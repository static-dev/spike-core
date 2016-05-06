module.exports = function (Roots, args) {
  const project = new Roots({ root: args.path })
  process.nextTick(() => project.clean())
  return project
}
