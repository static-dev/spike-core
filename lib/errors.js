/**
 * @module Errors
 */

/**
 * @class SpikeError
 * @classdesc A spike-specific error class, echoes the underlying error but
 * with an added id, if provided.
 * @param {Object} args - error arguments object
 * @param {Number} args.id - error id
 * @param {String} args.message - the error message
 */
class SpikeError extends Error {
  constructor (args) {
    super(args.err)
    this.id = args.id
    this.message = args.err.message
    this.stack = args.err.stack
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
