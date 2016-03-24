import util from './plugin_utils'

export default class StaticWebpackPlugin {

  // Accepted Options
  // - matcher (string)
  // - ignore (array)
  // - dumpDirs (array)
  constructor (opts) {
    this.opts = opts
  }

  apply (compiler) {
    // read file tree and get all static files
    this.files = util.getFilesFromGlob(compiler, this.opts)

    // inject static files into webpack's pipeline
    compiler.plugin('make', (compilation, done) => {
      util.addFilesAsWebpackEntries(this.files, this.opts, compiler, compilation)
        .then((res) => done())
    })

    // remove static assets from webpack pipeline
    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('optimize-chunk-assets', (chunks, done) => {
        util.removeAssets(compilation, this.opts, done)
      })
    })
  }
}
