import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createAuditLog } from '@/app/api/audit/route';

// Helper: serialize a DB row into a client-friendly WorkOrder object
function serializeWorkOrder(row: {
  id: string;
  otId: string;
  activities: string[];
  collaborators: string[];
  zoneName: string;
  description: string;
  status: string;
  plannedDate: Date | null;
  photosBefore: string[];
  photosAfter: string[];
  recurringId: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    otId: row.otId,
    activities: Array.isArray(row.activities) ? row.activities : [],
    collaborators: Array.isArray(row.collaborators) ? row.collaborators : [],
    zoneName: row.zoneName,
    description: row.description,
    status: row.status,
    plannedDate: row.plannedDate ? new Date(row.plannedDate).getTime() : null,
    startedAt: row.startedAt ? new Date(row.startedAt).getTime() : null,
    completedAt: row.completedAt ? new Date(row.completedAt).getTime() : null,
    createdAt: new Date(row.createdAt).getTime(),
    photosBefore: Array.isArray(row.photosBefore) ? row.photosBefore : [],
    photosAfter: Array.isArray(row.photosAfter) ? row.photosAfter : [],
    recurringId: row.recurringId,
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
// The otId is generated atomically on the server to prevent duplicate numbers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const id = body.id || crypto.randomUUID();
    const activities = Array.isArray(body.activities) ? body.activities : [];
    const collaborators = Array.isArray(body.collaborators) ? body.collaborators : [];
    const zoneName = body.zoneName || '';
    const description = body.description || '';
    const status = body.status || 'Pendiente';
    const photosBefore = Array.isArray(body.photosBefore) ? body.photosBefore : [];
    const photosAfter = Array.isArray(body.photosAfter) ? body.photosAfter : [];
    // Auto-set startedAt/completedAt based on initial status
    const startedAt = status === 'En Proceso' || status === 'Terminada' ? new Date() : null;
    const completedAt = status === 'Terminada' ? new Date() : null;
    const plannedDate = body.plannedDate ? new Date(body.plannedDate) : null;
    const recurringId = body.recurringId || null;

    // ─── Generate otId atomically on the server ───
    // Always calculate from actual data to prevent duplicates and resets
    const allOts = await db.workOrder.findMany({
      select: { otId: true },
    });
    let maxNum = 0;
    for (const ot of allOts) {
      const num = parseInt(ot.otId.replace('OT-', ''), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }

    // Also check the Counter table for a higher value
    let counter = await db.counter.findUnique({ where: { id: 'ot_counter' } });
    if (counter && counter.value > maxNum) {
      maxNum = counter.value;
    }

    const nextNum = maxNum + 1;
    const otId = body.otId || `OT-${String(nextNum).padStart(4, '0')}`;

    // Update the counter to stay in sync
    if (counter) {
      await db.counter.update({
        where: { id: 'ot_counter' },
        data: { value: nextNum },
      });
    } else {
      await db.counter.create({
        data: { id: 'ot_counter', value: nextNum },
      });
    }

    const row = await db.workOrder.create({
      data: {
        id,
        otId,
        activities,
        collaborators,
        zoneName,
        description,
        status,
        plannedDate,
        photosBefore,
        photosAfter,
        recurringId,
        startedAt,
        completedAt,
      },
    });

    // Audit log: CREATE
    const performedBy = body._performedBy || 'admin';
    const profileId = body._profileId || null;
    await createAuditLog({
      action: 'CREATE',
      entityType: 'WorkOrder',
      entityId: id,
      entityName: otId,
      changes: {
        otId: { old: null, new: otId },
        status: { old: null, new: status },
        activities: { old: null, new: activities },
        zoneName: { old: null, new: zoneName },
      },
      performedBy,
      profileId,
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
