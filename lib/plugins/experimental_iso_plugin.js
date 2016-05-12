const mm = require('micromatch')
const path = require('path')
const fs = require('fs')
const {
  addFilesAsWebpackEntries,
  removeAssets,
  getOutputPath
} = require('./plugin_utils')

module.exports = class ExperimentalIsoPlugin {

  /**
   * @constructor
   * @param {Object} opts - options for configuration
   * @param {String} opts.root - project root
   * @param {Array} opts.dumpDirs - directories to dump to public
   */
  constructor (opts) {
    this.opts = opts
    this.files = opts.iso
    if (opts.iso === true) this.files = '**/*.jade'
    // tempfile written to node_modules so the require path is easy
    this.tempFile = path.join(this.opts.root, 'node_modules/iso.js')
  }

  apply (compiler) {
    let jadeFiles

    compiler.plugin('make', (compilation, done) => {
      jadeFiles = compiler.options.spike.files.jade

      // filter in files matching the user-defined matcher
      const matchingFiles = jadeFiles.filter((f) => {
        return mm.isMatch(f.replace(`${this.opts.root}/`, ''), this.files)
      })

      // now we are going to build the link injector script
      let mod = ''

      // first, we require in all the matching jade files so that we have the
      // contents ready to inject if needed
      matchingFiles.forEach((f) => {
        mod += `exports['${getOutputPath(f, this.opts).replace(/\.jade/, '')}'] = require('../${f.replace(`${this.opts.root}/`, '')}')\n`
      })

      // now we add the script that matches link clicks to templates
      // TODO: make this a little cleaner, ensure it's being compiled by babel
      mod += `
        const links = document.querySelectorAll('a')

        window.onpopstate = function (e) {
					console.log(e.target.location.pathname)
					matchedTpl = getTemplate(e.target.location.pathname)
					if (matchedTpl) {
						document.write(matchedTpl)
						document.close()
					} else {
						console.error('flagrant error! call in the devs!')
					}
				}

        for (let i = 0; i < links.length; i++) {
          const el = links[i]
          el.onclick = (e) => {
            e.preventDefault()
            const parser = document.createElement('a')
            parser.href = el.href
            matchedTpl = getTemplate(el.pathname)
            if (matchedTpl) {
              document.write(matchedTpl)
							document.close()
							history.pushState({}, '', el.href)
            } else {
              window.location = el.href
            }
          }
        }

        function getTemplate(href) {
          let hrefPath = href
					if (href[href.length-1] === '/') { hrefPath = href + 'index.html' }
          hrefPath = hrefPath.substring(1).replace(/.html$/, '')
          return exports[hrefPath]
        }
      `
      // then we write it all as a temporary file
      fs.writeFileSync(this.tempFile, mod)

      // finally, we add that file as an entry to webpack so that it shows up
      addFilesAsWebpackEntries([this.tempFile], this.opts, compilation)
      done()
    })

    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('optimize-chunk-assets', (chunks, done) => {
        // once everything has been compiled, we remove the temp file
        fs.unlinkSync(this.tempFile)
        removeAssets(compilation, [this.tempFile], this.opts, done)
      })
    })
  }

}
