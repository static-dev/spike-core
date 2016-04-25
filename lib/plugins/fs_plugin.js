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
  compiler.options.module.loaders.map((l) => {
    if (!l._core) { return }
    const files = compiler.options.roots.files[l._core]
    l.test = pathToRegex(files)
  })
  done()
}

function pathToRegex (paths) {
  if (!paths.length) { return new RegExp('^.^') }
  return new RegExp(paths.map((p, i) => {
    return p.replace(/\//g, '\\/')
  }).join('|'))
}
