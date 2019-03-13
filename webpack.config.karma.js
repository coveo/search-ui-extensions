const webpackConfig = require('./webpack.config.js');
const StringReplacePlugin = require("string-replace-webpack-plugin");

// These modifications are required to have proper coverage with karma-coverage-istanbul-reporter.
webpackConfig.devtool = "inline-source-map";
webpackConfig.module.rules.find(rule => rule.loader === "ts-loader").options.compilerOptions = {
    "inlineSourceMap": true
};
webpackConfig.module.rules.push({
    enforce: "post",
    test: /\.ts$/,
    loader: 'istanbul-instrumenter-loader',
    exclude: [
        'node_modules',
        /\.spec\.ts$/
    ]
});
/*
 * Ensures that TypeScript extends is not counted twice for the "branches" coverage summary.
 * Since `super()` outputs `_super.call() || this`, it counts as two branches in the coverage.
 * This gives a cleaner coverage output.
 * See issue here for more details: https://github.com/Microsoft/TypeScript/issues/13029
 */
const ignoreNonRequiredBranchForIstanbulRule = {
    enforce: "pre",
    test:/\.ts/,
    loader: StringReplacePlugin.replace({
        replacements: [{
            pattern:/(super\([,\.\w\s]+\))[;]??/i,
            replacement: function(match, part1, offset, string) {
                return `${part1} /* istanbul ignore next: TypeScript extends */;`;
            }
        }]
    })
};
webpackConfig.module.rules.push(ignoreNonRequiredBranchForIstanbulRule)
webpackConfig.externals.push({
    "coveo-search-ui-tests": "CoveoJsSearchTests"
});

module.exports = webpackConfig;