import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper: serialize a DB row into a client-friendly WorkOrder object
function serializeWorkOrder(row: {
  id: string;
  otId: string;
  activities: string[];
  collaborators: string[];
  zoneName: string;
  description: string;
  status: string;
  photosBefore: string[];
  photosAfter: string[];
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
    createdAt: new Date(row.createdAt).getTime(),
    photosBefore: Array.isArray(row.photosBefore) ? row.photosBefore : [],
    photosAfter: Array.isArray(row.photosAfter) ? row.photosAfter : [],
  };
}

// PUT /api/workorders/[id] — update a work order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};

    if (body.otId !== undefined) data.otId = body.otId;
    if (body.activities !== undefined) data.activities = Array.isArray(body.activities) ? body.activities : [];
    if (body.collaborators !== undefined) data.collaborators = Array.isArray(body.collaborators) ? body.collaborators : [];
    if (body.zoneName !== undefined) data.zoneName = body.zoneName;
    if (body.description !== undefined) data.description = body.description;
    if (body.status !== undefined) data.status = body.status;
    if (body.photosBefore !== undefined) data.photosBefore = Array.isArray(body.photosBefore) ? body.photosBefore : [];
    if (body.photosAfter !== undefined) data.photosAfter = Array.isArray(body.photosAfter) ? body.photosAfter : [];

    const row = await db.workOrder.update({
      where: { id },
      data,
    });

    return NextResponse.json(serializeWorkOrder(row));
  } catch (error) {
    console.error('PUT /api/workorders/[id] error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la orden de trabajo' },
      { status: 500 }
    );
  }
}

// DELETE /api/workorders/[id] — delete a work order
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.workOrder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/workorders/[id] error:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la orden de trabajo' },
      { status: 500 }
    );
  }
}
