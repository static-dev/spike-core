import path from 'path'
import Joi from 'joi'
import {Minimatch} from 'minimatch'
import JadePlugin from './plugins/jade_plugin'
import CSSPlugin from './plugins/css_plugin'

// TODO remove once they come from sprout template
import autoprefixer from 'autoprefixer'
import precss from 'precss'
import postcssImport from 'postcss-import'

export default class Config {
  constructor (opts) {
    opts = this.validateOpts(opts)
    this.transformRootsOptionsToWebpack(opts)
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
      bundleName: Joi.string().default('bundle.js')
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
        { test: mmToRe(opts.matchers.css), exclude: /node_modules/, loader: 'style!css!postcss' },
        { test: mmToRe(opts.matchers.js), exclude: /node_modules/, loader: 'babel' },
        { test: mmToRe(opts.matchers.jade), exclude: /node_modules/, loader: 'jade?pretty=true' }
      ]
    }

    this.postcss = function (wp) {
      return [postcssImport({ addDependencyTo: wp })].push(...opts.postCssPlugins)
    }

    this.babel = opts.babelConfig

    this.plugins = [
      new JadePlugin({ matcher: opts.matchers.jade, locals: { foo: 'bar' }, ignore: [/layout\.jade/] }),
      new CSSPlugin({ matcher: opts.matchers.css })
    ]

    return this
  }
}

// utils

function mmToRe (mm) {
  return new Minimatch(mm).makeRe()
}
