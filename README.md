# D&D Shop Generator

A web-based tool for Dungeon Masters to generate and manage shop inventories for their D&D campaigns. Designed and built for Override. To jump straight in visit https://dndshop.sveken.com/

## Features

- **Item Management**
  - Add, edit, and delete items
  - Set local and national currency prices
  - Categorize items by size (Small, Medium, Large)
  - Mark items as Day Market or Black Market
  - Track item cooldowns for availability

- **Shop Generation**
  - Generate random shops with available items
  - Filter by Day Market or Black Market
  - Enable/disable specific item categories
  - Auto-applies cooldowns when items are purchased

- **Settings & Configuration**
  - Customize currency names
  - Manage item categories
  - Set cooldown periods and item limits per category
  - Import/Export data for backup
  - Dark/Light theme toggle

## Getting Started

1. **Adding Items**
   - Go to the "Manage Items" tab
   - Fill in the item details form
   - Click "Add Item" to save

2. **Generating a Shop**
   - Navigate to the "Generate Shop" tab
   - Select market type (Day/Black Market)
   - Choose which categories to include
   - Click "Generate Shop"
   - Click "Buy" on items to mark them as purchased (applies cooldown)

3. **Managing Categories**
   - Go to the "Settings" tab
   - Add/Edit/Delete categories
   - Set cooldown days and item limits per category

4. **Customizing Currency**
   - In Settings, set your local and national currency names
   - Changes apply to all item displays

## Tips

- Use filters in the Items tab to easily find and manage specific items
- Black Market items can appear in both market types
- Export your data regularly for backup
- Reset cooldowns manually in the Items tab if needed

## Data Management

- **Export**: Click "Export Data" in Settings to save your inventory
- **Import**: Use "Import Data" to restore from a backup
- **Reset**: "Reset All Data" will clear everything (use with caution)

## Notes

- Data is stored locally in your browser
- Regular backups are recommended
- Works offline after first load

## Usage and Offline Installation 
This web app can be run locally via the Release Binarys, hosted in docker, Used online, or installed as a offline capable PWA App from the online version (Recommended)

### Install as a web app (PWA)
1. Go to https://dndshop.sveken.com/
2. On Chrome, go to the URL and click "Add to Desktop" to download an offline version. Go Phone or Tablet, find the "Add to Homescreen" to add the program as an offline app.
3. Start managing your D&D shops!

### Online only 
1. Go to https://dndshop.sveken.com/
2. Start managing your D&D shops!

### Host  your own version using the prebuilt binarys
1. Go to the [Release Page](https://github.com/sveken/OverrideDNDShop/releases) and download the version for your platform, Darwin is the mac version.
2. Simply run, and visit localhost:8080 in your web browser. 
3. Start managing your D&D shops!

### Host via docker 
Docker Compose file is below. 



```
services:
  OverrideDNDShop:
    image: ghcr.io/sveken/overridedndshop:main
    ports:
      - "8080:8080"
    restart: always
```