import ts from 'typescript';
import path from 'path';
import globby from 'globby';
import fs from 'fs';
import commandLineArgs from 'command-line-args';

import { create } from './src/create.js';
import { 
  getUserConfig, 
  getCliConfig, 
  addFrameworkPlugins, 
  addCustomElementsPropertyToPackageJson,
  mergeGlobsAndExcludes,
  MENU
} from './src/utils/cli.js';

(async () => {
  const mainDefinitions = [
    { name: 'command', defaultOption: true }
  ]
  const mainOptions = commandLineArgs(mainDefinitions, { stopAtFirstUnknown: true });
  const argv = mainOptions._unknown || [];
  
  if (mainOptions.command === 'analyze') {

    const cliConfig = getCliConfig(argv)
    const userConfig = await getUserConfig();

    /**
     * Merged config options
     * Command line options override userConfig options
     */
    const mergedOptions = { ...userConfig, ...cliConfig };

    const merged = mergeGlobsAndExcludes(userConfig, cliConfig);

    const globs = await globby(merged);

    /**
     * Create modules for `create`
     */
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

    const plugins = await addFrameworkPlugins(mergedOptions);

    /**
     * Create the manifest
     */
    const customElementsManifest = create({
      modules,
      plugins: plugins || []
    });
    
    if(mergedOptions.dev) {
      console.log(JSON.stringify(customElementsManifest, null, 2));
    }

    try {
      addCustomElementsPropertyToPackageJson();
    } catch {
      console.log(`Could not add 'customElements' property to ${process.cwd()}/package.json. \nAdding this property helps tooling locate your Custom Elements Manifest. Please consider adding it yourself, or file an issue if you think this is a bug.\nhttps://www.github.com/open-wc/custom-elements-manifest`);
    }
  } else {
    console.log(MENU);
  }

})();