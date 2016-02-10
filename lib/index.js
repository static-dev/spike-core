import webpack from 'webpack'
import Config from './config'

export default class Roots {
  constructor (opts = {}) {
    this.config = new Config(opts)
  }

  compile () {
    return new Promise((resolve, reject) => {
      webpack(this.config, (err, stats) => {
        // handle all errors
        // ref: https://webpack.github.io/docs/node.js-api.html#error-handling
        if (err) { return reject(err) }
        let jsonStats = stats.toJson()
        if (jsonStats.errors.length > 0) { reject(jsonStats.errors) }
        if (jsonStats.warnings.length > 0) { reject(jsonStats.warnings) } // we may want to WARN instead of reject

        return resolve(stats)
      })
    })
  }
}
