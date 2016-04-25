import {
  addFilesAsWebpackEntries,
  removeAssets,
  getOutputPath
} from './plugin_utils'

export default class StaticWebpackPlugin {

  // Accepted Options
  // - matcher (string)
  // - ignore (array)
  // - dumpDirs (array)
  constructor (opts) {
    this.opts = opts
  }

  apply (compiler) {
    let staticFiles

    // inject static files into webpack's pipeline
    compiler.plugin('make', (compilation, done) => {
      staticFiles = compiler.options.roots.files.static
      addFilesAsWebpackEntries(staticFiles, this.opts, compilation)
        .then((res) => done())
    })

    // grab the sources and dependencies and export them into the right files
    // have webpack export them into their own files
    compiler.plugin('emit', (compilation, done) => {
      staticFiles.forEach((f) => {
        const dep = compilation.modules.find((el) => {
          if (el.userRequest === f) { return el }
        })

        if (!dep) { throw new Error(`Webpack failed to add entry for ${f}`) }
        if (dep.error) { return done(dep.error) }

        let src
        try {
          // webpack stores this value using the relative path as a key
          let relativePath = getOutputPath(f, this.opts)
            .replace(this.opts.root, '')

          // now we pull the value from the dependency using the correct key
          src = dep.assets[relativePath]._value
        } catch (_) {
          src = ''
        }

        const outputPath = getOutputPath(f, this.opts)
        compilation.assets[outputPath] = {
          source: () => { return src },
          size: () => { return src.length }
        }
      })

      done()
    })

    // remove static assets from webpack pipeline
    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('optimize-chunk-assets', (chunks, done) => {
        removeAssets(compilation, staticFiles, this.opts, done)
      })
    })
  }
}
