import _eval from 'require-from-string'
import util from './plugin_utils'

export default class CSSWebpackPlugin {

  // Accepted Options
  // - matcher (string)
  // - dumpDirs (array)
  // - cssTemplates (boolean)
  constructor (opts) {
    this.opts = opts
  }

  apply (compiler) {
    // read file tree and get all css files
    this.files = util.getFilesFromGlob(compiler, this.opts)

    // inject css files into webpack's pipeline
    compiler.plugin('make', (compilation, done) => {
      util.addFilesAsWebpackEntries(this.files, this.opts, compiler, compilation)
          .then((res) => done())
    })

    // grab the sources and dependencies and export them into the right files
    // have webpack export them into their own files
    compiler.plugin('emit', (compilation, done) => {
      this.files.forEach((f) => {
        const dep = compilation.modules.find((el) => {
          if (el.userRequest === f) { return el }
        })

        if (!dep) { throw new Error(`Webpack failed to add entry for ${f}`) }
        if (dep.error) { return done(dep.error) }

        const srcFn = dep._source._value
        let src = _eval(srcFn, f) // eslint-disable-line
        src = src[0][1] // this part is questionable, but it is what it is

        const outputPath = util.getOutputPath(compiler, f, this.opts)
        compilation.assets[outputPath] = {
          source: () => { return src },
          size: () => { return src.length }
        }
      })

      done()
    })

    // remove css assets from webpack pipeline, unless cssTemplates option
    // is present
    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('optimize-chunk-assets', (chunks, done) => {
        if (!this.opts.cssTemplates) {
          util.removeAssets(compilation, this.opts, done)
        }
      })
    })
  }

}
