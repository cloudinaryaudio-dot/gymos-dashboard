#!/usr/bin/env bash
# ============================================================
# GymOS — One-Command Setup Script
# 
# Usage:
#   ./scripts/setup.sh
#
# Prerequisites:
#   - PostgreSQL connection env vars set (PGHOST, PGUSER, etc.)
#     OR pass DATABASE_URL
#   - Supabase project with service_role key for auth config
#
# What this does:
#   1. Runs all database migrations (idempotent)
#   2. Disables email verification
#   3. Prints instructions for seeding demo data
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🏋️ GymOS Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 1: Run database migrations ──
echo ""
echo "📦 Step 1: Setting up database tables..."

if command -v psql &> /dev/null; then
  psql -f "$SCRIPT_DIR/setup.sql" 2>&1
  echo "✅ Database tables created successfully!"
else
  echo "❌ psql not found. Install PostgreSQL client or run setup.sql manually."
  echo "   You can run: psql -f scripts/setup.sql"
  exit 1
fi

# ── Step 2: Disable email verification ──
echo ""
echo "🔓 Step 2: Disabling email verification..."

SUPABASE_PROJECT_ID="${VITE_SUPABASE_PROJECT_ID:-${SUPABASE_PROJECT_ID:-}}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [ -n "$SUPABASE_PROJECT_ID" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  # Use Supabase Management API to disable email confirmations
  SUPABASE_URL="https://${SUPABASE_PROJECT_ID}.supabase.co"
  
  curl -s -X PATCH \
    "${SUPABASE_URL}/auth/v1/admin/config" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"mailer_autoconfirm": true}' \
    > /dev/null 2>&1 && echo "✅ Email verification disabled!" || echo "⚠️  Could not auto-disable email verification. Disable it manually in Supabase Dashboard → Auth → Settings."
else
  echo "⚠️  SUPABASE_SERVICE_ROLE_KEY not set."
  echo "   To disable email verification manually:"
  echo "   → Supabase Dashboard → Authentication → Providers → Email"
  echo "   → Turn OFF 'Confirm email'"
fi

# ── Step 3: Instructions ──
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Start the app:  npm run dev"
echo "  2. Sign up at /login"
echo "  3. Seed demo data at /seed"
echo "  4. Go to /app/dashboard"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
