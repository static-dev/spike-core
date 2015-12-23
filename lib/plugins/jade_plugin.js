import glob from 'glob'
import path from 'path'
import SingleEntryDependency from 'webpack/lib/dependencies/SingleEntryDependency'

export default class JadeWebpackPlugin {

  constructor (opts) {
    if (!opts) { this.opts = {} } else { this.opts = opts };
  }

  apply (compiler) {
    console.log(compiler.options.context)
    // read file tree and get all jade files
    this.files = glob.sync(`${compiler.options.context}/**/*.jade`)
                    .filter(this._removeIgnores.bind(this))

    // inject jade files into webpack's pipeline
    compiler.plugin('make', (compilation, done) => {
      let tasks = []

      this.files.forEach(f => {
        let name = f.match(/\/(\w+).jade/)[1]
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

  _removeIgnores (f) {
    for (let ignore of this.opts.ignore) {
      if (f.match(ignore)) { return false }
    }
    return true
  }

}
