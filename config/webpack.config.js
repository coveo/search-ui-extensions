module.exports = {
    mode: 'production',
    entry: {
        CoveoJsSearchExtensions: './src/Index'
    },
    output: {
        path: require('path').resolve('./bin/js'),
        filename:  `[name].js`,
        libraryTarget: 'umd',
        library: 'CoveoExtension',
        publicPath: '/js/'
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
                options: {}
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
