import TestPlugin from './plugin.js'

export default {
  locals: {
    foo: 'bar'
  },
  ignore: ['app.js', 'plugin.js'],
  plugins: [
    new TestPlugin()
  ]
}
