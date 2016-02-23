import glob from 'glob'
import path from 'path'
import micromatch from 'micromatch'
import SingleEntryDependency from 'webpack/lib/dependencies/SingleEntryDependency'

export default {
  getFilesFromGlob (compiler, opts) {
    const matcher = path.join(compiler.options.context, opts.matcher)
    const files = glob.sync(matcher, { ignore: opts.ignore })
    return files
  },
  addFilesAsWebpackEntries (files, opts, compiler, compilation) {
    let tasks = []

    files.forEach((f) => {
      let name = this.getOutputPath(compiler, f, opts)
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
      const re = new RegExp(`^${path.sep}${d}`)
      if (rel.match(re)) { rel = rel.replace(`${path.sep}${d}`, '') }
    })

    return rel.substring(1)
  },
  removeAssets (compilation, opts, done) {
    for (const a in compilation.assets) {
      if (a.substring(0, a.length - 3).match(mmToRe(opts.matcher))) {
        delete compilation.assets[a]
      }
    }
    done()
  }
}

// utils
function mmToRe (mm) {
  return micromatch.makeRe(mm)
}
