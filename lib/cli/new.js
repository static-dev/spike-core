import path from 'path'
import {EventEmitter} from 'events'

export default function (Roots, args) {
  const emitter = new EventEmitter()
  emitter.on('done', (project) => {
    emitter.emit('create', `project created at ${path.resolve(project.config.context)}`)
  })
  process.nextTick(() => Roots.new({ root: args.path, emitter: emitter }))
  return emitter
}
