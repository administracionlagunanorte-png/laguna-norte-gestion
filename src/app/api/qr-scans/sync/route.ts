import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/qr-scans/sync — batch upload offline scans
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scans } = body as {
      scans: Array<{
        code: string;
        scannedBy: string;
        profileId?: string;
        latitude?: number;
        longitude?: number;
        notes?: string;
        scannedAt: number; // timestamp when scan was performed locally
      }>;
    };

    if (!Array.isArray(scans) || scans.length === 0) {
      return NextResponse.json({ error: 'No se recibieron escaneos para sincronizar' }, { status: 400 });
    }

    if (scans.length > 100) {
      return NextResponse.json({ error: 'Máximo 100 escaneos por sincronización' }, { status: 400 });
    }

    const results: Array<{
      success: boolean;
      code: string;
      scanId?: string;
      locationName?: string;
      error?: string;
    }> = [];

    for (const scanData of scans) {
      try {
        if (!scanData.code) {
          results.push({ success: false, code: scanData.code || '', error: 'Código QR vacío' });
          continue;
        }

        // Find the QR location by code
        const qrLocation = await db.qrLocation.findUnique({ where: { code: scanData.code } });
        if (!qrLocation) {
          results.push({ success: false, code: scanData.code, error: 'Código QR no encontrado' });
          continue;
        }

        if (!qrLocation.active) {
          results.push({ success: false, code: scanData.code, error: 'Ubicación QR desactivada' });
          continue;
        }

        const scan = await db.qrScan.create({
          data: {
            qrLocationId: qrLocation.id,
            scannedBy: scanData.scannedBy || '',
            profileId: scanData.profileId || null,
            latitude: scanData.latitude || null,
            longitude: scanData.longitude || null,
            notes: (scanData.notes || '') + (scanData.scannedAt ? ` [Offline: ${new Date(scanData.scannedAt).toISOString()}]` : ''),
          },
          include: {
            location: {
              select: { id: true, name: true, location: true, code: true },
            },
          },
        });

        results.push({
          success: true,
          code: scanData.code,
          scanId: scan.id,
          locationName: scan.location?.name ?? '',
        });
      } catch (err: any) {
        results.push({ success: false, code: scanData.code, error: err.message || 'Error interno' });
      }
    }

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      synced: succeeded,
      failed,
      results,
    }, { status: 200 });
  } catch (error) {
    console.error('POST /api/qr-scans/sync error:', error);
    return NextResponse.json({ error: 'Error al sincronizar escaneos' }, { status: 500 });
  }
}
