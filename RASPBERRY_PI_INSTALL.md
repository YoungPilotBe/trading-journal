# Trading Journal - Raspberry Pi Installation

Simple installation guide for running Trading Journal on Raspberry Pi (ARM64).

## Prerequisites

- Raspberry Pi with ARM64 architecture
- Raspberry Pi OS (or compatible Linux distribution)

## Installation Steps

### 1. Download the Release

Download the latest `trading-journal-linux-arm64-*.zip` file from the [Releases page](https://github.com/YoungPilotBe/trading-journal/releases).

### 2. Transfer to Raspberry Pi

Transfer the downloaded ZIP file to your Raspberry Pi using one of these methods:

```bash
mkdir tmp
cd tmp
wget https://github.com/YoungPilotBe/trading-journal/releases/download/v0.1.2/Trading.Journal-linux-arm64-0.1.2.zip
```

### 3. Extract the Archive

```bash
unzip Trading.Journal-linux-arm64-0.1.2.zip
```

This will create a `trading-journal` directory with the application files.

### 4. Make it Executable

```bash
cd trading-journal/trading-journal
chmod +x "Trading Journal"
```

### 5. Run the Application

```bash
./"Trading Journal"
```

## Troubleshooting

### Permission Denied

If you get a permission error, make sure the file is executable:

```bash
chmod +x "Trading Journal"
```

### Missing Dependencies

If the app doesn't start, install required dependencies:

```bash
sudo apt update
sudo apt install -y libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils libatspi2.0-0 libuuid1 libsecret-1-0
```

### Display Issues

If you're running without a desktop environment, you'll need X11:

```bash
sudo apt install -y xorg xinit
```

## Running on Boot (Optional)

To run Trading Journal automatically on boot, create a systemd service:

```bash
sudo nano /etc/systemd/system/trading-journal.service
```

Add the following content:

```ini
[Unit]
Description=Trading Journal
After=graphical.target

[Service]
Type=simple
User=pi
Environment=DISPLAY=:0
ExecStart=/home/pi/trading-journal/trading-journal/Trading Journal
Restart=on-failure

[Install]
WantedBy=graphical.target
```

Enable and start the service:

```bash
sudo systemctl enable trading-journal.service
sudo systemctl start trading-journal.service
```

## Uninstall

To remove Trading Journal:

```bash
rm -rf ~/trading-journal
sudo systemctl stop trading-journal.service  # if you set it up
sudo systemctl disable trading-journal.service  # if you set it up
sudo rm /etc/systemd/system/trading-journal.service  # if you set it up
```

## Support

For issues or questions, visit: https://github.com/YoungPilotBe/trading-journal/issues
