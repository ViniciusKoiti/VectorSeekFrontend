#!/usr/bin/env node
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const workspaceRoot = path.resolve(__dirname, '..');
const projectRoot = path.join(workspaceRoot, 'apps', 'platform');
const srcPath = path.join(projectRoot, 'src');
const distPath = path.join(workspaceRoot, 'dist', 'apps', 'platform');
const isProduction = process.argv.includes('--prod') || process.argv.includes('--configuration=production');

// Ensure dist directory exists
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

// Copy index.html
const indexHtmlSrc = path.join(srcPath, 'index.html');
const indexHtmlDest = path.join(distPath, 'index.html');
if (fs.existsSync(indexHtmlSrc)) {
  fs.copyFileSync(indexHtmlSrc, indexHtmlDest);
}

// Copy assets
const assetsSrc = path.join(srcPath, 'assets');
const assetsDest = path.join(distPath, 'assets');
if (fs.existsSync(assetsSrc)) {
  if (!fs.existsSync(assetsDest)) {
    fs.mkdirSync(assetsDest, { recursive: true });
  }
  copyRecursiveSync(assetsSrc, assetsDest);
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Build configuration
const buildOptions = {
  entryPoints: [path.join(srcPath, 'main.ts')],
  bundle: true,
  outdir: distPath,
  format: 'esm',
  target: 'es2020',
  platform: 'browser',
  sourcemap: !isProduction,
  minify: isProduction,
  treeShaking: true,
  splitting: true,
  chunkNames: 'chunks/[name]-[hash]',
  legalComments: 'none',
  define: {
    'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
  },
  loader: {
    '.html': 'text',
    '.css': 'text',
  },
  resolveExtensions: ['.ts', '.js', '.json'],
  alias: {
    '@vectorseek/platform': path.join(projectRoot, 'src', 'app'),
    '@vectorseek/data-access': path.join(workspaceRoot, 'libs', 'data-access', 'src'),
    '@vectorseek/ui': path.join(workspaceRoot, 'libs', 'ui'),
  },
  // Note: With local dependencies in third-party/, we bundle everything
  // Uncomment the external array if you want to use external CDN or global scripts
  // external: [
  //   '@angular/core',
  //   '@angular/common',
  //   '@angular/platform-browser',
  //   '@angular/router',
  //   '@angular/forms',
  //   'rxjs',
  //   'rxjs/operators',
  //   'zone.js',
  // ],
};

console.log(`\n🔨 Building ${isProduction ? 'production' : 'development'} bundle...\n`);

esbuild
  .build(buildOptions)
  .then(() => {
    console.log(`\n✅ Build completed successfully!`);
    console.log(`📦 Output: ${distPath}\n`);
  })
  .catch((error) => {
    console.error('\n❌ Build failed:', error);
    process.exit(1);
  });

