import util from './plugin_utils'

export default class FsWebpackPlugin {

  // Accepted Options
  // - matchers (array)
  // - ignore (array)
  constructor (opts) {
    this.opts = opts
  }

  apply (compiler) {
    // read file tree and get all files
    compiler.plugin('run', (compilation, done) => {
      compiler.options.files = util.getFilesFromGlob(compiler, this.opts)
      done()
    })
  }
}
