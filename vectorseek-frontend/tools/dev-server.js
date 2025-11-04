#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const workspaceRoot = path.resolve(__dirname, '..');
const projectRoot = path.join(workspaceRoot, 'apps', 'platform');
const srcPath = path.join(projectRoot, 'src');
const indexHtmlPath = path.join(srcPath, 'index.html');

const PORT = process.env.PORT || 4200;

// Simple development server that serves static files
function createDevServer() {
  const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? indexHtmlPath : path.join(srcPath, req.url);

    // Remove query strings
    filePath = filePath.split('?')[0];

    // Security: ensure we're not serving files outside src
    if (!filePath.startsWith(srcPath)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    // Default to index.html for directory requests
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    // Add .html extension if file doesn't exist
    if (!fs.existsSync(filePath) && !path.extname(filePath)) {
      filePath += '.html';
    }

    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          // Try to serve index.html for SPA routing
          fs.readFile(indexHtmlPath, (err2, content2) => {
            if (err2) {
              res.writeHead(404);
              res.end('File not found');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(content2, 'utf-8');
            }
          });
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
          '.ts': 'application/typescript',
          '.json': 'application/json',
          '.css': 'text/css',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.svg': 'image/svg+xml',
        };

        const contentType = contentTypeMap[ext] || 'text/plain';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });

  server.listen(PORT, () => {
    console.log(`\n🚀 Development server running at http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${srcPath}`);
    console.log(`\n⚠️  Note: This is a basic static file server.`);
    console.log(`   For full Angular functionality, you'll need a proper bundler.`);
    console.log(`\nPress Ctrl+C to stop the server.\n`);
  });

  return server;
}

// Check if index.html exists
if (!fs.existsSync(indexHtmlPath)) {
  console.error(`❌ Error: index.html not found at ${indexHtmlPath}`);
  console.error('Please ensure index.html exists in the src directory.');
  process.exit(1);
}

// Start the server
const server = createDevServer();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down server...');
  server.close(() => {
    console.log('Server stopped.');
    process.exit(0);
  });
});

