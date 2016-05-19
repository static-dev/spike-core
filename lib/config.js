const path = require('path')
const Joi = require('joi')
const JadePlugin = require('./plugins/jade_plugin')
const CSSPlugin = require('./plugins/css_plugin')
const StaticPlugin = require('./plugins/static_plugin')
const FsPlugin = require('./plugins/fs_plugin')
const PushStatePlugin = require('./plugins/pushstate_plugin')
const micromatch = require('micromatch')
const union = require('lodash.union')
const postcssImport = require('postcss-import')
const BrowserSyncPlugin = require('browser-sync-webpack-plugin')
const {accessSync} = require('fs')
const hygienist = require('hygienist-middleware')
const merge = require('lodash.merge')
const SpikeUtils = require('./plugins/plugin_utils')

/**
 * @module Config
 */

/**
 * @class Config
 * @classdesc Primary configuration for core webpack compiler
 * @param {Object} opts - options, documented in the readme
 * @param {Spike} project - the current spike instance
 */
module.exports = class Config {
  constructor (opts, project) {
    if (!opts.root) {
      throw new Error('[spike constructor] option "root" is required')
    }
    // merges API options into app.js options
    let allOpts = Object.assign(this.parseAppJs(opts), opts)
    this.transformSpikeOptionsToWebpack(this.validateOpts(allOpts))
    this.project = project
  }

  /**
   * Validates spike options, provides defaults where necessary
   * @param  {Object} opts - spike options object
   * @return {Object} validated and fully filled out objects
   */
  validateOpts (opts) {
    const schema = Joi.object().keys({
      root: Joi.string().required(),
      env: Joi.string(),
      matchers: Joi.object().default().keys({
        jade: Joi.string().default('**/*.jade'),
        css: Joi.string().default('**/*.sss'),
        js: Joi.string().default('**/*.js'),
        static: Joi.string().default('!**/*.+(js|sss|jade)')
      }),
      postcss: Joi.object().default().keys({
        plugins: Joi.array().single().default([]),
        parser: Joi.object(),
        stringifier: Joi.object(),
        syntax: Joi.object()
      }),
      babel: Joi.object().default({}),
      cleanUrls: Joi.bool().default(true),
      jade: Joi.object().default({}),
      pushState: [Joi.boolean(), Joi.string()],
      dumpDirs: Joi.array().default(['views', 'assets']),
      locals: Joi.object().default({}),
      ignore: Joi.array().default([]),
      entry: Joi.object().default({ 'js/main': ['./assets/js/index.js'] }),
      vendor: Joi.array().single(),
      modulesDirectories: Joi.array().default(['node_modules', 'bower_components']),
      outputDir: Joi.string().default('public'),
      plugins: Joi.array().default([]),
      module: Joi.object().default().keys({
        loaders: Joi.array().default([])
      }),
      server: Joi.object().default().keys({
        watchOptions: Joi.object().default().keys({
          ignored: Joi.array().default('node_modules')
        }),
        server: Joi.object().default({}),
        port: Joi.number().default(1111),
        middleware: Joi.array().default([]),
        logLevel: Joi.string().default('silent'),
        logPrefix: Joi.string().default('spike'),
        notify: Joi.bool().default(false),
        host: Joi.string().default('localhost')
      })
    })

    const validation = Joi.validate(opts, schema, { allowUnknown: true })
    if (validation.error) { throw new Error(validation.error) }
    let res = validation.value

    // Joi can't handle defaulting this, so we do it manually
    res.server.server.baseDir = res.outputDir.replace(res.root, '')

    // add cleanUrls middleware to browserSync if cleanUrls === true
    if (res.cleanUrls) {
      res.server.middleware.unshift(hygienist(res.server.server.baseDir))
    }

    // ensure server.watchOptions.ignored is an array (browsersync accepts
    // string or array), then push ['node_modules', '.git', outputDir] to make
    // sure they're not watched
    res.server.watchOptions.ignored = Array.prototype.concat(res.server.watchOptions.ignored)
    res.server.watchOptions.ignored = union(res.server.watchOptions.ignored, ['node_modules', '.git', res.outputDir])

    // Here we set up the matchers that will watch for newly added files to the
    // project.
    //
    // The browsersync matcher doesn't like absolute paths, so we calculate the
    // relative path from cwd to your project root. Usually this will be an
    // empty string as spike commands are typically run from the project root.
    //
    // We then add all the watcher ignores so that they do not trigger the "new
    // file added to the project" code path. They are added twice, the first
    // time for the directory contents, and the second for the directory itself.
    const p = path.relative(process.cwd(), res.root)
    let allWatchedFiles = [path.join(p, '**/*')]
      .concat(res.server.watchOptions.ignored.map((i) => {
        return `!${path.join(p, i, '**/*')}`
      }))
      .concat(res.server.watchOptions.ignored.map((i) => {
        return `!${path.join(p, i)}`
      }))

    // catch newly added files, put through the pipeline
    res.server.files = [{
      match: allWatchedFiles,
      fn: (event, file) => {
        const util = new SpikeUtils(this)
        const f = path.join(this.context, file.replace(p, ''))
        const files = this.spike.files.all
        if (files.indexOf(f) < 0 && !util.isFileIgnored(f) && event !== 'addDir') {
          this.project.watcher.watch([], [], [f])
        }
      }
    }]

    return res
  }

  /**
   * Takes a valid spike options object and transforms it into valid webpack
   * configuration, applied directly as properties of the class.
   * @param  {Object} opts - validated spike options object
   * @return {Class} returns self, but with the properties of a webpack config
   */
  transformSpikeOptionsToWebpack (opts) {
    this.entry = opts.entry
    this.context = opts.root

    this.output = {
      path: path.join(this.context, opts.outputDir),
      filename: '[name].js'
    }

    this.resolveLoader = {
      root: [
        path.join(opts.root), // the project root
        path.join(__dirname, '../node_modules'), // spike/node_modules
        path.join(__dirname, '../../../node_modules') // spike's flattened deps, via npm 3+
      ]
    }

    // core ignores
    opts.ignore.unshift(
      '**/node_modules/**', // node_modules folder
      `${this.output.path}/**/*`, // anything in the public folder
      '**/.git/**', // any git content
      '**/package.json', // the primary package.json file
      '**/.DS_Store', // any dumb DS Store file
      `${this.context}/app.js`, // primary config
      `${this.context}/app.*.js` // any environment config
    )

    const spikeLoaders = [
      {
        exclude: opts.ignore.map(mmToRe),
        loader: 'css-loader!postcss-loader',
        _core: 'css'
      }, {
        exclude: opts.ignore.map(mmToRe),
        loader: 'babel-loader',
        _core: 'js'
      }, {
        exclude: opts.ignore.map(mmToRe),
        loader: 'jade-static-loader',
        _core: 'jade'
      }, {
        exclude: opts.ignore.map(mmToRe),
        loader: 'source-loader',
        _core: 'static'
      }
    ]

    this.module = opts.module
    this.module.loaders = opts.module.loaders.concat(spikeLoaders)

    this.postcss = function (wp) {
      opts.postcss.plugins.unshift(postcssImport({ addDependencyTo: wp }))
      return opts.postcss
    }

    this.jade = Object.assign({
      locals: opts.locals,
      pretty: true
    }, opts.jade)

    this.modulesDirectories = opts.modulesDirectories

    // for spike-specific shared config and utilities
    this.spike = {
      files: {},
      env: opts.env,
      locals: opts.locals,
      server: opts.server,
      dumpDirs: opts.dumpDirs,
      ignore: opts.ignore,
      vendor: opts.vendor,
      matchers: opts.matchers,
      pushState: opts.pushState
    }

    this.babel = opts.babel

    const util = new SpikeUtils(this)

    // TODO: revisit this before a stable launch
    this.plugins = [new FsPlugin(util)]
      .concat(opts.plugins)
      .concat([
        new JadePlugin(util),
        new CSSPlugin(util),
        new StaticPlugin(util),
        new PushStatePlugin(util),
        new BrowserSyncPlugin(opts.server, { callback: (_, bs) => {
          if (bs.utils.devIp.length) {
            this.project.emit('info', `External IP: http://${bs.utils.devIp[0]}:${this.spike.server.port}`)
          }
        } })
      ])

    if (this.resolve) this.resolve = opts.resolve

    return this
  }

  /**
   * Looks for an "app.js" file at the project root, if there is one parses its
   * contents into spike options and validates them. If there is an environment
   * provided as an option, also pulls the environment config and merges it in.
   * @param  {String} root - path to the root of a spike project
   * @return {Object} validated spike options object
   */
  parseAppJs (opts) {
    let config = loadFile(path.resolve(opts.root, 'app.js'))

    if (opts.env) {
      const envConfig = loadFile(path.resolve(opts.root, `app.${opts.env}.js`))
      config = merge(config, envConfig)
    }

    return config
  }
}

// utils

function loadFile (f) {
  try {
    accessSync(f)
    return require(f)
  } catch (err) {
    if (err.code !== 'ENOENT') { throw new Error(err) }
    return {}
  }
}

function mmToRe (mm) {
  return micromatch.makeRe(mm)
}
