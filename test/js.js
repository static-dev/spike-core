const test = require('ava')
const path = require('path')
const fs = require('fs')
const {compileFixture} = require('./_helpers')

test('works with es6 module imports', (t) => {
  return compileFixture(t, 'es_modules', { entry: { main: './index.js' } })
    .then(({res, publicPath}) => {
      const src = fs.readFileSync(path.join(publicPath, 'main.js'), 'utf8')
      t.regex(src, /__WEBPACK_IMPORTED_MODULE_0__doge__/)
      t.regex(src, /'wow'/)
    })
})
