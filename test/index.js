import 'babel-core/register'
import path from 'path'
import fs from 'fs'
import rimraf from 'rimraf'
import test from 'ava'
import helpers from './_helpers'

// test.afterEach.cb((t) => {
//   rimraf(t.context.publicPath, t.end)
// })

// test('dump dirs', (t) => {
//   return helpers.compileFixture(t, 'dump_dirs').then((res) => {
//     let indexPath = path.join(res.publicPath, 'index.html')
//     t.ok(fs.existsSync(indexPath))
//     t.is(fs.readFileSync(indexPath, 'utf8'), '\n<p>hello world!</p>')
//   })
// })
//
// test('ignores', (t) => {
//   return helpers.compileFixture(t, 'ignores').then((res, publicPath) => {
//     let indexPath = path.join(res.publicPath, 'index.html')
//     let aboutPath = path.join(res.publicPath, 'about.html')
//     let layoutPath = path.join(res.publicPath, 'layout.html')
//
//     t.ok(fs.existsSync(indexPath))
//     t.ok(fs.existsSync(aboutPath))
//     t.notOk(fs.existsSync(layoutPath))
//   })
// })

test('locals', (t) => {
  return helpers.compileFixture(t, 'locals').then((res, publicPath) => {
    let indexPath = path.join(res.publicPath, 'index.html')
    t.is(fs.readFileSync(indexPath, 'utf8'), 'bar')
  })
})
