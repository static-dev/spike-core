import webpack from 'webpack'
import Config from './config'

export default class Roots {
  constructor (opts = {}) {
    this.config = new Config(opts)
  }

  compile () {
    return new Promise((resolve, reject) => {
      webpack(this.config, (err, stats) => {
        if (err) { console.log('error caught'); return reject(err) }
        return resolve(stats)
      })
    })
  }
}
