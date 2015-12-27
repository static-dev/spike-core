import path from 'path'
import autoprefixer from 'autoprefixer'
import precss from 'precss'
import postcssImport from 'postcss-import'
import {Minimatch} from 'minimatch'
import JadePlugin from './plugins/jade_plugin'
import CSSPlugin from './plugins/css_plugin'

export default class Config {
  constructor (opts) {
    // as much of this as possible should come from sprout template, not a core dep
    let defaults = {
      matchers: {
        jade: '**/*.jade',
        css: '**/*.css',
        js: '**/*.js'
      },
      postCssPlugins: [autoprefixer, precss],
      babelConfig: { presets: ['es2015-node5', 'stage-0'] }
    }

    this.entry = { main: ['./app.js'] }
    this.context = opts.root

    this.output = {
      path: path.join(this.context, 'public'),
      filename: opts.bundleName || 'bundle.js'
    }

    this.module = {
      loaders: [
        { test: mmToRe(defaults.matchers.css), exclude: /node_modules/, loader: 'style!css!postcss' },
        { test: mmToRe(defaults.matchers.js), exclude: /node_modules/, loader: 'babel' },
        { test: mmToRe(defaults.matchers.jade), exclude: /node_modules/, loader: 'jade?pretty=true' }
      ]
    }

    this.postcss = function (wp) {
      return [postcssImport({ addDependencyTo: wp })].push(...defaults.postCssPlugins)
    }

    this.babel = defaults.babelConfig

    this.plugins = [
      new JadePlugin({ matcher: defaults.matchers.jade, locals: { foo: 'bar' }, ignore: [/layout\.jade/] }),
      new CSSPlugin({ matcher: defaults.matchers.css })
    ]
  }
}

// utils

function mmToRe (mm) {
  return new Minimatch(mm).makeRe()
}
