#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const esbuild = require('esbuild');

const workspaceRoot = path.resolve(__dirname, '..');
const projectRoot = path.join(workspaceRoot, 'apps', 'platform');
const srcPath = path.join(projectRoot, 'src');
const distPath = path.join(workspaceRoot, 'dist', 'apps', 'platform', '.dev');
const indexHtmlPath = path.join(srcPath, 'index.html');

const PORT = process.env.PORT || 4200;

// Ensure dev dist directory exists
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

// Copy index.html to dist
const distIndexHtml = path.join(distPath, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  let indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
  // Update script tag to point to bundled main.js
  indexHtmlContent = indexHtmlContent.replace(
    /<\/body>/i,
    '<script type="module" src="/main.js"></script></body>'
  );
  fs.writeFileSync(distIndexHtml, indexHtmlContent);
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

// ESBuild context for watch mode
let esbuildContext = null;

async function startBuild() {
  try {
    const buildOptions = {
      entryPoints: [path.join(srcPath, 'main.ts')],
      bundle: true,
      outdir: distPath,
      format: 'esm',
      target: 'es2020',
      platform: 'browser',
      sourcemap: true,
      minify: false,
      treeShaking: true,
      splitting: true,
      chunkNames: 'chunks/[name]',
      legalComments: 'none',
      define: {
        'process.env.NODE_ENV': JSON.stringify('development'),
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
      plugins: [
        {
          name: 'angular-plugin',
          setup(build) {
            // Handle Angular template files
            build.onResolve({ filter: /\.html$/ }, (args) => {
              if (args.importer.endsWith('.ts')) {
                return { path: args.path, namespace: 'file' };
              }
            });
          },
        },
      ],
      // Note: With local dependencies in third-party/, we bundle everything
      // Uncomment the external array if you want to use external CDN
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

    esbuildContext = await esbuild.context(buildOptions);
    await esbuildContext.rebuild();
    console.log('✅ Initial build completed\n');
    
    // Start watch mode
    await esbuildContext.watch();
    console.log('👀 Watching for changes...\n');
  } catch (error) {
    console.error('❌ Build error:', error);
    process.exit(1);
  }
}

// HTTP server to serve bundled files
function createDevServer() {
  const server = http.createServer((req, res) => {
    let filePath = req.url === '/' || req.url === '/index.html' 
      ? distIndexHtml 
      : path.join(distPath, req.url);

    // Remove query strings
    filePath = filePath.split('?')[0];

    // Security: ensure we're not serving files outside dist
    if (!filePath.startsWith(distPath)) {
      // Allow serving from assets
      if (req.url.startsWith('/assets/')) {
        filePath = path.join(assetsDest, req.url.replace('/assets/', ''));
      } else {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
    }

    // Default to index.html for directory requests
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = distIndexHtml;
    }

    // Add .js extension if requesting a chunk
    if (req.url.startsWith('/chunks/') && !path.extname(filePath)) {
      filePath += '.js';
    }

    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          // For SPA routing, serve index.html
          if (!req.url.startsWith('/assets/') && !req.url.includes('.')) {
            fs.readFile(distIndexHtml, (err2, content2) => {
              if (err2) {
                res.writeHead(404);
                res.end('File not found');
              } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content2, 'utf-8');
              }
            });
          } else {
            res.writeHead(404);
            res.end('File not found');
          }
        } else {
          res.writeHead(500);
          res.end(`Server error: ${err.code}`);
        }
      } else {
        // Determine content type
        const ext = path.extname(filePath);
        const contentTypeMap = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.mjs': 'application/javascript',
          '.json': 'application/json',
          '.css': 'text/css',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.svg': 'image/svg+xml',
          '.woff': 'font/woff',
          '.woff2': 'font/woff2',
        };

        const contentType = contentTypeMap[ext] || 'text/plain';
        const headers = {
          'Content-Type': contentType,
        };

        // Enable CORS for development
        if (ext === '.js' || ext === '.mjs') {
          headers['Access-Control-Allow-Origin'] = '*';
        }

        res.writeHead(200, headers);
        res.end(content, 'utf-8');
      }
    });
  });

  server.listen(PORT, () => {
    console.log(`\n🚀 Angular Development Server running at http://localhost:${PORT}`);
    console.log(`📁 Serving from: ${distPath}`);
    console.log(`\nPress Ctrl+C to stop the server.\n`);
  });

  return server;
}

// Start build and server
async function start() {
  await startBuild();
  const server = createDevServer();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\nShutting down server...');
    if (esbuildContext) {
      await esbuildContext.dispose();
    }
    server.close(() => {
      console.log('Server stopped.');
      process.exit(0);
    });
  });
}

start().catch(console.error);

