const GladePlugin = require('./plugin.js')

module.exports = {
  locals: { foo: 'bar' },
  ignore: ['plugin.js'],
  plugins: [new GladePlugin()]
}
