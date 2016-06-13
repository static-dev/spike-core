/**
 * @module StaticPlugin
 */

/**
 * @class StaticPlugin
 * @classdesc A webpack plugin that takes in any remaining files, adds them to
 * the pipeline, and writes them.
 */
module.exports = class StaticWebpackPlugin {

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
    let staticFiles

    // inject static files into webpack's pipeline
    compiler.plugin('make', (compilation, done) => {
      staticFiles = compiler.options.spike.files.static
      this.util.addFilesAsWebpackEntries(compilation, staticFiles)
        .done(() => done(), done)
    })

    // grab the sources and dependencies and export them into the right files
    // have webpack export them into their own files
    compiler.plugin('emit', (compilation, done) => {
      staticFiles.forEach((f) => {
        const dep = compilation.modules.find((el) => {
          if (el.userRequest === f) { return el }
        })

        /* istanbul ignore next */
        if (!dep) { throw new Error(`Webpack failed to add entry for ${f}`) }
        /* istanbul ignore next */
        if (dep.error) { return done(dep.error) }

        const src = dep._src

        const outputPath = this.util.getOutputPath(f).relative
        compilation.assets[outputPath] = {
          source: () => { return src },
          size: () => { return src.length }
        }
      })

      done()
    })

    // remove static assets from webpack pipeline
    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('optimize-chunk-assets', (chunks, done) => {
        this.util.removeAssets(compilation, staticFiles, chunks)
        done()
      })
    })
  }
}
