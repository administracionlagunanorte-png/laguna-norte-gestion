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

// Helper: compare old and new values to generate change log
function computeChanges(oldData: Record<string, unknown>, newData: Record<string, unknown>): Record<string, { old: unknown; new: unknown }> {
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  for (const key of Object.keys(newData)) {
    const oldVal = oldData[key];
    const newVal = newData[key];
    // Compare as JSON strings to handle arrays
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes[key] = { old: oldVal ?? null, new: newVal ?? null };
    }
  }
  return changes;
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
    if (body.plannedDate !== undefined) data.plannedDate = body.plannedDate ? new Date(body.plannedDate) : null;
    if (body.photosBefore !== undefined) data.photosBefore = Array.isArray(body.photosBefore) ? body.photosBefore : [];
    if (body.photosAfter !== undefined) data.photosAfter = Array.isArray(body.photosAfter) ? body.photosAfter : [];

    // Auto-track startedAt/completedAt when status changes
    if (body.status !== undefined) {
      data.status = body.status;
      // Fetch current record to check for auto-timestamps
      const current = await db.workOrder.findUnique({ where: { id } });
      if (current) {
        if (body.status === 'En Proceso' && !current.startedAt && body.startedAt === undefined) {
          data.startedAt = new Date();
        }
        if (body.status === 'Terminada' && !current.completedAt && body.completedAt === undefined) {
          data.completedAt = new Date();
          if (!current.startedAt && body.startedAt === undefined) {
            data.startedAt = current.createdAt;
          }
        }
      }
    }
    // Explicit timestamp overrides take precedence
    if (body.startedAt !== undefined) data.startedAt = body.startedAt ? new Date(body.startedAt) : null;
    if (body.completedAt !== undefined) data.completedAt = body.completedAt ? new Date(body.completedAt) : null;

    // Fetch current record for audit logging before updating
    const oldRecord = await db.workOrder.findUnique({ where: { id } });

    const row = await db.workOrder.update({
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
          entityType: 'WorkOrder',
          entityId: id,
          entityName: oldRecord.otId || id,
          changes,
          performedBy,
          profileId,
        });
      }
    }

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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch the record before deleting for audit log
    const record = await db.workOrder.findUnique({ where: { id } });

    await db.workOrder.delete({
      where: { id },
    });

    // Audit log: DELETE
    if (record) {
      // Try to get performedBy from query params or headers
      const { searchParams } = new URL(request.url);
      const performedBy = searchParams.get('_performedBy') || 'admin';
      const profileId = searchParams.get('_profileId') || null;
      await createAuditLog({
        action: 'DELETE',
        entityType: 'WorkOrder',
        entityId: id,
        entityName: record.otId || id,
        changes: {
          otId: { old: record.otId, new: null },
          status: { old: record.status, new: null },
          activities: { old: record.activities, new: null },
          zoneName: { old: record.zoneName, new: null },
          collaborators: { old: record.collaborators, new: null },
          description: { old: record.description, new: null },
        },
        performedBy,
        profileId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/workorders/[id] error:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la orden de trabajo' },
      { status: 500 }
    );
  }
}
