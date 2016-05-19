/**
 * @module FSPlugin
 */

const path = require('path')
const glob = require('glob')
const micromatch = require('micromatch')

/**
 * @class FsWebpackPlugin
 * @classdesc A webpack plugin that collects files to be parsed from the project
 * root and makes them available to other plugins
 */
module.exports = class FsWebpackPlugin {

  /**
   * @constructor
   * @param {Object} opts - spike config object
   * @param {String} opts.root - project root
   * @param {String} opts.dumpDirs - directories to dump into output folder
   * @param {Array} opts.ignore - array of ignore patterns
   * @param {Object} opts.matchers - matchers from spike config
   * @param {Array} opts.module.loaders - webpack loaders from spike config
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
  compiler.options.spike.files = getFilesFromGlob(this.opts)
  compiler.options.module.loaders.map((l) => {
    if (!l._core) { return }
    const files = compiler.options.spike.files[l._core]
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

/**
 * Given the config options, pulls all files from the fs that match any of the
 * provided matchers.
 * @param {Object} opts - spike config object
 * @param {String} opts.root - project root
 * @param {String} opts.dumpDirs - directories to dump into output folder
 * @param {Array} opts.ignore - array of ignore patterns
 * @param {Object} opts.matchers - matchers from spike config
 * @param {Array} opts.module.loaders - webpack loaders from spike config
 * @return {Array} all matching file paths, absolute
 */
function getFilesFromGlob (opts) {
  let files = {}
  const matcher = path.join(opts.root, '**/**')
  files.all = glob.sync(matcher, { ignore: opts.ignore, dot: true, nodir: true })

  // Grab any file match tests from user-provided loaders
  const customLoaderTests = opts.module.loaders.reduce((m, l) => {
    if (!l._core) m.push(l.test)
    return m
  }, [])

  // push all files matched by custom loaders into a `custom` category
  files.custom = []
  for (const loaderTest of customLoaderTests) {
    files.all.forEach((f) => {
      if (f.match(loaderTest)) files.custom.push(f)
    })
  }

  // Core matchers do not match files that are already covered by custom loaders
  const allWithoutCustom = files.all.filter((f) => files.custom.indexOf(f) < 0)
  for (const key in opts.matchers) {
    files[key] = micromatch(allWithoutCustom, opts.matchers[key], { dot: true })
  }

  return files
}
