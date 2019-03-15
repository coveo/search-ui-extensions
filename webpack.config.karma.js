const webpackConfig = require('./webpack.config.js');
const StringReplacePlugin = require('string-replace-webpack-plugin');

// These modifications are required to have proper coverage with karma-coverage-istanbul-reporter.
webpackConfig.devtool = 'inline-source-map';
webpackConfig.module.rules.find(
    rule => rule.loader === 'ts-loader'
).options.compilerOptions = {
    inlineSourceMap: true
};
webpackConfig.module.rules.push({
    enforce: 'post',
    test: /\.ts$/,
    loader: 'istanbul-instrumenter-loader',
    exclude: [
        /\.spec\.ts$/
    ]
});

webpackConfig.externals.push({
    'coveo-search-ui-tests': 'CoveoJsSearchTests'
});

module.exports = webpackConfig;
