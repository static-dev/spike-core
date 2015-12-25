import 'babel-core/register'
import test from 'ava'
import Roots from '..'

test('config errors', t => {
  t.throws(() => { new Roots() }, 'ValidationError: child "root" fails because ["root" is required]') // eslint-disable-line
  t.throws(() => { new Roots({ root: 'foo', matchers: 'wow' }) }, 'ValidationError: child "matchers" fails because ["matchers" must be an object]') // eslint-disable-line
  t.throws(() => { new Roots({ root: 'foo', matchers: { css: [1] } }) }, 'ValidationError: child "matchers" fails because [child "css" fails because ["css" must be a string]]') // eslint-disable-line
  t.throws(() => { new Roots({ root: 'foo', postCssPlugins: function () {} }) }, 'ValidationError: child "postCssPlugins" fails because ["postCssPlugins" must be an array]') // eslint-disable-line
  t.throws(() => { new Roots({ root: 'foo', babelConfig: 'wow' }) }, 'ValidationError: child "babelConfig" fails because ["babelConfig" must be an object]') // eslint-disable-line
  t.throws(() => { new Roots({ root: 'foo', bundleName: ['foo', 'bar'] }) }, 'ValidationError: child "bundleName" fails because ["bundleName" must be a string]') // eslint-disable-line
})
