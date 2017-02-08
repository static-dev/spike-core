const SpikeUtil = require('spike-util')

module.exports = class TestWebpackPlugin {
  constructor (opts) {
    this.opts = opts
  }

  apply (compiler) {
    this.util = new SpikeUtil(compiler.options)
    compiler.plugin('run', (compilation, done) => {
      setTimeout(() => {
        compiler.options.entry.test = 'bar'
        done()
      }, 300)
    })

    compiler.plugin('emit', (compilation, done) => {
      const file = this.util.getSpikeOptions().files.process.find((f) => {
        if (f.path.match(/custom_output/)) { return f }
      })
      file.outPath = file.path.replace(/custom_output/, 'changed_output')
      done()
    })
  }
}
