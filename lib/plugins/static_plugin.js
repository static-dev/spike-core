import {addFilesAsWebpackEntries, removeAssets} from './plugin_utils'

export default class StaticWebpackPlugin {

  // Accepted Options
  // - matcher (string)
  // - ignore (array)
  // - dumpDirs (array)
  constructor (opts) {
    this.opts = opts
  }

  apply (compiler) {
    let staticFiles

    // inject static files into webpack's pipeline
    compiler.plugin('make', (compilation, done) => {
      staticFiles = compiler.options.roots.files.static
      addFilesAsWebpackEntries(staticFiles, this.opts, compilation)
        .then((res) => done())
    })

    // remove static assets from webpack pipeline
    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('optimize-chunk-assets', (chunks, done) => {
        removeAssets(compilation, this.opts, done)
      })
    })
  }
}
