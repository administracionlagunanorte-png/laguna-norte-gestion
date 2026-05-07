import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function serializeProfile(row: {
  id: string;
  name: string;
  password: string;
  workAreaIds: string[];
  createdAt: Date;
  updatedAt: Date;
}, includePassword = false) {
  const result: Record<string, unknown> = {
    id: row.id,
    name: row.name,
    workAreaIds: Array.isArray(row.workAreaIds) ? row.workAreaIds : [],
    hasPassword: row.password !== '',
    createdAt: new Date(row.createdAt).getTime(),
    updatedAt: new Date(row.updatedAt).getTime(),
  };
  if (includePassword) {
    result.password = row.password;
  }
  return result;
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
    if (body.workAreaIds !== undefined) data.workAreaIds = Array.isArray(body.workAreaIds) ? body.workAreaIds : [];

    const row = await db.profile.update({
      where: { id },
      data,
    });

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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.profile.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/profiles/[id] error:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el perfil' },
      { status: 500 }
    );
  }
}
