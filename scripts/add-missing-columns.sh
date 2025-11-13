#!/bin/bash
# Script to add missing columns to properties table in production

echo "🔧 Adding missing columns to properties table..."

docker compose -f docker-compose.production.yml exec -T db-prod psql -U rentals_user -d rentals_prod << 'EOF'
-- Add missing columns to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "publicUrl" TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "showCountdown" BOOLEAN DEFAULT TRUE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "showHighDemand" BOOLEAN DEFAULT TRUE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "showViewCount" BOOLEAN DEFAULT TRUE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "organizationId" UUID;

-- Create indexes
CREATE INDEX IF NOT EXISTS "properties_organizationId_idx" ON properties("organizationId");
CREATE INDEX IF NOT EXISTS "properties_organizationId_createdAt_idx" ON properties("organizationId", "createdAt");

-- Verify columns
\d properties
EOF

echo "✅ Columns added successfully!"
echo ""
echo "🔄 Restarting api-prod container..."
docker compose -f docker-compose.production.yml restart api-prod

echo ""
echo "⏳ Waiting for container to be ready..."
sleep 10

echo ""
echo "🧪 Testing properties endpoint..."
curl -k https://api-45-55-95-48.sslip.io/properties

echo ""
echo "✅ Done! Properties endpoint should now work."
