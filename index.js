import JadePlugin from './lib/plugins/jade_plugin.js'
import _ from 'lodash'

module.exports = function (opts) {
  if (!opts) { opts = {} }
  let spec = { plugins: [new JadePlugin()] }
  let out = _.defaults(spec, opts)

  return out
}
