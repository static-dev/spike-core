import {getFilesFromGlob} from './plugin_utils'

/**
 * @module FSPlugin
 */

/**
 * @class FsWebpackPlugin
 * @classdesc A webpack plugin that collects files to be parsed from the project
 * root and makes them available to other plugins
 */
export default class FsWebpackPlugin {

  /**
   * @constructor
   * @param {Object} opts - roots config object
   * @param {String} opts.root - project root
   * @param {String} opts.dumpDirs - directories to dump into output folder
   * @param {Array} opts.ignore - array of ignore patterns
   * @param {Object} opts.matchers - matchers from roots config
   * @param {Array} opts.module.loaders - webpack loaders from roots config
   */
  constructor (opts) {
    this.opts = opts
  }

  apply (compiler) {
    compiler.plugin('run', run.bind(this, compiler))
    compiler.plugin('watch-run', run.bind(this, compiler))
  }
}

function run (compiler, compilation, done) {
  compiler.options.roots.files = getFilesFromGlob(this.opts)
  compiler.options.module.loaders.map((l) => {
    if (!l._core) { return }
    const files = compiler.options.roots.files[l._core]
    l.test = pathToRegex(files)
  })
  done()
}

function pathToRegex (paths) {
  if (!paths.length) { return new RegExp('^.^') }
  return new RegExp(paths.map((p, i) => {
    return p.replace(/\//g, '\\/')
  }).join('|'))
}
