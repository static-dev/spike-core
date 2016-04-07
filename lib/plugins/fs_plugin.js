import util from './plugin_utils'

export default class FsWebpackPlugin {

  // Accepted Options
  // - matchers (array)
  // - ignore (array)
  constructor (opts) {
    this.opts = opts
  }

  apply (compiler) {
    compiler.plugin('run', run.bind(this, compiler))
    compiler.plugin('watch-run', run.bind(this, compiler))
  }
}

function run (compiler, compilation, done) {
  compiler.options.files = util.getFilesFromGlob(compiler, this.opts)
  done()
}
