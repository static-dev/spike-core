module.exports = {
  ignore: ['app.js', 'fooLoader.js'],
  resolve: {
    alias: {
      fooLoader: './fooLoader.js'
    }
  },
  module: {
    loaders: [{ test: /\.foo$/, loader: 'fooLoader', extension: 'txt' }]
  }
}
