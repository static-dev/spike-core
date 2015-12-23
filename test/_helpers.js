import 'babel-core/register'
import path from 'path'
import Roots from '..'

const fixtures = path.join(__dirname, 'fixtures')

async function compileFixture (t, name) {
  let testPath = path.join(fixtures, name)
  let project = new Roots({ root: testPath })
  let publicPath = path.join(testPath, 'public')
  let res = await project.compile()
  return { res, publicPath }
}

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

function promisifyAll (target) {
  return Object.keys(target).reduce((promisified, key) => {
    const value = target[key]
    if (typeof value === 'function') {
      promisified[key] = promisify(value)
    } else {
      promisified[key] = value
    }
    return promisified
  }, {})
}

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
