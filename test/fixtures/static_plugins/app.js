const GladePlugin = require('./plugin.js')

module.exports = {
  ignore: ['plugin.js'],
  plugins: [new GladePlugin()]
}
