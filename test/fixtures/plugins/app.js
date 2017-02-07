const TestPlugin = require('./plugin.js')

module.exports = {
  test: 'foo',
  ignore: ['app.js', 'plugin.js', 'after_plugin.js'],
  plugins: [new TestPlugin()]
}
