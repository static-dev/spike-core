const test = require('ava')
const path = require('path')
const fs = require('fs')
const Roots = require('..')
const {fixturesPath} = require('./_helpers')

test.cb('watches the project, reloads on modification', (t) => {
  const project = new Roots({
    root: path.join(fixturesPath, 'watch'),
    server: { open: false }
  })
  let i = 0

  project.on('compile', (res) => {
    i++
    if (i === 1) {
      const file = path.join(fixturesPath, 'watch/index.jade')
      fs.appendFileSync(file, ' ')
      fs.writeFileSync(file, fs.readFileSync(file, 'utf8').trim())
    }
    if (i === 2) {
      watcher.close()
      t.end()
    }
  })

  const watcher = project.watch()
  // make sure the watcher is returned
  t.truthy((typeof watcher.startTime) === 'number')
})

test.cb('incorporates new file when added while watching', (t) => {
  const project = new Roots({
    root: path.join(fixturesPath, 'watch'),
    server: { open: false }
  })
  let i = 0
  const testFile = path.join(fixturesPath, 'watch/test.jade')
  const testResultFile = path.join(fixturesPath, 'watch/public/test.html')

  project.on('compile', (res) => {
    i++
    if (i === 1) {
      fs.writeFileSync(testFile, 'p test')
    }
    if (i === 2) {
      const contents = fs.readFileSync(testResultFile, 'utf8')
      t.truthy(contents, '\n<p>test</p>')
      fs.unlinkSync(testFile)
      fs.unlinkSync(testResultFile)
      watcher.close()
      t.end()
    }
  })

  const watcher = project.watch()
})
