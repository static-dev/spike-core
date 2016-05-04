/**
 * @module Errors
 */

/**
 * @class RootsError
 * @classdesc A roots-specific error class
 * @param {Object} args - should have an `id` and `message` property
 */
export class RootsError extends Error {
  constructor (args) {
    super()
    this.id = args.id
    this.message = args.message
  }
}

export class RootsWarning extends RootsError {}
