import {
  test,
  compileFixture,
  fs,
  path,
  exists,
  map
} from './_helpers'

test('does not compile ignored files', async (t) => {
  let { publicPath } = await compileFixture(t, 'ignores')
  let [
    index,
    about,
    layout
  ] = await Promise::map(['index', 'about', 'layout'], name => {
    return fs::exists(path.join(publicPath, `${name}.html`))
  })
  t.ok(index)
  t.ok(about)
  t.notOk(layout)
})
