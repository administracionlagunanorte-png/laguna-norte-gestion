import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper: always get the true max OT number from actual WorkOrder data
// This ensures the counter NEVER resets even if the Counter table is wiped
async function getMaxOtNumber(): Promise<number> {
  const allOts = await db.workOrder.findMany({
    select: { otId: true },
  });
  let maxNum = 0;
  for (const ot of allOts) {
    const num = parseInt(ot.otId.replace('OT-', ''), 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  }
  return maxNum;
}

// Helper: ensure the counter is in sync with actual data
async function ensureCounterSynced(): Promise<number> {
  const actualMax = await getMaxOtNumber();

  let counter = await db.counter.findUnique({
    where: { id: 'ot_counter' },
  });

  if (!counter) {
    // Counter doesn't exist (was reset/deleted) — recreate from actual data
    counter = await db.counter.create({
      data: { id: 'ot_counter', value: actualMax },
    });
  } else if (counter.value < actualMax) {
    // Counter is behind actual data (was reset but data exists) — fix it
    counter = await db.counter.update({
      where: { id: 'ot_counter' },
      data: { value: actualMax },
    });
  }

  return counter.value;
}

// GET /api/counter — get current OT counter value (always synced with actual data)
export async function GET() {
  try {
    const value = await ensureCounterSynced();
    return NextResponse.json({ value });
  } catch (error) {
    console.error('GET /api/counter error:', error);
    return NextResponse.json(
      { error: 'Error al obtener el contador' },
      { status: 500 }
    );
  }
}

// POST /api/counter — increment and return next OT number (atomic, never resets)
export async function POST(request: NextRequest) {
  try {
    // First, always sync the counter with actual data to prevent resets
    const actualMax = await getMaxOtNumber();

    let counter = await db.counter.findUnique({
      where: { id: 'ot_counter' },
    });

    if (!counter) {
      // Counter doesn't exist — create it at actualMax + 1 (the next number)
      counter = await db.counter.create({
        data: { id: 'ot_counter', value: actualMax + 1 },
      });
    } else if (counter.value <= actualMax) {
      // Counter is behind or equal to actual data — advance past the max
      counter = await db.counter.update({
        where: { id: 'ot_counter' },
        data: { value: actualMax + 1 },
      });
    } else {
      // Counter is ahead of actual data (normal case) — just increment
      counter = await db.counter.update({
        where: { id: 'ot_counter' },
        data: { value: { increment: 1 } },
      });
    }

    return NextResponse.json({ value: counter.value });
  } catch (error) {
    console.error('POST /api/counter error:', error);
    return NextResponse.json(
      { error: 'Error al incrementar el contador' },
      { status: 500 }
    );
  }
}
