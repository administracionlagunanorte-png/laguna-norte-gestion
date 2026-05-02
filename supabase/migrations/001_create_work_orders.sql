-- Migration: Create WorkOrder table for Laguna Norte Gestión Operativa
-- Run this SQL in the Supabase SQL Editor (Dashboard → SQL Editor)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create WorkOrder table
CREATE TABLE IF NOT EXISTS "WorkOrder" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "otId" TEXT NOT NULL DEFAULT '',
  "activities" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "collaborators" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "zoneName" TEXT DEFAULT '',
  "description" TEXT DEFAULT '',
  "status" TEXT DEFAULT 'Pendiente',
  "photosBefore" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "photosAfter" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updatedAt
DROP TRIGGER IF EXISTS set_updated_at ON "WorkOrder";
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON "WorkOrder"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index on otId for faster lookups
CREATE INDEX IF NOT EXISTS idx_workorder_otid ON "WorkOrder"("otId");

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_workorder_status ON "WorkOrder"("status");

-- Create index on createdAt for sorting
CREATE INDEX IF NOT EXISTS idx_workorder_createdat ON "WorkOrder"("createdAt" DESC);

-- Enable Row Level Security (optional — adjust policies as needed)
ALTER TABLE "WorkOrder" ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous read access (adjust for production)
CREATE POLICY "Allow anonymous read access" ON "WorkOrder"
  FOR SELECT USING (true);

-- Policy: Allow anonymous insert
CREATE POLICY "Allow anonymous insert" ON "WorkOrder"
  FOR INSERT WITH CHECK (true);

-- Policy: Allow anonymous update
CREATE POLICY "Allow anonymous update" ON "WorkOrder"
  FOR UPDATE USING (true);

-- Policy: Allow anonymous delete
CREATE POLICY "Allow anonymous delete" ON "WorkOrder"
  FOR DELETE USING (true);
