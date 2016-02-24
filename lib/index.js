import webpack from 'webpack'
import {EventEmitter} from 'events'
import WebpackDevServer from 'webpack-dev-server'
import Config from './config'
import {RootsError, RootsWarning} from './errors'

export default class Roots extends EventEmitter {
  constructor (opts = {}) {
    super()
    this.config = new Config(opts)
  }

  compile () {
    const id = this._id()
    const compiler = webpack(this.config)

    compiler.run((err, stats) => {
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
    return [id, compiler]
  }

  watch (opts) {
    const [, compiler] = this.compile()
    const watcher = compiler.watch(opts)
    const server = new WebpackDevServer(compiler, this.config.server)
    server.listen(this.config.server.port, 'localhost', () => {
      console.log(`listening on port ${this.config.server.port}`)
    })
    return [watcher, server]
  }

  _id () {
    return (Math.random().toString(16) + '000000000').substr(2, 8)
  }
}
