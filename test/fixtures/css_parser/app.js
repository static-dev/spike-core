const sugarss = require('sugarss')

module.exports = {
  ignore: ['**/_*'],
  matchers: { css: '**/*.sss' },
  postcss: { parser: sugarss }
}
