import {
  test,
  compileFixture,
  fs,
  path
} from './_helpers'

test('properly compiles css', async (t) => {
  let { publicPath } = await compileFixture(t, 'css')
  let contents = await fs.readFile(path.join(publicPath, 'foo.html'), 'utf8')
  t.is(contents, '\n<p>foobar</p>')
  // TODO: add check for main.css and ensure it's been processed w/ postcss
})
