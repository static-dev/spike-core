/**
 * @module CSSPlugin
 */

const _eval = require('require-from-string')

/**
 * @class CSSWebpackPlugin
 * @classdesc A webpack plugin that takes in .sss files, adds them to the
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

        const srcFn = dep._source._value
        let src = _eval(srcFn, f) // eslint-disable-line
        src = src[0][1] // this part is questionable, but it is what it is
        const outputPath = this.util.getOutputPath(f)
        const newPath = outputPath.relative.replace(/\.[^/.]+$/, '.css')
        compilation.assets[newPath] = {
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
