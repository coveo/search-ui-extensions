const path = require('path');

const webpackConfig = require('./webpack.config.js');
// These modifications are required to have proper coverage with karma-coverage-istanbul-reporter.
webpackConfig.devtool = 'inline-source-map';
webpackConfig.module.rules = [
    {
        test: /\.ts$/,
        use: [
            {
                loader: 'ts-es5-istanbul-coverage',
            },
            {
                loader: 'ts-loader',
                options: {
                    configFile: path.resolve('./config/tsconfig.json'),
                    compilerOptions: {
                        module: 'commonjs',
                        inlineSourceMap: true,
                        sourceMap: undefined,
                        outDir: undefined,
                    },
                },
            },
        ],
    },
    {
        test: /\.svg$/,
        loader: 'raw-loader',
        options: {},
    },
    {
        enforce: 'post',
        test: /\.ts$/,
        loader: 'istanbul-instrumenter-loader',
        exclude: path.resolve('tests/'),
        query: {
            esModules: true,
        },
    },
];

webpackConfig.externals.push({
    'coveo-search-ui-tests': 'CoveoJsSearchTests',
});

module.exports = webpackConfig;
