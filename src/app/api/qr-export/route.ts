import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { db } from '@/lib/db';

// GET /api/qr-export?mode=single&code=QR-XXX or ?mode=bulk&groupByName=true
// Returns high-res QR images for PDF export
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'bulk'; // 'single' or 'bulk'
    const code = searchParams.get('code');
    const groupByName = searchParams.get('groupByName') === 'true';

    if (mode === 'single') {
      // Export a single QR
      if (!code) {
        return NextResponse.json({ error: 'Código es obligatorio para exportación individual' }, { status: 400 });
      }

      const qrLocation = await db.qrLocation.findUnique({ where: { code } });
      if (!qrLocation) {
        return NextResponse.json({ error: 'Ubicación QR no encontrada' }, { status: 404 });
      }

      const dataUrl = await QRCode.toDataURL(code, {
        width: 1024,
        margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });

      return NextResponse.json({
        items: [{
          id: qrLocation.id,
          name: qrLocation.name,
          code: qrLocation.code,
          location: qrLocation.location,
          description: qrLocation.description,
          dataUrl,
        }],
      });
    }

    // Bulk export — get all active QR locations
    const locations = await db.qrLocation.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    const items = [];

    if (groupByName) {
      // Group by name: for locations with the same name, generate multiple QRs
      const grouped: Record<string, typeof locations> = {};
      for (const loc of locations) {
        const key = loc.name;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(loc);
      }

      // Sort groups alphabetically
      const sortedGroups = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

      for (const [name, group] of sortedGroups) {
        for (const loc of group) {
          const dataUrl = await QRCode.toDataURL(loc.code, {
            width: 1024,
            margin: 2,
            color: { dark: '#1e293b', light: '#ffffff' },
            errorCorrectionLevel: 'H',
          });
          items.push({
            id: loc.id,
            name: loc.name,
            code: loc.code,
            location: loc.location,
            description: loc.description,
            dataUrl,
          });
        }
      }
    } else {
      for (const loc of locations) {
        const dataUrl = await QRCode.toDataURL(loc.code, {
          width: 1024,
          margin: 2,
          color: { dark: '#1e293b', light: '#ffffff' },
          errorCorrectionLevel: 'H',
        });
        items.push({
          id: loc.id,
          name: loc.name,
          code: loc.code,
          location: loc.location,
          description: loc.description,
          dataUrl,
        });
      }
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error('GET /api/qr-export error:', error);
    return NextResponse.json({ error: 'Error al exportar códigos QR' }, { status: 500 });
  }
}
