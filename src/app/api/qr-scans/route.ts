import { NextRequest, NextResponse } from 'next/server'
import { db, withRetry } from '@/lib/db'

/**
 * GET /api/qr-scans
 * Lista los escaneos con filtros opcionales.
 * Query params soportados:
 *   - qrLocationId: filtrar por ubicación QR
 *   - scannedBy:    filtrar por nombre del guardia
 *   - profileId:    filtrar por perfil
 *   - from:         timestamp ms (inclusive)
 *   - to:           timestamp ms (inclusive)
 *   - limit:        por defecto 200, máx 500
 *   - offset:       paginación
 *
 * Retorna: { scans: [...], total: N }
 * Cada scan incluye la relación `location` con id/name/location/code.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const qrLocationId = searchParams.get('qrLocationId') || undefined
    const scannedBy = searchParams.get('scannedBy') || undefined
    const profileId = searchParams.get('profileId') || undefined
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10) || 200, 500)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

    const where: any = {}
    if (qrLocationId) where.qrLocationId = qrLocationId
    if (scannedBy) where.scannedBy = scannedBy
    if (profileId) where.profileId = profileId
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(Number(from))
      if (to) where.createdAt.lte = new Date(Number(to))
    }

    const [scans, total] = await withRetry(() =>
      Promise.all([
        db.movilQrScan.findMany({
          where,
          include: {
            location: {
              select: { id: true, name: true, location: true, code: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        db.movilQrScan.count({ where }),
      ]),
    )

    return NextResponse.json({ scans, total })
  } catch (err) {
    console.error('GET /api/qr-scans error:', err)
    return NextResponse.json({ scans: [], total: 0 })
  }
}

/**
 * POST /api/qr-scans
 * Registra un nuevo escaneo.
 *
 * Body aceptado:
 *   - code:        código QR escaneado (ej: "QR-PORTERIA-01"). Se resuelve a qrLocationId.
 *   - qrLocationId: opcional, si ya se conoce el ID directo.
 *   - scannedBy:   nombre del guardia
 *   - profileId:   ID del perfil
 *   - latitude, longitude: GPS
 *   - notes:       observaciones
 *   - scannedAt:   opcional (timestamp ms). Si se omite, se usa now() del servidor.
 *                  Permite que los escaneos offline preserven la hora real.
 *
 * Retorna el scan creado con la relación `location` incluida.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Resolver qrLocationId: puede venir directo o via code
    let qrLocationId: string | undefined = body.qrLocationId
    if (!qrLocationId && body.code) {
      const loc = await withRetry(() =>
        db.movilQrLocation.findUnique({ where: { code: String(body.code).trim() } }),
      )
      if (!loc) {
        return NextResponse.json(
          { error: `Código QR no reconocido: ${body.code}` },
          { status: 404 },
        )
      }
      if (!loc.active) {
        return NextResponse.json(
          { error: `La ubicación ${loc.name} está inactiva` },
          { status: 400 },
        )
      }
      qrLocationId = loc.id
    }

    if (!qrLocationId) {
      return NextResponse.json(
        { error: 'Se requiere code o qrLocationId' },
        { status: 400 },
      )
    }

    // Timestamp: usar scannedAt si viene (offline), sino now()
    const createdAt = body.scannedAt ? new Date(Number(body.scannedAt)) : new Date()

    const scan = await withRetry(() =>
      db.movilQrScan.create({
        data: {
          qrLocationId,
          scannedBy: body.scannedBy || '',
          profileId: body.profileId || null,
          latitude:
            typeof body.latitude === 'number'
              ? body.latitude
              : body.latitude
                ? Number(body.latitude)
                : null,
          longitude:
            typeof body.longitude === 'number'
              ? body.longitude
              : body.longitude
                ? Number(body.longitude)
                : null,
          notes: body.notes || '',
          createdAt,
        },
        include: {
          location: {
            select: { id: true, name: true, location: true, code: true },
          },
        },
      }),
    )

    return NextResponse.json(scan)
  } catch (err) {
    console.error('POST /api/qr-scans error:', err)
    return NextResponse.json({ error: 'Error al registrar escaneo' }, { status: 500 })
  }
}
