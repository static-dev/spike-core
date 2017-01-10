module.exports = class JadeWebpackPlugin {
  constructor (opts) {
    this.opts = opts
  }

  apply (compiler) {
    compiler.plugin('run', (compilation, done) => {
      setTimeout(() => {
        compiler.options.test = 'bar'
        done()
      }, 300)
    })

    compiler.plugin('emit', (compilation, done) => {
      const file = compiler.options.spike.files.process.find((f) => {
        if (f.path.match(/custom_output/)) { return f }
      })
      file.outPath = file.path.replace(/custom_output/, 'changed_output')
      done()
    })
  }
}
