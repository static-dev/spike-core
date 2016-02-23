import webpack from 'webpack'
import {EventEmitter} from 'events'
import Config from './config'
import {RootsError, RootsWarning} from './errors'

export default class Roots extends EventEmitter {
  constructor (opts = {}) {
    super()
    this.config = new Config(opts)
  }

  compile () {
    // Assign this compilation a random id
    const id = this._id()

    // Compile with webpack
    webpack(this.config, (err, stats) => {
      if (err) {
        return this.emit('error', new RootsError({ id: id, message: err }))
      }

      // Webpack "soft errors" are classified as warnings in roots. An error is
      // an error. If it doesn't break the build, it's a warning.
      const jsonStats = stats.toJson()
      if (jsonStats.errors.length > 0) {
        this.emit('warning', new RootsWarning({ id: id, message: jsonStats.errors }))
      }
      if (jsonStats.warnings.length > 0) {
        this.emit('warning', new RootsWarning({ id: id, message: jsonStats.warnings }))
      }

      this.emit('compile', { id: id, stats: stats })
    })

    // Returns the compilation's ID synchronously, this can be checked against
    // events emitted from the project instance.
    return id
  }

  _id () {
    return (Math.random().toString(16) + '000000000').substr(2, 8)
  }
}
