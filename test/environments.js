const test = require('ava')
const {compileFixture} = require('./_helpers')

test('environment config parsed correctly', (t) => {
  return compileFixture(t, 'environments', { env: 'doge' }).then(({res}) => {
    t.truthy(res.stats.compilation.options.env1)
    t.truthy(res.stats.compilation.options.env2)
  })
})
