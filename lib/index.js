import path from 'path'
import os from 'os'
import mkdirp from 'mkdirp'
import W from 'when'
import node from 'when/node'
import {exec} from 'child_process'
import webpack from 'webpack'
import rimraf from 'rimraf'
import Sprout from 'sprout'
import Joi from 'joi'
import inquirer from 'inquirer'
import {EventEmitter} from 'events'
import Config from './config'
import {RootsError, RootsWarning} from './errors'

export default class Roots extends EventEmitter {
  constructor (opts = {}) {
    super()
    this.config = new Config(opts)
  }

  compile () {
    const id = this._id()
    const compiler = webpack(this.config)

    compiler.run((err, stats) => {
      if (err) {
        return this.emit('error', new RootsError({ id: id, message: err }))
      }

      // Webpack "soft errors" are classified as warnings in roots. An error is
      // an error. If it doesn't break the build, it's a warning.
      const jsonStats = stats.toJson()
      if (jsonStats.errors.length > 0) {
        this.emit('warning', new RootsWarning({ id: id, message: jsonStats.errors }))
      }
      if (jsonStats.warnings.length > 0) {
        this.emit('warning', new RootsWarning({ id: id, message: jsonStats.warnings }))
      }

      this.emit('compile', { id: id, stats: stats })
    })

    // Returns the compilation's ID synchronously, this can be checked against
    // events emitted from the project instance.
    return [id, compiler]
  }

  watch (opts) {
    const [, compiler] = this.compile()
    return compiler.watch(opts, (err, stats) => {
      if (err) { return this.emit('error', err) }
      this.emit('compile', { stats: stats })
    })
  }

  clean () {
    rimraf(this.config.output.path, () => {
      this.emit('remove', 'cleaned output directory')
    })
  }

  static new (options) {
    // validate options
    const schema = Joi.object().keys({
      root: Joi.string().required(),
      template: Joi.string().default('base'),
      src: Joi.string().default('git@github.com:carrot/roots-mini-base'),
      locals: Joi.object()
    }).with('template', 'src')
    const opts = Joi.validate(options, schema).value

    // create roots config directory if it doesn't exist, initialize sprout
    const tplPath = path.join(os.homedir(), '.roots/templates')
    mkdirp.sync(tplPath)
    const sprout = new Sprout(tplPath)

    // if the template doesn't exist, add it from the source
    let promise = W.resolve()
    if (!sprout.templates[opts.template]) {
      promise = sprout.add(opts.template, opts.src)
    }

    // set up sprout options and iniquirer for prompts
    const sproutOptions = {
      locals: opts.locals,
      questionnaire: (prompts, skip) => {
        return W.promise((resolve, reject) => {
          const qs = prompts.filter((q) => { return skip.indexOf(q.name) < 0 })
          inquirer.prompt(qs, resolve)
        })
      }
    }

    // run it
    return promise
      .then(sprout.init.bind(sprout, opts.template, opts.root, sproutOptions))
      .then(npmInstall.bind(null, opts))
      .then(() => { return new Roots({ root: opts.root }) })
  }

  _id () {
    return (Math.random().toString(16) + '000000000').substr(2, 8)
  }
}

function npmInstall (opts) {
  return node.call(exec, 'npm install', { cwd: opts.root })
}
