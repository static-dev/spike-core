import path from 'path'
import autoprefixer from 'autoprefixer'
import precss from 'precss'
import htmlPlugin from 'html-webpack-plugin'
import jadePlugin from './plugins/jade_plugin'

module.exports = {
  entry: { main: './app.js' },
  output: {
    path: path.join(__dirname, 'public'),
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      { test: /\.css$/, exclude: /node_modules/, loader: 'style-loader!css-loader!postcss-loader' },
      // { text: /\.js$/, exclude: /node_modules, plugins/, loader: 'babel-loader?presets[]=es2015' },
      { test: /\.jade$/, exclude: /node_modules/, loader: 'jade-loader' }
    ]
  },
  postcss: function(){
    return [autoprefixer, precss];
  },
  plugins: [
    new htmlPlugin({ title: 'Roots Mini' }),
    new jadePlugin()
  ]
}
