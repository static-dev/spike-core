const nodeFs = require('fs')
const path = require('path')
const When = require('when')
const node = require('when/node')
const Spike = require('..')

// export references to required modules and/or paths
const fixturesPath = exports.fixturesPath = path.join(__dirname, 'fixtures')
exports.fs = node.liftAll(nodeFs)

/**
 * compiles a fixture into it's `public/` directory
 * @param  {Object} t - ava test helper for setting t.context props
 * @param  {String} name - the name of the fixture to compile
 * @return {Promise} - a promise for the compiled fixture and the path to
 *                     it's `public/` directory
 */
exports.compileFixture = function compileFixture (t, name, options = {}) {
  const testPath = path.join(fixturesPath, name)
  const project = new Spike(Object.assign(options, { root: testPath }))
  const publicPath = path.join(testPath, 'public')

  return When.promise(function (resolve, reject) {
    project.on('error', reject)
    project.on('compile', function (res) { resolve({res, publicPath}) })

    project.compile()
  })
}
