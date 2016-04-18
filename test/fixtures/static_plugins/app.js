import GladePlugin from './plugin.js'

export default {
  locals: { foo: 'bar' },
  ignore: ['plugin.js'],
  plugins: [new GladePlugin()]
}
