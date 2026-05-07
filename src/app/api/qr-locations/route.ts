import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createAuditLog } from '@/app/api/audit/route';

// GET /api/qr-locations — list all QR locations
export async function GET() {
  try {
    const locations = await db.qrLocation.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { scans: true } } },
    });

    const serialized = locations.map(loc => ({
      id: loc.id,
      name: loc.name,
      description: loc.description,
      location: loc.location,
      code: loc.code,
      active: loc.active,
      createdBy: loc.createdBy,
      scanCount: loc._count.scans,
      createdAt: new Date(loc.createdAt).getTime(),
      updatedAt: new Date(loc.updatedAt).getTime(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('GET /api/qr-locations error:', error);
    return NextResponse.json({ error: 'Error al obtener ubicaciones QR' }, { status: 500 });
  }
}

// POST /api/qr-locations — create a new QR location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, location, code, active, _performedBy, _profileId } = body;

    if (!name || !code) {
      return NextResponse.json({ error: 'Nombre y código son obligatorios' }, { status: 400 });
    }

    // Check if code already exists
    const existing = await db.qrLocation.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'El código ya existe' }, { status: 409 });
    }

    const qrLocation = await db.qrLocation.create({
      data: {
        name,
        description: description || '',
        location: location || '',
        code,
        active: active !== undefined ? active : true,
        createdBy: _performedBy || 'admin',
      },
    });

    await createAuditLog({
      action: 'CREATE',
      entityType: 'QrLocation',
      entityId: qrLocation.id,
      entityName: qrLocation.name,
      changes: { old: null, new: { name, code, location, active } },
      performedBy: _performedBy || 'admin',
      profileId: _profileId || null,
    });

    return NextResponse.json({
      id: qrLocation.id,
      name: qrLocation.name,
      description: qrLocation.description,
      location: qrLocation.location,
      code: qrLocation.code,
      active: qrLocation.active,
      createdBy: qrLocation.createdBy,
      scanCount: 0,
      createdAt: new Date(qrLocation.createdAt).getTime(),
      updatedAt: new Date(qrLocation.updatedAt).getTime(),
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/qr-locations error:', error);
    return NextResponse.json({ error: 'Error al crear ubicación QR' }, { status: 500 });
  }
}
