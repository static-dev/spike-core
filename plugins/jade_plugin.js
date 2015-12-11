import glob from 'glob'
import path from 'path'
import SingleEntryDependency from 'webpack/lib/dependencies/SingleEntryDependency'

export default class JadeWebpackPlugin {

  constructor (opts) {
    if (!opts) { this.opts = {} } else { this.opts = opts };
  }

  apply (compiler) {
    // read file tree and get all jade files
    let files = glob.sync(`${compiler.options.context}/views/**.jade`)

    // inject jade files into webpack's pipeline
    compiler.plugin('make', (compilation, done) => {
      let tasks = []

      files.forEach(f => {
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
    // NOTE: make sure to handle ignored files
    compiler.plugin('emit', (compilation, done) => {
      files.forEach(f => {
        let dep = compilation.modules.find((el) => {
          if (el.userRequest === f) { return el }
        })
        let src = dep._source._value
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
