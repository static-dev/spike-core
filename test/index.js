import 'babel-core/register'
import path from 'path'
import fs from 'fs'
// import rimraf from 'rimraf'
import test from 'ava'
import helpers from './_helpers'

let promisedFs = helpers.promisifyAll(fs)

// test.afterEach.cb((t) => {
//   rimraf(t.context.publicPath, t.end)
// })

test('dump dirs', async (t) => {
  let { publicPath } = await helpers.compileFixture(t, 'dump_dirs')
  let indexPath = path.join(publicPath, 'index.html')
  let indexPathExists = await promisedFs::helpers.exists(indexPath)
  let indexPathContents = await promisedFs.readFile(indexPath, 'utf8')
  t.ok(indexPathExists)
  t.is(indexPathContents, '\n<p>hello world!</p>')
})

test('ignores', async (t) => {
  let { publicPath } = await helpers.compileFixture(t, 'ignores')
  let [index, about, layout] = await Promise.all(
    ['index', 'about', 'layout'].map(name => (
      promisedFs::helpers.exists(
        path.join(publicPath, `${name}.html`)
      )
    ))
  )
  t.ok(index)
  t.ok(about)
  t.notOk(layout)
})

test('locals', async (t) => {
  let { publicPath } = await helpers.compileFixture(t, 'locals')
  let indexPath = path.join(publicPath, 'index.html')
  let indexPathContents = await promisedFs.readFile(indexPath, 'utf8')
  t.is(indexPathContents, 'bar')
})
