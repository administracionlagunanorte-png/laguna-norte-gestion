import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/qr-scans — list all scans (admin view)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const qrLocationId = searchParams.get('qrLocationId') || undefined;
    const scannedBy = searchParams.get('scannedBy') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const from = searchParams.get('from') ? parseInt(searchParams.get('from')!) : undefined;
    const to = searchParams.get('to') ? parseInt(searchParams.get('to')!) : undefined;

    const where: Record<string, unknown> = {};
    if (qrLocationId) where.qrLocationId = qrLocationId;
    if (scannedBy) where.scannedBy = scannedBy;
    if (from || to) {
      const createdAt: Record<string, unknown> = {};
      if (from) createdAt.gte = new Date(from);
      if (to) createdAt.lte = new Date(to);
      where.createdAt = createdAt;
    }

    const [scans, total] = await Promise.all([
      db.qrScan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          location: {
            select: { id: true, name: true, location: true, code: true },
          },
        },
      }),
      db.qrScan.count({ where }),
    ]);

    const serialized = scans.map(scan => ({
      id: scan.id,
      qrLocationId: scan.qrLocationId,
      scannedBy: scan.scannedBy,
      profileId: scan.profileId,
      latitude: scan.latitude,
      longitude: scan.longitude,
      notes: scan.notes,
      createdAt: new Date(scan.createdAt).getTime(),
      location: scan.location ? {
        id: scan.location.id,
        name: scan.location.name,
        location: scan.location.location,
        code: scan.location.code,
      } : null,
    }));

    return NextResponse.json({ scans: serialized, total, limit, offset });
  } catch (error) {
    console.error('GET /api/qr-scans error:', error);
    return NextResponse.json({ error: 'Error al obtener escaneos' }, { status: 500 });
  }
}

// POST /api/qr-scans — create a new scan (guard scans a QR)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, scannedBy, profileId, latitude, longitude, notes } = body;

    if (!code) {
      return NextResponse.json({ error: 'Código QR es obligatorio' }, { status: 400 });
    }

    // Find the QR location by code
    const qrLocation = await db.qrLocation.findUnique({ where: { code } });
    if (!qrLocation) {
      return NextResponse.json({ error: 'Código QR no encontrado' }, { status: 404 });
    }

    if (!qrLocation.active) {
      return NextResponse.json({ error: 'Esta ubicación QR está desactivada' }, { status: 400 });
    }

    const scan = await db.qrScan.create({
      data: {
        qrLocationId: qrLocation.id,
        scannedBy: scannedBy || '',
        profileId: profileId || null,
        latitude: latitude || null,
        longitude: longitude || null,
        notes: notes || '',
      },
      include: {
        location: {
          select: { id: true, name: true, location: true, code: true },
        },
      },
    });

    return NextResponse.json({
      id: scan.id,
      qrLocationId: scan.qrLocationId,
      scannedBy: scan.scannedBy,
      profileId: scan.profileId,
      latitude: scan.latitude,
      longitude: scan.longitude,
      notes: scan.notes,
      createdAt: new Date(scan.createdAt).getTime(),
      location: scan.location ? {
        id: scan.location.id,
        name: scan.location.name,
        location: scan.location.location,
        code: scan.location.code,
      } : null,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/qr-scans error:', error);
    return NextResponse.json({ error: 'Error al registrar escaneo' }, { status: 500 });
  }
}
