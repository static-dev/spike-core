import Joi from 'joi'
import _eval from 'require-from-string'
import util from './plugin_utils'

export default class CSSWebpackPlugin {

  constructor (opts) {
    let schema = Joi.object().keys({
      matcher: Joi.string().required(),
      dumpDirs: Joi.array().required(),
      ignore: Joi.array().default([]),
      cssTemplates: Joi.bool(),
      locals: Joi.object().default({})
    })

    let validation = Joi.validate(opts, schema)
    if (validation.error) { throw new Error(validation.error) }
    this.opts = validation.value
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
        let dep = compilation.modules.find((el) => {
          if (el.userRequest === f) { return el }
        })

        if (!dep) { throw new Error(`Webpack failed to add entry for ${f}`) }

        if (dep.error) {
          // TODO: remove when async/await tests are gone
          console.error(`${dep.error.name}: ${dep.error.message}`)
          throw new Error(`${dep.error.name}: ${dep.error.message}`)
        }

        let srcFn = dep._source._value
        let src = _eval(srcFn, f) // eslint-disable-line
        src = src[0][1] // this part is questionable, but it is what it is

        let outputPath = util.getOutputPath(compiler, f, this.opts)
        compilation.assets[outputPath] = {
          source: () => { return src },
          size: () => { return src.length }
        }

        if (!this.opts.cssTemplates) { dep._remove = true }
      })

      // remove any extracted modules from the pipeline
      compilation.modules = compilation.modules.filter((dep) => {
        return !dep._remove
      })

      done()
    })
  }

}
