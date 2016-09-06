module.exports = {
  ignore: ['app.js', 'fooLoader.js'],
  resolve: {
    alias: {
      fooLoader: './fooLoader.js'
    }
  },
  module: {
    loaders: [{ test: /\.scss$/, loader: 'postcss', extension: 'css' }]
  }
}
