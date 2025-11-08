#!/bin/bash

echo "========================================="
echo "Trading Journal Diagnostic Script"
echo "========================================="
echo ""

echo "1️⃣  Checking /opt/trading-journal structure..."
echo ""
ls -laR /opt/trading-journal | head -50
echo ""

echo "2️⃣  Looking for 'Trading Journal' executable..."
echo ""
find /opt/trading-journal -name "Trading Journal" -type f
echo ""

echo "3️⃣  Checking executable permissions..."
echo ""
find /opt/trading-journal -name "Trading Journal" -type f -exec ls -lah {} \;
echo ""

echo "4️⃣  Checking autostart configuration..."
echo ""
cat /home/kiosk/.config/openbox/autostart
echo ""

echo "5️⃣  Checking service status..."
echo ""
systemctl status trading-journal-kiosk.service --no-pager | tail -20
echo ""

echo "6️⃣  Checking recent logs..."
echo ""
journalctl -u trading-journal-kiosk.service -n 30 --no-pager
echo ""

echo "========================================="
echo "Diagnostic Complete!"
echo "========================================="

