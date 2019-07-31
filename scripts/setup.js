'use strict';
const { ncp } = require('ncp');
const { resolve } = require('path');
const { mkdirSync, existsSync } = require('fs');

const folderToCopy = [{ src: resolve('./pages'), dest: resolve('./bin/pages') }, { src: resolve('./img'), dest: resolve('./bin/img') }];

if (!existsSync(resolve('./bin'))) {
    mkdirSync(resolve('./bin'), { recursive: true });
}

folderToCopy.forEach(folder =>
    ncp(folder.src, folder.dest, err => {
        if (err) throw err;
    })
);
