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

    // Start/end of today in Chile timezone (for duplicate check)
    const chileStartOfDay = new Date(chileNow);
    chileStartOfDay.setHours(0, 0, 0, 0);
    const chileEndOfDay = new Date(chileNow);
    chileEndOfDay.setHours(23, 59, 59, 999);

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
        // Check if today's day of week is in the daysOfWeek array
        const daysOfWeek = Array.isArray(recurring.daysOfWeek) ? recurring.daysOfWeek : [];
        shouldGenerate = daysOfWeek.includes(todayDayOfWeek);
      } else if (recurring.frequency === 'monthly') {
        // Check if today matches dayOfMonth
        shouldGenerate = recurring.dayOfMonth === todayDayOfMonth;
      }

      if (!shouldGenerate) continue;

      // Check for duplicate: already have a WorkOrder with this recurringId created today
      const existing = await db.workOrder.findFirst({
        where: {
          recurringId: recurring.id,
          createdAt: {
            gte: chileStartOfDay,
            lte: chileEndOfDay,
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
