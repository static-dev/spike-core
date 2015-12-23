import 'babel-core/register'

import path from 'path'
import fs from 'fs'
import rimraf from 'rimraf'
import test from 'ava'
import Roots from '..'

const fixtures = path.join(__dirname, 'fixtures')

test.afterEach.cb((t) => {
  rimraf(t.context.publicPath, t.end)
})

test('dump dirs', (t) => {
  let testPath = path.join(fixtures, 'dump_dirs')
  let publicPath = t.context.publicPath = path.join(testPath, 'public')
  let project = new Roots({ root: testPath })

  return project.compile().then((res) => {
    let indexPath = path.join(publicPath, 'index.html')
    // index.jade is in the resulting modules
    t.ok(Object.keys(res.compilation._modules)[1].match(/dump_dirs\/views\/index\.jade/))
    // `public/index.html` exists
    t.ok(fs.existsSync(indexPath))
    // `public/index.html` has the correct html
    t.is(fs.readFileSync(indexPath, 'utf8'), '\n<p>hello world!</p>')
  })
})
