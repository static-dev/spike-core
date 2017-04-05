module.exports = {
  ignore: ['app.js', 'fooLoader.js'],
  resolveLoader: {
    alias: { fooLoader: './fooLoader.js' }
  },
  module: {
    rules: [{
      test: /\.foo$/,
      use: [{
        loader: 'fooLoader',
        options: { _skipSpikeProcessing: true }
      }]
    }]
  }
}
