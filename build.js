/**
 * Cross-Platform Build Script for Vercel Deployment
 * Prepares the Build Output API v3 structure (.vercel/output/static)
 * and public/ directory so Vercel can serve the static site seamlessly.
 */

const fs = require('fs');
const path = require('path');

const staticFiles = ['index.html', 'style.css', 'app.js', 'dsa.js'];

// 1. Prepare Vercel Build Output API v3 (.vercel/output/static)
const vercelStaticDir = path.join(__dirname, '.vercel', 'output', 'static');
fs.mkdirSync(vercelStaticDir, { recursive: true });

for (const file of staticFiles) {
  const src = path.join(__dirname, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(vercelStaticDir, file));
  }
}

const vercelConfig = path.join(__dirname, '.vercel', 'output', 'config.json');
fs.writeFileSync(vercelConfig, JSON.stringify({ version: 3 }, null, 2));

// 2. Prepare public/ directory as additional fallback
const publicDir = path.join(__dirname, 'public');
fs.mkdirSync(publicDir, { recursive: true });

for (const file of staticFiles) {
  const src = path.join(__dirname, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(publicDir, file));
  }
}

console.log('✅ Vercel static build output generated successfully in .vercel/output/static and public/');
