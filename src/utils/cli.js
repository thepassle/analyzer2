import { readConfig, ConfigLoaderError } from '@web/config-loader';
import fs from 'fs';
import commandLineArgs from 'command-line-args';

const IGNORE = [
  '!node_modules/**/*.*', 
  '!bower_components/**/*.*', 
  '!**/*.test.{js,ts}', 
  '!**/*.suite.{js,ts}', 
  '!**/*.config.{js,ts}'
];

/**
 * @TODO 🚨 if the cli/config file supplies `globs`, we have to ignore the default globs on line 28
 */
export function mergeGlobsAndExcludes(userConfig, cliConfig) {
  const merged = [
    ...(userConfig?.globs || []),
    ...(userConfig?.exclude?.map((i) => `!${i}`) || []),
    ...(cliConfig?.globs || []),
    ...(cliConfig?.exclude?.map((i) => `!${i}`) || []),
    ...IGNORE,
  ];

  return merged;
}

export async function getUserConfig() {
  let userConfig = {};
  try {
    userConfig = await readConfig('custom-elements-manifest.config');
  } catch (error) {
    if (error instanceof ConfigLoaderError) {
      console.error(error.message);
      return;
    }
    console.error(error);
    return;
  }
  return userConfig || {};
}

export function getCliConfig(argv) {
  const optionDefinitions = [
    { name: 'globs', type: String, multiple: true, defaultValue: [ '**/*.{js,ts}', '!**/.*.{js,ts}'] },
    { name: 'exclude', type: String, multiple: true },
    { name: 'dev', type: Boolean, defaultValue: false },
    { name: 'litelement', type: Boolean, defaultValue: false },
    { name: 'stencil', type: Boolean, defaultValue: false },
    { name: 'catalyst', type: Boolean, defaultValue: false },
  ];
  
  return commandLineArgs(optionDefinitions, { argv });
}

export async function addFrameworkPlugins(mergedOptions) {
  let plugins = [];
  if(mergedOptions?.litelement) {
    const { litPlugin } = await import('../features/framework-plugins/lit/lit.js');
    plugins = [...(litPlugin() || [])]
  }

  if(mergedOptions?.stencil) {
    const { stencilPlugin } = await import('../features/framework-plugins/stencil/stencil.js');
    plugins.push(stencilPlugin());
  }

  if(mergedOptions?.catalyst) {
    const { catalystPlugin } = await import('../features/framework-plugins/catalyst/catalyst.js');
    plugins.push(catalystPlugin());
  }

  return plugins;
}

export function addCustomElementsPropertyToPackageJson() {
  const packageJsonPath = `${process.cwd()}/package.json`;
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());
  
  if(packageJson?.customElements) {
    return;
  } else {
    packageJson.customElements = 'custom-elements.json';
    fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
  }
}