import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createAuditLog } from '@/app/api/audit/route';

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

// Helper: compare old and new values to generate change log
function computeChanges(oldData: Record<string, unknown>, newData: Record<string, unknown>): Record<string, { old: unknown; new: unknown }> {
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  for (const key of Object.keys(newData)) {
    const oldVal = oldData[key];
    const newVal = newData[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes[key] = { old: oldVal ?? null, new: newVal ?? null };
    }
  }
  return changes;
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

    // Fetch old record for audit
    const oldRecord = await db.recurringWorkOrder.findUnique({ where: { id } });

    const row = await db.recurringWorkOrder.update({
      where: { id },
      data,
    });

    // Audit log: UPDATE
    if (oldRecord) {
      const oldData: Record<string, unknown> = {};
      const newData: Record<string, unknown> = {};
      for (const key of Object.keys(data)) {
        if (key in oldRecord) {
          oldData[key] = (oldRecord as Record<string, unknown>)[key];
        }
        newData[key] = data[key];
      }
      const changes = computeChanges(oldData, newData);
      if (Object.keys(changes).length > 0) {
        const performedBy = body._performedBy || 'admin';
        const profileId = body._profileId || null;
        await createAuditLog({
          action: 'UPDATE',
          entityType: 'RecurringWorkOrder',
          entityId: id,
          entityName: oldRecord.name || id,
          changes,
          performedBy,
          profileId,
        });
      }
    }

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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch the record before deleting for audit log
    const record = await db.recurringWorkOrder.findUnique({ where: { id } });

    await db.recurringWorkOrder.delete({
      where: { id },
    });

    // Audit log: DELETE
    if (record) {
      const { searchParams } = new URL(request.url);
      const performedBy = searchParams.get('_performedBy') || 'admin';
      const profileId = searchParams.get('_profileId') || null;
      await createAuditLog({
        action: 'DELETE',
        entityType: 'RecurringWorkOrder',
        entityId: id,
        entityName: record.name || id,
        changes: {
          name: { old: record.name, new: null },
          frequency: { old: record.frequency, new: null },
          activities: { old: record.activities, new: null },
        },
        performedBy,
        profileId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/recurring/[id] error:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la OT repetitiva' },
      { status: 500 }
    );
  }
}
