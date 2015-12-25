import 'babel-core/register'
import path from 'path'
import test from 'ava'
import { promisifyAll, compileFixture, exists } from './_helpers'
const fs = promisifyAll(require('fs'))

test('discards directories, but keeps the directories files', async (t) => {
  let { publicPath } = await compileFixture(t, 'dump_dirs')
  let index = path.join(publicPath, 'index.html')
  let fileExists = await fs::exists(index)
  let contents = await fs.readFile(index, 'utf8')
  t.ok(fileExists)
  t.is(contents, '\n<p>hello world!</p>')
})
