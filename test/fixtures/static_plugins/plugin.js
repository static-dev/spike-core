module.exports = class GladePlugin {
  constructor (opts) {
    this.opts = opts
  }

  apply (compiler) {
    compiler.plugin('emit', function (compilation, done) {
      const staticFiles = compiler.options.spike.files.static
      const gladeFiles = staticFiles.filter((f) => f.match(/\.glade$/))
      gladeFiles.forEach((f) => {
        const dep = compilation.modules.find((el) => {
          if (el.userRequest === f) { return el }
        })
        let src = String(dep.assets['foo.glade']._value)
        src = src.replace(/glade/, 'Glade Air Freshener™')
        dep.assets['foo.glade']._value = Buffer(src)
      })
      done()
    })
  }
}
