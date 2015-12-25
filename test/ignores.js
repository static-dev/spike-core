import 'babel-core/register'
import path from 'path'
import test from 'ava'
import { promisifyAll, compileFixture, exists } from './_helpers'
const fs = promisifyAll(require('fs'))

test('does not compile ignored directories', async (t) => {
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
