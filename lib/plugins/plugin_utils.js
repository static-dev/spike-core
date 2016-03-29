import glob from 'glob'
import path from 'path'
import micromatch from 'micromatch'
import SingleEntryDependency from 'webpack/lib/dependencies/SingleEntryDependency'

export default {
  getFilesFromGlob (compiler, opts) {
    let files = {}
    const matcher = path.join(compiler.options.context, '**/**')
    files._all = glob.sync(matcher, { ignore: opts.ignore })

    for (let key in opts.matchers) {
      files[key] = micromatch(files._all, opts.matchers[key])
    }
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
    for (let key in opts.matchers) {
      for (const a in compilation.assets) {
        if (a.substring(0, a.length - 3).match(mmToRe(opts.matchers[key]))) {
          delete compilation.assets[a]
        }
      }
    }
    done()
  },

  /**
   * resolveRelativeSourcePath - takes a relative path like `img/foo.png`
   * and resolves it to an absolute path. Function respects your dumpDirs
   * and knows how to resolve it's absolute source path
   *
   * @param  {obj} compiler the webpack compiler object
   * @param  {string} file     a relative path
   * @param  {object} opts     your roots config options
   * @return {string}          returns an absolute path
   */
  resolveRelativeSourcePath (compiler, file, opts) {
    let rel = file.replace(compiler.options.context)

    // check to see if the file is from a dumpDir path
    opts.dumpPaths.forEach((d) => {
      const test = new RegExp(`${rel}`)
      if (d.match(test)) { rel = d }
    })
    return path.join(compiler.options.context, rel)
  }
}

// utils
function mmToRe (mm) {
  return micromatch.makeRe(mm)
}
