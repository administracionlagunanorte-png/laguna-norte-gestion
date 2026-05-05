import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function serializeRecurring(row: {
  id: string;
  name: string;
  activities: string[];
  collaborators: string[];
  zoneName: string;
  workAreaId: string;
  description: string;
  frequency: string;
  daysOfWeek: number[];
  dayOfMonth: number | null;
  status: string;
  lastGeneratedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    activities: Array.isArray(row.activities) ? row.activities : [],
    collaborators: Array.isArray(row.collaborators) ? row.collaborators : [],
    zoneName: row.zoneName,
    workAreaId: row.workAreaId,
    description: row.description,
    frequency: row.frequency,
    daysOfWeek: Array.isArray(row.daysOfWeek) ? row.daysOfWeek : [],
    dayOfMonth: row.dayOfMonth,
    status: row.status,
    lastGeneratedAt: row.lastGeneratedAt ? new Date(row.lastGeneratedAt).getTime() : null,
    createdAt: new Date(row.createdAt).getTime(),
    updatedAt: new Date(row.updatedAt).getTime(),
  };
}

// PUT /api/recurring/[id] — update a recurring work order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.activities !== undefined) data.activities = Array.isArray(body.activities) ? body.activities : [];
    if (body.collaborators !== undefined) data.collaborators = Array.isArray(body.collaborators) ? body.collaborators : [];
    if (body.zoneName !== undefined) data.zoneName = body.zoneName;
    if (body.workAreaId !== undefined) data.workAreaId = body.workAreaId;
    if (body.description !== undefined) data.description = body.description;
    if (body.frequency !== undefined) data.frequency = body.frequency;
    if (body.daysOfWeek !== undefined) data.daysOfWeek = Array.isArray(body.daysOfWeek) ? body.daysOfWeek.map(Number) : [];
    if (body.dayOfMonth !== undefined) data.dayOfMonth = body.dayOfMonth != null ? Number(body.dayOfMonth) : null;
    if (body.status !== undefined) data.status = body.status;

    const row = await db.recurringWorkOrder.update({
      where: { id },
      data,
    });

    return NextResponse.json(serializeRecurring(row));
  } catch (error) {
    console.error('PUT /api/recurring/[id] error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la OT repetitiva' },
      { status: 500 }
    );
  }
}

// DELETE /api/recurring/[id] — delete a recurring work order
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.recurringWorkOrder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/recurring/[id] error:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la OT repetitiva' },
      { status: 500 }
    );
  }
}
