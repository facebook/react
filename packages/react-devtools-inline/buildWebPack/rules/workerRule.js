import babelOptions from '../options/babelOptions';


export function workerRule() {
    return {
        test: /\.worker\.js$/,
        use: [
            {
                loader: 'workerize-loader',
                options: {
                    inline: true,
                    name: '[name]',
                },
            },
            {
                loader: 'babel-loader',
                options: babelOptions,
            },
        ],
    }
}