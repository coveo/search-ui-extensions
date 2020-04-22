'use strict';
const fs = require('fs');
const path = require('path');
const xml = require('xml2js');
const builder = new xml.Builder({
    renderOpts: {
        pretty: false
    },
    headless: true
});

const svgImport = /import \* as *(?<variable>.*) from '(?<path>.*\.svg)';/i;

const svgfolder = path.resolve('./svg/');

const filenames = fs.readdirSync(svgfolder);

let svgStrings = {};
filenames.forEach(filename => {
    const buffer = fs.readFileSync(path.join(svgfolder, filename));
    xml.parseString(buffer.toString('utf8'), (err, result) => {
        svgStrings[filename] = builder.buildObject(result);
    });
});

const iconFile = path.resolve('./bin/es6/utils/icons.js');
const iconFileContent = fs.readFileSync(iconFile, { encoding: 'utf8' });

let newIconFileContent = [];
const oldIconFileContent = iconFileContent.split('\n');
oldIconFileContent.forEach(content => {
    if (svgImport.test(content)) {
        const matched = content.match(svgImport).groups;
        const filename = path.basename(matched.path);
        const changed = content.replace(svgImport, `const ${matched.variable} = \'${svgStrings[filename]}\';`);
        newIconFileContent.push(changed);
    } else {
        newIconFileContent.push(content);
    }
});

fs.writeFileSync(path.resolve('./bin/es6/utils/icons.js'), newIconFileContent.join('\n'), { encoding: 'utf8' });
