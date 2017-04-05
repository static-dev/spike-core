module.exports = {
  ignore: ['app.js'],
  module: {
    rules: [{
      test: /\.scss$/,
      use: [{
        loader: 'postcss',
        options: { _spikeExtension: 'css' }
      }]
    }]
  }
}
