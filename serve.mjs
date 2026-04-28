import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import { lookup } from 'mime-types';

const PORT = 3000;
const STATIC_DIR = '/home/z/my-project/.next/static';
const PUBLIC_DIR = '/home/z/my-project/public';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

// This is NOT going to work for SSR... we need next.js
// Let's try a different approach
