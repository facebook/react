import { babelOptions } from "../options/babelOptions"


export function JSrule() {
    return {
        test: /\.js$/,
        loader: 'babel-loader',
        options: babelOptions,
    }
}