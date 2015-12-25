import 'babel-core/register'
import path from 'path'
import test from 'ava'
import { promisifyAll, compileFixture } from './_helpers'
const fs = promisifyAll(require('fs'))

test('injects template locals', async (t) => {
  let { publicPath } = await compileFixture(t, 'locals')
  let contents = await fs.readFile(path.join(publicPath, 'index.html'), 'utf8')
  t.is(contents, 'bar')
})
