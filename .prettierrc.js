module.exports = {
    printWidth: 150,
    tabWidth: 4,
    useTabs: false,
    semi: true,
    singleQuote: true,
    endOfLine: 'lf',
    overrides: [
        {
            files: '*.json',
            options: {
                singleQuote: false
            }
        }
    ]
};
