#!/bin/bash

# Script to fix PostgreSQL authentication error
# This fixes the "auth_permission_dialog.dialog_executable_path is not a file" error

PG_HBA_CONF="/Library/PostgreSQL/18/data/pg_hba.conf"
BACKUP_FILE="${PG_HBA_CONF}.backup.$(date +%Y%m%d_%H%M%S)"

echo "🔧 Fixing PostgreSQL authentication configuration..."
echo ""

# Check if file exists
if [ ! -f "$PG_HBA_CONF" ]; then
    echo "❌ Error: pg_hba.conf not found at $PG_HBA_CONF"
    exit 1
fi

# Create backup
echo "📦 Creating backup of pg_hba.conf..."
sudo cp "$PG_HBA_CONF" "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"
echo ""

# Show current configuration
echo "📋 Current authentication methods:"
sudo grep -E "^[^#].*127.0.0.1|^[^#].*localhost|^[^#].*::1" "$PG_HBA_CONF" | head -5
echo ""

# Fix the authentication methods
echo "🔨 Updating authentication methods to 'md5'..."
sudo sed -i '' 's/\(127\.0\.0\.1.*\)scram-sha-256/\1md5/g' "$PG_HBA_CONF"
sudo sed -i '' 's/\(127\.0\.0\.1.*\)password/\1md5/g' "$PG_HBA_CONF"
sudo sed -i '' 's/\(::1.*\)scram-sha-256/\1md5/g' "$PG_HBA_CONF"
sudo sed -i '' 's/\(::1.*\)password/\1md5/g' "$PG_HBA_CONF"
sudo sed -i '' 's/\(localhost.*\)scram-sha-256/\1md5/g' "$PG_HBA_CONF"
sudo sed -i '' 's/\(localhost.*\)password/\1md5/g' "$PG_HBA_CONF"

# Ensure local connections use md5
if ! sudo grep -q "^host.*127.0.0.1.*md5" "$PG_HBA_CONF"; then
    echo "➕ Adding md5 authentication for localhost..."
    echo "host    all             all             127.0.0.1/32            md5" | sudo tee -a "$PG_HBA_CONF" > /dev/null
fi

if ! sudo grep -q "^host.*::1.*md5" "$PG_HBA_CONF"; then
    echo "➕ Adding md5 authentication for IPv6 localhost..."
    echo "host    all             all             ::1/128                 md5" | sudo tee -a "$PG_HBA_CONF" > /dev/null
fi

echo ""
echo "✅ Configuration updated!"
echo ""
echo "🔄 Restarting PostgreSQL..."
sudo /Library/PostgreSQL/18/bin/pg_ctl -D /Library/PostgreSQL/18/data restart -l /Library/PostgreSQL/18/data/server.log

echo ""
echo "✅ Done! PostgreSQL should now accept md5 password authentication."
echo "📝 You can now try running your Node.js server again."

