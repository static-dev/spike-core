import glob from 'glob'
import path from 'path'
import SingleEntryDependency from 'webpack/lib/dependencies/SingleEntryDependency'

export default {
  getFilesFromGlob (compiler, opts) {
    let matcher = path.join(compiler.options.context, opts.matcher)
    let files = glob.sync(matcher, { ignore: opts.ignore })
    return files
  },
  addFilesAsWebpackEntries (files, opts, compiler, compilation) {
    let tasks = []

    files.forEach((f) => {
      let name = f.replace(compiler.options.context, '').substring(1)
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
  getOutputPath (compiler, f, opts) {
    let rel = f.replace(compiler.options.context, '')

    opts.dumpDirs.forEach((d) => {
      let re = new RegExp(`^${path.sep}${d}`)
      if (rel.match(re)) { rel = rel.replace(`${path.sep}${d}`, '') }
    })

    return rel.substring(1)
  }
}
