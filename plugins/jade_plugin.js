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

      // find asset
      let outputFilename = compiler.options.output.filename;
      let asset = compilation.assets[outputFilename];

      let source = asset.source();
      console.log(source);
    });
  }

}
