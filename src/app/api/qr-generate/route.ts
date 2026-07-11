import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

// GET /api/qr-generate?code=QR-LOC-001 — generate a QR code image as data URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const size = parseInt(searchParams.get('size') || '256', 10);

    if (!code) {
      return NextResponse.json({ error: 'Código es obligatorio' }, { status: 400 });
    }

    const dataUrl = await QRCode.toDataURL(code, {
      width: size,
      margin: 2,
      color: {
        dark: '#1e293b', // slate-800
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });

    return NextResponse.json({ code, dataUrl });
  } catch (error) {
    console.error('GET /api/qr-generate error:', error);
    return NextResponse.json({ error: 'Error al generar código QR' }, { status: 500 });
  }
}
