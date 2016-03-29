import test from 'ava'
import Roots from '..'
import path from 'path'
import { fixturesPath } from './_helpers'

test('creates a new roots project', (t) => {
  return Roots.new({ root: path.join(fixturesPath, 'new_test'),
    locals: {
      name: 'test',
      description: 'test',
      github_username: 'test'
    }
  })
})
