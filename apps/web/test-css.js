const postcss = require('postcss');
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync('app/globals.css', 'utf8');
const config = require('./postcss.config.ts');
console.log('Postcss config:', config);
