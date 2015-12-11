import glob from 'glob'
import SingleEntryDependency from 'webpack/lib/dependencies/SingleEntryDependency'

export default class JadeWebpackPlugin {

  constructor (opts) {
    if (!opts) { opts = {} };
  }

  apply (compiler) {
    // read file tree and get all jade files
    let files = glob.sync(`${compiler.options.context}/views/**.jade`)

    // inject jade files into webpack's pipeline
    compiler.plugin('make', (compilation, cb) => {
      files.forEach(f => {
        let name = f.match(/\/(\w+).jade/)[1]
        let relativePath = f.replace(compiler.options.context, '.')
        let dep = new SingleEntryDependency(relativePath)

        compilation.addEntry(compiler.options.context, dep, name, cb)
      })
    })

    // after they have compiled, get the source, maps, deps, etc.

    // have webpack export them
    compiler.plugin('emit', (compilation, done) => {
      let contents = 'testing testing 123'

      compilation.assets['output_file.html'] = {
        source: () => { return contents },
        size: () => { return contents.length }
      }

      done()
    })
  }

}

// Utilities

// function extractJadeFiles (modules) {
//   return _.compact(_.map(modules, (i, key) => {
//     let filename = key.split('!').pop()
//     if (filename.match(/\.jade$/)) { return filename }
//   }))
// }
