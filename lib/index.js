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
const {Error, Warning} = require('./errors')

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
   * @return {Object} compile id, webpack compiler
   */
  compile () {
    const id = uuid()
    const compiler = webpack(this.config)
    compiler.run(compileCallback.bind(this, id))
    return {id, compiler}
  }

  /**
   * Compiles a project and watches it, when a file changes, recompiles
   * @param {Object} opts - options to be passed to webpack.watch
   * @fires Spike#error
   * @fires Spike#warning
   * @fires Spike#compile
   * @return {Object} watch id, webpack watcher
   */
  watch (opts = {}) {
    const id = uuid()
    this.compiler = webpack(this.config)
    const watcher = this.compiler.watch(opts, compileCallback.bind(this, id))
    this.watcher = watcher
    return {id, watcher}
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
   * @param {String} [options.template] - name of the template to use
   * @param {Object} [options.locals] - locals provided to the sprout template
   * @param {EventEmitter} [options.emitter] - an event emitter for feedback
   * @param {Inquirer} [options.inquirer] - inquirer instance for CLI
   * @fires Spike#info
   * @fires Spike#error
   * @fires Spike#done
   */
  static new (options) {
    // validate options
    const schema = Joi.object().keys({
      root: Joi.string().required(),
      template: Joi.string(),
      locals: Joi.object(),
      emitter: Joi.func(),
      inquirer: Joi.func()
    })
    const opts = Joi.validate(options, schema).value
    const emit = opts.emitter.emit.bind(opts.emitter)
    const sprout = initSprout(emit)

    // If a template option was passed, grab the source from sprout if possible
    // If not, use the default template options
    if (opts.template) {
      const tpl = sprout.templates[opts.template]
      if (tpl) {
        opts.src = tpl.src
      } else {
        return emit('error', `template "${opts.template}" has not been added to spike`)
      }
    } else {
      const conf = readConfig().defaultTemplate
      opts.template = conf.name
      opts.src = conf.src
    }

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
      .tap(() => emit('info', 'initializing template'))
      .then(sprout.init.bind(sprout, opts.template, opts.root, sproutOptions))
      .tap(() => emit('info', 'installing production dependencies'))
      .then(npmInstall.bind(null, opts))
      .then(() => new Spike({ root: opts.root }))
      .done(
        (instance) => { emit('done', instance) },
        (err) => { emit('error', err) }
      )
  }
}

/**
 * Generates a unique id for each compile run
 * @private
 */
function uuid () {
  return (Math.random().toString(16) + '000000000').substr(2, 8)
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
    return this.emit('error', new Error({ id, err }))
  }
  // Webpack "soft errors" are classified as warnings in spike. An error is
  // an error. If it doesn't break the build, it's a warning.
  const cstats = stats.compilation
  if (cstats.errors.length) {
    this.emit('warning', new Warning({ id, err: cstats.errors[0] }))
  }
  /* istanbul ignore next */
  if (cstats.warnings.length) {
    this.emit('warning', new Warning({ id, err: cstats.warnings[0] }))
  }

  this.emit('compile', {id, stats})
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
   * @param {EventEmitter} emitter - will return events to report progress
   * @fires emitter#info
   * @fires emitter#success
   * @fires emitter#error
   */
  add: function (options = {}) {
    const schema = Joi.object().keys({
      name: Joi.string().required(),
      src: Joi.string().required(),
      emitter: Joi.func().required()
    })
    const {opts, emit, sprout} = this._init(options, schema)

    emit('info', 'adding template')
    sprout.add(opts.name, opts.src).done(() => {
      emit('success', `template "${opts.name}" added`)
    }, (err) => {
      emit('error', err)
    })
  },
  /**
   * Removes a template from spike's list
   * @param {Object} options
   * @param {String} name - name of the template to remove
   * @param {EventEmitter} emitter - will return events to report progress
   * @fires emitter#info
   * @fires emitter#success
   */
  remove: function (options = {}) {
    const schema = Joi.object().keys({
      name: Joi.string().required(),
      emitter: Joi.func().required()
    })
    const {opts, emit, sprout} = this._init(options, schema)

    emit('info', 'removing template')
    sprout.remove(opts.name).done(() => {
      emit('success', `template "${opts.name}" removed`)
    })
  },
  /**
   * Sets a template as the default when creating projects with `Spike.new`
   * @param {Object} options
   * @param {String} name - name of the template to make default
   * @param {EventEmitter} [emitter] - will return events to report progress
   * @fires emitter#info
   * @fires emitter#success
   * @fires emitter#error
   */
  default: function (options = {}) {
    const schema = Joi.object().keys({
      name: Joi.string().required(),
      emitter: Joi.func().default({ emit: (x) => x })
    })
    const {opts, emit, sprout} = this._init(options, schema)
    const tpl = sprout.templates[opts.name]

    if (tpl) {
      writeConfig({ defaultTemplate: { name: tpl.name, src: tpl.src } })
      const message = `template "${opts.name}" is now the default`
      emit('success', message)
      return message
    } else {
      const message = `template "${opts.name}" doesn't exist`
      emit('error', message)
      return message
    }
  },
  /**
   * Sets a template as the default when creating projects with `Spike.new`
   * @param {EventEmitter} [emitter] - will return events to report progress
   * @fires emitter#info
   * @fires emitter#success
   */
  list: function (options = {}) {
    const schema = Joi.object().keys({
      emitter: Joi.func().default({ emit: (x) => x })
    })
    const {emit, sprout} = this._init(options, schema)

    emit('success', sprout.templates)
    return sprout.templates
  },
  /**
   * Removes the primary spike config and all templates, like a clean install
   */
  reset: function () {
    try {
      fs.unlinkSync(Spike.configPath)
      rimraf.sync(Spike.tplPath)
    } catch (_) { }
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
Spike.globalConfig = readConfig

module.exports = Spike

/**
 * Ensures the folder structure is present and initializes sprout
 * @param {EventEmitter} - event emitter to report progress
 * @return {Sprout} initialized sprout instance
 */
function initSprout (emit) {
  try {
    fs.accessSync(Spike.tplPath)
  } catch (_) {
    emit('info', 'configuring template storage')
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
    id: uuid(),
    analytics: true,
    defaultTemplate: {
      name: 'base',
      src: 'https://github.com/static-dev/spike-tpl-base.git'
    }
  }

  try {
    fs.accessSync(Spike.tplPath)
  } catch (_) {
    mkdirp.sync(Spike.tplPath)
  }

  try {
    fs.accessSync(Spike.configPath)
  } catch (_) {
    fs.writeFileSync(Spike.configPath, JSON.stringify(defaultConfig))
  }
}
