import _ from 'lodash'
import evaluate from 'eval'

export default class JadeWebpackPlugin {

  constructor(opts) {
    if (!opts) { opts = {} };
  }

  apply(compiler) {
    var self = this;

    compiler.plugin('emit', (compilation, done) => {
      // grab compilation stats
      let stats = compilation.getStats();
      let statsJson = stats.toJson();

      // find bundle source
      let outputFilename = compiler.options.output.filename;
      let asset = compilation.assets[outputFilename];

      let source = asset.source();

      // get jade files
      let jadeFiles = extractJadeFiles(compiler.records.modules.byIdentifier);
      console.log(jadeFiles);

      done();
    });
  }

}

// Utilities

function extractJadeFiles(modules) {
  return _.compact(_.map(modules, (i, key) => {
    let filename = key.split('!').pop();
    if (filename.match(/\.jade$/)) { return filename }
  }));
}