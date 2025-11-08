# Trading Journal Auto-Update Script Setup

This guide will help you set up the auto-update script on your Raspberry Pi.

## Step 1: Copy the Script to Raspberry Pi

From your Mac, run:

```bash
scp update-trading-journal.sh thomasrobijn@dock.local:/tmp/
```

## Step 2: SSH into Raspberry Pi

```bash
ssh thomasrobijn@dock.local
```

Password: `TRgj4551`

## Step 3: Install the Script

Once connected to the Raspberry Pi:

```bash
# Move script to a system location
sudo mv /tmp/update-trading-journal.sh /usr/local/bin/update-trading-journal

# Make it executable
sudo chmod +x /usr/local/bin/update-trading-journal
```

## Step 4: Run the Update

To update Trading Journal to the latest version:

```bash
sudo update-trading-journal
```

The script will:

1. ✓ Check for the latest release on GitHub
2. ✓ Download the ARM64 Linux version
3. ✓ Stop the running service
4. ✓ Create a backup of the current installation
5. ✓ Install the new version
6. ✓ Set correct permissions
7. ✓ Restart the service

## Optional: Set Up Automatic Updates

### Option A: Manual Updates via Cron (Recommended)

Create a weekly update check that logs to file but doesn't auto-update:

```bash
sudo crontab -e
```

Add this line to check every Sunday at 3 AM:

```cron
0 3 * * 0 /usr/local/bin/update-trading-journal >> /var/log/trading-journal-update.log 2>&1
```

### Option B: Create a Manual Update Command

Add an alias to your shell for easy updates:

```bash
echo 'alias tj-update="sudo /usr/local/bin/update-trading-journal"' >> ~/.bashrc
source ~/.bashrc
```

Then you can simply run:

```bash
tj-update
```

## Troubleshooting

### Check Current Installation

```bash
ls -la /opt/trading-journal
cat /opt/trading-journal/VERSION
```

### Check Service Status

```bash
sudo systemctl status trading-journal-kiosk.service
```

### Restore from Backup

If the update fails, restore the backup:

```bash
sudo systemctl stop trading-journal-kiosk.service
sudo rm -rf /opt/trading-journal/*
sudo cp -r /opt/trading-journal.backup/* /opt/trading-journal/
sudo systemctl start trading-journal-kiosk.service
```

### View Update Logs

If you set up automatic updates:

```bash
sudo tail -f /var/log/trading-journal-update.log
```

### Manually Check for Updates

```bash
curl -s https://api.github.com/repos/YoungPilotBe/trading-journal/releases/latest | grep tag_name
```

## What the Script Does

1. **Fetches latest release** from GitHub API
2. **Downloads** the ARM64 Linux build
3. **Stops the service** to prevent file conflicts
4. **Creates a backup** at `/opt/trading-journal.backup`
5. **Extracts and installs** the new version
6. **Sets permissions** (`chmod +x` and `chown`)
7. **Saves version info** to `/opt/trading-journal/VERSION`
8. **Restarts the service** automatically
9. **Rolls back** if anything fails

## Important Notes

- The script preserves your systemd service configuration
- All existing auto-start settings remain intact
- The backup is kept at `/opt/trading-journal.backup` for safety
- The script requires sudo/root access to run
