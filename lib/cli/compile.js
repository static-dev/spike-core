export default function (Roots, args) {
  const project = new Roots({ root: args.path })
  process.nextTick(() => project.compile())
  return project
}
