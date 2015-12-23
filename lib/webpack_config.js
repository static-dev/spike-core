import path from 'path'
import autoprefixer from 'autoprefixer'
import precss from 'precss'
import JadePlugin from './plugins/jade_plugin'

// nearly all of this will be configurable eventually, it's rigid now just
// because we're still in early development

module.exports = {
  entry: { main: ['./app.js'] },
  output: {
    path: path.join(__dirname, 'public'),
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      { test: /\.css$/, exclude: /node_modules/, loader: 'style!css!postcss' },
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel' },
      { test: /\.jade$/, exclude: /node_modules/, loader: 'jade?pretty=true' }
    ]
  },
  postcss: function () {
    return [autoprefixer, precss]
  },
  babel: {
    presets: ['es2015-node5', 'stage-0']
  },
  plugins: [
    new JadePlugin({ locals: { foo: 'bar' }, ignore: [/layout\.jade/] })
  ]
}
