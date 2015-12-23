import path from 'path'
import autoprefixer from 'autoprefixer'
import precss from 'precss'
import {Minimatch} from 'minimatch'
import JadePlugin from './plugins/jade_plugin'

// nearly all of this will be configurable eventually, it's rigid now just
// because we're still in early development

let jadeMatcher = '**/*.jade'
let cssMatcher = '**/*.css'
let jsMatcher = '**/*.js'

module.exports = {
  entry: { main: ['./app.js'] },
  output: {
    path: path.join(__dirname, 'public'),
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      { test: mmToRe(cssMatcher), exclude: /node_modules/, loader: 'style!css!postcss' },
      { test: mmToRe(jsMatcher), exclude: /node_modules/, loader: 'babel' },
      { test: mmToRe(jadeMatcher), exclude: /node_modules/, loader: 'jade?pretty=true' }
    ]
  },
  postcss: function () {
    return [autoprefixer, precss]
  },
  babel: {
    presets: ['es2015-node5', 'stage-0']
  },
  plugins: [
    new JadePlugin({ matcher: jadeMatcher,locals: { foo: 'bar' }, ignore: [/layout\.jade/] })
  ]
}

// utils

function mmToRe (mm) {
  return new Minimatch(mm).makeRe()
}
