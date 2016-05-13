const test = require('ava')
const Spike = require('..')

test('config errors', (t) => {
  t.throws(() => { new Spike() }, // eslint-disable-line
    '[spike constructor] option "root" is required')
  t.throws(() => { new Spike({ root: 'foo', matchers: 'wow' }) }, // eslint-disable-line
    'ValidationError: child "matchers" fails because ["matchers" must be an object]')
  t.throws(() => { new Spike({ root: 'foo', matchers: { css: [1] } }) }, // eslint-disable-line
    'ValidationError: child "matchers" fails because [child "css" fails because ["css" must be a string]]')
  t.throws(() => { new Spike({ root: 'foo', postcss: function () {} }) }, // eslint-disable-line
    'ValidationError: child "postcss" fails because ["postcss" must be an object]')
  t.throws(() => { new Spike({ root: 'foo', babelConfig: 'wow' }) }, // eslint-disable-line
    'ValidationError: child "babelConfig" fails because ["babelConfig" must be an object]')
  t.throws(() => { new Spike({ root: 'foo', entry: ['foo', 'bar'] }) }, // eslint-disable-line
    'ValidationError: child "entry" fails because ["entry" must be an object]')
})
