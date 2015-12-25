import path from 'path'
import Roots from '..'

const fixtures = path.join(__dirname, 'fixtures')

/**
 * compiles a fixture into it's `public/` directory
 * @param  {Object} t - ava test helper for setting t.context props
 * @param  {String} name - the name of the fixture to compile
 * @return {Promise} - a promise for the compiled fixture and the path to
 *                     it's `public/` directory
 */
async function compileFixture (t, name) {
  let testPath = path.join(fixtures, name)
  let project = new Roots({ root: testPath })
  let publicPath = path.join(testPath, 'public')
  let res = await project.compile()
  return { res, publicPath }
}

/**
 * converts a function that accepts a node-style callback
 * into a function that returns a promise
 * @param  {Function} original - the function to convert
 * @return {Function} the promisified function
 * @example
 * let readFile = promisify(fs.readFile)
 * readFile(file).then(...)
 */
function promisify (original) {
  return (...args) => {
    return new Promise((resolve, reject) => {
      args.push((...args) => {
        const error = args.shift()
        if (error) return reject(error)
        resolve(args.length > 1 ? args : args[0])
      })
      original(...args)
    })
  }
}

/**
 * Converts an object of node-style async methods
 * into an interface who's methods return promises
 * @param  {Object} target - the API to convert
 * @return {Object} - the promisified interface
 * @example
 * let fs = promisifyAll(require('fs'))
 * fs.readFile(file).then(...)
 */
function promisifyAll (target) {
  return Object.keys(target).reduce((promisified, key) => {
    const method = target[key]
    promisified[key] = typeof method === 'function'
      ? promisify(target::method)
      : method
    return promisified
  }, {})
}

/**
 * asynchronous wrapper around fs.stat that
 * detects if a file found at `path` exists or not
 * @this   {Object} - promisified `fs` module
 * @param  {String} path - the path to the file
 * @return {Promise} - resolves to true if file exists
 *                     else resolves to false
 * @example
 * let fs = promisifyAll(require('fs'))
 * fs::exists(file).then(...)
 */
async function exists (path) {
  try {
    await this.stat(path)
    return true
  } catch (e) {
    return false
  }
}

export default {
  compileFixture,
  promisify,
  promisifyAll,
  exists
}
