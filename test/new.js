import test from 'ava'
import Roots from '..'
import path from 'path'
import node from 'when/node'
import rimraf from 'rimraf'
import { fixturesPath } from './_helpers'

test('creates a new roots project', (t) => {
  const testPath = path.join(fixturesPath, 'new_test')
  return Roots.new({ root: testPath,
    locals: {
      name: 'test',
      description: 'test',
      github_username: 'test'
    }
  }).then((instance) => {
    t.is(instance.config.context, testPath)
  }).finally(() => {
    return node.call(rimraf, testPath)
  })
})
