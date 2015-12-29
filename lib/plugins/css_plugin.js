import util from './plugin_utils'
import Joi from 'joi'

export default class CSSWebpackPlugin {

  constructor (opts) {
    let schema = Joi.object().keys({
      matcher: Joi.string().required(),
      dumpDirs: Joi.array().required(),
      ignore: [Joi.string(), Joi.array()],
      locals: Joi.object()
    })

    let validation = Joi.validate(opts, schema)
    if (validation.error) { throw new Error(validation.error) }
    this.opts = validation.value
  }

  apply (compiler) {
    // read file tree and get all css files
    this.files = util.getFilesFromGlob(compiler, this.opts)

    // inject jade files into webpack's pipeline
    compiler.plugin('make', (compilation, done) => {
      util.addFilesAsWebpackEntries(this.files, this.opts, compiler, compilation)
          .then(res => done())
    })

    // grab the sources and dependencies and export them into the right files
    // have webpack export them into their own files
    compiler.plugin('emit', (compilation, done) => {
      this.files.forEach(f => {
        let dep = compilation.modules.find((el) => {
          if (el.userRequest === f) { return el }
        })

        if (!dep) { throw new Error(`Webpack failed to add entry for ${f}`) }

        let srcFn = dep._source._value
        console.log(srcFn)
        let locals = this.opts.locals || {}
        let src = eval(srcFn)(locals) // eslint-disable-line

        let outputPath = util.getOutputPath(compiler, f, this.opts)
        compilation.assets[outputPath] = {
          source: () => { return src },
          size: () => { return src.length }
        }
      })

      done()
    })
  }

}
