export default function (Roots, args) {
  const project = new Roots({ root: args.path })
  process.nextTick(() => project.watch())
  return project
}
