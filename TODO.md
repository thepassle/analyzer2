# Running analyzer in the browser


ESM wont be possible because of TS. Need to load TS with just a good ol' script tag:
```html
<script src="https://unpkg.com/typescript@latest"></script>
```

```js
import { nodeResolve } from '@rollup/plugin-node-resolve';
const commentParser = require.resolve('comment-parser');

export default {
  input: 'index.js',
  output: {
    globals: {
      typescript: 'ts'
    },
    name: 'analyzer',
    file: 'bundle.js',
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
```

```js
import ts from 'typescript';
import parse from 'comment-parser';

const comment = `/**
* Description may go
* over few lines followed by @tags
* @param {string} name the name parameter
* @param {any} value the value of any type
*/`

export function create(data) {
  console.log(parse(comment));
  console.log('success 🎉')
  return ts.transpile(data);
}
```

Load as follows:
```html
<html>
  <head>
    <script src="https://unpkg.com/typescript@latest"></script>
    <script src="./bundle.js"></script>
    <script>
      console.log(analyzer.create(`const a: string = 'hello';`)); // var a = 'hello';
    </script>
  </head>
  <body>

  </body>
</html>
```



Or this, in a worker:

This runs TS in the browser:

```js
const tsTranspiledEvent = new Event('tsTranspiled')
const workerFile = window.URL.createObjectURL(
  new Blob(
    [
      `
        importScripts('https://unpkg.com/typescript@latest')

        onmessage = (event) => {
          console.log('in worker:', event.data)
          const transpiled = ts.transpile(event.data)
          postMessage(transpiled)

          console.log(ts.createSourceFile(
            '',
            event.data,
            ts.ScriptTarget.ES2015,
            true,
          ));
        }
        
      `,
    ],
    {
      type: 'text/javascript',
    },
  ),
);

window.addEventListener('DOMContentLoaded', () => {
  const w = new Worker(workerFile)
  w.postMessage(`const a = true;`);

  w.onmessage = (event) => {
    let transpiled = event.data;
    console.log(transpiled);
  }

  window.dispatchEvent(tsTranspiledEvent)
});
```