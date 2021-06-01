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