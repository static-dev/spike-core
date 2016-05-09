module.exports = function (Roots, args) {
  const project = new Roots({ root: args.path, env: args.env })
  process.nextTick(() => project.compile())
  return project
}
