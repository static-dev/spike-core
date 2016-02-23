import util from './plugin_utils'
import Joi from 'joi'

export default class JadeWebpackPlugin {

  constructor (opts) {
    const schema = Joi.object().keys({
      matcher: Joi.string().required(),
      dumpDirs: Joi.array().required(),
      ignore: [Joi.string(), Joi.array()],
      jadeTemplates: Joi.bool(),
      locals: Joi.object()
    })

    const validation = Joi.validate(opts, schema)
    if (validation.error) { throw new Error(validation.error) }
    this.opts = validation.value
  }

  apply (compiler) {
    // read file tree and get all jade files
    this.files = util.getFilesFromGlob(compiler, this.opts)

    // inject jade files into webpack's pipeline
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

        const srcFn = dep._source._value
        const locals = this.opts.locals || {}
        const src = eval(srcFn)(locals) // eslint-disable-line

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
