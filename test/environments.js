const test = require('ava')
const {compileFixture} = require('./_helpers')

test('environment config parsed correctly', (t) => {
  return compileFixture(t, 'environments', { env: 'doge' }).then(({res}) => {
    t.is(res.stats.compilation.options.entry.doge1[0], 'doge')
    t.is(res.stats.compilation.options.entry.doge2[0], 'very')
    t.is(res.stats.compilation.options.entry.doge3[0], 'amaze')
    t.is(res.stats.compilation.options.entry.doge4[0], 'doge')
  })
})
