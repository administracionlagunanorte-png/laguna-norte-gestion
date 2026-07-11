import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { db } from '@/lib/db';

// GET /api/inventory/export?format=pdf|excel&category=&status=
// Returns inventory data + QR codes for export
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'pdf';
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;

    const items = await db.inventoryItem.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    // Generate QR codes for each item
    const itemsWithQr = [];
    for (const item of items) {
      const dataUrl = await QRCode.toDataURL(item.qrCode, {
        width: 1024,
        margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });

      itemsWithQr.push({
        id: item.id,
        name: item.name,
        brand: item.brand,
        model: item.model,
        serialNumber: item.serialNumber,
        category: item.category,
        location: item.location,
        lastMaintenance: item.lastMaintenance ? new Date(item.lastMaintenance).getTime() : null,
        lastReview: item.lastReview ? new Date(item.lastReview).getTime() : null,
        nextMaintenance: item.nextMaintenance ? new Date(item.nextMaintenance).getTime() : null,
        status: item.status,
        photo: item.photo || '',
        notes: item.notes,
        qrCode: item.qrCode,
        qrDataUrl: dataUrl,
        createdBy: item.createdBy,
        createdAt: new Date(item.createdAt).getTime(),
      });
    }

    return NextResponse.json({ items: itemsWithQr, format });
  } catch (error) {
    console.error('GET /api/inventory/export error:', error);
    return NextResponse.json({ error: 'Error al exportar inventario' }, { status: 500 });
  }
}
