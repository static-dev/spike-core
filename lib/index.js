import path from 'path'
import webpack from 'webpack'
import config from './config'

export default class Roots {
  constructor (opts = {}) {
    this.opts = opts
  }

  compile () {
    config.context = this.opts.root
    config.output.path = path.join(this.opts.root, 'public')
    // perhaps config should just be merged with the default, with
    // a couple exceptions and extras

    return new Promise((resolve, reject) => {
      webpack(config, (err, stats) => {
        if (err) { return reject(err) }
        return resolve(stats)
      })
    })
  }
}
