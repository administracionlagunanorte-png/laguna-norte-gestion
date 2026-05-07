import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createAuditLog } from '@/app/api/audit/route';

// POST /api/recurring/generate — generate WorkOrders for today from all active recurring templates
export async function POST() {
  try {
    // Get "today" in Chile timezone (America/Santiago)
    const now = new Date();
    const chileStr = now.toLocaleString('en-US', { timeZone: 'America/Santiago' });
    const chileNow = new Date(chileStr);
    const todayDayOfWeek = chileNow.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const todayDayOfMonth = chileNow.getDate();

    // Build UTC date range for "today in Chile" to check against createdAt (stored in UTC)
    const chileY = chileNow.getFullYear();
    const chileM = chileNow.getMonth();
    const chileD = chileNow.getDate();

    // Chile is UTC-4 (standard) or UTC-3 (DST). We calculate the UTC window:
    const utcOffsetMs = now.getTime() - chileNow.getTime();
    const utcStartOfDay = new Date(Date.UTC(chileY, chileM, chileD, 0, 0, 0, 0) + utcOffsetMs);
    const utcEndOfDay = new Date(Date.UTC(chileY, chileM, chileD, 23, 59, 59, 999) + utcOffsetMs);

    // Get the counter for OT IDs — ALWAYS recalculate from actual data to prevent resets
    const allOts = await db.workOrder.findMany({
      select: { otId: true },
    });
    let counter = 0;
    for (const ot of allOts) {
      const num = parseInt(ot.otId.replace('OT-', ''), 10);
      if (!isNaN(num) && num > counter) counter = num;
    }

    // Fetch all active recurring work orders
    const activeRecurring = await db.recurringWorkOrder.findMany({
      where: { status: 'active' },
    });

    let created = 0;
    let skipped = 0;

    for (const recurring of activeRecurring) {
      // Check if this recurring template should generate today
      let shouldGenerate = false;

      if (recurring.frequency === 'daily') {
        shouldGenerate = true;
      } else if (recurring.frequency === 'weekly') {
        const daysOfWeek = Array.isArray(recurring.daysOfWeek) ? recurring.daysOfWeek : [];
        shouldGenerate = daysOfWeek.includes(todayDayOfWeek);
      } else if (recurring.frequency === 'monthly') {
        shouldGenerate = recurring.dayOfMonth === todayDayOfMonth;
      }

      if (!shouldGenerate) continue;

      // Check for duplicate: already have a WorkOrder with this recurringId created today (Chile time)
      const existing = await db.workOrder.findFirst({
        where: {
          recurringId: recurring.id,
          createdAt: {
            gte: utcStartOfDay,
            lte: utcEndOfDay,
          },
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Generate the WorkOrder
      counter++;
      const otId = `OT-${String(counter).padStart(4, '0')}`;

      const woId = crypto.randomUUID();
      await db.workOrder.create({
        data: {
          id: woId,
          otId,
          activities: Array.isArray(recurring.activities) ? recurring.activities : [],
          collaborators: Array.isArray(recurring.collaborators) ? recurring.collaborators : [],
          zoneName: recurring.zoneName,
          description: recurring.description || `[Auto] ${recurring.name}`,
          status: 'Pendiente',
          plannedDate: new Date(chileY, chileM, chileD, 12, 0, 0),
          photosBefore: [],
          photosAfter: [],
          recurringId: recurring.id,
        },
      });

      // Update lastGeneratedAt
      await db.recurringWorkOrder.update({
        where: { id: recurring.id },
        data: { lastGeneratedAt: new Date() },
      });

      // Audit log: CREATE (auto-generated)
      await createAuditLog({
        action: 'CREATE',
        entityType: 'WorkOrder',
        entityId: woId,
        entityName: otId,
        changes: {
          otId: { old: null, new: otId },
          status: { old: null, new: 'Pendiente' },
          recurringId: { old: null, new: recurring.id },
          generatedFromRecurring: { old: null, new: recurring.name },
        },
        performedBy: 'Sistema (Auto)',
      });

      created++;
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      message: `${created} OT(s) creada(s), ${skipped} ya existían para hoy`,
    });
  } catch (error) {
    console.error('POST /api/recurring/generate error:', error);
    return NextResponse.json(
      { error: 'Error al generar OTs repetitivas' },
      { status: 500 }
    );
  }
}
