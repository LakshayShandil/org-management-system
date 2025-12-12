# Frontend Deployment Guide

## Production Build

### 1. Build for Production

```bash
npm run build
```

This creates an optimized `dist/` folder ready for deployment.

### 2. Test Production Build Locally

```bash
npm run preview
```

Visit `http://localhost:4173` to test the production build.

---

## Deployment Options

### Option A: Vercel (Recommended for React/Vite)

**Advantages**: Free tier, automatic deployments, serverless, fast CDN

#### Steps:

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login & Deploy**
   ```bash
   vercel
   ```

3. **Set Environment Variables**
   In Vercel dashboard, go to **Settings → Environment Variables**:
   ```
   VITE_API_BASE=https://your-backend-url.onrender.com
   ```

4. **Deploy**
   - Vercel auto-deploys on git push to `main`
   - URL: `https://your-project.vercel.app`

---

### Option B: Netlify

**Advantages**: Similar to Vercel, great for static sites, drag-and-drop deploy

#### Steps:

1. **Build locally**
   ```bash
   npm run build
   ```

2. **Drag `dist/` folder to netlify.com**
   - Or connect GitHub for auto-deploy

3. **Set Environment Variables**
   In Netlify dashboard:
   ```
   VITE_API_BASE=https://your-backend-url.onrender.com
   ```

4. **Configure Build**
   - Build command: `npm run build`
   - Publish directory: `dist`

---

### Option C: Self-hosted (Your Server)

1. **Build**
   ```bash
   npm run build
   ```

2. **Upload `dist/` folder to your server**

3. **Serve with Nginx**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       root /var/www/org-management/dist;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

4. **Set API URL** in `.env.production`:
   ```
   VITE_API_BASE=https://your-backend-url
   ```

---

## Environment Configuration

### Development
```bash
# .env.development (optional, uses default localhost:8000)
VITE_API_BASE=http://localhost:8000
```

### Production
```bash
# .env.production
VITE_API_BASE=https://your-backend-url.onrender.com
```

### Access in Code
```javascript
const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
```

---

## Performance Optimization

The build includes:
- ✅ Code splitting (Vite)
- ✅ CSS minification
- ✅ JavaScript compression
- ✅ Image optimization ready
- ✅ Tailwind CSS purging

Check build size:
```bash
npm run build
# Check dist/ folder size
```

---

## Troubleshooting

### Issue: API calls return 401 Unauthorized

**Solution**: Ensure `VITE_API_BASE` points to correct backend URL

### Issue: CORS errors

**Solution**: Verify backend has CORS enabled for your frontend domain

### Issue: Page blank or 404 errors

**Solution**: Ensure server redirects all routes to `index.html` (React Router requirement)

### Issue: Styles not loading

**Solution**: Check `dist/index.html` has correct `<link>` tags for CSS

---

## CI/CD Integration

### GitHub Actions (Auto-deploy on push)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: cd frontend && npm ci && npm run build
      
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: frontend/dist
```

---

## Monitoring

### Check Production App

```bash
curl https://your-frontend-url
# Should return HTML
```

### View Errors

- **Vercel**: Dashboard → Logs
- **Netlify**: Dashboard → Logs
- **Self-hosted**: Check server logs

---

## Rollback

### Vercel
- Dashboard → Deployments → Click previous version → Promote to Production

### Netlify
- Dashboard → Deploys → Click previous deploy

### Self-hosted
- Keep backup of previous `dist/` folder
- Restore when needed

---

## Security

- ✅ HTTPS enforced (all platforms)
- ✅ API calls over HTTPS
- ✅ No sensitive data in .env files
- ✅ JWT tokens stored in localStorage
- ✅ CORS configured properly

**Production Checklist**:
- [ ] VITE_API_BASE uses HTTPS
- [ ] Backend CORS allows your domain
- [ ] No hardcoded secrets in code
- [ ] Rate limiting enabled on backend
- [ ] Error messages don't expose internals

---

## Package.json Scripts

```json
{
  "dev": "vite",                    // Dev server
  "build": "vite build",            // Production build
  "preview": "vite preview",        // Preview production build
  "lint": "eslint ."                // Lint code
}
```

---

## Next Steps

1. Deploy backend to Render
2. Get backend URL (e.g., `https://org-management-backend.onrender.com`)
3. Set `VITE_API_BASE` in frontend
4. Deploy frontend to Vercel/Netlify
5. Test all features end-to-end

---

## Support

For deployment issues:
- Check environment variables are set correctly
- Verify backend is running and accessible
- Check browser console for errors (F12)
- Review deployment provider logs
