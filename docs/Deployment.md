# Deployment Manual: AWS EC2 & Vercel

This manual explains how to deploy the **TCRE Glucometer System** in a production cloud environment.

---

## 1. Frontend: Deploying to Vercel

The React/Next.js frontend dashboard is designed to be hosted serverless on Vercel.

### Steps
1. Push the monorepo to GitHub.
2. Log into the Vercel dashboard and select "Add New Project".
3. Import the repository.
4. Configure the Project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
5. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL`: Set to the HTTPS URL of your EC2 backend (e.g. `https://api.tcre-glucometer.com`).
6. Click **Deploy**. Vercel will build the frontend and serve it at a custom URL.

---

## 2. Backend: Deploying to AWS EC2 (Node.js & PM2)

The Express backend and PostgreSQL database run on an AWS EC2 instance.

### System Prerequisites
Ensure your EC2 instance (Ubuntu 22.04 LTS recommended) has the following installed:
- Node.js (v18.x or v20.x)
- Git
- PM2 (`npm install -g pm2`)
- Nginx (`sudo apt install nginx`)

### Deploying the backend
1. SSH into the EC2 instance.
2. Clone the repository:
   ```bash
   git clone <repo-url> /var/www/tcre-glucometer-system
   ```
3. Copy `.env.example` to `.env` in the root:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to set production secrets (database URL, CORS origins, and port `3001`).
4. Install monorepo dependencies from the root:
   ```bash
   npm install
   ```
5. Build the backend code:
   ```bash
   npm run build:backend
   ```
6. Start the server using PM2:
   ```bash
   pm2 start config/pm2/ecosystem.config.js --env production
   ```
7. Verify running status:
   ```bash
   pm2 status
   pm2 logs
   ```

---

## 3. Reverse Proxy Configuration: Nginx & SSL

Configure Nginx to proxy port `80/443` to the backend.

1. Copy our Nginx configuration file to the system config folder:
   ```bash
   sudo cp config/nginx/nginx.conf /etc/nginx/nginx.conf
   ```
2. Check the configuration for syntax correctness:
   ```bash
   sudo nginx -t
   ```
3. Restart Nginx to load changes:
   ```bash
   sudo systemctl restart nginx
   ```
4. Obtain free SSL certificates using Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.tcre-glucometer.com
   ```
   Certbot will automatically edit the SSL paths in `nginx.conf` and schedule automatic renewals.
