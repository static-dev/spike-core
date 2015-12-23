import path from 'path'
import webpack from 'webpack'
import config from './webpack_config'

export default class Roots {
  constructor (opts = {}) {
    this.opts = opts
  }

  compile () {
    config.context = this.opts.root
    config.output.path = path.join(this.opts.root, 'public')

    return new Promise((resolve, reject) => {
      webpack(config, (err, stats) => {
        if (err) { return reject(err) }
        return resolve(stats)
      })
    })
  }
}
