const test = require('ava')
const Spike = require('..')

test('config errors', (t) => {
  t.throws(() => { new Spike() }, // eslint-disable-line
    '[spike constructor] option "root" is required')
  t.throws(() => { new Spike({ root: 'foo', matchers: 'wow' }) }, // eslint-disable-line
    'ValidationError: child "matchers" fails because ["matchers" must be an object]')
  t.throws(() => { new Spike({ root: 'foo', matchers: { css: [1] } }) }, // eslint-disable-line
    'ValidationError: child "matchers" fails because [child "css" fails because ["css" must be a string]]')
  t.throws(() => { new Spike({ root: 'foo', postcss: 8 }) }, // eslint-disable-line
    'ValidationError: child "postcss" fails because ["postcss" must be an object, "postcss" must be a Function]')
  t.throws(() => { new Spike({ root: 'foo', babel: 'wow' }) }, // eslint-disable-line
    'ValidationError: child "babel" fails because ["babel" must be an object]')
  t.throws(() => { new Spike({ root: 'foo', entry: ['foo', 'bar'] }) }, // eslint-disable-line
    'ValidationError: child "entry" fails because ["entry" must be an object]')
  t.throws(() => { new Spike({ root: 'foo', server: {server: false} }) }, // eslint-disable-line
    'ValidationError: child "server" fails because [child "server" fails because ["server" must be an object]]')
  t.throws(() => { new Spike({ root: 'foo', server: {server: {}, proxy: 'http://localhost:1234/'} }) }, // eslint-disable-line
    'ValidationError: child "server" fails because [child "server" fails because ["server" must be one of [false]]]')
})
