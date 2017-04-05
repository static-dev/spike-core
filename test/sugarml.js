const test = require('ava')
const path = require('path')
const fs = require('fs')
const sugarml = require('sugarml')
const {compileFixture} = require('./_helpers')

test('works with sugarml parser', (t) => {
  return compileFixture(t, 'sugarml', {
    matchers: { html: '*(**/)*.sgr' },
    reshape: {
      parser: sugarml,
      filename: (ctx) => ctx.resourcePath,
      locals: {}
    }
  }).then(({res, publicPath}) => {
    const index = fs.readFileSync(path.join(publicPath, 'index.html'), 'utf8')
    t.truthy(index === '<!DOCTYPE html><head><title>wowowowowowoowowowooooowowowowowwwwowoowowowow</title><link href="style.css"></head><body><img src="image.jpg"><p>oh hello!</p><script src="script.js"></script></body>')
  })
})
