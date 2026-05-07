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

// Helper: compare old and new values to generate change log
function computeChanges(oldData: Record<string, unknown>, newData: Record<string, unknown>): Record<string, { old: unknown; new: unknown }> {
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  for (const key of Object.keys(newData)) {
    const oldVal = oldData[key];
    const newVal = newData[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes[key] = { old: oldVal ?? null, new: newVal ?? null };
    }
  }
  return changes;
}

// PUT /api/profiles/[id] — update a profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.password !== undefined) data.password = body.password;
    if (body.accessCode !== undefined) data.accessCode = body.accessCode;
    if (body.color !== undefined) data.color = body.color;
    if (body.icon !== undefined) data.icon = body.icon;
    if (body.workAreaIds !== undefined) data.workAreaIds = Array.isArray(body.workAreaIds) ? body.workAreaIds : [];
    if (body.permissions !== undefined) data.permissions = Array.isArray(body.permissions) ? body.permissions : ['view'];

    // Fetch old record for audit
    const oldRecord = await db.profile.findUnique({ where: { id } });

    const row = await db.profile.update({
      where: { id },
      data,
    });

    // Audit log: UPDATE
    if (oldRecord) {
      const oldData: Record<string, unknown> = {};
      const newData: Record<string, unknown> = {};
      for (const key of Object.keys(data)) {
        if (key in oldRecord) {
          oldData[key] = (oldRecord as Record<string, unknown>)[key];
        }
        newData[key] = data[key];
      }
      const changes = computeChanges(oldData, newData);
      if (Object.keys(changes).length > 0) {
        const performedBy = body._performedBy || 'admin';
        const profileId = body._profileId || null;
        await createAuditLog({
          action: 'UPDATE',
          entityType: 'Profile',
          entityId: id,
          entityName: oldRecord.name || id,
          changes,
          performedBy,
          profileId,
        });
      }
    }

    return NextResponse.json(serializeProfile(row, false));
  } catch (error) {
    console.error('PUT /api/profiles/[id] error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el perfil' },
      { status: 500 }
    );
  }
}

// POST /api/profiles/[id] — verify profile password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const password = body.password || '';

    const profile = await db.profile.findUnique({
      where: { id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      );
    }

    if (profile.password === '' || profile.password === password) {
      return NextResponse.json({ success: true, profile: serializeProfile(profile, false) });
    }

    return NextResponse.json(
      { error: 'Contraseña incorrecta' },
      { status: 401 }
    );
  } catch (error) {
    console.error('POST /api/profiles/[id] verify error:', error);
    return NextResponse.json(
      { error: 'Error al verificar el perfil' },
      { status: 500 }
    );
  }
}

// DELETE /api/profiles/[id] — delete a profile
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch the record before deleting for audit log
    const record = await db.profile.findUnique({ where: { id } });

    await db.profile.delete({
      where: { id },
    });

    // Audit log: DELETE
    if (record) {
      const { searchParams } = new URL(request.url);
      const performedBy = searchParams.get('_performedBy') || 'admin';
      const profileId = searchParams.get('_profileId') || null;
      await createAuditLog({
        action: 'DELETE',
        entityType: 'Profile',
        entityId: id,
        entityName: record.name || id,
        changes: {
          name: { old: record.name, new: null },
          permissions: { old: record.permissions, new: null },
          workAreaIds: { old: record.workAreaIds, new: null },
        },
        performedBy,
        profileId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/profiles/[id] error:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el perfil' },
      { status: 500 }
    );
  }
}
