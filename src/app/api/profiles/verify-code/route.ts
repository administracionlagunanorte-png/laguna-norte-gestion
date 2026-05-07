import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/profiles/verify-code — find a profile by access code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = (body.code || '').trim().toUpperCase();

    if (!code) {
      return NextResponse.json(
        { error: 'Ingresa un código' },
        { status: 400 }
      );
    }

    // Find profile with matching access code (case-insensitive)
    const profiles = await db.profile.findMany();
    const profile = profiles.find(p => p.accessCode.toUpperCase() === code);

    if (!profile) {
      return NextResponse.json(
        { error: 'Código no válido' },
        { status: 404 }
      );
    }

    // If profile has a password, require it too
    if (profile.password && body.password !== undefined) {
      if (profile.password !== body.password) {
        return NextResponse.json(
          { error: 'Contraseña incorrecta', needsPassword: true },
          { status: 401 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        name: profile.name,
        accessCode: profile.accessCode,
        color: profile.color || '',
        icon: profile.icon || '',
        workAreaIds: Array.isArray(profile.workAreaIds) ? profile.workAreaIds : [],
        permissions: Array.isArray(profile.permissions) ? profile.permissions : ['view'],
        hasPassword: profile.password !== '',
        hasAccessCode: profile.accessCode !== '',
        needsPassword: profile.password !== '' && !body.password,
        createdAt: new Date(profile.createdAt).getTime(),
        updatedAt: new Date(profile.updatedAt).getTime(),
      },
    });
  } catch (error) {
    console.error('POST /api/profiles/verify-code error:', error);
    return NextResponse.json(
      { error: 'Error al verificar el código' },
      { status: 500 }
    );
  }
}
