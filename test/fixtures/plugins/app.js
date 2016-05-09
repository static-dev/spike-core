const TestPlugin = require('./plugin.js')

module.exports = {
  locals: { foo: 'bar' },
  ignore: ['app.js', 'plugin.js'],
  plugins: [new TestPlugin()]
}
