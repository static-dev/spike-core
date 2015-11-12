import webpack from 'webpack'
import path from 'path'
import chai from 'chai'

// configure chai
chai.should()
chai.use(require('chai-fs'))

// the base fixtures path
let fixturesPath = path.join(__dirname, './fixtures')

describe('jade', function () {
  let jadePath

  before(function () {
    jadePath = path.join(fixturesPath, 'jade')
  })

  it.skip('runs a dry test', function () {
    require(path.join(jadePath, 'app.js'))
  })

  it('compiles the jade to a static file', function (done) {
    let config = require(path.join(jadePath, 'app.js'))
    webpack(config, function (err, stats) {
      if (err) return done(err)
      if (stats.hasErrors()) return done(new Error(stats.toString()))

      let bundleFile = path.join(config.output.path, 'bundle.js')
      let indexFile = path.join(config.output.path, 'index.html')

      bundleFile.should.be.a.file()
      // will fail until /lib/plugins/jade_plugin.js is working
      indexFile.should.be.a.file()
      done()
    })
  })
})
