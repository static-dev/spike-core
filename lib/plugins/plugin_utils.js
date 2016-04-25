import glob from 'glob'
import path from 'path'
import micromatch from 'micromatch'
import W from 'when'
import node from 'when/node'
import SingleEntryDependency from 'webpack/lib/dependencies/SingleEntryDependency'
import MultiEntryDependency from 'webpack/lib/dependencies/MultiEntryDependency'

/**
 * Given the config options, pulls all files from the fs that match any of the
 * provided matchers
 * @param  {Object} opts     - should have `root`, `ignore`, `matchers`
 * @return {Array}           - all matching file paths, absolute
 */
export function getFilesFromGlob (opts) {
  let files = {}
  const matcher = path.join(opts.root, '**/**')
  files.all = glob.sync(matcher, { ignore: opts.ignore, dot: true, nodir: true })

  // Grab any file match tests from user-provided loaders
  const customLoaderTests = opts.module.loaders.reduce((m, l) => {
    if (!l._core) m.push(l.test)
    return m
  }, [])

  // push all files matched by custom loaders into a `custom` category
  files.custom = []
  for (const loaderTest of customLoaderTests) {
    files.all.forEach((f) => {
      if (f.match(loaderTest)) files.custom.push(f)
    })
  }

  // Core matchers do not match files that are already covered by custom loaders
  const allWithoutCustom = files.all.filter((f) => files.custom.indexOf(f) < 0)
  for (const key in opts.matchers) {
    files[key] = micromatch(allWithoutCustom, opts.matchers[key], { dot: true })
  }

  return files
}

/**
 * Adds a number of files to webpack's pipeline as entires, so that webpack
 * processes them even if they are not required in the main js file.
 * @param {Array} files        - array of absolute paths to files
 * @param {Object} opts        - contains at least `root` and `dumpDirs`
 * @param {Object} compilation - object from plugin
 */
export function addFilesAsWebpackEntries (files, opts, compilation) {
  return W.all(files.map((f) => {
    const name = getOutputPath(f, opts)
    const relativePath = f.replace(opts.root, '.')
    const dep = new MultiEntryDependency([new SingleEntryDependency(relativePath)], name)
    const addEntryFn = compilation.addEntry.bind(compilation)

    return node.call(addEntryFn, opts.root, dep, name)
  }))
}

/**
 * Given a source file path, outputs the file's destination as roots-mini
 * will write it.
 * @param  {String} file - path to source file
 * @param  {Object} opts - contains at least `root` and `dumpDirs`
 * @return {String}      - output path
 */
export function getOutputPath (file, opts) {
  let rel = file.replace(opts.root, '')

  opts.dumpDirs.forEach((d) => {
    const re = new RegExp(`^${path.sep}${d}`)
    if (rel.match(re)) { rel = rel.replace(`${path.sep}${d}`, '') }
  })

  return rel.substring(1)
}

/**
 * Removes assets from the webpack compilation, so that static files are not
 * written to the js file, since we already write them as static files.
 * @param  {Object}   compilation - webpack compilation object from plugin
 * @param  {Object}   opts        - contains at least `matchers`
 * @param  {Function} done        - callback
 */
export function removeAssets (compilation, _files, opts, done) {
  // assets are set in compilation.assets as the output path, relative to
  // the root, with '.js' at the end, so we transform to that format for
  // comparison
  let files = _files.map((f) => {
    return getOutputPath(f, opts).replace(`${opts.root}/`, '') + '.js'
  })
  // now we go through all the assets and remove the ones we have processed
  // with roots so that they are not written to the js file
  for (const a in compilation.assets) {
    if (files.indexOf(a) > -1) { delete compilation.assets[a] }
  }
  done()
}

/**
 * Takes a relative path like `img/foo.png` and resolves it to an absolute
 * path. Function respects your dumpDirs and knows how to resolve it's
 * absolute source path
 * @param  {obj} compiler the webpack compiler object
 * @param  {string} file     a relative path
 * @param  {object} opts     your roots config options
 * @return {string}          returns an absolute path
 */
export function resolveRelativeSourcePath (file, opts) {
  let rel = file.replace(opts.root, '')

  // check to see if the file is from a dumpDir path
  opts.dumpPaths.forEach((d) => {
    const test = new RegExp(`${rel}`)
    if (d.match(test)) { rel = d }
  })
  return path.join(opts.root, rel)
}

/**
 * Boolean return whether a file matches any of the configured ignores
 * @param  {Object}  ignores - contains at least `ignore`
 * @param  {String}  file    - absolute file path
 * @return {Boolean}         - file ignored or not?
 */
export function isFileIgnored (ignores, file) {
  return micromatch.any(file, ignores)
}
