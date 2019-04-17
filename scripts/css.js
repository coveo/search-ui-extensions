'use strict';
let sass = require('node-sass');
let fs = require('fs');

let basePath = './bin/css/';
let result = sass.renderSync({
    file: './src/sass/Index.scss',
    outFile: `${basePath}CoveoJsSearchExtensions.css`
});

if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
}
fs.writeFileSync(`${basePath}CoveoJsSearchExtensions.css`, result.css);
