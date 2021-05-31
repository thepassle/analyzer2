import ts from 'typescript';
import path from 'path';
import globby from 'globby';
import fs from 'fs';
import commandLineArgs from 'command-line-args';

import { create } from './src/create.js';
import { getUserConfig } from './src/utils/cli.js';

const IGNORE = [
  '!node_modules/**/*.*', 
  '!bower_components/**/*.*', 
  '!**/*.test.{js,ts}', 
  '!**/*.suite.{js,ts}', 
  '!**/*.config.{js,ts}'
];

(async () => {
  const mainDefinitions = [
    { name: 'command', defaultOption: true }
  ]
  const mainOptions = commandLineArgs(mainDefinitions, { stopAtFirstUnknown: true });
  const argv = mainOptions._unknown || [];
  
  if (mainOptions.command === 'analyze') {

    const optionDefinitions = [
      { name: 'globs', type: String, multiple: true, defaultValue: [ '**/*.{js,ts}', '!**/.*.{js,ts}'] },
      { name: 'exclude', type: String, multiple: true },
      { name: 'dev', type: Boolean, defaultValue: false },
      { name: 'litelement', type: Boolean, defaultValue: false },
      { name: 'stencil', type: Boolean, defaultValue: false },
      { name: 'catalyst', type: Boolean, defaultValue: false },
    ];
    
    const commandLineOptions = commandLineArgs(optionDefinitions, { argv });
    const userConfig = await getUserConfig();
    /**
     * Merged config options
     * Command line options override userConfig options
     */
    const mergedOptions = { 
      ...userConfig,
      ...commandLineOptions,
    }

    /**
     * @TODO 🚨 if the cli/config file supplies `globs`, we have to ignore the default globs on line 28
     */
    const merged = [
      ...(userConfig?.globs || []),
      ...(userConfig?.exclude?.map((i) => `!${i}`) || []),
      ...(commandLineOptions?.globs || []),
      ...(commandLineOptions?.exclude?.map((i) => `!${i}`) || []),
      ...IGNORE,
    ];

    const globs = await globby([
      // ...merged, 
      'fixtures/-default/package/**/*.{ts,js}'
    ]);

    const modules = globs.map(glob => {
      const relativeModulePath = `./${path.relative(process.cwd(), glob)}`;
      const source = fs.readFileSync(relativeModulePath).toString();

      return ts.createSourceFile(
        relativeModulePath,
        source,
        ts.ScriptTarget.ES2015,
        true,
      );
    });

    let plugins = [];
    if(mergedOptions?.litelement) {
      const { litPlugin } = await import('./src/features/framework-plugins/lit/lit.js');
      plugins = [...(litPlugin() || [])]
    }

    if(mergedOptions?.stencil) {
      const { stencilPlugin } = await import('./src/features/framework-plugins/stencil/stencil.js');
      plugins.push(stencilPlugin());
    }

    if(mergedOptions?.catalyst) {
      const { catalystPlugin } = await import('./src/features/framework-plugins/catalyst/catalyst.js');
      plugins.push(catalystPlugin());
    }

    const customElementsManifest = create({
      modules,
      plugins: mergedOptions?.plugins || []
    });
    
    if(mergedOptions.dev) {
      console.log(JSON.stringify(customElementsManifest, null, 2));
    }

    try {
      const packageJsonPath = `${process.cwd()}/package.json`;
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());
      
      if(packageJson?.customElements) {
        return;
      } else {
        packageJson.customElements = 'custom-elements.json';
        fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
      }
    } catch {
      console.log(`Could not add 'customElements' property to ${process.cwd()}/package.json. \nAdding this property helps tooling locate your Custom Elements Manifest. Please consider adding it yourself, or file an issue if you think this is a bug.\nhttps://www.github.com/open-wc/custom-elements-manifest`);
    }
  } else {
    console.log(`
@custom-elements-manifest/analyzer

Available commands:
    | Command/option   | Type       | Description                                          | Example               |
    | ---------------- | ---------- | ---------------------------------------------------- | --------------------- |
    | analyze          |            | Analyze your components                              |                       |
    | --globs          | string[]   | Globs to analyze                                     | \`--globs "foo.js"\`    |
    | --exclude        | string[]   | Globs to exclude                                     | \`--exclude "foo.js"\`  |
    | --litelement     | boolean    | Enable special handling for LitElement syntax        | \`--litelement\`        |
    | --stencil        | boolean    | Enable special handling for Stencil syntax           | \`--stencil\`           |
    | --catalyst       | boolean    | Enable special handling for Catalyst syntax          | \`--catalyst\`          |

Example:
    custom-elements-manifest analyze --litelement --globs "**/*.js" --exclude "foo.js" "bar.js"
`)
  }

})();