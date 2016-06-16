module.exports = class JadeWebpackPlugin {
  constructor (opts) {
    this.opts = opts
  }

  apply (compiler) {
    compiler.plugin('run', function (compilation, done) {
      setTimeout(function () {
        compiler.options.test = 'bar'
        done()
      }, 300)
    })
  }
}
