import Roots from '..'
import fs from 'fs'
import {
  test,
  fixturesPath,
  path
} from './_helpers'

test.cb('watches the project, reloads on modification', (t) => {
  const project = new Roots({
    root: path.join(fixturesPath, 'watch'),
    server: {
      open: false
    }
  })
  let i = 0

  project.on('compile', (res) => {
    i++
    if (i === 1) {
      const file = path.join(fixturesPath, 'watch/index.jade')
      setTimeout(() => {
        fs.appendFileSync(file, ' ')
        fs.writeFileSync(file, fs.readFileSync(file, 'utf8').trim())
      }, 100)
    }
    if (i === 2) {
      watcher.close()
      t.end()
    }
  })

  const watcher = project.watch()
  t.truthy((typeof watcher.startTime) === 'number')
})
