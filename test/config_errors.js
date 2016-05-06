const test = require('ava')
const Roots = require('..')

test('config errors', (t) => {
  t.throws(() => { new Roots() }, // eslint-disable-line
    'a "root" is required')
  t.throws(() => { new Roots({ root: 'foo', matchers: 'wow' }) }, // eslint-disable-line
    'ValidationError: child "matchers" fails because ["matchers" must be an object]')
  t.throws(() => { new Roots({ root: 'foo', matchers: { css: [1] } }) }, // eslint-disable-line
    'ValidationError: child "matchers" fails because [child "css" fails because ["css" must be a string]]')
  t.throws(() => { new Roots({ root: 'foo', postcss: function () {} }) }, // eslint-disable-line
    'ValidationError: child "postcss" fails because ["postcss" must be an object]')
  t.throws(() => { new Roots({ root: 'foo', babelConfig: 'wow' }) }, // eslint-disable-line
    'ValidationError: child "babelConfig" fails because ["babelConfig" must be an object]')
  t.throws(() => { new Roots({ root: 'foo', entry: ['foo', 'bar'] }) }, // eslint-disable-line
    'ValidationError: child "entry" fails because ["entry" must be an object]')
})
