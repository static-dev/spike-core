import 'babel-core/register'
import path from 'path'
// import rimraf from 'rimraf'
import test from 'ava'
import { promisifyAll, compileFixture, exists } from './_helpers'

const fs = promisifyAll(require('fs'))

// test.afterEach.cb((t) => {
//   rimraf(t.context.publicPath, t.end)
// })

test('dump dirs', async (t) => {
  let { publicPath } = await compileFixture(t, 'dump_dirs')
  let index = path.join(publicPath, 'index.html')
  let exists = await fs::exists(index)
  let contents = await fs.readFile(index, 'utf8')
  t.ok(exists)
  t.is(contents, '\n<p>hello world!</p>')
})

test('ignores', async (t) => {
  let { publicPath } = await compileFixture(t, 'ignores')
  let [index, about, layout] = await Promise.all(
    ['index', 'about', 'layout'].map(name => (
      fs::exists(path.join(publicPath, `${name}.html`))
    ))
  )
  t.ok(index)
  t.ok(about)
  t.notOk(layout)
})

test('locals', async (t) => {
  let { publicPath } = await compileFixture(t, 'locals')
  let contents = await fs.readFile(path.join(publicPath, 'index.html'), 'utf8')
  t.is(contents, 'bar')
})
