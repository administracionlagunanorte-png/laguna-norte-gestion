import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const dynamic = 'force-dynamic'
export const revalidate = 0
// Las imágenes en base64 pueden ser grandes
export const maxDuration = 30

/**
 * POST /api/patentes/ocr
 *
 * Recibe una foto (base64) de una patente vehicular chilena y usa VLM
 * (Vision Language Model) para extraer el texto de la patente.
 *
 * Body:
 *   - image: string (data URL base64, ej: "data:image/jpeg;base64,...")
 *
 * Retorna:
 *   - { success: true, patente: "ABCD12", raw: "..." }
 *   - { success: false, error: "..." }
 *
 * Formatos de patente chilena soportados:
 *   - Viejo: 4 letras + 2 números (ABCD12)
 *   - Nuevo (2013+): 2 letras + 4 números (AB1234)
 *   - Actual (2020+): 2 letras + 3 números + 1 letra (AB123C)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image } = body

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Imagen es obligatoria (data URL base64)' },
        { status: 400 },
      )
    }

    // Validar que sea un data URL
    if (!image.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'La imagen debe ser un data URL (data:image/...)' },
        { status: 400 },
      )
    }

    // Inicializar VLM
    const zai = await ZAI.create()

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Eres un sistema de lectura de patentes vehiculares chilenas.

Observa la imagen y encuentra la patente del vehículo. Las patentes chilenas tienen estos formatos:
- Formato viejo: 4 letras + 2 números (ej: ABCD12, BRFG78)
- Formato nuevo: 2 letras + 4 números (ej: AB1234, DJ5678)
- Formato actual: 2 letras + 3 números + 1 letra (ej: AB123C, DJ456F)

Instrucciones:
1. Lee SOLO la patente del vehículo (ignora otros textos)
2. Devuelve ÚNICAMENTE la patente en mayúsculas, sin espacios, sin guiones, sin puntos
3. No agregues explicaciones, comentarios ni texto adicional
4. Si no puedes leer la patente claramente, responde "NO_LEIBLE"

Ejemplos de respuesta válida:
- ABCD12
- DJ5678
- AB123C
- NO_LEIBLE`,
            },
            {
              type: 'image_url',
              image_url: { url: image },
            },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    })

    const rawText = response.choices[0]?.message?.content?.trim() || ''

    // Limpiar el resultado: quitar espacios, puntos, guiones
    let patente = rawText
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '') // Solo letras y números
      .trim()

    // Validar formato de patente chilena
    const patenteVieja = /^[A-Z]{4}\d{2}$/.test(patente) // ABCD12
    const patenteNueva = /^[A-Z]{2}\d{4}$/.test(patente) // AB1234
    const patenteActual = /^[A-Z]{2}\d{3}[A-Z]$/.test(patente) // AB123C

    if (patente === 'NOLEIBLE' || (!patenteVieja && !patenteNueva && !patenteActual)) {
      // Si no coincide con ningún formato, pero el VLM devolvió algo,
      // lo devolvemos como raw para que el guardia pueda confirmar/editar
      if (patente.length >= 4 && patente.length <= 7) {
        return NextResponse.json({
          success: true,
          patente,
          raw: rawText,
          formatMatch: false,
          warning: 'La patente no coincide con un formato estándar. Verifica antes de confirmar.',
        })
      }
      return NextResponse.json({
        success: false,
        error: 'No se pudo leer la patente. Toma otra foto más cerca y con mejor iluminación.',
        raw: rawText,
      })
    }

    return NextResponse.json({
      success: true,
      patente,
      raw: rawText,
      formatMatch: true,
    })
  } catch (err) {
    console.error('POST /api/patentes/ocr error:', err)
    const msg = err instanceof Error ? err.message : 'Error al procesar la imagen'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
