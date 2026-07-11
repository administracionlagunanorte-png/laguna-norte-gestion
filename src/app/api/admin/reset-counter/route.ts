import { NextRequest, NextResponse } from 'next/server'
import { db, withRetry } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/reset-counter
 * Resetea el contador de OT al valor especificado.
 * Body: { value: number }
 *
 * Ejemplo: { value: 88 } → la próxima OT será OT-0089
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const value = Number(body.value)

    if (isNaN(value) || value < 0) {
      return NextResponse.json(
        { error: 'value debe ser un número válido ≥ 0' },
        { status: 400 },
      )
    }

    const result = await withRetry(() =>
      db.secuencia.upsert({
        where: { tabla: 'OrdenTrabajo' },
        update: { ultimoNum: value },
        create: { tabla: 'OrdenTrabajo', prefijo: 'OT', ultimoNum: value, padding: 4 },
      }),
    )

    return NextResponse.json({
      success: true,
      message: `Contador reseteado a ${value}. Próxima OT: OT-${String(value + 1).padStart(4, '0')}`,
      current: result.ultimoNum,
      nextOT: `OT-${String(result.ultimoNum + 1).padStart(4, '0')}`,
    })
  } catch (error: any) {
    console.error('Error en reset-counter:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
