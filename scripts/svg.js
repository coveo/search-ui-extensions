'use strict';
const fs = require('fs');
const path = require('path');
const xml = require('xml2js');
const builder = new xml.Builder({
    renderOpts: {
        pretty: false,
    },
    headless: true,
});
const parser = new xml.Parser();

const svgImport = /import \* as *(?<svgvariable>.*) from '(?<svgpath>.*\.svg)';/i;
const svgfolder = path.resolve('./svg/');

function readSVG(filename) {
    return fs.readFileSync(path.join(svgfolder, filename));
}

async function uglifySVG(svg) {
    const result = await parser.parseStringPromise(svg.toString('utf8'));
    return builder.buildObject(result);
}

async function replaceSVGImport(line) {
    if (!svgImport.test(line)) {
        return line;
    }
    const { svgpath, svgvariable } = line.match(svgImport).groups;
    return line.replace(svgImport, `const ${svgvariable} = \'${await uglifySVG(readSVG(path.basename(svgpath)))}\';`);
}

const iconFile = path.resolve('./bin/es6/utils/icons.js');

const contents = fs.readFileSync(iconFile, { encoding: 'utf8' }).split('\n').map(replaceSVGImport);

Promise.all(contents).then((data) => {
    fs.writeFileSync(iconFile, data.join('\n'), { encoding: 'utf8' });
});
