import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createAuditLog } from '@/app/api/audit/route';

function serializeProfile(row: {
  id: string;
  name: string;
  password: string;
  accessCode: string;
  color: string;
  icon: string;
  workAreaIds: string[];
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}, includePassword = false) {
  const result: Record<string, unknown> = {
    id: row.id,
    name: row.name,
    accessCode: row.accessCode || '',
    color: row.color || '',
    icon: row.icon || '',
    workAreaIds: Array.isArray(row.workAreaIds) ? row.workAreaIds : [],
    permissions: Array.isArray(row.permissions) ? row.permissions : ['view'],
    hasPassword: row.password !== '',
    hasAccessCode: row.accessCode !== '',
    createdAt: new Date(row.createdAt).getTime(),
    updatedAt: new Date(row.updatedAt).getTime(),
  };
  if (includePassword) {
    result.password = row.password;
  }
  return result;
}

// GET /api/profiles — return all profiles (password excluded, hasPassword flag included)
export async function GET() {
  try {
    const rows = await db.profile.findMany({
      orderBy: { name: 'asc' },
    });
    const items = rows.map(r => serializeProfile(r, false));
    return NextResponse.json(items);
  } catch (error) {
    console.error('GET /api/profiles error:', error);
    return NextResponse.json(
      { error: 'Error al obtener los perfiles' },
      { status: 500 }
    );
  }
}

// POST /api/profiles — create a new profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const row = await db.profile.create({
      data: {
        name: body.name || '',
        password: body.password || '',
        accessCode: body.accessCode || '',
        color: body.color || '',
        icon: body.icon || '',
        workAreaIds: Array.isArray(body.workAreaIds) ? body.workAreaIds : [],
        permissions: Array.isArray(body.permissions) ? body.permissions : ['view'],
      },
    });

    // Audit log: CREATE
    const performedBy = body._performedBy || 'admin';
    const profileId = body._profileId || null;
    await createAuditLog({
      action: 'CREATE',
      entityType: 'Profile',
      entityId: row.id,
      entityName: row.name || row.id,
      changes: {
        name: { old: null, new: row.name },
        permissions: { old: null, new: row.permissions },
        workAreaIds: { old: null, new: row.workAreaIds },
      },
      performedBy,
      profileId,
    });

    return NextResponse.json(serializeProfile(row, false), { status: 201 });
  } catch (error) {
    console.error('POST /api/profiles error:', error);
    return NextResponse.json(
      { error: 'Error al crear el perfil' },
      { status: 500 }
    );
  }
}
