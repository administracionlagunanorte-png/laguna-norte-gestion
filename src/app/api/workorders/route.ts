import { NextRequest, NextResponse } from 'next/server';
import { db, withRetry } from '@/lib/db';

// Permitir bodies grandes para fotos en base64
export const maxDuration = 60
export const bodySizeLimit = '8mb'

// Helper: serializar OrdenTrabajo → formato WorkOrder de la app móvil
function serializeOT(ot: {
  id: string;
  otNum: string;
  titulo: string;
  estado: string;
  ubicacion: string | null;
  descripcion: string | null;
  fechaInicio: string | null;
  fechaInicioReal: string | null;
  fechaFinReal: string | null;
  fotosAntes: string | null;
  fotosDespues: string | null;
  asignadoId: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: ot.id,
    otId: ot.otNum,
    activities: ot.titulo ? ot.titulo.split(', ').filter(Boolean) : [],
    collaborators: ot.asignadoId ? [ot.asignadoId] : [],
    zoneName: ot.ubicacion || '',
    description: ot.descripcion || ot.titulo || '',
    status: mapearEstadoMovil(ot.estado),
    plannedDate: ot.fechaInicio ? new Date(ot.fechaInicio).getTime() : null,
    startedAt: ot.fechaInicioReal ? new Date(ot.fechaInicioReal).getTime() : null,
    completedAt: ot.fechaFinReal ? new Date(ot.fechaFinReal).getTime() : null,
    createdAt: ot.createdAt.getTime(),
    photosBefore: safeParseArray(ot.fotosAntes),
    photosAfter: safeParseArray(ot.fotosDespues),
    recurringId: null,
  };
}

// GET — listar OTs desde OrdenTrabajo de Aiven
export async function GET() {
  try {
    const ots = await withRetry(() =>
      db.ordenTrabajo.findMany({
        orderBy: { createdAt: 'desc' },
        take: 500,
      })
    );
    const workOrders = ots.map(serializeOT);
    return NextResponse.json(workOrders);
  } catch (error) {
    console.error('GET /api/workorders error:', error);
    return NextResponse.json(
      { error: 'Error al obtener las órdenes de trabajo' },
      { status: 500 }
    );
  }
}

// POST — crear nueva OT en OrdenTrabajo de Aiven
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const activities = Array.isArray(body.activities) ? body.activities : [];
    const titulo = activities.length > 0 ? activities.join(', ') : (body.description || 'OT Móvil');
    const estado = mapearEstadoSistema(body.status || 'Pendiente');

    // Generar número de OT usando Secuencia (compartido con sistema escritorio)
    const secuencia = await withRetry(() =>
      db.secuencia.upsert({
        where: { tabla: 'OrdenTrabajo' },
        update: { ultimoNum: { increment: 1 } },
        create: { tabla: 'OrdenTrabajo', prefijo: 'OT', ultimoNum: 1, padding: 4 },
      })
    );
    const otNum = `OT-${String(secuencia.ultimoNum).padStart(4, '0')}`;

    // Auto-set timestamps
    const ahora = new Date().toISOString();
    const fechaInicioReal = (body.status === 'En Proceso' || body.status === 'Terminada') ? ahora : null;
    const fechaFinReal = body.status === 'Terminada' ? ahora : null;

    const nuevaOT = await withRetry(() =>
      db.ordenTrabajo.create({
        data: {
          otNum,
          titulo,
          tipo: 'Correctivo',
          prioridad: 'Media',
          estado,
          ubicacion: body.zoneName || null,
          descripcion: body.description || null,
          fechaInicio: body.plannedDate ? new Date(body.plannedDate).toISOString().split('T')[0] : null,
          fechaInicioReal,
          fechaFinReal,
          fotosAntes: body.photosBefore?.length > 0 ? JSON.stringify(body.photosBefore) : null,
          fotosDespues: body.photosAfter?.length > 0 ? JSON.stringify(body.photosAfter) : null,
          progreso: body.status === 'Terminada' ? 100 : (body.status === 'En Proceso' ? 50 : 0),
          asignadoId: body.collaborators?.[0] || null,
          estadoAprobacion: 'Pendiente',
        },
      })
    );

    return NextResponse.json(serializeOT(nuevaOT), { status: 201 });
  } catch (error) {
    console.error('POST /api/workorders error:', error);
    return NextResponse.json(
      { error: 'Error al crear la orden de trabajo' },
      { status: 500 }
    );
  }
}

// Mapear estados: sistema escritorio ↔ app móvil
function mapearEstadoMovil(estadoSistema: string): string {
  const mapeo: Record<string, string> = {
    'Pendiente': 'Pendiente',
    'En Progreso': 'En Proceso',
    'Completado': 'Terminada',
    'Cancelado': 'Pendiente',
  };
  return mapeo[estadoSistema] || 'Pendiente';
}

function mapearEstadoSistema(estadoMovil: string): string {
  const mapeo: Record<string, string> = {
    'Pendiente': 'Pendiente',
    'En Proceso': 'En Progreso',
    'Terminada': 'Completado',
  };
  return mapeo[estadoMovil] || 'Pendiente';
}

function safeParseArray(str: string | null): string[] {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
