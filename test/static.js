const test = require('ava')
const path = require('path')
const fs = require('fs')
const md5File = require('md5-file')
const {compileFixture, fixturesPath} = require('./_helpers')

test('static plugin copies over file with correct content', (t) => {
  return compileFixture(t, 'static').then(({publicPath}) => {
    const f1 = fs.readFileSync(path.join(publicPath, 'foo.wow'), 'utf8')
    const f2 = fs.readFileSync(path.join(publicPath, 'snargle/test.json'), 'utf8')
    const f3 = fs.readFileSync(path.join(publicPath, '.empty.f'), 'utf8')
    t.is(f1.trim(), 'hello there!', 'plain text not copied correctly')
    t.is(JSON.parse(f2).foo, 'bar', 'json not copied correctly')
    t.is(f3, '')

    const imgIn = md5File.sync(path.join(fixturesPath, 'static/doge.png'))
    const imgOut = md5File.sync(path.join(publicPath, 'doge.png'))
    t.is(imgIn, imgOut, 'image not copied correctly')
  })
})

test('static plugin ignores files processed by webpack plugins', (t) => {
  return compileFixture(t, 'static_plugins').then(({publicPath}) => {
    const f1 = fs.readFileSync(path.join(publicPath, 'foo.html'), 'utf8')
    const f2 = fs.readFileSync(path.join(publicPath, 'foo.spade'), 'utf8')
    const f3 = fs.readFileSync(path.join(publicPath, 'foo.glade'), 'utf8')
    t.is(f1.trim(), '<p>foo</p>')
    t.is(f2.trim(), 'p not processed by spike core')
    t.is(f3.trim(), 'Glade Air Freshener™ is a really cool product')
  })
})
