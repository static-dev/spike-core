export default class JadeWebpackPlugin {
  constructor (opts) {
    this.opts = opts
  }

  apply (compiler) {
    compiler.plugin('run', function (compilation, done) {
      setTimeout(function () {
        compiler.options.locals.foo = 'doge'
        done()
      }, 300)
    })
  }
}
