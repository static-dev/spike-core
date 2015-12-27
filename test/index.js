import 'babel-core/register'
import path from 'path'
import fs from 'fs'
import test from 'ava'
import helpers from './_helpers'
import Roots from '..'
// import rimraf from 'rimraf'

// const fixtures = path.join(__dirname, 'fixtures')

// test.afterEach.cb((t) => {
//   rimraf(t.context.publicPath, t.end)
// })

test('dump dirs', t => {
  return helpers.compileFixture(t, 'dump_dirs').then((res) => {
    let indexPath = path.join(res.publicPath, 'index.html')
    t.ok(fs.existsSync(indexPath))
    t.is(fs.readFileSync(indexPath, 'utf8'), '\n<p>hello world!</p>')
  })
})

test('ignores', t => {
  return helpers.compileFixture(t, 'ignores').then((res, publicPath) => {
    let indexPath = path.join(res.publicPath, 'index.html')
    let aboutPath = path.join(res.publicPath, 'about.html')
    let layoutPath = path.join(res.publicPath, 'layout.html')

    t.ok(fs.existsSync(indexPath))
    t.ok(fs.existsSync(aboutPath))
    t.notOk(fs.existsSync(layoutPath))
  })
})

test('locals', t => {
  return helpers.compileFixture(t, 'locals').then((res, publicPath) => {
    let indexPath = path.join(res.publicPath, 'index.html')
    t.is(fs.readFileSync(indexPath, 'utf8'), 'bar')
  })
})

test('config errors', t => {
  t.throws((() => { new Roots() }), 'ValidationError: child "root" fails because ["root" is required]') // eslint-disable-line
  t.throws( (() => { new Roots({ root: 'foo', matchers: 'wow' }) }), 'ValidationError: child "matchers" fails because ["matchers" must be an object]') // eslint-disable-line
})

test.skip('css', (t) => {
  return helpers.compileFixture(t, 'css').then((res, publicPath) => {
    console.log(res)
  })
})
