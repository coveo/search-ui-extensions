'use strict';
let sass = require('node-sass');
let fs = require('fs');

let result = sass.renderSync({
  file: './src/sass/Index.scss',
  outFile: './bin/css/CoveoJsSearchExtensions.css'
})

fs.writeFileSync('./bin/css/CoveoJsSearchExtensions.css', result.css);
