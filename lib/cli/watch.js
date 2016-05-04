export default function (Roots, args) {
  const project = new Roots({ root: args.path, env: args.env })
  process.nextTick(() => project.watch())
  return project
}
