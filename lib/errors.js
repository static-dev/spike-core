export class RootsError extends Error {
  constructor (args) {
    super()
    this.id = args.id
    this.message = args.message
  }
}

export class RootsWarning extends RootsError {}
