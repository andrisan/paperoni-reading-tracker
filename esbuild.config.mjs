import esbuild from 'esbuild';
import process from 'node:process';

const prod = process.argv[2] === 'production';

const context = await esbuild.context({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  external: ['paperoni'],
  format: 'esm',
  target: 'es2020',
  outfile: 'main.js',
  sourcemap: prod ? false : 'inline',
  treeShaking: true,
  minify: prod,
  jsx: 'automatic',
  loader: {
    '.ts': 'ts',
    '.tsx': 'tsx',
  },
});

if (prod) {
  await context.rebuild();
  process.exit(0);
}

await context.watch();
