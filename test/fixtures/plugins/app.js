import TestPlugin from './plugin.js'

export default {
  locals: {
    foo: 'bar'
  },
  plugins: [
    new TestPlugin()
  ]
}
