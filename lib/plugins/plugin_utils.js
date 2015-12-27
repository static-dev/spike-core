import glob from 'glob'
import path from 'path'
import SingleEntryDependency from 'webpack/lib/dependencies/SingleEntryDependency'

export default {
  getFilesFromGlob: (compiler, opts) => {
    return glob.sync(`${compiler.options.context}${opts.matcher}`)
                    .filter(removeIgnores.bind(null, opts.ignore))
  },
  addFilesAsWebpackEntries: (files, opts, compiler, compilation) => {
    let tasks = []

    files.forEach(f => {
      // TODO this needs to be pulled from opts.matcher
      let name = f.match(/\/(\w+).jade/)[1]
      let relativePath = f.replace(compiler.options.context, '.')
      let dep = new SingleEntryDependency(relativePath)

      tasks.push(new Promise((resolve, reject) => {
        compilation.addEntry(compiler.options.context, dep, name, (err) => {
          if (err) { reject(err) } else { resolve(true) }
        })
      }))
    })

    return Promise.all(tasks)
  },
  getOutputPath: (compiler, f, opts) => {
    let rel = f.replace(compiler.options.context, '')

    opts.dumpDirs.forEach(d => {
      let re = new RegExp(`^${path.sep}${d}`)
      if (rel.match(re)) { rel = rel.replace(`${path.sep}${d}`, '') }
    })

    return rel.substring(1)
  }
}

// utils

function removeIgnores (ignores, f) {
  for (let ignore of ignores) {
    if (f.match(ignore)) { return false }
  }
  return true
}
