/**
 * @module JadePlugin
 */

const cheerio = require('cheerio')

/**
 * @class JadePlugin
 * @classdesc A webpack plugin that takes in .jade files, adds them to the
 * pipeline, and writes them.
 */
module.exports = class JadeWebpackPlugin {

  /**
   * @constructor
   * @param {Object} opts - options for configuration
   * @param {String} opts.root - project root
   * @param {Array} opts.dumpDirs - directories to dump to public
   */
  constructor (util) {
    this.util = util
  }

  apply (compiler) {
    let jadeFiles

    // inject jade files into webpack's pipeline
    compiler.plugin('make', (compilation, done) => {
      jadeFiles = compiler.options.spike.files.jade
      this.util.addFilesAsWebpackEntries(compilation, jadeFiles)
        .done(() => done(), done)
    })

    // grab the sources and dependencies and export them into the right files
    // have webpack export them into their own files
    compiler.plugin('emit', (compilation, done) => {
      jadeFiles.forEach((f) => {
        const dep = compilation.modules.find((el) => {
          if (el.userRequest === f) { return el }
        })

        /* istanbul ignore next */
        if (!dep) { throw new Error(`Webpack failed to add entry for ${f}`) }
        /* istanbul ignore next */
        if (dep.error) { return done(dep.error) }

        let src = JSON.parse(dep._source._value.replace(/^module\.exports = /, ''))

        // find all HTML asset references
        // Matching for:
        // - all nodes with an `src` attribute
        // - all <link> nodes with an `href` attribute
        const $ = cheerio.load(src)
        const srcs = $('[src], link[href]').map(function (i, el) {
          const attributes = $(this).attr()
          if ('src' in attributes) {
            return $(this).attr('src')
          }

          if ('href' in attributes) {
            return $(this).attr('href')
          }
        }).get()

        // add HTML asset references as dependencies in webpack
        srcs.forEach((src) => {
          const p = this.util.getSourcePath(src)
          dep.fileDependencies.push(p.relative)
        })

        const outputPath = this.util.getOutputPath(f).relative.replace(/\.jade$/, '.html')
        compilation.assets[outputPath] = {
          source: () => { return src },
          size: () => { return src.length }
        }
      })

      done()
    })

    // remove jade assets from webpack pipeline, unless jadeTemplates option
    // is present
    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('optimize-chunk-assets', (chunks, done) => {
        this.util.removeAssets(compilation, jadeFiles)
        done()
      })
    })
  }

}
