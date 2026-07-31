# VibeLink Deployment Guide

## Static Export for Netlify

This project is configured for static export and can be deployed to Netlify manually.

### Building for Production

Run the build command to generate the static files:

```bash
npm run build
```

This will create an `out` directory containing all the static files needed for deployment.

### Deploying to Netlify

#### Option 1: Manual Upload via Netlify Dashboard

1. Build the project: `npm run build`
2. Go to [Netlify](https://app.netlify.com/)
3. Click "Add new site" → "Deploy manually"
4. Drag and drop the `out` folder into the upload area
5. Netlify will deploy your site automatically

#### Option 2: Netlify CLI

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Build the project: `npm run build`
3. Deploy: `netlify deploy --prod --dir=out`

### Configuration Notes

- **Static Export**: The project uses `output: 'export'` in `next.config.ts`
- **Image Optimization**: Images are unoptimized for static export compatibility
- **Client Components**: All interactive components use `"use client"` directive
- **No Server-Side Features**: The site is fully static with no API routes or server components

### Deployed URL

After deployment, your site will be available at:
- Your custom domain (if configured)
- A random Netlify URL (e.g., `https://your-site-name.netlify.app`)

### Environment Variables

No environment variables are required for the static landing page.

### Custom Domain

To use a custom domain:
1. Go to Site settings → Domain management
2. Add your custom domain
3. Update DNS records as instructed by Netlify