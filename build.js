#!/usr/bin/env node
/* build.js — concatenates html/ fragments into index.html
 *
 * Usage: node build.js
 *
 * Edit files in html/ then run this script to regenerate index.html.
 * The order of fragments below matches the page structure.
 */

const fs = require('fs');
const path = require('path');

const htmlDir = path.join(__dirname, 'html');

function read(file) {
  return fs.readFileSync(path.join(htmlDir, file), 'utf-8');
}

const output = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  read('head.html'),
  '<body>',
  read('persistent.html'),
  read('hero.html'),
  read('nav.html'),
  read('statement.html'),
  read('skills.html'),
  read('experience.html'),
  read('riddles.html'),
  read('contact.html'),
  read('footer.html'),
  read('modals.html'),
  read('scripts.html'),
  '</body>',
  '</html>',
].join('\n');

fs.writeFileSync(path.join(__dirname, 'index.html'), output);
console.log('Built index.html ✓');
