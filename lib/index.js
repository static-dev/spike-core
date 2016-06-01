/**
 * @module Spike
 */

const path = require('path')
const fs = require('fs')
const os = require('os')
const mkdirp = require('mkdirp')
const W = require('when')
const node = require('when/node')
const {exec} = require('child_process')
const webpack = require('webpack')
const rimraf = require('rimraf')
const Sprout = require('sprout')
const Joi = require('joi')
const {EventEmitter} = require('events')
const Config = require('./config')
const Errors = require('./errors')

/**
 * @class Spike
 * @classdesc Creates a spike project instance and allows interaction with it
 * @param {Object} opts - documented in the readme
 */
class Spike extends EventEmitter {
  constructor (opts = {}) {
    super()
    this.config = new Config(opts, this)
  }

  /**
   * Compiles the spike project once
   * @fires Spike#error
   * @fires Spike#warning
   * @fires Spike#compile
   * @return {Array} a unique compile id, and webpack compiler instance
   */
  compile () {
    const id = this._id()
    const compiler = webpack(this.config)

    compiler.run(compileCallback.bind(this, id))

    // Returns the compilation's ID synchronously, this can be checked against
    // events emitted from the project instance.
    return [id, compiler]
  }

  /**
   * Compiles a project and watches it, when a file changes, recompiles
   * @param {Object} opts - options to be passed to webpack.watch
   * @fires Spike#error
   * @fires Spike#warning
   * @fires Spike#compile
   * @return {Watcher} webpack watcher instance
   */
  watch (opts = {}) {
    const id = this._id()
    this.compiler = webpack(this.config)
    this.watcher = this.compiler.watch(opts, compileCallback.bind(this, id))
    return this.watcher
  }

  /**
   * Removes the public directory
   * @fires Spike#remove
   */
  clean () {
    rimraf(this.config.output.path, () => {
      this.emit('remove', 'cleaned output directory')
    })
  }

  /**
   * Creates a new spike project from a template and returns the instance
   * @static
   * @param {Object} options - options for new project
   * @param {String} options.root - path ro the root of the project
   * @param {String} [options.template='base'] - name of the template to use
   * @param {String} [options.src=https://github.com/static-dev/spike-tpl-base.git] - path to the template source
   * @param {Object} [options.overrides] - locals provided to the sprout template
   * @param {EventEmitter} [options.emitter] - an event emitter for feedback
   * @fires Spike#info
   * @fires Spike#error
   * @fires Spike#done
   */
  static new (options) {
    // validate options
    const schema = Joi.object().keys({
      root: Joi.string().required(),
      template: Joi.string(),
      src: Joi.string(),
      locals: Joi.object(),
      emitter: Joi.func(),
      inquirer: Joi.func()
    }).with('template', 'src')
    const opts = Joi.validate(options, schema).value
    const emit = opts.emitter.emit.bind(opts.emitter)

    // Get the default template from the global config if needed
    if (!opts.template) {
      const conf = readConfig().defaultTemplate
      opts.template = conf.name
      opts.src = conf.src
    }

    // Initialize sprout
    const sprout = initSprout(emit)

    // if the template doesn't exist, add it from the source
    let promise = W.resolve()
    if (!sprout.templates[opts.template]) {
      emit('info', `adding template "${opts.template}"`)
      promise = sprout.add(opts.template, opts.src)
    }

    // set up sprout options and iniquirer for prompts
    const sproutOptions = {
      locals: opts.locals,
      questionnaire: opts.inquirer
    }

    // run it
    promise
      .tap(() => { emit('info', 'initializing template') })
      .then(sprout.init.bind(sprout, opts.template, opts.root, sproutOptions))
      .tap(() => { emit('info', 'installing production dependencies') })
      .then(npmInstall.bind(null, opts))
      .then(() => { return new Spike({ root: opts.root }) })
      .done(
        (instance) => { emit('done', instance) },
        (err) => { emit('error', err) }
      )
  }

  /**
   * Generates a unique id for each compile run
   * @private
   */
  _id () {
    return (Math.random().toString(16) + '000000000').substr(2, 8)
  }
}

/**
 * Runs `npm install` from the command line in the project root
 * @private
 * @return {Promise.<String>} promise for the command output
 */
function npmInstall (opts) {
  return node.call(exec, 'npm install --production', { cwd: opts.root })
}

/**
 * Function to be executed after a compile finishes. Handles errors and emits
 * events as necessary.
 * @param {Number} id - the compile's id
 * @param {Error} [err] - if there was an error, it's here
 * @param {WebpackStats} stats - stats object from webpack
 * @fires Spike#error
 * @fires Spike#warning
 * @fires Spike#compile
 */
