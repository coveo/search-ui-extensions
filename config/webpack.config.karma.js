const path = require('path');
const WebpackKarmaDieHardPlugin = require('webpack-karma-die-hard');

const webpackConfig = require('./webpack.config.js');
// These modifications are required to have proper coverage with karma-coverage-istanbul-reporter.
webpackConfig.devtool = 'inline-source-map';
webpackConfig.module.rules = [
    {
        test: /\.ts$/,
        use: [
            {
                loader: 'ts-es5-istanbul-coverage'
            },
            {
                loader: 'ts-loader',
                options: {
                    configFile: path.resolve('./config/tsconfig.json'),
                    compilerOptions: {
                        module: 'commonjs',
                        inlineSourceMap: true,
                        sourceMap: undefined,
                        outDir: undefined
                    }
                }
            }
        ]
    },
    {
        test: /\.svg$/,
        loader: 'raw-loader',
        options: {}
    },
    {
        enforce: 'post',
        test: /\.ts$/,
        loader: 'istanbul-instrumenter-loader',
        exclude: path.resolve('tests/'),
        query: {
            esModules: true
        }
    }
];

webpackConfig.externals.push({
    'coveo-search-ui-tests': 'CoveoJsSearchTests'
});

/**
 * Plugin for Webpack to ensure errors cause it to quit with a non-zero exit code
 * when used as a Karma preprocessor with the karma-webpack plugin.
 * This works around known issues in karma-webpack: https://github.com/webpack-contrib/karma-webpack/issues/66
 */
webpackConfig.plugins.push(new WebpackKarmaDieHardPlugin());

module.exports = webpackConfig;
