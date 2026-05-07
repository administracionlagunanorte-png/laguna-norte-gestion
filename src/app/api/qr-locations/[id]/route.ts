import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createAuditLog } from '@/app/api/audit/route';

// PUT /api/qr-locations/[id] — update a QR location
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, location, code, active, _performedBy, _profileId } = body;

    const existing = await db.qrLocation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Ubicación QR no encontrada' }, { status: 404 });
    }

    // If code is changing, check uniqueness
    if (code && code !== existing.code) {
      const codeExists = await db.qrLocation.findUnique({ where: { code } });
      if (codeExists) {
        return NextResponse.json({ error: 'El código ya existe' }, { status: 409 });
      }
    }

    const updated = await db.qrLocation.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(location !== undefined && { location }),
        ...(code !== undefined && { code }),
        ...(active !== undefined && { active }),
      },
    });

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'QrLocation',
      entityId: id,
      entityName: updated.name,
      changes: {
        old: { name: existing.name, code: existing.code, location: existing.location, active: existing.active },
        new: { name: updated.name, code: updated.code, location: updated.location, active: updated.active },
      },
      performedBy: _performedBy || 'admin',
      profileId: _profileId || null,
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      location: updated.location,
      code: updated.code,
      active: updated.active,
      createdBy: updated.createdBy,
      createdAt: new Date(updated.createdAt).getTime(),
      updatedAt: new Date(updated.updatedAt).getTime(),
    });
  } catch (error) {
    console.error('PUT /api/qr-locations/[id] error:', error);
    return NextResponse.json({ error: 'Error al actualizar ubicación QR' }, { status: 500 });
  }
}

// DELETE /api/qr-locations/[id] — delete a QR location
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const performedBy = searchParams.get('_performedBy') || 'admin';
    const profileId = searchParams.get('_profileId') || undefined;

    const existing = await db.qrLocation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Ubicación QR no encontrada' }, { status: 404 });
    }

    await db.qrLocation.delete({ where: { id } });

    await createAuditLog({
      action: 'DELETE',
      entityType: 'QrLocation',
      entityId: id,
      entityName: existing.name,
      changes: { old: { name: existing.name, code: existing.code, location: existing.location }, new: null },
      performedBy,
      profileId: profileId || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/qr-locations/[id] error:', error);
    return NextResponse.json({ error: 'Error al eliminar ubicación QR' }, { status: 500 });
  }
}
