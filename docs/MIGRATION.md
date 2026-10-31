# VAHN AUTOMOTIVE — MIGRATION STRATEGY (MIGRATION.md)

## 1. Migration Pathways

The core codebase is intentionally decoupled from Appwrite Cloud to support frictionless scaling when transaction volume exceeds free tier thresholds.

### Pathway A: Appwrite Cloud to Self-Hosted Appwrite
- **Trigger**: File storage exceeds 2GB or database document limits require dedicated VM.
- **Cost**: ~$5 - $10/month on Hetzner, DigitalOcean, or AWS Lightsail.
- **Process**:
  1. Deploy Appwrite via Docker Compose on your VM.
  2. Run the backup/export script `scripts/export-data.js` to dump all JSON documents.
  3. Update `VITE_APPWRITE_ENDPOINT` to your custom domain (e.g. `https://api.vahnautomotive.com/v1`).
  4. Run `node scripts/setup-appwrite.js` against the new endpoint.

### Pathway B: Appwrite to PostgreSQL / Supabase
- **Trigger**: Advanced multi-warehouse relational querying or complex SQL reporting.
- **Process**:
  1. The database entities defined in `docs/DATABASE.md` map 1:1 with PostgreSQL tables.
  2. Implement the `PostgresRepository` class satisfying the existing `IProductRepository`, `IOrderRepository`, etc. in `src/infrastructure/repositories`.
  3. Switch the injection factory in `src/infrastructure/repositories/index.ts`.
  4. Zero UI components or domain services need to be altered.

### Pathway C: Storage to Cloudflare R2 / AWS S3
- **Trigger**: High-resolution 4K product imagery or high media egress.
- **Process**:
  1. Implement `IStorageAdapter` for Cloudflare R2 (which offers 10GB free and zero egress fees).
  2. Point the storage provider factory to `R2StorageAdapter`.
