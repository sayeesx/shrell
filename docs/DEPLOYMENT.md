# VAHN AUTOMOTIVE — DEPLOYMENT & PRODUCTION GUIDE (DEPLOYMENT.md)

## 1. Zero Fixed Expense Architecture
- **Frontend Hosting**: Cloudflare Pages (Free tier: unlimited bandwidth, free custom domain, automated global CDN, HTTP/3, and free SSL certificate).
- **Backend**: Appwrite Cloud Free Tier (Free project, 75,000 monthly active users, 2GB database, 2GB storage, 750k function executions).
- **Analytics**: Cloudflare Web Analytics (Privacy-focused, cookie-free, 100% free).

---

## 2. Step-by-Step Production Deployment

### Step A: Appwrite Cloud Setup
1. Create a free account at [https://cloud.appwrite.io](https://cloud.appwrite.io).
2. Create a new project: `vahn-automotive-india`.
3. Note your **Project ID** and **API Endpoint** (`https://cloud.appwrite.io/v1`).
4. In Appwrite Console > Databases: Create a database named `vahn_ecommerce` (`DATABASE_ID`).
5. Run the automated database setup and seeding script provided in this repository:
   ```bash
   node scripts/setup-appwrite.js
   ```
   This will automatically provision all collections, attributes, indexes, and initial product catalogue.

### Step B: Cloudflare Pages Deployment
1. Push this repository to GitHub or GitLab.
2. In Cloudflare Dashboard > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your repository.
4. Set Build Settings:
   - **Framework Preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Configure Environment Variables in Cloudflare Pages dashboard:
   - `VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1`
   - `VITE_APPWRITE_PROJECT_ID=your_project_id`
   - `VITE_APPWRITE_DATABASE_ID=vahn_ecommerce`
   - `VITE_WHATSAPP_SUPPORT_NUMBER=919876543210`
   - `VITE_STORE_UPI_ID=vahnautomotive@okhdfcbank`
   - `VITE_STORE_UPI_NAME=VAHN Automotive Private Limited`
6. Click **Save and Deploy**.
