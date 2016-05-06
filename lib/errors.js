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
class RootsError extends Error {
  constructor (args) {
    super()
    this.id = args.id
    this.message = args.message
  }
}
exports.Error = RootsError

/**
 * @class RootsWarning
 * @classdesc A roots-specific warning class
 * @param {Object} args - error arguments object
 * @param {Number} args.id - error id
 * @param {String} args.message - the error message
 */
class RootsWarning extends RootsError {}
exports.Warning = RootsWarning
