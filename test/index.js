import 'babel-core/register'
import path from 'path'
// import rimraf from 'rimraf'
import test from 'ava'
import helpers from './_helpers'
import Roots from '..'

import { promisifyAll, compileFixture, exists } from './_helpers'

const fs = promisifyAll(require('fs'))

// test.afterEach.cb((t) => {
//   rimraf(t.context.publicPath, t.end)
// })

test('dump dirs', async (t) => {
  let { publicPath } = await compileFixture(t, 'dump_dirs')
  let index = path.join(publicPath, 'index.html')
  let exists = await fs::exists(index)
  let contents = await fs.readFile(index, 'utf8')
  t.ok(exists)
  t.is(contents, '\n<p>hello world!</p>')
})

test('ignores', async (t) => {
  let { publicPath } = await compileFixture(t, 'ignores')
  let [index, about, layout] = await Promise.all(
    ['index', 'about', 'layout'].map(name => (
      fs::exists(path.join(publicPath, `${name}.html`))
    ))
  )
  t.ok(index)
  t.ok(about)
  t.notOk(layout)
})

test('locals', async (t) => {
  let { publicPath } = await compileFixture(t, 'locals')
  let contents = await fs.readFile(path.join(publicPath, 'index.html'), 'utf8')
  t.is(contents, 'bar')
})

test('config errors', t => {
  t.throws(() => { new Roots() }, 'ValidationError: child "root" fails because ["root" is required]') // eslint-disable-line
  t.throws(() => { new Roots({ root: 'foo', matchers: 'wow' }) }, 'ValidationError: child "matchers" fails because ["matchers" must be an object]') // eslint-disable-line
  t.throws(() => { new Roots({ root: 'foo', matchers: { css: [1] } }) }, 'ValidationError: child "matchers" fails because [child "css" fails because ["css" must be a string]]') // eslint-disable-line
  t.throws(() => { new Roots({ root: 'foo', postCssPlugins: function () {} }) }, 'ValidationError: child "postCssPlugins" fails because ["postCssPlugins" must be an array]') // eslint-disable-line
  t.throws(() => { new Roots({ root: 'foo', babelConfig: 'wow' }) }, 'ValidationError: child "babelConfig" fails because ["babelConfig" must be an object]') // eslint-disable-line
  t.throws(() => { new Roots({ root: 'foo', bundleName: ['foo', 'bar'] }) }, 'ValidationError: child "bundleName" fails because ["bundleName" must be a string]') // eslint-disable-line
})

test.skip('css', (t) => {
  return helpers.compileFixture(t, 'css').then((res, publicPath) => {
    console.log(res)
  })
})
