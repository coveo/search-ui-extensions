'use strict';
const ncp = require('ncp').ncp;

const folderToCopy = [
    {
        src: './pages',
        dest: './bin'
    },
    {
        src: './src/img',
        dest: './bin/img'
    }
];

folderToCopy.forEach(folder => ncp(folder.src, folder.dest));
