const path = require('path')
const qs = require('querystring')
const Joi = require('joi')
const HtmlPlugin = require('./plugins/html_plugin')
const CSSPlugin = require('./plugins/css_plugin')
const StaticPlugin = require('./plugins/static_plugin')
const FsPlugin = require('./plugins/fs_plugin')
const micromatch = require('micromatch')
const union = require('lodash.union')
const merge = require('lodash.merge')
const BrowserSyncPlugin = require('browser-sync-webpack-plugin')
const {accessSync} = require('fs')
const hygienist = require('hygienist-middleware')
const SpikeUtils = require('spike-util')

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
        html: Joi.string().default('**/*.html'),
        css: Joi.string().default('**/*.css'),
        js: Joi.string().default('**/*.js')
      }),
      postcss: Joi.alternatives().try(Joi.object(), Joi.func()).default({ plugins: [] }),
      reshape: Joi.alternatives().try(Joi.object(), Joi.array(), Joi.func()).default({ locals: {} }),
      babel: Joi.object(),
      cleanUrls: Joi.bool().default(true),
      dumpDirs: Joi.array().default(['views', 'assets']),
      ignore: Joi.array().default([]),
      entry: Joi.object().keys({
        arg: Joi.string(),
        value: Joi.array().items(Joi.string()).single()
      }).default({ 'js/main': ['./assets/js/index.js'] }),
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
    res.server.watchOptions.ignored = union(res.server.watchOptions.ignored, [
      'node_modules',
      '.git',
      res.outputDir
    ])

    // core ignores
    res.ignore.unshift(
      'node_modules/**', // node_modules folder
      `${res.outputDir}/**`, // anything in the public folder
      '.git/**', // any git content
      'package.json', // the primary package.json file
      '**/.DS_Store', // any dumb DS Store file
      'app.js', // primary config
      'app.*.js' // any environment config
    )

    // Loader excludes use absolute paths for some reason, so we add the context
    // to the beginning of the path so users can input them as relative to root.
    res.ignore = res.ignore.map((i) => path.join(res.root, i))

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

    // parse any extra postcss options out to be passed as querystrings
    const postcssDirectKeys = ['plugins', 'parser', 'stringifier', 'syntax']
    res.postcssQuery = {}
    for (const k in res.postcss) {
      if (postcssDirectKeys.indexOf(k) < 0) res.postcssQuery[k] = res.postcss[k]
    }

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
    // `disallow` options would break spike if modified.
    const disallow = ['output', 'resolveLoader', 'spike', 'plugins', 'context']

    // `noCopy` options are spike-specific and shouldn't be directly added to
    // webpack's config
    const noCopy = ['root', 'matchers', 'env', 'server', 'cleanUrls', 'dumpDirs', 'ignore', 'vendor', 'outputDir', 'css', 'postcssQuery']

    // All options other than `disallow` or `noCopy` are added directly to
    // webpack's config object
    const filteredOpts = removeKeys(opts, disallow.concat(noCopy))
    Object.assign(this, filteredOpts)

    // `noCopy` options are added under the `spike` property
    this.spike = { files: {} }
    Object.assign(this.spike, filterKeys(opts, noCopy))

    // Now we run some spike-specific config transforms
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

    // If the user has passed options, accept them, but the ones set above take
    // priority if there's a conflict, as they are essential to spike.
    if (opts.resolveLoader) {
      this.resolveLoader = merge(opts.resolveLoader, this.resolveLoader)
    }

    const reIgnores = opts.ignore.map(mmToRe)
    const spikeLoaders = [
      {
        exclude: reIgnores,
        loader: `source-loader!postcss-loader?${qs.stringify(opts.postcssQuery)}`,
        _core: 'css'
      }, {
        exclude: reIgnores,
        loader: 'babel-loader',
        _core: 'js'
      }, {
        exclude: reIgnores,
        loader: 'source-loader!reshape-loader',
        _core: 'html'
      }, {
        exclude: reIgnores,
        loader: 'source-loader',
        _core: 'static'
      }
    ]

    this.module.loaders = spikeLoaders.concat(opts.module.loaders)

    const util = new SpikeUtils(this)

    this.plugins = [new FsPlugin(util)]
      .concat(opts.plugins)
      .concat([
        new HtmlPlugin(util),
        new CSSPlugin(util),
        new StaticPlugin(util),
        new BrowserSyncPlugin(opts.server, { callback: (_, bs) => {
          if (bs.utils.devIp.length) {
            this.project.emit('info', `External IP: http://${bs.utils.devIp[0]}:${this.spike.server.port}`)
          }
        } })
      ])

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

function removeKeys (obj, keys) {
  const res = {}
  for (const k in obj) { if (keys.indexOf(k) < 0) res[k] = obj[k] }
  return res
}

function filterKeys (obj, keys) {
  const res = {}
  for (const k in obj) { if (keys.indexOf(k) > 0) res[k] = obj[k] }
  return res
}
