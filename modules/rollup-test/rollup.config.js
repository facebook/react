// import typescript from 'rollup-plugin-typescript';
// import tsc from 'typescript'

import nodeResolve from 'rollup-plugin-node-resolve';

class RollupNG2 {
    constructor(options){
        this.options = options;
    }
    resolveId(id, from){
        //console.log(id, from);
        // if(id.startsWith('angular2/')){
        //     return `${__dirname}/vendor/angular2/${id.split('angular2/').pop()}.js`;
        // }
        if(id.startsWith('rxjs/')){
            return `${__dirname}/node_modules/rxjs-es/${id.replace('rxjs/', '')}.js`;
        }
    }
}


const rollupNG2 = (config) => new RollupNG2(config);


export default {
    entry: 'dist/hello_world.js',
    //entry: 'hello_world.ts',
    sourceMap: true,
    plugins: [
      //typescript({typescript: tsc, target: 'es5', declaration: false}),
      rollupNG2(),
      nodeResolve({ jsnext: true, main: true }),
    ]
}
