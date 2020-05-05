const path = require('path');
const nodeExternals = require('webpack-node-externals');

const OUTPUT_DIR = 'build';

module.exports = {
    target: 'node',
    mode: 'development',
    entry: './src/main.ts',
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, OUTPUT_DIR),
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    externals: [
        nodeExternals({
            whitelist: ['webpack/hot/poll?100'],
        }),
    ],
};
