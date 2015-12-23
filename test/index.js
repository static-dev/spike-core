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

test.skip('dump dirs', async (t) => {
  let { publicPath } = await helpers.compileFixture(t, 'dump_dirs')
  let indexPath = path.join(publicPath, 'index.html')
  let indexPathExists = await promisedFs::helpers.exists(indexPath)
  let indexPathContents = await promisedFs.readFile(indexPath, 'utf8')
  t.ok(indexPathExists)
  t.is(indexPathContents, '\n<p>hello world!</p>')
})

test('ignores', async (t) => {
  let { publicPath } = await helpers.compileFixture(t, 'ignores')
  let indexPath = path.join(publicPath, 'index.html')
  let aboutPath = path.join(publicPath, 'about.html')
  let layoutPath = path.join(publicPath, 'layout.html')
  let indexPathExists = await promisedFs::helpers.exists(indexPath)
  let aboutPathExists = await promisedFs::helpers.exists(aboutPath)
  let layoutPathExists = await promisedFs::helpers.exists(layoutPath)
  t.ok(indexPathExists)
  t.ok(aboutPathExists)
  t.notOk(layoutPathExists)
})

test('locals', async (t) => {
  let { publicPath } = await helpers.compileFixture(t, 'locals')
  let indexPath = path.join(publicPath, 'index.html')
  let indexPathContents = await promisedFs.readFile(indexPath, 'utf8')
  t.is(indexPathContents, 'bar')
})
