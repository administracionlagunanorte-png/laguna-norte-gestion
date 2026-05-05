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

// GET /api/recurring — return all recurring work orders
export async function GET() {
  try {
    const rows = await db.recurringWorkOrder.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const items = rows.map(serializeRecurring);
    return NextResponse.json(items);
  } catch (error) {
    console.error('GET /api/recurring error:', error);
    return NextResponse.json(
      { error: 'Error al obtener las OTs repetitivas' },
      { status: 500 }
    );
  }
}

// POST /api/recurring — create a new recurring work order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const row = await db.recurringWorkOrder.create({
      data: {
        name: body.name || '',
        activities: Array.isArray(body.activities) ? body.activities : [],
        collaborators: Array.isArray(body.collaborators) ? body.collaborators : [],
        zoneName: body.zoneName || '',
        workAreaId: body.workAreaId || '',
        description: body.description || '',
        frequency: body.frequency || 'weekly',
        daysOfWeek: Array.isArray(body.daysOfWeek) ? body.daysOfWeek.map(Number) : [],
        dayOfMonth: body.dayOfMonth != null ? Number(body.dayOfMonth) : null,
        status: body.status || 'active',
      },
    });

    return NextResponse.json(serializeRecurring(row), { status: 201 });
  } catch (error) {
    console.error('POST /api/recurring error:', error);
    return NextResponse.json(
      { error: 'Error al crear la OT repetitiva' },
      { status: 500 }
    );
  }
}
