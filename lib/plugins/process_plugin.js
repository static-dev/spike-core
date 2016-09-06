/**
 * @module ProcessPlugin
 */

/**
 * @class ProcessWebpackPlugin
 * @classdesc A webpack plugin that takes in files, adds them to the
 * pipeline, and writes them with the correct extension.
 */
module.exports = class ProcessWebpackPlugin {

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
    let processedFiles
    let filesOnly

    // inject files into webpack's pipeline
    compiler.plugin('make', (compilation, done) => {
      processedFiles = compiler.options.spike.files.process
      filesOnly = processedFiles.map((f) => f.path)
      this.util.addFilesAsWebpackEntries(compilation, filesOnly)
        .done(() => done(), done)
    })

    // grab the sources and dependencies and export them into the right files
    // have webpack export them into their own files
    compiler.plugin('emit', (compilation, done) => {
      processedFiles.forEach((f) => {
        const dep = compilation.modules.find((el) => {
          if (el.userRequest === f.path) { return el }
        })

        /* istanbul ignore next */
        if (!dep) { throw new Error(`Webpack failed to add entry for ${f}`) }
        /* istanbul ignore next */
        if (dep.error) { return done(dep.error) }

        let src
        // source loader exports the source cleanly
        if (dep._src) {
          src = dep._src
        // if not using the source loader, extract from webpack
        } else {
          src = JSON.parse(dep._source._value.replace(/^module\.exports = /, ''))
        }

        // calculate the output path
        let outputPath = this.util.getOutputPath(f.path).relative

        // set the file's extension
        if (f.extension) {
          outputPath = outputPath.replace(/(.*)?(\..+?$)/, `$1.${f.extension}`)
        }

        // and give the file to webpack for emission!
        compilation.assets[outputPath] = {
          source: () => { return src },
          size: () => { return src.length }
        }
      })

      done()
    })

    // remove assets from webpack pipeline, we already wrote them
    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('optimize-chunk-assets', (chunks, done) => {
        this.util.removeAssets(compilation, filesOnly, chunks)
        done()
      })
    })
  }

}
