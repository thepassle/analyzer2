import { nodeResolve } from '@rollup/plugin-node-resolve';
const commentParser = require.resolve('comment-parser');

export default {
  input: 'src/create.js',
  output: {
    globals: {
      typescript: 'ts'
    },
    name: 'analyzer',
    file: 'browser.js',
    format: 'iife'
  },
  plugins: [
    {
      load(id) {
        if (id === commentParser) {
          return `
import { parse } from 'comment-parser/es6/index.js'
export default parse;
          `;
        }
      }  
    },
    nodeResolve({
      resolveOnly: ['comment-parser']
    }),
  ]
};