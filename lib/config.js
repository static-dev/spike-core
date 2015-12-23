import path from 'path'
import autoprefixer from 'autoprefixer'
import precss from 'precss'
import postcssImport from 'postcss-import'
import micromatch from 'micromatch'
import JadePlugin from './plugins/jade_plugin'

// nearly all of this will be configurable eventually, it's rigid now just
// because we're still in early development

let jadeMatcher = '**/*.jade'
let cssMatcher = '**/*.css'
let jsMatcher = '**/*.js'

// all this stuff should be injected by the sprout template, not a core dep

let postCssPlugins = [autoprefixer, precss]
let babelConfig = { presets: ['es2015-node5', 'stage-0'] }

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
  postcss: function (wp) {
    return [postcssImport({ addDependencyTo: wp })].push(...postCssPlugins)
  },
  babel: babelConfig,
  plugins: [
    new JadePlugin({ matcher: jadeMatcher, locals: { foo: 'bar' }, ignore: [/layout\.jade/] })
  ]
}

// utils

function mmToRe (mm) {
  return micromatch.makeRe(mm)
}
