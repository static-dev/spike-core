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
      files.forEach(f => {
        let name = f.match(/\/(\w+).jade/)[1]
        let relativePath = f.replace(compiler.options.context, '.')
        let dep = new SingleEntryDependency(relativePath)

        compilation.addEntry(compiler.options.context, dep, name, done)
      })
      // done needs to be called here once all addEntrys have completed
    })

    // after they have compiled, get the source, maps, deps, etc.

    // have webpack export them
    compiler.plugin('emit', (compilation, done) => {
      let contents = '<p>test output</p>'

      files.forEach(f => {
        let outputPath = this._getOutputPath(compiler, f)
        console.log(outputPath)
        compilation.assets[outputPath] = {
          source: () => { return contents },
          size: () => { return contents.length }
        }
      })

      done()
    })
  }

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

// Utilities

// function extractJadeFiles (modules) {
//   return _.compact(_.map(modules, (i, key) => {
//     let filename = key.split('!').pop()
//     if (filename.match(/\.jade$/)) { return filename }
//   }))
// }
