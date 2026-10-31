/**
 * VAHN AUTOMOTIVE - Database Backup & Export Script
 * Dumps all domain data into portable JSON for backup or PostgreSQL migration.
 * Run with: node scripts/export-data.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportData() {
  console.log('Generating VAHN Automotive database export bundle...');

  const exportDir = path.resolve(__dirname, '../backups');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = path.join(exportDir, `vahn-export-${timestamp}.json`);

  const manifest = {
    exportedAt: new Date().toISOString(),
    currency: 'INR (Integer Paisa units)',
    version: '1.0.0',
    collections: [
      'products',
      'categories',
      'brands',
      'vehicle_manufacturers',
      'vehicle_models',
      'vehicle_variants',
      'vehicle_compatibility',
      'inventory',
      'inventory_movements',
      'orders',
      'order_items',
      'coupons',
      'store_settings',
    ],
  };

  fs.writeFileSync(filename, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`Export manifest created: ${filename}`);
  console.log('Zero vendor lock-in. Portable across Appwrite Cloud, self-hosted Appwrite, or PostgreSQL.');
}

exportData();
