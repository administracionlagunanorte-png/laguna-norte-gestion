import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/migrate-patentes
 *
 * Crea la tabla MovilPatente en la BD Aiven si no existe.
 * Esto es necesario porque Vercel solo hace `prisma generate` al deployar,
 * no `prisma db push`.
 *
 * Una vez creado el endpoint, se puede eliminar.
 */
export async function POST() {
  try {
    // Verificar si la tabla existe intentando hacer una query
    try {
      await db.movilPatente.count()
      return NextResponse.json({
        success: true,
        message: 'La tabla MovilPatente ya existe',
        alreadyExists: true,
      })
    } catch {
      // La tabla no existe, hay que crearla
    }

    // Crear la tabla con SQL directo
    // Usamos $executeRawUnsafe porque Prisma no tiene un método directo para crear tablas
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MovilPatente" (
        "id" TEXT NOT NULL,
        "patente" TEXT NOT NULL,
        "ubicacion" TEXT NOT NULL,
        "entradaQrCode" TEXT NOT NULL,
        "entradaScanId" TEXT,
        "entradaAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "salidaQrCode" TEXT,
        "salidaScanId" TEXT,
        "salidaAt" TIMESTAMP(3),
        "scannedBy" TEXT NOT NULL DEFAULT '',
        "profileId" TEXT,
        "latitude" DOUBLE PRECISION,
        "longitude" DOUBLE PRECISION,
        "notes" TEXT NOT NULL DEFAULT '',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "MovilPatente_pkey" PRIMARY KEY ("id")
      );
    `)

    // Crear índices
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MovilPatente_ubicacion_salidaAt_idx" ON "MovilPatente"("ubicacion", "salidaAt");`)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MovilPatente_patente_idx" ON "MovilPatente"("patente");`)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MovilPatente_entradaAt_idx" ON "MovilPatente"("entradaAt");`)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MovilPatente_scannedBy_idx" ON "MovilPatente"("scannedBy");`)

    return NextResponse.json({
      success: true,
      message: 'Tabla MovilPatente creada correctamente',
      created: true,
    })
  } catch (error: any) {
    console.error('Error en migrate-patentes:', error)
    return NextResponse.json(
      { error: error.message || 'Error al migrar' },
      { status: 500 },
    )
  }
}
