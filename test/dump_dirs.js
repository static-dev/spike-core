import {
  test,
  compileFixture,
  fs,
  path,
  exists
} from './_helpers'

test('discards directories, but keeps the directory\'s files', async (t) => {
  let { publicPath } = await compileFixture(t, 'dump_dirs')
  let index = path.join(publicPath, 'index.html')
  let fileExists = await fs::exists(index)
  let contents = await fs.readFile(index, 'utf8')
  t.ok(fileExists)
  t.is(contents, '\n<p>hello world!</p>')
})
