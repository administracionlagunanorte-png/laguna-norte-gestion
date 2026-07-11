import { NextRequest, NextResponse } from 'next/server'
import { db, withRetry } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/patentes
 * Lista patentes con filtros opcionales.
 * Query params:
 *   - ubicacion: filtrar por ubicación (FLAMENCOS, etc.)
 *   - soloAbiertas: 'true' para ver solo patentes sin salida (salidaAt = null)
 *   - from: timestamp ms
 *   - to: timestamp ms
 *   - limit: default 200, max 500
 *
 * Retorna: { patentes: [...], total: N }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ubicacion = searchParams.get('ubicacion') || undefined
    const soloAbiertas = searchParams.get('soloAbiertas') === 'true'
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10) || 200, 500)

    const where: any = {}
    if (ubicacion) where.ubicacion = ubicacion
    if (soloAbiertas) where.salidaAt = null
    if (from || to) {
      where.entradaAt = {}
      if (from) where.entradaAt.gte = new Date(Number(from))
      if (to) where.entradaAt.lte = new Date(Number(to))
    }

    const patentesRaw = await withRetry(() =>
      db.movilPatente.findMany({
        where,
        orderBy: { entradaAt: 'desc' },
        take: limit,
      }),
    )
    const total = await withRetry(() => db.movilPatente.count({ where }))

    return NextResponse.json({ patentes: patentesRaw, total })
  } catch (err) {
    console.error('GET /api/patentes error:', err)
    return NextResponse.json({ patentes: [], total: 0 })
  }
}

/**
 * POST /api/patentes
 * Registra una patente entrando a una ubicación.
 *
 * Body:
 *   - patente: string (ej: "ABCD12")
 *   - ubicacion: string (ej: "FLAMENCOS")
 *   - entradaQrCode: string (ej: "QR-FLAMENCOS-ENTRADA-A")
 *   - entradaScanId: string? (id del MovilQrScan que triggered la entrada)
 *   - scannedBy: string
 *   - profileId: string?
 *   - latitude, longitude: number?
 *   - notes: string?
 *   - entradaAt: number? (timestamp ms, opcional para preservar hora offline)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.patente || !body.ubicacion || !body.entradaQrCode) {
      return NextResponse.json(
        { error: 'patente, ubicacion y entradaQrCode son obligatorios' },
        { status: 400 },
      )
    }

    const patente = String(body.patente).trim().toUpperCase().replace(/\s/g, '')
    if (patente.length < 4 || patente.length > 10) {
      return NextResponse.json(
        { error: 'Patente inválida (debe tener entre 4 y 10 caracteres)' },
        { status: 400 },
      )
    }

    const entradaAt = body.entradaAt
      ? new Date(Number(body.entradaAt))
      : new Date()

    const latitude =
      typeof body.latitude === 'number' ? body.latitude
      : body.latitude ? Number(body.latitude) : null
    const longitude =
      typeof body.longitude === 'number' ? body.longitude
      : body.longitude ? Number(body.longitude) : null

    const patenteRecord = await withRetry(() =>
      db.movilPatente.create({
        data: {
          patente,
          ubicacion: String(body.ubicacion).trim().toUpperCase(),
          entradaQrCode: String(body.entradaQrCode).trim(),
          entradaScanId: body.entradaScanId || null,
          entradaAt: isNaN(entradaAt.getTime()) ? new Date() : entradaAt,
          scannedBy: body.scannedBy || '',
          profileId: body.profileId || null,
          latitude,
          longitude,
          notes: body.notes || '',
        },
      }),
    )

    return NextResponse.json(patenteRecord)
  } catch (err) {
    console.error('POST /api/patentes error:', err)
    const msg = err instanceof Error ? err.message : 'Error al registrar patente'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
