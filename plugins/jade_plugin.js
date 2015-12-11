import glob from 'glob'

export default class JadeWebpackPlugin {

  constructor (opts) {
    if (!opts) { opts = {} };
  }

  apply (compiler) {
    //
    // Step 1: read file tree and get all jade files
    //

    glob(`${compiler.options.context}/views/**.jade`, (err, files) => {
      if (err) { throw err }
      console.log(files)
    })

    //
    // Step 2: inject jade files into webpack's pipeline
    //
    compiler.plugin('make', (compilation) => {
      // second param needs to be a webpack `Dependency`
      compilation.addEntry(compiler.options.context, 'views/index.jade', 'testing', (err) => { console.error(err) })
    })

    //
    // Step 3: after they have compiled, get the source, maps, deps, etc.
    //

    //
    // Step 4: have webpack export them
    //
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
