#!/usr/bin/env bash
# ============================================================
# Supabase Setup Script for Laguna Norte Gestión Operativa
# ============================================================
# This script helps you connect your Next.js app to Supabase.
#
# Prerequisites:
#   1. A Supabase project created at https://supabase.com/dashboard
#   2. Your project's database password
#   3. Node.js and npm installed
#
# Usage:
#   chmod +x scripts/supabase-setup.sh
#   ./scripts/supabase-setup.sh
# ============================================================

set -e

echo "🚀 Laguna Norte Gestión Operativa — Supabase Setup"
echo "===================================================="
echo ""

# Step 1: Get project details
echo "📋 Step 1: Enter your Supabase project details"
echo ""
echo "You can find these in your Supabase Dashboard:"
echo "  → Go to your project → Settings → Database"
echo ""

read -p "Enter your Supabase Project Reference (e.g., abcdefghijklmnop): " PROJECT_REF
read -p "Enter your database region (e.g., us-east-1, sa-east-1): " REGION
read -sp "Enter your database password: " DB_PASSWORD
echo ""

if [ -z "$PROJECT_REF" ] || [ -z "$DB_PASSWORD" ]; then
  echo "❌ Project reference and password are required."
  exit 1
fi

# Step 2: Construct connection strings
# Transaction pooler (port 6543) — for app runtime
DATABASE_URL="postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-${REGION}.pooler.supabase.com:6543/postgres"
# Session pooler (port 5432) — for Prisma migrate/push
DIRECT_URL="postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-${REGION}.pooler.supabase.com:5432/postgres"
# Supabase project URL
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

echo ""
echo "📝 Step 2: Updating .env file..."

# Update .env file
cat > .env << EOF
# Supabase PostgreSQL connection URL (Prisma)
# Pooled connection (for Prisma Client in app runtime)
DATABASE_URL=${DATABASE_URL}

# Direct connection (for Prisma Migrate / db push)
DIRECT_URL=${DIRECT_URL}

# Supabase Client SDK
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_WLFhjA-N6KYVsWYfJ374ew_lCIoV3UF
EOF

echo "✅ .env file updated!"

# Step 3: Generate Prisma client
echo ""
echo "📦 Step 3: Generating Prisma client..."
npx prisma generate

# Step 4: Push schema to Supabase
echo ""
echo "🗄️ Step 4: Pushing database schema to Supabase..."
echo "Using direct connection for schema migration..."
DATABASE_URL="$DIRECT_URL" npx prisma db push --accept-data-loss

echo ""
echo "✅ Database schema pushed successfully!"

# Step 5: Verify connection
echo ""
echo "🔍 Step 5: Verifying database connection..."
npx prisma db execute --stdin <<'SQL'
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';
SQL

echo ""
echo "===================================================="
echo "🎉 Supabase setup complete!"
echo ""
echo "Your app is now connected to Supabase PostgreSQL."
echo "Next steps:"
echo ""
echo "  1. Start the development server:"
echo "     npm run dev"
echo ""
echo "  2. For Vercel deployment, add these environment variables:"
echo "     DATABASE_URL=${DATABASE_URL}"
echo "     DIRECT_URL=${DIRECT_URL}"
echo "     NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}"
echo "     NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_WLFhjA-N6KYVsWYfJ374ew_lCIoV3UF"
echo ""
echo "  3. Visit your Supabase dashboard to verify the tables:"
echo "     ${SUPABASE_URL}/editor"
echo ""
echo "===================================================="
