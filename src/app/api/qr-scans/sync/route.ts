import { NextRequest, NextResponse } from 'next/server'
import { db, withRetry } from '@/lib/db'

/**
 * POST /api/qr-scans/sync
 * Sincroniza escaneos realizados offline.
 *
 * Body: { scans: OfflineScan[] }
 *   Cada scan puede traer:
 *     - code (recomendado): se resuelve a qrLocationId
 *     - qrLocationId: alternativo directo
 *     - scannedBy, profileId, latitude, longitude, notes
 *     - scannedAt: timestamp ms del momento real del escaneo (importante para preservar la hora)
 *
 * Retorna: { success, synced, failed, errors[] }
 */
export async function POST(request: NextRequest) {
  try {
    const { scans } = await request.json()
    if (!Array.isArray(scans)) {
      return NextResponse.json({ success: true, synced: 0, failed: 0, errors: [] })
    }

    // Cache de códigos QR ya resueltos para evitar múltiples lookups
    const codeCache = new Map<string, string | null>()

    let synced = 0
    let failed = 0
    const errors: { index: number; code?: string; error: string }[] = []
    const results: { success: boolean; code?: string; offlineId?: string; error?: string }[] = []

    for (let i = 0; i < scans.length; i++) {
      const s = scans[i]
      try {
        // Resolver qrLocationId
        let qrLocationId: string | undefined = s.qrLocationId
        if (!qrLocationId && s.code) {
          const codeKey = String(s.code).trim()
          if (codeCache.has(codeKey)) {
            qrLocationId = codeCache.get(codeKey) || undefined
          } else {
            const loc = await withRetry(() =>
              db.movilQrLocation.findUnique({ where: { code: codeKey } }),
            )
            codeCache.set(codeKey, loc?.id || null)
            qrLocationId = loc?.id
          }
        }

        if (!qrLocationId) {
          failed++
          const errMsg = `Código QR no reconocido: ${s.code || '(vacío)'}`
          errors.push({ index: i, code: s.code, error: errMsg })
          results.push({ success: false, code: s.code, offlineId: s.id, error: errMsg })
          continue
        }

        // Preservar la hora real del escaneo si viene scannedAt
        const createdAt = s.scannedAt ? new Date(Number(s.scannedAt)) : new Date()

        await withRetry(() =>
          db.movilQrScan.create({
            data: {
              qrLocationId,
              scannedBy: s.scannedBy || '',
              profileId: s.profileId || null,
              latitude:
                typeof s.latitude === 'number'
                  ? s.latitude
                  : s.latitude
                    ? Number(s.latitude)
                    : null,
              longitude:
                typeof s.longitude === 'number'
                  ? s.longitude
                  : s.longitude
                    ? Number(s.longitude)
                    : null,
              notes: s.notes || '',
              createdAt,
            },
          }),
        )
        synced++
        results.push({ success: true, code: s.code, offlineId: s.id })
      } catch (err) {
        failed++
        const errMsg = err instanceof Error ? err.message : 'Error desconocido'
        errors.push({ index: i, code: s.code, error: errMsg })
        results.push({ success: false, code: s.code, offlineId: s.id, error: errMsg })
      }
    }

    return NextResponse.json({ success: true, synced, failed, errors, results })
  } catch (err) {
    console.error('POST /api/qr-scans/sync error:', err)
    return NextResponse.json(
      { error: 'Error al sincronizar escaneos' },
      { status: 500 },
    )
  }
}
