import Roots from '..'
import {
  test,
  compileFixture,
  fixturesPath,
  path
} from './_helpers'

test('emits compile errors correctly', (t) => {
  return compileFixture(t, 'compile_error').catch((err) => {
    t.truthy(err.message.toString().match(/no closing bracket found/))
  })
})

test.cb('emits compile warnings correctly', (t) => {
  const project = new Roots({ root: path.join(fixturesPath, 'css') })

  project.on('error', t.end)
  project.on('warning', (msg) => {
    t.truthy(msg.toString().match(/Cannot resolve 'file' or 'directory' \.\/assets\/js\/index\.js/))
    t.end()
  })

  project.compile()
})

test.skip('emits webpack warnings correctly', (t) => {
  console.log('need to be able to generate a webpack warning for this test')
})
