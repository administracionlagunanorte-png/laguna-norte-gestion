import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper: create an audit log entry
export async function createAuditLog({
  action,
  entityType,
  entityId,
  entityName,
  changes,
  performedBy,
  profileId,
}: {
  action: string;       // CREATE, UPDATE, DELETE
  entityType: string;   // WorkOrder, Profile, RecurringWorkOrder
  entityId: string;
  entityName?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  performedBy?: string;
  profileId?: string;
}) {
  try {
    await db.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        entityName: entityName || '',
        changes: changes ? JSON.stringify(changes) : '{}',
        performedBy: performedBy || 'admin',
        profileId: profileId || null,
      },
    });
  } catch (error) {
    // Audit logging should never block the main operation
    console.error('Audit log error:', error);
  }
}

// GET /api/audit — return audit logs with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType') || undefined;
    const action = searchParams.get('action') || undefined;
    const performedBy = searchParams.get('performedBy') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: Record<string, unknown> = {};
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;
    if (performedBy) where.performedBy = performedBy;

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.auditLog.count({ where }),
    ]);

    const serialized = logs.map(log => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      entityName: log.entityName,
      changes: log.changes ? JSON.parse(log.changes) : {},
      performedBy: log.performedBy,
      profileId: log.profileId,
      createdAt: new Date(log.createdAt).getTime(),
    }));

    return NextResponse.json({ logs: serialized, total, limit, offset });
  } catch (error) {
    console.error('GET /api/audit error:', error);
    return NextResponse.json(
      { error: 'Error al obtener los registros de auditoría' },
      { status: 500 }
    );
  }
}
