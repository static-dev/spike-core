/**
 * @module Errors
 */

/**
 * @class RootsError
 * @classdesc A roots-specific error class
 * @param {Object} args - error arguments object
 * @param {Number} args.id - error id
 * @param {String} args.message - the error message
 */
export class RootsError extends Error {
  constructor (args) {
    super()
    this.id = args.id
    this.message = args.message
  }
}

export class RootsWarning extends RootsError {}
