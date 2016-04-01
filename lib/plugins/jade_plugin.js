import util from './plugin_utils'
import cheerio from 'cheerio'

export default class JadeWebpackPlugin {

  // Accepted Options
  // - matcher (string)
  // - dumpDirs (array)
  // - ignore (array)
  // - jadeTemplates (boolean)
  // - locals (object)
  constructor (opts) {
    this.opts = opts
  }

  apply (compiler) {
    // inject jade files into webpack's pipeline
    compiler.plugin('make', (compilation, done) => {
      util.addFilesAsWebpackEntries(compiler.options.files.jade, this.opts, compiler, compilation)
        .then((res) => done())
    })

    // grab the sources and dependencies and export them into the right files
    // have webpack export them into their own files
    compiler.plugin('emit', (compilation, done) => {
      compiler.options.files.jade.forEach((f) => {
        const dep = compilation.modules.find((el) => {
          if (el.userRequest === f) { return el }
        })

        if (!dep) { throw new Error(`Webpack failed to add entry for ${f}`) }
        if (dep.error) { return done(dep.error) }

        let src = JSON.parse(dep._source._value)

        // find all HTML asset references
        // Matching for:
        // - all nodes with an `src` attribute
        // - all <link> nodes with an `href` attribute
        const $ = cheerio.load(src)
        const srcs = $('[src], link[href]').map(function (i, el) {
          const attributes = $(this).attr()
          if ('src' in attributes) {
            return $(this).attr('src')
          }

          if ('href' in attributes) {
            return $(this).attr('href')
          }
        }).get()

        // add HTML asset references as dependencies in webpack
        srcs.forEach((src) => {
          const p = util.resolveRelativeSourcePath(compiler, src, this.opts)
          dep.fileDependencies.push(p)
        })

        const outputPath = util.getOutputPath(compiler, f, this.opts)
                             .replace(/\.jade$/, '.html')
        compilation.assets[outputPath] = {
          source: () => { return src },
          size: () => { return src.length }
        }
      })

      done()
    })

    // remove jade assets from webpack pipeline, unless jadeTemplates option
    // is present
    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('optimize-chunk-assets', (chunks, done) => {
        if (!this.opts.jadeTemplates) {
          util.removeAssets(compilation, this.opts, done)
        }
      })
    })
  }

}
