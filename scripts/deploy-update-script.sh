#!/bin/bash

# Deploy Update Script to Raspberry Pi
# Run this from your Mac to automatically set up the update script on the Pi

set -e

PI_HOST="thomasrobijn@dock.local"
PI_PASSWORD="TRgj4551"
SCRIPT_NAME="update-trading-journal.sh"

echo "========================================="
echo "Deploying Update Script to Raspberry Pi"
echo "========================================="
echo ""

echo "📦 Copying update script to Raspberry Pi..."

# Use expect to handle password authentication
expect << EOF
set timeout 30
spawn scp "$SCRIPT_NAME" "$PI_HOST:/tmp/"
expect {
    "password:" {
        send "$PI_PASSWORD\r"
        expect eof
    }
    "Are you sure you want to continue connecting" {
        send "yes\r"
        expect "password:"
        send "$PI_PASSWORD\r"
        expect eof
    }
}
EOF

echo "🔧 Installing script on Raspberry Pi..."

# Use expect to handle password authentication for SSH
expect << EOF
set timeout 30
spawn ssh "$PI_HOST" "sudo mv /tmp/update-trading-journal.sh /usr/local/bin/update-trading-journal && sudo chmod +x /usr/local/bin/update-trading-journal && echo '✅ Update script installed successfully!' && echo '' && echo '📍 Script location: /usr/local/bin/update-trading-journal' && echo '' && echo 'To update Trading Journal, SSH into the Pi and run:' && echo '  sudo update-trading-journal'"
expect {
    "password:" {
        send "$PI_PASSWORD\r"
        expect eof
    }
}
EOF

echo ""
echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. SSH into your Raspberry Pi:"
echo "   ssh $PI_HOST"
echo ""
echo "2. Run the update script:"
echo "   sudo update-trading-journal"
echo ""

