import path from 'path'
import Joi from 'joi'
import JadePlugin from './plugins/jade_plugin'
import CSSPlugin from './plugins/css_plugin'
import StaticPlugin from './plugins/static_plugin'
import FsPlugin from './plugins/fs_plugin'
import micromatch from 'micromatch'
import union from 'lodash.union'
import postcssImport from 'postcss-import'
import BrowserSyncPlugin from 'browser-sync-webpack-plugin'
import glob from 'glob'
import {accessSync} from 'fs'
import hygienist from 'hygienist-middleware'
import {getOutputPath, isFileIgnored} from './plugins/plugin_utils'

export default class Config {
  constructor (opts, project) {
    // TODO: better error reporting w/ links to docs
    if (!opts.root) { throw new Error('a "root" is required') }
    // merges API options into app.js options
    let allOpts = Object.assign(this.parseAppJs(opts.root), opts)
    this.transformRootsOptionsToWebpack(this.validateOpts(allOpts))
    this.project = project
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
        css: Joi.string().default('**/*.+(css|sss)'),
        js: Joi.string().default('**/*.js'),
        // this has to not match any webpack entry file
        static: Joi.string().default('!**/*.+(js|css|sss|jade)')
      }),
      postcss: Joi.object().default().keys({
        plugins: Joi.array().single().default([]),
        parser: Joi.object(),
        stringifier: Joi.object(),
        syntax: Joi.object()
      }),
      babelConfig: Joi.object().default({}),
      cleanUrls: Joi.bool().default(true),
      jade: Joi.object().default({}),
      dumpDirs: Joi.array().default(['views', 'assets']),
      locals: Joi.object().default({}),
      ignore: Joi.array().default([]),
      entry: Joi.object().default({ 'js/main': ['./assets/js/index.js'] }),
      modulesDirectories: Joi.array().default(['node_modules', 'bower_components']),
      outputDir: Joi.string().default('public'),
      plugins: Joi.array().default([]),
      module: Joi.object().default().keys({
        loaders: Joi.array().default([])
      }),
      resolve: Joi.object().default().keys({
        alias: Joi.object().default({})
      }),
      server: Joi.object().default().keys({
        ui: [Joi.bool(), Joi.object()],
        files: [Joi.string(), Joi.array()],
        watchOptions: Joi.object().default().keys({
          ignored: Joi.array().default('node_modules')
        }),
        server: Joi.object().default({}),
        proxy: [Joi.string(), Joi.object(), Joi.bool()],
        port: Joi.number().default(1111),
        middleware: Joi.array().default([]),
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

    // add cleanUrls middleware to browserSync if cleanUrls === true
    if (res.cleanUrls) {
      res.server.middleware.unshift(hygienist(res.server.server.baseDir))
    }

    // ensure server.watchOptions.ignored is an array (browsersync accepts
    // string or array), then push ['node_modules', '.git', outputDir] to make
    // sure they're not watched
    res.server.watchOptions.ignored = Array.prototype.concat(res.server.watchOptions.ignored)
    res.server.watchOptions.ignored = union(res.server.watchOptions.ignored, ['node_modules', '.git', res.outputDir])

    // log the files within your dumpDirs for intelligent dependency rewrites
    res.dumpPaths = glob.sync(`*(${res.dumpDirs.join('|')})/**`)

    // Here we set up the matchers that will watch for newly added files to the
    // project.
    //
    // The browsersync matcher doesn't like absolute paths, so we calculate the
    // relative path from cwd to your project root. Usually this will be an
    // empty string as roots commands are typically run from the project root.
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
        const f = path.join(this.context, file.replace(p, ''))
        const files = this.roots.files.all
        if (files.indexOf(f) < 0 && !this.roots.ignored(f) && event !== 'addDir') {
          this.project.watcher.watch([], [], [f])
        }
      }
    }]

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
    this.locals = opts.locals

    // for roots-specific shared config and utilities
    this.roots = {
      outputPath: (f) => { return getOutputPath(f, opts) },
      ignored: isFileIgnored.bind(null, opts.ignore),
      files: {}
    }

    this.output = {
      path: path.join(this.context, opts.outputDir),
      filename: '[name].js'
    }

    this.resolveLoader = {
      root: [
        path.join(opts.root), // the project root
        path.join(__dirname, '../node_modules'), // roots-mini/node_modules
        path.join(__dirname, '../../../node_modules') // roots-mini's flattened deps, via npm 3+
      ]
    }

    // ignore node_modules, .git, and output directory automatically
    opts.ignore.unshift('**/node_modules/**', `${this.output.path}/**/*`, '**/.git/**', '**/package.json', `${this.context}/app.js`)

    const rootsLoaders = [
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
        loader: 'file-loader',
        query: { dumpDirs: opts.dumpDirs },
        _core: 'static'
      }
    ]

    this.module = opts.module
    this.module.loaders = opts.module.loaders.concat(rootsLoaders)

    this.postcss = function (wp) {
      opts.postcss.plugins.unshift(postcssImport({ addDependencyTo: wp }))
      return opts.postcss
    }

    this.jade = Object.assign({
      locals: this.locals,
      pretty: true
    }, opts.jade)

    this.modulesDirectories = opts.modulesDirectories

    // TODO: revisit this before a stable launch
    this.babel = opts.babelConfig
    this.plugins = [new FsPlugin(opts)]
      .concat(opts.plugins)
      .concat([
        new JadePlugin(opts),
        new CSSPlugin(opts),
        new StaticPlugin(opts),
        new BrowserSyncPlugin(opts.server, { callback: function (err, bs) {
          if (err) { console.error(err) }
          if (bs.utils.devIp.length) { console.log(bs.utils.devIp[0]) }
        } })
      ])

    this.server = opts.server
    this.resolve = opts.resolve

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
    const filename = path.resolve(root, 'app.js')
    require('babel-core/register')({ presets: ['es2015', 'stage-2'] })

    try {
      accessSync(filename)
      const mod = require(filename)
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
