/**
 * @module CSSPlugin
 */

/**
 * @class CSSWebpackPlugin
 * @classdesc A webpack plugin that takes in .css files, adds them to the
 * pipeline, and writes them.
 */
module.exports = class CSSWebpackPlugin {

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
    let cssFiles

    // inject css files into webpack's pipeline
    compiler.plugin('make', (compilation, done) => {
      cssFiles = compiler.options.spike.files.css
      this.util.addFilesAsWebpackEntries(compilation, cssFiles)
        .done(() => done(), done)
    })

    // grab the sources and dependencies and export them into the right files
    // have webpack export them into their own files
    compiler.plugin('emit', (compilation, done) => {
      cssFiles.forEach((f) => {
        const dep = compilation.modules.find((el) => {
          if (el.userRequest === f) { return el }
        })

        /* istanbul ignore next */
        if (!dep) { throw new Error(`Webpack failed to add entry for ${f}`) }
        /* istanbul ignore next */
        if (dep.error) { return done(dep.error) }

        let src = JSON.parse(dep._source._value.replace(/^module\.exports = /, ''))

        let outputPath = this.util.getOutputPath(f)
        // replace any other extension with `.css`
        outputPath = outputPath.relative.replace(/(.*)?(\..+?$)/, '$1.css')

        compilation.assets[outputPath] = {
          source: () => { return src },
          size: () => { return src.length }
        }
      })

      done()
    })

    // remove css assets from webpack pipeline, unless cssTemplates option
    // is present
    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('optimize-chunk-assets', (chunks, done) => {
        this.util.removeAssets(compilation, cssFiles, chunks)
        done()
      })
    })
  }

}
