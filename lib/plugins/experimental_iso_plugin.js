const mm = require('micromatch')
const path = require('path')
const fs = require('fs')
const {addFilesAsWebpackEntries, removeAssets} = require('./plugin_utils')

module.exports = class ExperimentalIsoPlugin {

  /**
   * @constructor
   * @param {Object} opts - options for configuration
   * @param {String} opts.root - project root
   * @param {Array} opts.dumpDirs - directories to dump to public
   */
  constructor (opts) {
    this.opts = opts
    this.files = 'views/*.jade'
    this.tempFile = path.join(this.opts.root, 'node_modules/iso.js')
  }

  apply (compiler) {
    let jadeFiles

    compiler.plugin('make', (compilation, done) => {
      jadeFiles = compiler.options.spike.files.jade
      // get paths relative to root
      const filesRelative = jadeFiles.map((f) => {
        return f.replace(this.opts.root + '/', '')
      })
      // filter in files matching the user-defined matcher
      const matchingFiles = mm.match(filesRelative, this.files)

      // now we are going to build the link injector script
      let mod = ''

      // first, we require in all the matching jade files so that we have the
      // contents ready to inject if needed
      matchingFiles.map((f) => {
        mod += `exports.${path.basename(f, '.jade')} = require('./${f}')\n`
      })

      // now we add the script that matches link clicks to templates
      mod += `
        const links = querySelectorAll('a')
        links.map((l) => {
          l.onclick = (e) => {
            e.preventDefault()
            if (l.href.match(our files)) {
              document.innerHTML = template name
            } else {
              // proceed as usual
            }
          }
        })
      `

      // then we write it all as a temporary file to root
      fs.writeFileSync(this.tempFile, mod)

      // finally, we add that file as an entry to webpack so that it shows up
      addFilesAsWebpackEntries([this.tempFile], this.opts, compilation)
      done()
    })

    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('optimize-chunk-assets', (chunks, done) => {
        fs.unlinkSync(this.tempFile)
        removeAssets(compilation, [this.tempFile], this.opts, done)
      })
    })
  }

}
