class RollupNG2 {
  resolveId(id, from){
    if(id.startsWith('@angular/')){
      return `${__dirname}/../../packages-dist/${id.split('/')[1]}/esm/index.js`;
    }

    // if(id.startsWith('rxjs/')){
    //   return `${__dirname}/../../../node_modules/rxjs-es/${id.replace('rxjs/', '')}.js`;
    // }
  }
}


export default {
  entry: 'test.js',
  format: 'es6',
  plugins: [
    new RollupNG2(),
  ]
}
