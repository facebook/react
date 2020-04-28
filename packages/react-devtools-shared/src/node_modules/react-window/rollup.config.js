import path from 'path';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import { terser } from 'rollup-plugin-terser';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

import pkg from './package.json';

const input = './src/index.js';

const external = id => !id.startsWith('.') && !path.isAbsolute(id);

const babelConfigEsModules = babel({
  runtimeHelpers: true,
  plugins: [['@babel/transform-runtime', { useESModules: true }]],
  sourceMaps: true,
});

const umdGlobals = {
  react: 'React',
};

export default [
  {
    input,
    output: {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
    },
    external,
    plugins: [
      babel({
        runtimeHelpers: true,
        plugins: ['@babel/transform-runtime'],
        sourceMaps: true,
      }),
      nodeResolve(),
      commonjs(),
    ],
  },

  {
    input,
    output: {
      file: pkg.module,
      format: 'esm',
      sourcemap: true,
    },
    external,
    plugins: [babelConfigEsModules, nodeResolve(), commonjs()],
  },

  {
    input,
    output: {
      file: 'dist/index-dev.umd.js',
      format: 'umd',
      sourcemap: true,
      name: 'ReactWindow',
      globals: umdGlobals,
    },
    external: Object.keys(umdGlobals),
    plugins: [
      babelConfigEsModules,
      nodeResolve(),
      commonjs(),
      replace({
        'process.env.NODE_ENV': JSON.stringify('development'),
      }),
      terser(),
    ],
  },

  {
    input,
    output: {
      file: 'dist/index-prod.umd.js',
      format: 'umd',
      sourcemap: true,
      name: 'ReactWindow',
      globals: umdGlobals,
    },
    external: Object.keys(umdGlobals),
    plugins: [
      babelConfigEsModules,
      nodeResolve(),
      commonjs(),
      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      terser(),
    ],
  },
];
