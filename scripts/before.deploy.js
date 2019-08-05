const { readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');

const TAG = process.env.TRAVIS_TAG;
if (!TAG) {
    throw new Error('TRAVIS_TAG is not defined in the current environment');
}

const VERSION = TAG.slice(TAG.indexOf('v') + 1, TAG.length);
const PACKAGE_JSON_LOCATION = resolve('package.json');

const PACKAGE = JSON.parse(readFileSync(PACKAGE_JSON_LOCATION, { encoding: 'utf8' }));
PACKAGE['version'] = VERSION;

writeFileSync(PACKAGE_JSON_LOCATION, JSON.stringify(PACKAGE, null, 4), { encoding: 'utf8' });
