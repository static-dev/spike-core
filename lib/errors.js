/**
 * @module Errors
 */

/**
 * @class SpikeError
 * @classdesc A spike-specific error class
 * @param {Object} args - error arguments object
 * @param {Number} args.id - error id
 * @param {String} args.message - the error message
 */
class SpikeError extends Error {
  constructor (args) {
    super()
    this.id = args.id
    this.message = args.message
  }
}
exports.Error = SpikeError

/**
 * @class SpikeWarning
 * @classdesc A spike-specific warning class
 * @param {Object} args - error arguments object
 * @param {Number} args.id - error id
 * @param {String} args.message - the error message
 */
class SpikeWarning extends SpikeError {}
exports.Warning = SpikeWarning
