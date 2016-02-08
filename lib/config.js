import path from 'path'
import Joi from 'joi'
import JadePlugin from './plugins/jade_plugin'
import CSSPlugin from './plugins/css_plugin'
import micromatch from 'micromatch'
import {transformFileSync} from 'babel-core'

// TODO remove once they come from sprout template
import autoprefixer from 'autoprefixer'
import precss from 'precss'
import postcssImport from 'postcss-import'

export default class Config {
  constructor (opts) {
    // TODO: better error reporting w/ links to docs
    if (!opts.root) { throw new Error('a "root" is required') }
    // merges API options into app.js options
    let allOpts = Object.assign(this.parseAppJs(opts.root), this.validateOpts(opts))
    this.transformRootsOptionsToWebpack(allOpts)
  }

  /**
   * Validates roots options, provides defaults where necessary
   * @param  {Object} opts - roots options object
   * @return {Object} validated and fully filled out objects
   */
  validateOpts (opts) {
    let schema = Joi.object().keys({
      root: Joi.string().required(),
      matchers: Joi.object().default().keys({
        jade: Joi.string().default('**/*.jade'),
        css: Joi.string().default('**/*.css'),
        js: Joi.string().default('**/*.js')
      }),
      postCssPlugins: Joi.array().default([autoprefixer, precss]),
      babelConfig: Joi.object().default({ presets: ['es2015-node5', 'stage-0'] }),
      bundleName: Joi.string().default('bundle.js'),
      dumpDirs: Joi.array().default(['views', 'assets'])
    })

    let validation = Joi.validate(opts, schema)
    if (validation.error) { throw new Error(validation.error) }
    return validation.value
  }

  /**
   * Takes a valid roots options object and transforms it into valid webpack
   * configuration, applied directly as properties of the class.
   * @param  {Object} opts - validated roots options object
   * @return {Class} returns self, but with the properties of a webpack config
   */
  transformRootsOptionsToWebpack (opts) {
    this.entry = { main: ['./app.js'] }
    this.context = opts.root

    this.output = {
      path: path.join(this.context, 'public'),
      filename: opts.bundleName
    }

    this.module = {
      loaders: [
        { test: mmToRe(opts.matchers.css), exclude: /node_modules/, loader: 'css!postcss' },
        { test: mmToRe(opts.matchers.js), exclude: /node_modules/, loader: 'babel' },
        { test: mmToRe(opts.matchers.jade), exclude: /node_modules/, loader: 'jade?pretty=true' }
      ]
    }

    this.postcss = function (wp) {
      let res = [postcssImport({ addDependencyTo: wp })]
      res.push(...opts.postCssPlugins)
      return opts.postCssPlugins
    }

    this.babel = opts.babelConfig

    this.plugins = [
      new JadePlugin({ matcher: opts.matchers.jade, locals: { foo: 'bar' }, ignore: [/layout\.jade/], dumpDirs: opts.dumpDirs }),
      new CSSPlugin({ matcher: opts.matchers.css, dumpDirs: opts.dumpDirs })
    ]

    return this
  }

  /**
   * Looks for an "app.js" file at the project root, if there is one parses its
   * contents into roots options and validates them.
   * @param  {String} root - path to the root of a roots project
   * @return {Object} validated roots options object
   */
  parseAppJs (root) {
    let res = {}
    try {
      let appConfig = transformFileSync(path.join(root, 'app.js'))
      res = this.validateOpts(appConfig)
    } catch (err) {
      // it's entirely ok if there's no app.js file
    }
    return res
  }
}

// utils

function mmToRe (mm) {
  return micromatch.makeRe(mm)
}
