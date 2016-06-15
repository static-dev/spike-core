const sugarss = require('sugarss')
const postcssImport = require('postcss-import')

module.exports = {
  ignore: ['**/_*'],
  matchers: { css: '**/*.sss' },
  postcss: (wp) => {
    return {
      parser: sugarss,
      plugins: [postcssImport({ addDependencyTo: wp })]
    }
  }
}
