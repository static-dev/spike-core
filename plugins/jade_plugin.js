export default class JadeWebpackPlugin {

  constructor(opts) {
    console.log('constructor fire');
  }

  apply(compiler) {
    compiler.plugin('emit', (compilation, done) => {
      let stats = compilation.getStats();
      console.log(stats);
      done();
    });
  }

}
