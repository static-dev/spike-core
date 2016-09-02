/**
 * @module FSPlugin
 */

const path = require('path')
const glob = require('glob')
const micromatch = require('micromatch')
const File = require('filewrap')
const difference = require('lodash.difference')

/**
 * @class FsWebpackPlugin
 * @classdesc A webpack plugin that collects files to be parsed from the project
 * root and makes them available to other plugins
 */
module.exports = class FsWebpackPlugin {

  /**
   * @constructor
   * @param {Object} util - a SpikeUtils object
   * @param {Object} util.conf - configuration values from webpack + spike
   * @param {Object} util.conf.spike - spike specific config values
   */
  constructor (util) {
    this.util = util
  }

  /**
   * Main webpack plugin entry point
   */
  apply (compiler) {
    this.util.runAll(compiler, this.run.bind(this, compiler))
  }

  /**
   * Function that is executed at the beginning of the compile process
   */
  run (compiler, compilation, done) {
    compiler.options.spike.files = this.getFilesFromGlob()
    compiler.options.module.loaders.map((l) => {
      if (!l._core) { return }
      let files
      if (l._core === 'static') {
        files = compiler.options.spike.files.static
      } else {
        files = compiler.options.spike.files.process.reduce((m, f) => {
          if (f.extension === l._core) m.push(f.path)
          return m
        }, [])
      }
      l.test = pathToRegex(files)
    })
    done()
  }

  /**
   * Given the config options, pulls all files from the fs that match any of the
   * provided matchers.
   * @return {Array} all matching file paths, absolute
   */
  getFilesFromGlob () {
    let files = {}
    const util = this.util

    // First, we grab all the files in the project, other than the ignored
    // files of course.

    const matcher = path.join(util.conf.context, '**/**')
    files.all = glob.sync(matcher, { ignore: util.conf.spike.ignore, dot: true, nodir: true })

    // There are two special types of files we want to *not* be processed by
    // spike's core plugins. Any files that are already being processed by a
    // user-added loader that has the `skipSpikeProcessing` key, and any files
    // in the `vendored` config. Here, we find these two types of files and
    // push them into their own custom categories.

    const customLoaderTests = util.conf.module.loaders.reduce((m, l) => {
      if (!l._core && l.skipSpikeProcessing) m.push(l.test); return m
    }, [])

    files.custom = files.all.filter((f) => {
      return customLoaderTests.find((t) => f.match(t) && f)
    })

    files.vendor = files.all.filter((f) => {
      const file = new File(util.conf.context, f)
      return util.matchGlobs(file.relative, util.conf.spike.vendor)[0]
    })

    // Now we go through the rest of the eligible files and sort them into
    // categories according to which plugin will process them, using the
    // `matchers` config, which matches by file extension. This does not
    // include any ignored, vendored, or custom loader processed files, as we
    // have separared these earlier.

    files.js = []
    files.process = []

    const allWithoutCustomOrVendor = difference(files.all, files.custom, files.vendor)

    for (const key in util.conf.spike.matchers) {
      // js files are processed by webpack, spike doesn't touch them
      if (key === 'js') {
        files.js.push(...micromatch(allWithoutCustomOrVendor, util.conf.spike.matchers[key], { dot: true }))
      } else {
        files.process.push(...micromatch(allWithoutCustomOrVendor, util.conf.spike.matchers[key], { dot: true }).map((f) => {
          return { path: f, extension: key }
        }))
      }
    }

    // Add any custom loader files with an extension to the right category

    util.conf.module.loaders.filter((l) => l.extension).map((l) => {
      files.process.push(...allWithoutCustomOrVendor.reduce((m, f) => {
        if (f.match(l.test)) m.push({ path: f, extension: l.extension })
        return m
      }, []))
    })

    // all minus custom, processed, and js (includes vendor)
    files.static = difference(files.all, files.custom, files.js, files.process.map((f) => f.path))

    return files
  }
}

/**
 * Given an array of paths, convert to a regex that matches for presence of
 * any of the given paths in a single path.
 * @param {Array} paths - array of absolute paths
 * @return {RegExp} regex that matches presence of any of the input paths
 */
function pathToRegex (paths) {
  if (!paths.length) { return new RegExp('^.^') }
  return new RegExp(paths.map((p, i) => {
    return p.replace(/\//g, '\\/')
  }).join('|'))
}
