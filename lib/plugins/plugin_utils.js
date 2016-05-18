/**
 * @module SpikeUtils
 */

const glob = require('glob')
const path = require('path')
const micromatch = require('micromatch')
const W = require('when')
const node = require('when/node')
const SingleEntryDependency = require('webpack/lib/dependencies/SingleEntryDependency')
const MultiEntryDependency = require('webpack/lib/dependencies/MultiEntryDependency')

module.exports = class SpikeUtils {
  constructor (config) {
    this.conf = config
  }

  /**
   * Adds a number of files to webpack's pipeline as entires, so that webpack
   * processes them even if they are not required in the main js file.
   * @param {Object} compilation - object from plugin
   * @param {Array} files - array of absolute paths to files
   * @return {Promise.<Array>} compilation.addEntry return value for each file
   */
  addFilesAsWebpackEntries (compilation, files) {
    return W.all(files.map((f) => {
      const name = this.getOutputPath(f)
      const relativePath = f.replace(this.conf.context, '.')
      const dep = new MultiEntryDependency([new SingleEntryDependency(relativePath)], name)
      const addEntryFn = compilation.addEntry.bind(compilation)

      return node.call(addEntryFn, this.conf.context, dep, name)
    }))
  }

  /**
   * Given a source file path, outputs the file's destination as spike
   * will write it.
   * @param {String} file - path to source file
   * @return {String} output path
   */
  getOutputPath (file) {
    let rel = file.replace(this.conf.context, '')

    this.conf.spike.dumpDirs.forEach((d) => {
      const re = new RegExp(`^${path.sep}${d}`)
      if (rel.match(re)) { rel = rel.replace(`${path.sep}${d}`, '') }
    })

    return rel.substring(1)
  }

  /**
   * Removes assets from the webpack compilation, so that static files are not
   * written to the js file, since we already write them as static files.
   * @param {Object} compilation - webpack compilation object from plugin
   * @param {Array} _files - array of absolute paths to processed files
   * @param {Function} done - callback
   */
  removeAssets (compilation, _files) {
    // assets are set in compilation.assets as the output path, relative to
    // the root, with '.js' at the end, so we transform to that format for
    // comparison
    let files = _files.map((f) => {
      return this.getOutputPath(f).replace(`${this.conf.context}/`, '') + '.js'
    })
    // now we go through all the assets and remove the ones we have processed
    // with spike so that they are not written to the js file
    for (const a in compilation.assets) {
      if (files.indexOf(a) > -1) { delete compilation.assets[a] }
    }
  }

  /**
   * Takes a relative path like `img/foo.png` and resolves it to an absolute
   * path. Function respects your dumpDirs and knows how to resolve it's
   * absolute source path.
   * @param {String} file - a relative path
   * @return {String} absolute path to the file
   */
  resolveRelativeSourcePath (file) {
    let rel = file.replace(this.conf.context, '')

    // check to see if the file is from a dumpDir path
    /* istanbul ignore next */
    // https://github.com/bcoe/nyc/issues/259
    glob.sync(`*(${this.conf.spike.dumpDirs.join('|')})/**`).forEach((d) => {
      const test = new RegExp(rel)
      if (d.match(test)) { rel = d }
    })

    return path.join(this.conf.context, rel)
  }

  /**
   * Boolean return whether a file matches any of the configured ignores.
   * @param {String} file - absolute file path
   * @return {Boolean} whether the file is ignored or not
   */
  isFileIgnored (file) {
    return micromatch.any(file, this.conf.spike.ignore)
  }
}
