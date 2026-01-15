# Deployment Guide for Base Coin Burner Mini App

This guide gives step-by-step, detailed instructions to deploy the mini app.

## Before You Deploy (Required)

1. **Install dependencies and run locally**:
   ```bash
   cd mini-app
   npm install
   npm run dev
   ```
   - Open the local URL printed in the terminal (usually `http://localhost:5173`).
   - Check browser console for errors.

2. **Optional: set OnchainKit API key** (if you have one):
   - Create a `.env` file:
     ```bash
     VITE_ONCHAINKIT_API_KEY=your_key_here
     ```

3. **Optional: set Covalent API key** (to list wallet tokens):
   - Create a `.env` file:
     ```bash
     VITE_COVALENT_API_KEY=your_key_here
     ```

4. **Verify required files are present** in `mini-app/`:
   - `index.html`
   - `vite.config.js`
   - `src/` (contains `main.jsx` and `App.jsx`)
   - `styles.css`

5. **Check relative paths**:
   - Use the Vite import system for assets when possible.
   - If you add public assets, put them in `public/` and reference as `/asset.png`.

6. **Know your final URL**:
   - You will need the deployed URL for Base app submission later.

## Option 1: Netlify (Recommended - Easiest)

### A) Netlify Web Interface (No CLI)

1. Go to [netlify.com](https://netlify.com) and sign in.
2. Click **Add new site → Deploy manually**.
3. Drag and drop the entire `mini-app` folder into the upload area.
4. Wait for the deployment to finish (Netlify shows a success message).
5. For Git‑connected sites, set:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click the generated site URL and verify it loads.
7. Optional: click **Site settings → Change site name** to set a friendly URL.

### B) Netlify CLI (Optional)

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```
2. Log in:
   ```bash
   netlify login
   ```
3. Deploy a preview:
   ```bash
   cd mini-app
   npm install
   npm run build
   netlify deploy
   ```
4. When prompted, choose **Create & configure a new site**.
5. Publish to production:
   ```bash
   netlify deploy --prod
   ```
6. Open the production URL and verify it loads.

**Netlify Configuration** (`netlify.toml` is included):
- Automatic HTTPS
- Custom domain support
- Continuous deployment from Git

## Option 2: Vercel

### A) Vercel Web Interface (No CLI)

1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click **Add New → Project**.
3. Import your Git repository (recommended) or upload the `mini-app` folder.
4. For a static site, accept defaults and click **Deploy**.
5. Open the deployment URL and verify it loads.

### B) Vercel CLI (Optional)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Deploy:
   ```bash
   cd mini-app
   vercel --prod
   ```
3. Open the URL printed in the output and verify it loads.

## Option 3: GitHub Pages

### A) Deploy from `/docs` (Simple)

1. Create a GitHub repository and push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/yourrepo.git
   git push -u origin main
   ```
2. Create a `docs` folder at repo root and copy `mini-app` into it:
   ```bash
   mkdir docs
   cp -r mini-app/* docs/
   git add docs
   git commit -m "Add docs for GitHub Pages"
   git push
   ```
3. Go to **Repository Settings → Pages**.
4. Set **Source** to `main` and **Folder** to `/docs`.
5. Save and wait for GitHub Pages to build.
6. Visit:
   `https://yourusername.github.io/yourrepo/`

### B) Deploy from Repository Root (Alternative)

1. Move/copy `mini-app` contents to the repo root (so `index.html` is at root).
2. In **Settings → Pages**, choose **Source** = `main`, **Folder** = `/root`.
3. Save and wait for GitHub Pages to build.

## Option 4: Cloudflare Pages

### A) Cloudflare Dashboard (No CLI)

1. Go to Cloudflare Dashboard → **Pages**.
2. Click **Create a project**.
3. Choose **Upload assets**.
4. Upload the `mini-app` folder.
5. Click **Deploy** and wait for the URL.
6. Open the URL and verify it loads.

### B) Wrangler CLI (Optional)

1. Install Wrangler:
   ```bash
   npm install -g wrangler
   ```
2. Deploy:
   ```bash
   cd mini-app
   wrangler pages deploy .
   ```
3. Open the URL printed in the output and verify it loads.

## Option 5: Traditional Web Hosting (FTP/SFTP)

1. Log in to your hosting provider’s FTP/SFTP.
2. Upload all files in `mini-app/` to your web root (usually `public_html/`).
3. Ensure `index.html` is directly in the web root.
4. Visit your domain and verify it loads.

## Base App Integration (After You Deploy)

1. **Copy your deployment URL** from the hosting provider.
2. **Submit to Base app**:
   - Follow Base app’s mini app submission process.
   - Provide your deployment URL.
3. **CORS Configuration** (if required):
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, POST, OPTIONS
   ```

## Production Checklist

- [ ] Test wallet connection on the deployed URL
- [ ] Verify Base smart wallet detection works
- [ ] Test burn functionality on testnet first
- [ ] Check that all assets load correctly
- [ ] Verify HTTPS is enabled (required for Web3)

## Custom Domain Setup

1. **Netlify/Vercel**: Add custom domain in dashboard settings.
2. **Update DNS**: Point your domain to the hosting provider.
3. **SSL**: Automatic SSL certificates (Let’s Encrypt).

## Testing After Deployment

1. Open your deployed URL.
2. Test wallet connection:
   - Base smart wallet (if using Base app)
   - MetaMask/Coinbase Wallet
3. Test contract loading with a test contract.
4. Test burn functionality on testnet first.

## Troubleshooting

### Assets Not Loading
- Check file paths are relative (not absolute).
- Verify all files are uploaded.
- Check browser console for 404 errors.

### CORS Errors
- Ensure hosting provider allows CORS.
- Check that API calls are to correct domains.
- Verify HTTPS is enabled.

### Wallet Connection Issues
- HTTPS is required for Web3 wallets.
- Check browser console for errors.
- Verify wallet extensions are enabled.

## Continuous Deployment

### Netlify
- Connect GitHub repository.
- Netlify auto-deploys on push to main branch.

### Vercel
- Connect Git repository.
- Auto-deploys on every push.

### GitHub Actions (Advanced)
See `.github/workflows/deploy.yml` for automated deployment.

## Security Notes

⚠️ **Important**:
- Never commit private keys or sensitive data.
- Use HTTPS (most hosts provide this automatically).
- Test thoroughly on testnet before mainnet.
- Review transaction details before confirming.

## Support

For deployment issues:
1. Check hosting provider documentation.
2. Verify all files are uploaded correctly.
3. Check browser console for errors.
4. Test locally first with `npm run dev`.
