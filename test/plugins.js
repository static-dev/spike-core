const test = require('ava')
const path = require('path')
const {compileFixture, fs} = require('./_helpers')

test('compiles a project with a custom plugin, plugins can change output path', (t) => {
  return compileFixture(t, 'plugins')
    .then(({res, publicPath}) => {
      const index = path.join(publicPath, 'index.html')
      const outputChanged = path.join(publicPath, 'changed_output.html')
      fs.statSync(index)
      fs.statSync(outputChanged)
      t.truthy(res.stats.compilation.options.test === 'bar')
    })
})
