import node_fs from 'fs'
import node_path from 'path'
import ava from 'ava'
import When from 'when'
import node from 'when/node'
import Roots from '..'
import rimrafLib from 'rimraf'

// export references to required modules and/or paths
export const fixturesPath = node_path.join(__dirname, 'fixtures')
export const fs = node.liftAll(node_fs)
export const test = ava
export const path = node_path
export const rimraf = rimrafLib

/**
 * compiles a fixture into it's `public/` directory
 * @param  {Object} t - ava test helper for setting t.context props
 * @param  {String} name - the name of the fixture to compile
 * @return {Promise} - a promise for the compiled fixture and the path to
 *                     it's `public/` directory
 */
export function compileFixture (t, name, options = {}) {
  const testPath = path.join(fixturesPath, name)
  const project = new Roots(Object.assign(options, { root: testPath }))
  const publicPath = path.join(testPath, 'public')

  return When.promise(function (resolve, reject) {
    project.on('error', reject)
    project.on('compile', function (res) { resolve({res, publicPath}) })

    project.compile()
  })
}
