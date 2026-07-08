import { NextRequest, NextResponse } from 'next/server';
import { db, withRetry } from '@/lib/db';

// Helper: serializar OrdenTrabajo → formato WorkOrder
function serializeOT(ot: any) {
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

// PUT — actualizar OT en OrdenTrabajo de Aiven
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const otActual = await withRetry(() => db.ordenTrabajo.findUnique({ where: { id } }));
    if (!otActual) {
      return NextResponse.json({ error: 'OT no encontrada' }, { status: 404 });
    }

    const data: any = {};

    if (body.activities !== undefined) {
      data.titulo = Array.isArray(body.activities) ? body.activities.join(', ') : body.activities;
    }
    if (body.zoneName !== undefined) data.ubicacion = body.zoneName;
    if (body.description !== undefined) data.descripcion = body.description;
    if (body.photosBefore !== undefined) data.fotosAntes = JSON.stringify(body.photosBefore);
    if (body.photosAfter !== undefined) data.fotosDespues = JSON.stringify(body.photosAfter);
    if (body.collaborators !== undefined) data.asignadoId = body.collaborators[0] || null;

    // Auto-tracking de timestamps
    if (body.status !== undefined) {
      const estadoSistema = mapearEstadoSistema(body.status);
      data.estado = estadoSistema;
      data.progreso = body.status === 'Terminada' ? 100 : (body.status === 'En Proceso' ? 50 : 0);

      if (estadoSistema === 'En Progreso' && !otActual.fechaInicioReal && body.startedAt === undefined) {
        data.fechaInicioReal = new Date().toISOString();
      }
      if (estadoSistema === 'Completado' && !otActual.fechaFinReal && body.completedAt === undefined) {
        data.fechaFinReal = new Date().toISOString();
      }
    }
    if (body.startedAt !== undefined) data.fechaInicioReal = body.startedAt ? new Date(body.startedAt).toISOString() : null;
    if (body.completedAt !== undefined) data.fechaFinReal = body.completedAt ? new Date(body.completedAt).toISOString() : null;

    const ot = await withRetry(() => db.ordenTrabajo.update({ where: { id }, data }));
    return NextResponse.json(serializeOT(ot));
  } catch (error) {
    console.error('PUT /api/workorders/[id] error:', error);
    return NextResponse.json({ error: 'Error al actualizar OT' }, { status: 500 });
  }
}

// DELETE — eliminar OT
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await withRetry(() => db.ordenTrabajo.delete({ where: { id } }));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/workorders/[id] error:', error);
    return NextResponse.json({ error: 'Error al eliminar OT' }, { status: 500 });
  }
}

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
