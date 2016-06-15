const test = require('ava')
const path = require('path')
const colorGray = require('postcss-color-gray')
const {compileFixture, fs} = require('./_helpers')

test('css files are compiled correctly', (t) => {
  return compileFixture(t, 'css')
    .then(({publicPath}) => { return path.join(publicPath, 'main.css') })
    .tap((base) => { return fs.stat(base).tap(t.truthy.bind(t)) })
    .then((base) => { return fs.readFile(base, 'utf8') })
    .then((contents) => { return t.regex(contents, /color: pink/) })
})

test('css works with postcss plugins', (t) => {
  return compileFixture(t, 'css_plugin', {
    postcss: { plugins: [colorGray()] }
  }).then(({publicPath}) => { return path.join(publicPath, 'main.css') })
    .tap((base) => { return fs.stat(base).tap(t.truthy.bind(t)) })
    .then((base) => { return fs.readFile(base, 'utf8') })
    .then((contents) => { return t.regex(contents, /color: rgb\(50, 50, 50\)/) })
})

test('css works with alternate parser', (t) => {
  return compileFixture(t, 'css_parser')
    .then(({publicPath}) => { return path.join(publicPath, 'main.css') })
    .tap((index) => { return fs.stat(index).tap(t.truthy.bind(t)) })
    .then((index) => { return fs.readFile(index, 'utf8') })
    .then((contents) => { return t.regex(contents, /background: blue/) })
})
