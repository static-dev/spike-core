import path from 'path'
import JadePlugin from './plugins/jade_plugin'

module.exports = {
  entry: { main: ['./app.js'] },
  output: {
    path: path.join(__dirname, 'public'),
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      { test: /\.jade$/, exclude: /node_modules/, loader: 'jade-loader' }
    ]
  },
  plugins: [
    new JadePlugin()
  ]
}
