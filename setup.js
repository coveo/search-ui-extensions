'use strict';
const fs = require('fs');
const ncp = require('ncp').ncp;

const folderToCopy = [{
  "src":'./pages',
  "dest":'./bin'
},{
  "src":'./img',
  "dest":'./bin/img'
}];

folderToCopy.forEach(folder => ncp(folder.src, folder.dest));