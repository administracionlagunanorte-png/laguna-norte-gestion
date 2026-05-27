import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createAuditLog } from '@/app/api/audit/route';

// GET /api/inventory — list all inventory items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await db.inventoryItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const serialized = items.map(item => ({
      id: item.id,
      name: item.name,
      brand: item.brand,
      model: item.model,
      serialNumber: item.serialNumber,
      category: item.category,
      location: item.location,
      lastMaintenance: item.lastMaintenance ? new Date(item.lastMaintenance).getTime() : null,
      lastReview: item.lastReview ? new Date(item.lastReview).getTime() : null,
      nextMaintenance: item.nextMaintenance ? new Date(item.nextMaintenance).getTime() : null,
      status: item.status,
      photo: item.photo || '',
      notes: item.notes,
      qrCode: item.qrCode,
      createdBy: item.createdBy,
      createdAt: new Date(item.createdAt).getTime(),
      updatedAt: new Date(item.updatedAt).getTime(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('GET /api/inventory error:', error);
    return NextResponse.json({ error: 'Error al obtener inventario' }, { status: 500 });
  }
}

// POST /api/inventory — create a new inventory item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name, brand, model, serialNumber, category, location,
      lastMaintenance, lastReview, nextMaintenance, status, photo, notes,
      _performedBy, _profileId,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    // Generate next qrCode atomically
    const lastItem = await db.inventoryItem.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { qrCode: true },
    });

    let nextNum = 1;
    if (lastItem?.qrCode) {
      const match = lastItem.qrCode.match(/INV-(\d+)/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    const qrCode = `INV-${String(nextNum).padStart(4, '0')}`;

    const item = await db.inventoryItem.create({
      data: {
        name,
        brand: brand || '',
        model: model || '',
        serialNumber: serialNumber || '',
        category: category || 'maquina',
        location: location || '',
        lastMaintenance: lastMaintenance ? new Date(lastMaintenance) : null,
        lastReview: lastReview ? new Date(lastReview) : null,
        nextMaintenance: nextMaintenance ? new Date(nextMaintenance) : null,
        status: status || 'operativo',
        photo: photo || '',
        notes: notes || '',
        qrCode,
        createdBy: _performedBy || 'admin',
      },
    });

    await createAuditLog({
      action: 'CREATE',
      entityType: 'InventoryItem',
      entityId: item.id,
      entityName: item.name,
      changes: { old: null, new: { name, brand, model, qrCode, category } },
      performedBy: _performedBy || 'admin',
      profileId: _profileId || null,
    });

    return NextResponse.json({
      id: item.id,
      name: item.name,
      brand: item.brand,
      model: item.model,
      serialNumber: item.serialNumber,
      category: item.category,
      location: item.location,
      lastMaintenance: item.lastMaintenance ? new Date(item.lastMaintenance).getTime() : null,
      lastReview: item.lastReview ? new Date(item.lastReview).getTime() : null,
      nextMaintenance: item.nextMaintenance ? new Date(item.nextMaintenance).getTime() : null,
      status: item.status,
      photo: item.photo || '',
      notes: item.notes,
      qrCode: item.qrCode,
      createdBy: item.createdBy,
      createdAt: new Date(item.createdAt).getTime(),
      updatedAt: new Date(item.updatedAt).getTime(),
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/inventory error:', error);
    return NextResponse.json({ error: 'Error al crear item de inventario' }, { status: 500 });
  }
}
