import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createAuditLog } from '@/app/api/audit/route';

// PUT /api/inventory/[id] — update an inventory item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name, brand, model, serialNumber, category, location,
      lastMaintenance, lastReview, nextMaintenance, status, photo, notes,
      _performedBy, _profileId,
    } = body;

    const existing = await db.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    const updated = await db.inventoryItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(brand !== undefined && { brand }),
        ...(model !== undefined && { model }),
        ...(serialNumber !== undefined && { serialNumber }),
        ...(category !== undefined && { category }),
        ...(location !== undefined && { location }),
        ...(lastMaintenance !== undefined && { lastMaintenance: lastMaintenance ? new Date(lastMaintenance) : null }),
        ...(lastReview !== undefined && { lastReview: lastReview ? new Date(lastReview) : null }),
        ...(nextMaintenance !== undefined && { nextMaintenance: nextMaintenance ? new Date(nextMaintenance) : null }),
        ...(status !== undefined && { status }),
        ...(photo !== undefined && { photo }),
        ...(notes !== undefined && { notes }),
      },
    });

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'InventoryItem',
      entityId: id,
      entityName: updated.name,
      changes: {
        old: { name: existing.name, brand: existing.brand, model: existing.model, status: existing.status },
        new: { name: updated.name, brand: updated.brand, model: updated.model, status: updated.status },
      },
      performedBy: _performedBy || 'admin',
      profileId: _profileId || null,
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      brand: updated.brand,
      model: updated.model,
      serialNumber: updated.serialNumber,
      category: updated.category,
      location: updated.location,
      lastMaintenance: updated.lastMaintenance ? new Date(updated.lastMaintenance).getTime() : null,
      lastReview: updated.lastReview ? new Date(updated.lastReview).getTime() : null,
      nextMaintenance: updated.nextMaintenance ? new Date(updated.nextMaintenance).getTime() : null,
      status: updated.status,
      photo: updated.photo || '',
      notes: updated.notes,
      qrCode: updated.qrCode,
      createdBy: updated.createdBy,
      createdAt: new Date(updated.createdAt).getTime(),
      updatedAt: new Date(updated.updatedAt).getTime(),
    });
  } catch (error) {
    console.error('PUT /api/inventory/[id] error:', error);
    return NextResponse.json({ error: 'Error al actualizar item de inventario' }, { status: 500 });
  }
}

// DELETE /api/inventory/[id] — delete an inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const performedBy = searchParams.get('_performedBy') || 'admin';
    const profileId = searchParams.get('_profileId') || undefined;

    const existing = await db.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    await db.inventoryItem.delete({ where: { id } });

    await createAuditLog({
      action: 'DELETE',
      entityType: 'InventoryItem',
      entityId: id,
      entityName: existing.name,
      changes: { old: { name: existing.name, qrCode: existing.qrCode, brand: existing.brand }, new: null },
      performedBy,
      profileId: profileId || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/inventory/[id] error:', error);
    return NextResponse.json({ error: 'Error al eliminar item de inventario' }, { status: 500 });
  }
}
