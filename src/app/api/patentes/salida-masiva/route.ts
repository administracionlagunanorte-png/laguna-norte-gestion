import { NextRequest, NextResponse } from 'next/server'
import { db, withRetry } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/patentes/salida-masiva
 * Marca como salidas todas las patentes abiertas de una ubicación.
 *
 * Se llama cuando el guardia escanea el QR de "SALIDA A" de una ubicación.
 *
 * Body:
 *   - ubicacion: string (ej: "FLAMENCOS")
 *   - salidaQrCode: string (ej: "QR-FLAMENCOS-SALIDA-A")
 *   - salidaScanId: string? (id del MovilQrScan que triggered la salida)
 *   - scannedBy: string?
 *   - salidaAt: number? (timestamp ms, opcional)
 *
 * Retorna: { success, cerradas: N }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.ubicacion || !body.salidaQrCode) {
      return NextResponse.json(
        { error: 'ubicacion y salidaQrCode son obligatorios' },
        { status: 400 },
      )
    }

    const ubicacion = String(body.ubicacion).trim().toUpperCase()
    const salidaQrCode = String(body.salidaQrCode).trim()
    const salidaAt = body.salidaAt
      ? new Date(Number(body.salidaAt))
      : new Date()
    const finalSalidaAt = isNaN(salidaAt.getTime()) ? new Date() : salidaAt

    // Buscar todas las patentes abiertas de esta ubicación
    const abiertas = await withRetry(() =>
      db.movilPatente.findMany({
        where: {
          ubicacion,
          salidaAt: null,
        },
        select: { id: true, patente: true },
      }),
    )

    if (abiertas.length === 0) {
      return NextResponse.json({
        success: true,
        cerradas: 0,
        message: `No había patentes abiertas en ${ubicacion}`,
      })
    }

    // Cerrar todas
    const ids = abiertas.map((p) => p.id)
    await withRetry(() =>
      db.movilPatente.updateMany({
        where: { id: { in: ids } },
        data: {
          salidaQrCode,
          salidaScanId: body.salidaScanId || null,
          salidaAt: finalSalidaAt,
        },
      }),
    )

    return NextResponse.json({
      success: true,
      cerradas: abiertas.length,
      patentes: abiertas.map((p) => p.patente),
      message: `${abiertas.length} patente(s) cerrada(s) en ${ubicacion}`,
    })
  } catch (err) {
    console.error('POST /api/patentes/salida-masiva error:', err)
    const msg = err instanceof Error ? err.message : 'Error al cerrar patentes'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
