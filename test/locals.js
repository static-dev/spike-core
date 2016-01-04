import {
  test,
  compileFixture,
  fs,
  path
} from './_helpers'

test('injects template locals', async (t) => {
  let { publicPath } = await compileFixture(t, 'locals')
  let contents = await fs.readFile(path.join(publicPath, 'index.html'), 'utf8')
  t.is(contents, 'bar')
})
