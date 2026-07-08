import { NextRequest, NextResponse } from 'next/server'
import { db, withRetry } from '@/lib/db'

export async function GET() {
  try {
    const logs = await withRetry(() => db.movilAuditLog.findMany({ take: 100, orderBy: { createdAt: 'desc' } }))
    return NextResponse.json(logs)
  } catch { return NextResponse.json([]) }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const log = await withRetry(() => db.movilAuditLog.create({
      data: { action: body.action || 'UPDATE', entityType: body.entityType || 'WorkOrder', entityId: body.entityId || '', entityName: body.entityName || '', changes: typeof body.changes === 'string' ? body.changes : JSON.stringify(body.changes || {}), performedBy: body.performedBy || 'admin', profileId: body.profileId || null }
    }))
    return NextResponse.json(log)
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}

export async function createAuditLog(data: { action: string; entityType: string; entityId: string; entityName: string; changes: any; performedBy: string; profileId: string | null }) {
  try {
    await withRetry(() => db.movilAuditLog.create({
      data: { action: data.action, entityType: data.entityType, entityId: data.entityId, entityName: data.entityName, changes: typeof data.changes === 'string' ? data.changes : JSON.stringify(data.changes), performedBy: data.performedBy, profileId: data.profileId }
    }))
  } catch {}
}
