const webpackConfig = require('./webpack.config.js');
const path = require('path');

// These modifications are required to have proper coverage with karma-coverage-istanbul-reporter.
webpackConfig.devtool = 'inline-source-map';
webpackConfig.module.rules.find(rule => rule.loader === 'ts-loader').options.compilerOptions = {
    module: 'commonjs',
    inlineSourceMap: true,
    sourceMap: undefined,
    outDir: undefined
};
webpackConfig.module.rules.push({
    enforce: 'post',
    test: /\.ts$/,
    loader: 'istanbul-instrumenter-loader',
    exclude: path.resolve('tests/'),
    query: {
        esModules: true
    }
});

webpackConfig.externals.push({
    'coveo-search-ui-tests': 'CoveoJsSearchTests'
});

module.exports = webpackConfig;
