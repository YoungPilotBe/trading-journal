#!/bin/bash

# Trading Journal Auto-Update Script for Raspberry Pi
# This script fetches the latest release from GitHub and updates the installation

set -e  # Exit on error

# Configuration
GITHUB_REPO="YoungPilotBe/trading-journal"
INSTALL_DIR="/opt/trading-journal"
BACKUP_DIR="/opt/trading-journal.backup"
TEMP_DIR="/tmp/trading-journal-update"
SERVICE_NAME="trading-journal-kiosk.service"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Trading Journal Auto-Update Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: This script must be run as root or with sudo${NC}"
    echo "Usage: sudo $0"
    exit 1
fi

# Check if installation directory exists
if [ ! -d "$INSTALL_DIR" ]; then
    echo -e "${RED}Error: Installation directory $INSTALL_DIR does not exist${NC}"
    exit 1
fi

echo -e "${YELLOW}→${NC} Fetching latest release information from GitHub..."

# Get the latest release information
LATEST_RELEASE=$(curl -s "https://api.github.com/repos/$GITHUB_REPO/releases/latest")

# Extract version and download URL
VERSION=$(echo "$LATEST_RELEASE" | grep -Po '"tag_name": "\K.*?(?=")')
DOWNLOAD_URL=$(echo "$LATEST_RELEASE" | grep -Po '"browser_download_url": "\K.*?linux-arm64.*?\.zip(?=")')

if [ -z "$VERSION" ] || [ -z "$DOWNLOAD_URL" ]; then
    echo -e "${RED}Error: Could not fetch latest release information${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Latest version: $VERSION"
echo -e "${GREEN}✓${NC} Download URL: $DOWNLOAD_URL"
echo ""

# Check current version if possible
if [ -f "$INSTALL_DIR/VERSION" ]; then
    CURRENT_VERSION=$(cat "$INSTALL_DIR/VERSION")
    echo -e "${YELLOW}→${NC} Current version: $CURRENT_VERSION"
    echo ""
fi

# Confirmation prompt
echo -e "${YELLOW}Installing version $VERSION${NC}"
read -p "Do you want to proceed? (y/n): " -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Update cancelled by user${NC}"
    exit 0
fi
echo ""

echo -e "${YELLOW}→${NC} Stopping service (if running)..."
if systemctl is-active --quiet "$SERVICE_NAME"; then
    systemctl stop "$SERVICE_NAME"
    echo -e "${GREEN}✓${NC} Service stopped"
else
    echo -e "${YELLOW}!${NC} Service not running"
fi

echo -e "${YELLOW}→${NC} Creating temporary directory..."
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR"

echo -e "${YELLOW}→${NC} Downloading latest release..."
if ! curl -L -o "trading-journal.zip" "$DOWNLOAD_URL"; then
    echo -e "${RED}Error: Failed to download release${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Downloaded successfully"

echo -e "${YELLOW}→${NC} Extracting archive..."
if ! unzip -q "trading-journal.zip"; then
    echo -e "${RED}Error: Failed to extract archive${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Extracted successfully"

echo -e "${YELLOW}→${NC} Creating backup of current installation..."
if [ -d "$BACKUP_DIR" ]; then
    rm -rf "$BACKUP_DIR"
fi
cp -r "$INSTALL_DIR" "$BACKUP_DIR"
echo -e "${GREEN}✓${NC} Backup created at $BACKUP_DIR"

echo -e "${YELLOW}→${NC} Removing old installation..."
rm -rf "$INSTALL_DIR"/*

echo -e "${YELLOW}→${NC} Installing new version..."
# Find the extracted directory and move its contents
EXTRACTED_DIR=$(find . -mindepth 1 -maxdepth 1 -type d | head -n 1)
if [ -z "$EXTRACTED_DIR" ]; then
    echo -e "${RED}Error: Could not find extracted directory${NC}"
    echo -e "${YELLOW}→${NC} Restoring from backup..."
    cp -r "$BACKUP_DIR"/* "$INSTALL_DIR"/
    exit 1
fi

cp -r "$EXTRACTED_DIR"/* "$INSTALL_DIR"/
echo -e "${GREEN}✓${NC} New version installed"

echo -e "${YELLOW}→${NC} Setting permissions..."
# Find the Trading Journal executable and make it executable
find "$INSTALL_DIR" -name "Trading Journal" -type f -exec chmod +x {} \;
chown -R kiosk:kiosk "$INSTALL_DIR"
echo -e "${GREEN}✓${NC} Permissions set"

echo -e "${YELLOW}→${NC} Saving version information..."
echo "$VERSION" > "$INSTALL_DIR/VERSION"

echo -e "${YELLOW}→${NC} Cleaning up..."
rm -rf "$TEMP_DIR"
echo -e "${GREEN}✓${NC} Cleanup complete"

echo -e "${YELLOW}→${NC} Starting service..."
if systemctl start "$SERVICE_NAME"; then
    echo -e "${GREEN}✓${NC} Service started successfully"
else
    echo -e "${RED}Error: Failed to start service${NC}"
    echo -e "${YELLOW}→${NC} Restoring from backup..."
    rm -rf "$INSTALL_DIR"/*
    cp -r "$BACKUP_DIR"/* "$INSTALL_DIR"/
    systemctl start "$SERVICE_NAME"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Update completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}New version: $VERSION${NC}"
echo ""
echo "You can safely delete the backup at: $BACKUP_DIR"
echo "Or restore it if needed with: sudo cp -r $BACKUP_DIR/* $INSTALL_DIR/"

