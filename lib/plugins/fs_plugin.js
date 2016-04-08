import {getFilesFromGlob} from './plugin_utils'

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
  compiler.options.roots.files = getFilesFromGlob(this.opts)
  done()
}
