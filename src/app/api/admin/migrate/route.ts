import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/admin/migrate — Run pending schema migrations
export async function POST() {
  try {
    const results: string[] = [];

    // Add photo column to InventoryItem if missing
    try {
      await db.$executeRawUnsafe(`
        ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "photo" TEXT NOT NULL DEFAULT '';
      `);
      results.push('Added photo column to InventoryItem');
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        results.push('photo column already exists in InventoryItem');
      } else {
        results.push(`InventoryItem.photo: ${e.message}`);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
