/**
 * @module HtmlPlugin
 */

/**
 * @class HtmlPlugin
 * @classdesc A webpack plugin that takes in .html files, adds them to the
 * pipeline, and writes them.
 */
module.exports = class HtmlWebpackPlugin {

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
    let htmlFiles

    // inject html files into webpack's pipeline
    compiler.plugin('make', (compilation, done) => {
      htmlFiles = compiler.options.spike.files.html
      this.util.addFilesAsWebpackEntries(compilation, htmlFiles)
        .done(() => done(), done)
    })

    // grab the sources and dependencies and export them into the right files
    // have webpack export them into their own files
    compiler.plugin('emit', (compilation, done) => {
      htmlFiles.forEach((f) => {
        const dep = compilation.modules.find((el) => {
          if (el.userRequest === f) { return el }
        })

        /* istanbul ignore next */
        if (!dep) { throw new Error(`Webpack failed to add entry for ${f}`) }
        /* istanbul ignore next */
        if (dep.error) { return done(dep.error) }

        let src = JSON.parse(dep._source._value.replace(/^module\.exports = /, ''))

        let outputPath = this.util.getOutputPath(f).relative
        // replace any other extension with `.html`
        outputPath = outputPath.replace(/(.*)?(\..+?$)/, '$1.html')

        compilation.assets[outputPath] = {
          source: () => { return src },
          size: () => { return src.length }
        }
      })

      done()
    })

    // remove html assets from webpack pipeline
    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('optimize-chunk-assets', (chunks, done) => {
        this.util.removeAssets(compilation, htmlFiles, chunks)
        done()
      })
    })
  }

}
