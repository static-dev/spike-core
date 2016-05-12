const Spike = require('..')
const path = require('path')
const test = require('ava')
const {fs, compileFixture, fixturesPath} = require('./_helpers')

test.before((t) => {
  return compileFixture(t, 'clean')
    .then(({publicPath}) => { return path.join(publicPath, 'index.html') })
    .tap((index) => { return fs.stat(index).tap(t.truthy.bind(t)) })
    .then((index) => { return fs.readFile(index, 'utf8') })
    .then((contents) => { return t.is(contents, '\n<p>override</p>') })
})

test.cb('emits clean message correctly', (t) => {
  const project = new Spike({ root: path.join(fixturesPath, 'clean') })

  project.on('error', t.end)
  project.on('remove', (msg) => {
    t.truthy(msg.toString().match(/cleaned output directory/))
    t.end()
  })

  project.clean()
})