function compileCallback (id, err, stats) {
  if (err) {
    return this.emit('error', new Errors.Error({ id: id, message: err }))
  }
  // Webpack "soft errors" are classified as warnings in spike. An error is
  // an error. If it doesn't break the build, it's a warning.
  const jsonStats = stats.toJson()
  if (jsonStats.errors.length) {
    this.emit('warning', new Errors.Warning({ id: id, message: jsonStats.errors }))
  }
  /* istanbul ignore next */
  if (jsonStats.warnings.length) {
    this.emit('warning', new Errors.Warning({ id: id, message: jsonStats.warnings }))
  }

  this.emit('compile', { id: id, stats: stats })
}

/**
 * A set of functions for controlling new project templates
 */
Spike.template = {
  /**
   * Adds a template to spike's stash
   * @param {Object} options
   * @param {String} name - name of the template to add
   * @param {String} src - url from which the template can be `git clone`d
   * @param {EventEmitter} [emitter] - will return events to report progress
   * @fires emitter#info
   * @fires emitter#done
   */
  add: function (options) {
    const schema = Joi.object().keys({
      name: Joi.string().required(),
      src: Joi.string().required(),
      emitter: Joi.func().default((x) => x)
    })
    const {opts, emit, sprout} = this._init(options, schema)

    emit('info', 'adding template')
    sprout.add(opts.name, opts.src).done(() => {
      emit('done', `template "${opts.name}" added`)
    })
  },
  /**
   * Removes a template from spike's list
   * @param {Object} options
   * @param {String} name - name of the template to remove
   * @param {EventEmitter} [emitter] - will return events to report progress
   * @fires emitter#info
   * @fires emitter#done
   */
  remove: function (options) {
    const schema = Joi.object().keys({
      name: Joi.string().required(),
      emitter: Joi.func().default((x) => x)
    })
    const {opts, emit, sprout} = this._init(options, schema)

    emit('info', 'removing template')
    sprout.remove(opts.name).done(() => {
      emit('done', `template "${opts.name} removed"`)
    })
  },
  /**
   * Sets a template as the default when creating projects with `Spike.new`
   * @param {Object} options
   * @param {String} name - name of the template to make default
   * @param {EventEmitter} [emitter] - will return events to report progress
   * @fires emitter#info
   * @fires emitter#done
   * @fires emitter#error
   */
  default: function (options) {
    const schema = Joi.object().keys({
      name: Joi.string().required(),
      emitter: Joi.func().default((x) => x)
    })
    const {opts, emit, sprout} = this._init(options, schema)
    const tpl = sprout.templates[opts.name]

    if (tpl) {
      writeConfig({ defaultTemplate: { name: tpl.name, src: tpl.src } })
      emit('done', `template "${opts.name}" is now the default`)
    } else {
      emit('error', `template "${opts.name}" doesn't exist`)
    }
  },
  /**
   * Sets a template as the default when creating projects with `Spike.new`
   * @param {EventEmitter} [emitter] - will return events to report progress
   * @fires emitter#info
   * @fires emitter#done
   */
  list: function (options) {
    const schema = Joi.object().keys({
      emitter: Joi.func().default((x) => x)
    })
    const {emit, sprout} = this._init(options, schema)

    emit('done', sprout.templates)
  },
  /**
   * Removes the primary spike config and all templates, like a clean install
   * @private
   */
  reset: function () {
    fs.unlinkSync(Spike.configPath)
    rimraf.sync(Spike.tplPath)
  },
  /**
   * Internal utility function
   * @private
   */
  _init: function (options, schema) {
    const opts = Joi.validate(options, schema).value
    const emit = opts.emitter.emit.bind(opts.emitter)
    const sprout = initSprout(emit)
    return {opts, emit, sprout}
  }
}

// path where spike stores defaults and new project templates
Spike.configPath = path.join(os.homedir(), '.spike/config.json')
Spike.tplPath = path.join(os.homedir(), '.spike/templates')

module.exports = Spike

/**
 * Ensures the folder structure is present and initializes sprout
 * @param {EventEmitter} - event emitter to report progress
 * @return {Sprout} initialized sprout instance
 */
function initSprout (emit) {
  emit('info', 'configuring template storage')
  try {
    fs.accessSync(Spike.tplPath)
  } catch (_) {
    mkdirp.sync(Spike.tplPath)
  }
  return new Sprout(Spike.tplPath)
}

/**
 * Reads spike's global configuration file
 * @return {Object} config values
 */
function readConfig () {
  ensureConfigExists()
  return JSON.parse(fs.readFileSync(Spike.configPath, 'utf8'))
}

/**
 * Writes an object to spike's global config
 * @param {Object} data - what you want to write to the file
 */
function writeConfig (data) {
  ensureConfigExists()
  fs.writeFileSync(Spike.configPath, JSON.stringify(data))
}

/**
 * If spike's global config file doesn't exist, creates it with the default
 * template in place.
 */
function ensureConfigExists () {
  const defaultConfig = {
    defaultTemplate: {
      name: 'base',
      src: 'https://github.com/static-dev/spike-tpl-base.git'
    }
  }

  try {
    fs.accessSync(Spike.configPath)
  } catch (_) {
    fs.writeFileSync(Spike.configPath, JSON.stringify(defaultConfig))
  }
}
