const webpackConfig = require('./webpack.config.karma.js');
const path = require('path');

process.env.CHROME_BIN = require('puppeteer').executablePath();

var configuration = {
    frameworks: ['jasmine'],
    files: [
        // Both CoveoJsSearch and CoveoJsSearchTests are included as externals, so you need include them in your testing environment.
        {
            pattern: '../node_modules/coveo-search-ui/bin/js/CoveoJsSearch.js',
            watched: false
        },
        {
            pattern: '../node_modules/coveo-search-ui-tests/bin/js/CoveoJsSearchTests.js',
            watched: false
        },
        { pattern: '../src/Index.ts' },
        { pattern: '../tests/**/*.spec.ts' }
    ],
    preprocessors: {
        // Builds both the components and the tests.
        '../src/**/*.ts': ['webpack'],
        '../tests/**/*.spec.ts': ['webpack']
    },
    // Required for Chrome, if you use it.
    mime: { 'text/x-typescript': ['ts'] },
    // Creates coverage files.
    reporters: ['coverage-istanbul', 'spec'],
    coverageIstanbulReporter: {
        dir: path.resolve('./bin/coverage'),
        reports: ['html', 'cobertura', 'json', 'lcov', 'text-summary'],
        fixWebpackSourcePaths: true
    },
    webpack: webpackConfig,
    webpackMiddleware: {
        stats: 'minimal',
        logLevel: 'warn'
    },
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
        ChromeHeadlessNoSandbox: {
            base: 'ChromeHeadless',
            flags: ['--no-sandbox']
        }
    }
};

module.exports = function(config) {
    config.set(configuration);
};
