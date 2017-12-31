import path from 'path'
import webpack from 'webpack'
import MemoryFS from 'memory-fs'

export function compileWithWebpack (file, extraConfig, cb) {
  const config = Object.assign({
    entry: path.resolve(__dirname, 'fixtures', file),
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader'
        },
        {
          test: /async-.*\.js$/,
          loader: require.resolve('./async-loader')
        },
        {
          test: /\.(png|woff2|css)$/,
          loader: 'file-loader',
          options: {
            name: '[name].[ext]'
          }
        }
      ]
    }
  }, extraConfig)

  const compiler = webpack(config)
  const fs = new MemoryFS()
  compiler.outputFileSystem = fs

  compiler.run((err, stats) => {
    expect(err).toBeFalsy()
    expect(stats.errors).toBeFalsy()
    cb(fs)
  })
}
