import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * ENDPOINT TEMPORAL — Eliminar patentes de prueba
 * Elimina todas las patentes cuyo scannedBy sea 'TEST' o cuya patente
 * empiece con 'TEST'.
 */
export async function POST() {
  try {
    const deleted = await db.movilPatente.deleteMany({
      where: {
        OR: [
          { scannedBy: 'TEST' },
          { patente: { startsWith: 'TEST' } },
        ],
      },
    })
    return NextResponse.json({
      success: true,
      deleted: deleted.count,
      message: `${deleted.count} patentes de prueba eliminadas`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
