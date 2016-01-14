import {
  test,
  compileFixture,
  fs,
  path,
  exists
} from './_helpers'

test('css plugin works', async (t) => {
  let { publicPath } = await compileFixture(t, 'css')
  let main = path.join(publicPath, 'main.css')
  let fileExists = await fs::exists(main)
  t.ok(fileExists)
})
