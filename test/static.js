import fs from 'fs'
import path from 'path'
import { test, compileFixture } from './_helpers'

test('static plugin copies over file with correct content', (t) => {
  return compileFixture(t, 'static').then(({publicPath}) => {
    const f1 = fs.readFileSync(path.join(publicPath, 'foo.wow'), 'utf8')
    const f2 = fs.readFileSync(path.join(publicPath, 'snargle/test.json'), 'utf8')
    t.is(f1.trim(), 'hello there!')
    t.is(JSON.parse(f2).foo, 'bar')
  })
})

test('static plugin ignores files processed by webpack plugins', (t) => {
  return compileFixture(t, 'static_plugins').then(({publicPath}) => {
    const f1 = fs.readFileSync(path.join(publicPath, 'foo.html'), 'utf8')
    const f2 = fs.readFileSync(path.join(publicPath, 'foo.spade'), 'utf8')
    const f3 = fs.readFileSync(path.join(publicPath, 'foo.glade'), 'utf8')
    t.is(f1.trim(), '<p>bar</p>')
    t.is(f2.trim(), 'p not processed by roots core')
    t.is(f3.trim(), 'Glade Air Freshener™ is a really cool product')
  })
})
