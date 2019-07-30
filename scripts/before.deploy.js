const { readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');

const BRANCH = process.env.TRAVIS_BRANCH;
if (!BRANCH) {
    throw new Error('TRAVIS_BRANCH is not define in the current environment');
}

const VERSION = BRANCH.slice(BRANCH.indexOf('v') + 1, BRANCH.length);
const PACKAGE_JSON_LOCATION = resolve('package.json');

const PACKAGE = JSON.parse(readFileSync(PACKAGE_JSON_LOCATION, { encoding: 'utf8' }));
PACKAGE['version'] = VERSION;

writeFileSync(PACKAGE_JSON_LOCATION, JSON.stringify(PACKAGE, null, 4), { encoding: 'utf8' });
