module.exports = class DogePlugin {
  constructor (opts) {
    this.opts = opts
  }

  apply (compiler) {
    compiler.plugin('run', function (compilation, done) {
      setTimeout(function () {
        compiler.options.spike.locals.foo = 'doge'
        done()
      }, 300)
    })
  }
}
