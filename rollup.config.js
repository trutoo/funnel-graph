import postcss from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';

import pkg from './package.json';

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        name: 'fg',
        file: pkg.browser,
        format: 'umd',
        plugins: [terser()],
        sourcemap: true,
      },
      {
        name: 'fg',
        file: `${pkg.browser.replace(/\.min\.js$/, '.js')}`,
        format: 'umd',
      },
    ],
    plugins: [
      postcss({
        extract: 'index.css',
      }),
      typescript({
        typescript: require('typescript'),
      }),
    ],
  },
  {
    input: 'src/index.ts',
    external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})],
    plugins: [
      // Utilize second pipeline to produce minified css as plugin does not support multiple extract locations
      postcss({
        extract: 'index.min.css',
        minimize: true,
      }),
      typescript({
        typescript: require('typescript'),
        tsconfigOverride: {
          compilerOptions: {
            target: 'es6',
          },
        },
      }),
    ],
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'esm' },
    ],
  },
];
