import path from 'path'
import autoprefixer from 'autoprefixer'
import precss from 'precss'
import JadePlugin from './plugins/jade_plugin'

module.exports = {
  entry: { main: ['./app.js'] },
  output: {
    path: path.join(__dirname, 'public'),
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      { test: /\.css$/, exclude: /node_modules/, loader: 'style!css!postcss' },
      { text: /\.js$/, exclude: /node_modules, plugins/, loader: 'babel' },
      { test: /\.jade$/, exclude: /node_modules/, loader: 'jade' }
    ]
  },
  postcss: function () {
    return [autoprefixer, precss]
  },
  babel: {
    presets: ['es2015-node5']
  },
  plugins: [
    new JadePlugin({ locals: { foo: 'bar' } })
  ]
}
