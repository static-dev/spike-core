import path from 'path'
import Joi from 'joi'
import JadePlugin from './plugins/jade_plugin'
import CSSPlugin from './plugins/css_plugin'
import micromatch from 'micromatch'
import union from 'lodash.union'
import _eval from 'require-from-string'
import {transformFileSync} from 'babel-core'
import postcssImport from 'postcss-import'
import BrowserSyncPlugin from 'browser-sync-webpack-plugin'

export default class Config {
  constructor (opts) {
    // TODO: better error reporting w/ links to docs
    if (!opts.root) { throw new Error('a "root" is required') }
    // merges API options into app.js options
    let allOpts = Object.assign(this.parseAppJs(opts.root), opts)
    this.transformRootsOptionsToWebpack(this.validateOpts(allOpts))
  }

  /**
   * Validates roots options, provides defaults where necessary
   * @param  {Object} opts - roots options object
   * @return {Object} validated and fully filled out objects
   */
  validateOpts (opts) {
    const schema = Joi.object().keys({
      root: Joi.string(),
      matchers: Joi.object().default().keys({
        jade: Joi.string().default('**/*.jade'),
        css: Joi.string().default('**/*.css'),
        js: Joi.string().default('**/*.js')
      }),
      postcss: Joi.object().default().keys({
        plugins: Joi.array().default([]),
        options: Joi.object().default({})
      }),
      babelConfig: Joi.object().default({}),
      dumpDirs: Joi.array().default(['views', 'assets']),
      locals: Joi.object().default({}),
      ignore: Joi.array().default([]),
      entry: Joi.object().default({ 'js/main': ['./assets/js/index.js'] }),
      modulesDirectories: Joi.array().default(['node_modules', 'bower_components']),
      outputDir: Joi.string().default('public'),
      jadeTemplates: Joi.bool().default(false),
      cssTemplates: Joi.bool().default(false),
      server: Joi.object().default().keys({
        port: Joi.number().default(1111),
        baseDir: Joi.string(),
        ui: [Joi.bool(), Joi.object()],
        files: [Joi.string(), Joi.array()],
        watchOptions: Joi.object().default().keys({
          ignored: Joi.array().default('node_modules')
        }),
        server: Joi.object().default({}),
        proxy: [Joi.string(), Joi.object(), Joi.bool()],
        middleware: [Joi.func(), Joi.array()],
        serveStatic: Joi.array(),
        https: Joi.bool(),
        ghostMode: Joi.object(),
        logLevel: Joi.string().default('silent'),
        logPrefix: Joi.string().default('roots'),
        logConnections: Joi.bool(),
        logFileChanges: Joi.bool(),
        logSnippet: Joi.bool(),
        snippetOptions: Joi.object(),
        rewriteRules: [Joi.array(), Joi.bool()],
        tunnel: [Joi.string(), Joi.bool()],
        online: Joi.bool(),
        open: [Joi.bool(), Joi.string()],
        browser: [Joi.string(), Joi.array()],
        xip: Joi.bool(),
        reloadOnRestart: Joi.bool(),
        notify: Joi.bool().default(false),
        scrollProportionally: Joi.bool(),
        scrollThrottle: Joi.number(),
        scrollRestoreTechnique: Joi.string(),
        scrollElements: Joi.array(),
        scrollElementMapping: Joi.array(),
        reloadDelay: Joi.number(),
        reloadDebounce: Joi.number(),
        plugins: Joi.array(),
        injectChanges: Joi.bool(),
        startPath: Joi.string(),
        minify: Joi.bool(),
        host: Joi.string().default('localhost'),
        codeSync: Joi.bool(),
        timestamps: Joi.bool(),
        scriptPath: Joi.func(),
        socket: Joi.object()
      })
    })

    const validation = Joi.validate(opts, schema)
    if (validation.error) { throw new Error(validation.error) }
    let res = validation.value

    // Joi can't handle defaulting this, so we do it manually
    res.server.server.baseDir = res.outputDir.replace(res.root, '')

    // ensure server.watchOptions.ignored is an array (browsersync accepts string or array)
    // then push ['node_modules', outputDir] to make sure they're not watched
    res.server.watchOptions.ignored = Array.prototype.concat(res.server.watchOptions.ignored)
    res.server.watchOptions.ignored = union(res.server.watchOptions.ignored, ['node_modules', res.outputDir])

    return res
  }

  /**
   * Takes a valid roots options object and transforms it into valid webpack
   * configuration, applied directly as properties of the class.
   * @param  {Object} opts - validated roots options object
   * @return {Class} returns self, but with the properties of a webpack config
   */
  transformRootsOptionsToWebpack (opts) {
    this.entry = opts.entry
    this.context = opts.root

    this.output = {
      path: path.join(this.context, opts.outputDir),
      filename: '[name].js'
    }

    this.resolveLoader = { root: path.join(__dirname, '../node_modules') }

    // ignore node_modules and output directory automatically
    opts.ignore.unshift('**/node_modules/**', `${this.output.path}/**`)

    this.module = {
      loaders: [
        { test: mmToRe(opts.matchers.css), exclude: opts.ignore.map(mmToRe), loader: `css!postcss?${JSON.stringify(opts.postcss.options)}` },
        { test: mmToRe(opts.matchers.js), exclude: opts.ignore.map(mmToRe), loader: 'babel' },
        { test: mmToRe(opts.matchers.jade), exclude: opts.ignore.map(mmToRe), loader: 'jade', query: { pretty: true } }
      ]
    }

    this.postcss = function (wp) {
      let res = [postcssImport({ addDependencyTo: wp })]
      res.push(...opts.postcss.plugins)
      return opts.postcss.plugins
    }

    this.modulesDirectories = opts.modulesDirectories

    this.babel = opts.babelConfig
    this.plugins = [
      new JadePlugin({
        matcher: opts.matchers.jade,
        locals: opts.locals,
        ignore: opts.ignore,
        dumpDirs: opts.dumpDirs,
        jadeTemplates: opts.jadeTemplates
      }), new CSSPlugin({
        matcher: opts.matchers.css,
        ignore: opts.ignore,
        dumpDirs: opts.dumpDirs,
        cssTemplates: opts.cssTemplates
      }), new BrowserSyncPlugin(opts.server)
    ]

    this.server = opts.server

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
    const filename = path.join(root, 'app.js')
    try {
      const contents = transformFileSync(filename, {
        filename: filename,
        presets: [require('babel-preset-es2015'), require('babel-preset-stage-2')]
      }).code
      const mod = _eval(contents)
      res = mod.__esModule ? mod.default : mod
    } catch (err) {
      if (err.code !== 'ENOENT') { throw new Error(err) }
    }
    return res
  }
}

// utils

function mmToRe (mm) {
  return micromatch.makeRe(mm)
}
