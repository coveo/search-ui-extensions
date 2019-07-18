const path = require('path')

module.exports = {
    mode: 'development',
    entry: {
        CoveoJsSearchExtensions: './src/Index'
    },
    output: {
        path: path.resolve('./bin/js/commonjs'),
        filename:  `[name].js`,
        libraryTarget: 'umd',
        library: 'CoveoExtension',
        publicPath: '/js/commonjs'
    },
    externals: [
        {
            // Defines the module "coveo-search-ui" as external, "Coveo" is defined in the global scope.
            // This requires you to load the original CoveoJsSearch.js file in your page.
            'coveo-search-ui': 'Coveo'
        }
    ],
    resolve: {
        extensions: ['.js', '.ts']
    },
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                options: {
                    configFile : path.resolve('./config/tsconfig.json')
                }
            },
            {
                test: /\.svg$/,
                loader: 'raw-loader',
                options: {}
            }
        ]
    },
    plugins: [],
    bail: true
};
