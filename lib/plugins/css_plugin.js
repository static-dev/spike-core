import util from './plugin_utils'
import path from 'path'
import SingleEntryDependency from 'webpack/lib/dependencies/SingleEntryDependency'

export default class CSSWebpackPlugin {

  constructor (opts) {
    if (!opts) { this.opts = {} } else { this.opts = opts }
    this.opts = Object.assign({
      ignore: [],
      locals: {}
    }, this.opts)
  }

  apply (compiler) {
    // read file tree and get all css files
    this.files = util.getFilesFromGlob(compiler, this.opts)

    // inject css files into webpack's pipeline
    compiler.plugin('make', (compilation, done) => {
      let tasks = []

      this.files.forEach(f => {
        // TODO this should use the matcher
        let name = f.match(/\/(\w+).css/)[1]
        let relativePath = f.replace(compiler.options.context, '.')
        let dep = new SingleEntryDependency(relativePath)

        tasks.push(new Promise((resolve, reject) => {
          compilation.addEntry(compiler.options.context, dep, name, (err) => {
            if (err) { reject(err) } else { resolve(true) }
          })
        }))
      })

      Promise.all(tasks).then((res) => { done() })
    })

    // grab the sources and dependencies and export them into the right files
    // have webpack export them into their own files
    compiler.plugin('emit', (compilation, done) => {
      this.files.forEach(f => {
        let dep = compilation.modules.find((el) => {
          if (el.userRequest === f) { return el }
        })

        if (!dep) { throw new Error(`Webpack failed to add entry for ${f}`) }

        let srcFn = dep._source._value
        console.log(srcFn)
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
  }

  _removeIgnores (f) {
    for (let ignore of this.opts.ignore) {
      if (f.match(ignore)) { return false }
    }
    return true
  }

}
