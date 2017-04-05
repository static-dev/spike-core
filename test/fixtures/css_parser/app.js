const postcssImport = require('postcss-import')

module.exports = {
  ignore: ['**/_*'],
  matchers: { css: '*(**/)*.sss' },
  postcss: {
    parser: 'sugarss', // TODO: this shouldnt work like this
    plugins: [postcssImport()]
  }
}
