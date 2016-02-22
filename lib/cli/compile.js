import Roots from '../'

export default function (context, args) {
  let project = new Roots({ root: args.path })
  return project.compile()
}
