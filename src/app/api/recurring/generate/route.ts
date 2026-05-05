import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
    // Approximate: Chile start of day in UTC is roughly 04:00 UTC the same day
    // Instead of hardcoding offset, we use the difference between now (UTC) and chileNow
    const utcOffsetMs = now.getTime() - chileNow.getTime();
    const utcStartOfDay = new Date(Date.UTC(chileY, chileM, chileD, 0, 0, 0, 0) + utcOffsetMs);
    const utcEndOfDay = new Date(Date.UTC(chileY, chileM, chileD, 23, 59, 59, 999) + utcOffsetMs);

    // Get the counter for OT IDs
    const lastOt = await db.workOrder.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { otId: true },
    });
    let counter = 0;
    if (lastOt?.otId) {
      const match = lastOt.otId.match(/OT-(\d+)/);
      if (match) counter = parseInt(match[1], 10);
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

      await db.workOrder.create({
        data: {
          id: crypto.randomUUID(),
          otId,
          activities: Array.isArray(recurring.activities) ? recurring.activities : [],
          collaborators: Array.isArray(recurring.collaborators) ? recurring.collaborators : [],
          zoneName: recurring.zoneName,
          description: recurring.description || `[Auto] ${recurring.name}`,
          status: 'Pendiente',
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
