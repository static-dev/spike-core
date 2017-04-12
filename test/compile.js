const Spike = require('..')
const test = require('ava')
const path = require('path')
const sugarml = require('sugarml')
const {fixturesPath, compileFixture} = require('./_helpers')

test('emits compile errors correctly', (t) => {
  return compileFixture(t, 'compile_error', {
    matchers: { html: '*(**/)*.sgr' },
    reshape: {
      parser: sugarml,
      filename: (ctx) => ctx.resourcePath,
      locals: {}
    }
  }).catch((err) => {
    t.truthy(err.message.toString().match(/Cannot parse character "<"/))
  })
})

test.cb('emits compile warnings correctly', (t) => {
  const project = new Spike({ root: path.join(fixturesPath, 'css') })

  project.on('error', t.end)
  project.on('warning', (msg) => {
    t.truthy(msg.toString().match(/Error: Can't resolve '.\/assets\/js\/index\.js'/))
    t.end()
  })

  project.compile()
})

test.skip('emits webpack warnings correctly', (t) => {
  console.log('need to be able to generate a webpack warning for this test')
})
