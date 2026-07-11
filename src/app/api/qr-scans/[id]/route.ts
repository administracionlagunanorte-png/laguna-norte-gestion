import { NextRequest, NextResponse } from 'next/server'
import { db, withRetry } from '@/lib/db'

/**
 * DELETE /api/qr-scans/[id]
 * Elimina un escaneo por ID.
 *
 * Útil para limpiar escaneos de prueba o registros incorrectos.
 * No requiere autenticación en la app móvil (el acceso se controla vía
 * el PIN de los perfiles), pero solo elimina el escaneo indicado.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { error: 'ID es obligatorio' },
        { status: 400 },
      )
    }

    await withRetry(() => db.movilQrScan.delete({ where: { id } }))
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/qr-scans/[id] error:', err)
    const msg = err instanceof Error ? err.message : 'Error al eliminar'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
