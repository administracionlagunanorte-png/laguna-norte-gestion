import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper: serialize a DB row into a client-friendly WorkOrder object
function serializeWorkOrder(row: {
  id: string;
  otId: string;
  activities: string;
  collaborators: string;
  zoneName: string;
  description: string;
  status: string;
  photosBefore: string;
  photosAfter: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  let activities: string[];
  try {
    const parsed = JSON.parse(row.activities);
    activities = Array.isArray(parsed) ? parsed : [];
  } catch {
    activities = [];
  }

  let collaborators: string[];
  try {
    const parsed = JSON.parse(row.collaborators);
    collaborators = Array.isArray(parsed) ? parsed : [];
  } catch {
    collaborators = [];
  }

  let photosBefore: string[];
  try {
    const parsed = JSON.parse(row.photosBefore);
    photosBefore = Array.isArray(parsed) ? parsed : [];
  } catch {
    photosBefore = [];
  }

  let photosAfter: string[];
  try {
    const parsed = JSON.parse(row.photosAfter);
    photosAfter = Array.isArray(parsed) ? parsed : [];
  } catch {
    photosAfter = [];
  }

  return {
    id: row.id,
    otId: row.otId,
    activities,
    collaborators,
    zoneName: row.zoneName,
    description: row.description,
    status: row.status,
    createdAt: new Date(row.createdAt).getTime(),
    photosBefore,
    photosAfter,
  };
}

// GET /api/workorders — return all work orders, newest first
export async function GET() {
  try {
    const rows = await db.workOrder.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const workOrders = rows.map(serializeWorkOrder);
    return NextResponse.json(workOrders);
  } catch (error) {
    console.error('GET /api/workorders error:', error);
    return NextResponse.json(
      { error: 'Error al obtener las órdenes de trabajo' },
      { status: 500 }
    );
  }
}

// POST /api/workorders — create a new work order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const id = body.id || crypto.randomUUID();
    const otId = body.otId || '';
    const activities = JSON.stringify(Array.isArray(body.activities) ? body.activities : []);
    const collaborators = JSON.stringify(Array.isArray(body.collaborators) ? body.collaborators : []);
    const zoneName = body.zoneName || '';
    const description = body.description || '';
    const status = body.status || 'Pendiente';
    const photosBefore = JSON.stringify(Array.isArray(body.photosBefore) ? body.photosBefore : []);
    const photosAfter = JSON.stringify(Array.isArray(body.photosAfter) ? body.photosAfter : []);

    const row = await db.workOrder.create({
      data: {
        id,
        otId,
        activities,
        collaborators,
        zoneName,
        description,
        status,
        photosBefore,
        photosAfter,
      },
    });

    return NextResponse.json(serializeWorkOrder(row), { status: 201 });
  } catch (error) {
    console.error('POST /api/workorders error:', error);
    return NextResponse.json(
      { error: 'Error al crear la orden de trabajo' },
      { status: 500 }
    );
  }
}
