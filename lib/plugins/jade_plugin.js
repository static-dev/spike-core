import util from './plugin_utils'
import path from 'path'

export default class JadeWebpackPlugin {

  constructor (opts) {
    // TODO use joi for this
    if (!opts) { this.opts = {} } else { this.opts = opts };
  }

  apply (compiler) {
    // read file tree and get all jade files
    this.files = util.getFilesFromGlob(compiler, this.opts)

    // inject jade files into webpack's pipeline
    compiler.plugin('make', (compilation, done) => {
      util.addFilesAsWebpackEntries(this.files, this.opts, compiler, compilation)
          .then(res => done())
    })

    // grab the sources and dependencies and export them into the right files
    // have webpack export them into their own files
    compiler.plugin('emit', (compilation, done) => {
      this.files.forEach(f => {
        let dep = compilation.modules.find((el) => {
          if (el.userRequest === f) { return el }
        })
        let srcFn = dep._source._value
        let locals = this.opts.locals || {}
        let src = eval(srcFn)(locals) // eslint-disable-line

        let outputPath = this._getOutputPath(compiler, f)
        compilation.assets[outputPath] = {
          source: () => { return src },
          size: () => { return src.length }
        }
      })

      done()
    })
  }

  // utils

  _getOutputPath (compiler, f) {
    let dump_dirs = this.opts.dump_dirs || ['views', 'assets']
    let res = f.replace(compiler.options.context, '')

    dump_dirs.forEach(d => {
      let re = new RegExp(`^${path.sep}${d}`)
      if (res.match(re)) { res = res.replace(`${path.sep}${d}`, '') }
    })

    return res.substring(1).replace(/\.jade$/, '.html')
  }

}
