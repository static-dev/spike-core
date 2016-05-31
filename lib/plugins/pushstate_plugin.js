const mm = require('micromatch')
const path = require('path')
const fs = require('fs')

module.exports = class PushStatePlugin {

  /**
   * @constructor
   * @param {Object} opts - options for configuration
   * @param {String} opts.root - project root
   * @param {Array} opts.dumpDirs - directories to dump to public
   */
  constructor (util) {
    this.util = util
    this.files = util.conf.spike.pushState
    if (this.files === true) this.files = '**/*.jade'
    // tempfile written to node_modules so the require path is easy
    this.tempFile = path.join(this.util.conf.context, 'node_modules/spike-pushstate.js')
  }

  apply (compiler) {
    if (!this.files) return

    compiler.plugin('make', (compilation, done) => {
      const jadeFiles = compiler.options.spike.files.jade

      // filter in files matching the user-defined matcher
      const matchingFiles = jadeFiles.filter((f) => {
        return mm.isMatch(f.replace(`${this.util.conf.context}/`, ''), this.files)
      })

      // now we are going to build the link injector script
      let mod = ''

      // first, we require in all the matching jade files so that we have the
      // contents ready to inject if needed
      matchingFiles.forEach((f) => {
        mod += `exports['${this.util.getOutputPath(f).replace(/\.jade/, '')}'] = require('../${f.replace(`${this.util.conf.context}/`, '')}')\n`
      })

      // now we add the script that matches link clicks to templates
      // TODO: make this a little cleaner, ensure it's being compiled by babel
      mod += `
        if (window.history) {
          var links = document.querySelectorAll('a')

          window.onpopstate = function (e) {
  					matchedTpl = getTemplate(e.target.location.pathname)
  					if (matchedTpl) {
  						document.write(matchedTpl)
  						document.close()
  					} else {
  						window.location = t.target.location
  					}
  				}

          for (let i = 0; i < links.length; i++) {
            var el = links[i]
            el.onclick = function (e) {
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
        }
      `
      // then we write it all as a temporary file
      fs.writeFileSync(this.tempFile, mod)

      // finally, we add that file as an entry to webpack so that it shows up
      this.util.addFilesAsWebpackEntries(compilation, [this.tempFile])
      done()
    })

    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('optimize-chunk-assets', (chunks, done) => {
        // once everything has been compiled, we remove the temp file
        fs.unlinkSync(this.tempFile)
        this.util.removeAssets(compilation, [this.tempFile])
        done()
      })
    })
  }

}
