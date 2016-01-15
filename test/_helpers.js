import node_fs from 'fs'
import node_path from 'path'
import ava from 'ava'
import W from 'when'
import node from 'when/node'
import Roots from '..'

// export references to required modules and/or paths
export const fixtures_path = node_path.join(__dirname, 'fixtures')
export const fs = node.liftAll(node_fs)
export const test = ava
export const path = node_path
export const promisify = node.lift

/**
 * compiles a fixture into it's `public/` directory
 * @param  {Object} t - ava test helper for setting t.context props
 * @param  {String} name - the name of the fixture to compile
 * @return {Promise} - a promise for the compiled fixture and the path to
 *                     it's `public/` directory
 */
export function compileFixture (t, name) {
  let testPath = path.join(fixtures_path, name)
  let project = new Roots({ root: testPath })
  let publicPath = path.join(testPath, 'public')

  return W(project.compile()).then(res => { return {res, publicPath} })
}

