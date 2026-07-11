import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 30

/**
 * POST /api/patentes/ocr
 *
 * Intenta leer una patente de una foto usando VLM (Vision Language Model).
 *
 * NOTA: El servicio de VLM (internal-api.z.ai) NO es accesible desde
 * Vercel porque usa IPs privadas (172.25.x.x). Solo funciona desde
 * el entorno interno de ZAI.
 *
 * Por lo tanto, este endpoint SIEMPRE devuelve error, y la app móvil
 * debe usar el ingreso manual como método principal.
 *
 * Body:
 *   - image: string (data URL base64)
 *
 * Retorna:
 *   - { success: false, error: "..." }
 */
export async function POST(request: NextRequest) {
  // El VLM no es accesible desde Vercel. Devolver error para que la app
  // use ingreso manual.
  return NextResponse.json(
    {
      success: false,
      error: 'El reconocimiento automático de patentes no está disponible. Usa el ingreso manual.',
    },
    { status: 501 },
  )
}
