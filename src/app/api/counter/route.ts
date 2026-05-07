import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/counter — get current OT counter value
export async function GET() {
  try {
    let counter = await db.counter.findUnique({
      where: { id: 'ot_counter' },
    });

    if (!counter) {
      // Initialize counter from the highest existing OT number
      const allOts = await db.workOrder.findMany({
        select: { otId: true },
      });
      let maxNum = 0;
      for (const ot of allOts) {
        const num = parseInt(ot.otId.replace('OT-', ''), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
      counter = await db.counter.create({
        data: { id: 'ot_counter', value: maxNum },
      });
    }

    return NextResponse.json({ value: counter.value });
  } catch (error) {
    console.error('GET /api/counter error:', error);
    return NextResponse.json(
      { error: 'Error al obtener el contador' },
      { status: 500 }
    );
  }
}

// POST /api/counter — increment and return next OT number (atomic)
export async function POST(request: NextRequest) {
  try {
    // Try to increment atomically
    let counter = await db.counter.findUnique({
      where: { id: 'ot_counter' },
    });

    if (!counter) {
      // Initialize counter from the highest existing OT number
      const allOts = await db.workOrder.findMany({
        select: { otId: true },
      });
      let maxNum = 0;
      for (const ot of allOts) {
        const num = parseInt(ot.otId.replace('OT-', ''), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
      counter = await db.counter.create({
        data: { id: 'ot_counter', value: maxNum + 1 },
      });
    } else {
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
