import fs from 'fs'
import path from 'path'
import { test, compileFixture } from './_helpers'

test('environment config parsed correctly', (t) => {
  return compileFixture(t, 'environments', { env: 'doge' }).then(({publicPath}) => {
    const src = fs.readFileSync(path.join(publicPath, 'index.html'), 'utf8')
    t.is(src.trim(), '<p>true+true</p>')
  })
})
