import { NextRequest, NextResponse } from 'next/server';
import { db, withRetry } from '@/lib/db';

// GET — listar perfiles. La primera vez crea desde Personal de Aiven.
export async function GET() {
  try {
    let perfiles = await withRetry(() => db.movilProfile.findMany({
      orderBy: { name: 'asc' },
      take: 100,
    }));

    // Si no hay perfiles, crearlos desde Personal
    if (perfiles.length === 0) {
      const personal = await withRetry(() => db.personal.findMany({
        where: { estado: 'Activo' },
        take: 50,
        orderBy: { nombre: 'asc' },
      }));

      for (const p of personal) {
        try {
          await withRetry(() => db.movilProfile.create({
            data: {
              name: p.nombre,
              accessCode: String(Math.floor(1000 + Math.random() * 9000)),
              password: '',
              color: 'bg-blue-600',
              icon: 'User',
              workAreaIds: [],
              permissions: ['view', 'create', 'edit'],
              personalId: p.id,
            },
          }));
        } catch {}
      }

      perfiles = await withRetry(() => db.movilProfile.findMany({
        orderBy: { name: 'asc' },
        take: 100,
      }));
    }

    return NextResponse.json(perfiles.map(p => ({
      id: p.id,
      name: p.name,
      password: p.password,
      accessCode: p.accessCode,
      color: p.color,
      icon: p.icon,
      workAreaIds: p.workAreaIds,
      permissions: p.permissions,
      personalId: p.personalId,
    })));
  } catch (error) {
    console.error('GET /api/profiles error:', error);
    return NextResponse.json([]);
  }
}

// POST — crear perfil
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const perfil = await withRetry(() => db.movilProfile.create({
      data: {
        name: body.name,
        password: body.password || '',
        accessCode: body.accessCode || String(Math.floor(1000 + Math.random() * 9000)),
        color: body.color || 'bg-blue-600',
        icon: body.icon || 'User',
        workAreaIds: body.workAreaIds || [],
        permissions: body.permissions || ['view'],
        personalId: body.personalId || null,
      },
    }));
    return NextResponse.json(perfil);
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
