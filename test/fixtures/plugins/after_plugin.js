module.exports = class AfterSpikeWebpackPlugin {
  constructor (opts) {
    this.opts = opts
  }

  apply (compiler) {
    compiler.plugin('emit', (compilation, done) => {
      this.opts.emitter.emit('check', Object.keys(compilation.assets).includes('changed_output.html'))
      done()
    })
  }
}
