/**
 * @module Spike
 */

const path = require('path')
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
      template: Joi.string().default('base'),
      src: Joi.string().default('https://github.com/static-dev/spike-tpl-base.git'),
      locals: Joi.object(),
      emitter: Joi.func(),
      inquirer: Joi.func()
    }).with('template', 'src')
    const opts = Joi.validate(options, schema).value
    const emit = opts.emitter.emit.bind(opts.emitter)

    // create spike config directory if it doesn't exist, initialize sprout
    emit('info', 'configuring template storage')
    mkdirp.sync(Spike.tplPath)
    const sprout = new Sprout(Spike.tplPath)

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
    return this.emit('error', new Error({ id: id, message: err }))
  }
  // Webpack "soft errors" are classified as warnings in spike. An error is
  // an error. If it doesn't break the build, it's a warning.
  const jsonStats = stats.toJson()
  if (jsonStats.errors.length) {
    this.emit('warning', new Warning({ id: id, message: jsonStats.errors }))
  }
  /* istanbul ignore next */
  if (jsonStats.warnings.length) {
    this.emit('warning', new Warning({ id: id, message: jsonStats.warnings }))
  }

  this.emit('compile', { id: id, stats: stats })
}

// path where spike stores all new project templates
Spike.tplPath = path.join(os.homedir(), '.spike/templates')

module.exports = Spike
