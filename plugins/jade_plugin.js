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
    // NOTE: make sure we are handling ignored files here
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

      Promise.all(tasks).then(done)
    })

    // after they have compiled, get the source, maps, deps, etc.

    // have webpack export them
    compiler.plugin('emit', (compilation, done) => {
      let contents = '<p>test output</p>'

      files.forEach(f => {
        let outputPath = this._getOutputPath(compiler, f)
        compilation.assets[outputPath] = {
          source: () => { return contents },
          size: () => { return contents.length }
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
