/**
 * @module FSPlugin
 */

const path = require('path')
const glob = require('glob')
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
    // first we load up and categorize all the files in the project
    compiler.options.spike.files = this.getFilesFromGlob()

    // then we add files to be processed by core loaders as their tests
    compiler.options.module.loaders.map((l) => {
      if (!l._core) { return }
      l.test = pathToRegex(compiler.options.spike.files[l._core])
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

    // There are three special types of files we want to *not* be processed by
    // spike's core plugins. Here, we find these three types of files and push
    // them into their own custom categories.

    // We start with a list of all files, which will be gradually cut down as
    // we find files to be ignored

    let allAvailableFiles = files.all

    // First step, we find any files that are already being processed by a
    // user-added loader that has the `skipSpikeProcessing` key (we will refer
    // to these as "skipLoaders").
    const skipLoaderTests = util.conf.module.loaders.reduce((m, l) => {
      if (!l._core && l.skipSpikeProcessing) m.push(l.test); return m
    }, [])

    files.skipLoaders = allAvailableFiles.filter((f) => {
      return skipLoaderTests.find((t) => f.match(t) && f)
    })

    allAvailableFiles = difference(allAvailableFiles, files.skipLoaders)

    // Then we grab any files in the `vendored` config
    files.vendor = matchRelative.call(this, allAvailableFiles, util.conf.spike.vendor)

    allAvailableFiles = difference(allAvailableFiles, files.vendor)

    // Finally, we pull any javascript files which are processed by webpack
    // internally using the 'js' matcher.
    files.js = matchRelative.call(this, allAvailableFiles, util.conf.spike.matchers.js)

    allAvailableFiles = difference(allAvailableFiles, files.js)

    // Next, we work through files that will be written out by our core
    // "static" plugin, which basically injects the file into webpack's
    // pipeline, lets it compile, then extracts and writes it out, modifying
    // the extension if necessary.
    //
    // This includes html and css files matched by the core matchers as well as
    // any files matched by custom loaders with an 'extension' property.

    files.process = []
    files.html = []
    files.css = []
    files.static = []

    // We start with the core matchers
    for (const key in util.conf.spike.matchers) {
      if (key === 'js') continue // js files are handled by webpack
      const matcher = util.conf.spike.matchers[key]
      const matchedFiles = matchRelative.call(this, allAvailableFiles, matcher)

      // add to the matcher's category so it's handled by the correct loader
      files[key].push(...matchedFiles)

      // then we add to the static category for the plugin
      const withExtensions = matchedFiles.map((f) => { return { path: f, extension: key } })
      files.process.push(...withExtensions)
    }

    // Then we add custom loaders with an 'extension' property
    util.conf.module.loaders.filter((l) => l.extension).map((l) => {
      const extensionLoaderMatches = allAvailableFiles.reduce((m, f) => {
        if (f.match(l.test)) m.push({ path: f, extension: l.extension })
        return m
      }, [])
      files.process.push(...extensionLoaderMatches)
    })

    allAvailableFiles = difference(allAvailableFiles, files.process.map((f) => f.path))

    // Now with any files that are left over, we add them in without an
    // extension property. This means that they will be processed by spike as
    // static files, but their extensions wont be changed.

    const noExtension = allAvailableFiles.map((f) => { return { path: f } })
    files.process.push(...noExtension)

    // Also add vendor files, as they are processed by spike's pipeline
    files.process.push(...files.vendor.map((f) => { return { path: f } }))

    // finally, add static/vendor to the static category for the loader
    files.static.push(...allAvailableFiles, ...files.vendor)

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

/**
 * Given a list of files and one or more glob matchers, returns a list of
 * matching files. Matchers are resolved relative to the project root rather
 * than their absolute paths.
 * @param  {Array} files - array of absolute paths to files
 * @param  {Array|String} matchers - one or more globstar matchers
 * @return {Array} - all files matched
 */
function matchRelative (files, matchers) {
  if (!matchers) return []
  return files.filter((f) => {
    const file = new File(this.util.conf.context, f)
    return this.util.matchGlobs(file.relative, matchers, { dot: true })[0]
  })
}
