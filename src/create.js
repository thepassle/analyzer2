import ts from 'typescript';
import { FEATURES } from './features/index.js';

/**
 * 🚨 TODO
 * - Lightning web components
 * - storybook
 */

/**
 * CORE
 * 
 * This function is the core of the analyzer. It takes an array of ts sourceFiles, and creates a
 * custom elements manifest.
 */
export function create({modules, plugins = []}) {
  const customElementsManifest = {
    schemaVersion: '0.1.0',
    readme: '',
    modules: [],
  };

  const mergedPlugins = [
    ...FEATURES,
    ...plugins,
  ];

  const context = {};

  modules.forEach(currModule => {
    /**
     * COLLECT PHASE
     * First pass through all modules. Can be used to gather imports, exports, types, default values, 
     * which you may need to know the existence of in a later phase.
     */
    collect(currModule, context, mergedPlugins);
  });

  modules.forEach(currModule => {
    const moduleDoc = {
      kind: "javascript-module",
      path: currModule.fileName,
      declarations: [],
      exports: []
    };

    /**
     * ANALYZE PHASE
     * Go through the AST of every separate module, and gather as much as information as we can
     * This includes a modules imports, which are not specified in custom-elements.json, but are
     * required for the LINK PHASE, and deleted when processed
     */
    analyze(currModule, moduleDoc, context, mergedPlugins);
    customElementsManifest.modules.push(moduleDoc);

    /**
     * LINK PHASE
     * All information for a module has been gathered, now we can link information together. Like:
     * - Finding a CustomElement's tagname by finding its customElements.define() call (or 'export')
     * - Applying inheritance to classes (adding `inheritedFrom` properties/attrs/events/methods)
     */
    mergedPlugins.forEach(({moduleLinkPhase}) => {
      moduleLinkPhase && moduleLinkPhase({ts, moduleDoc, context});
    });
  });

  /** 
   * PACKAGE LINK PHASE 
   * All modules have now been parsed, we can now link information from across modules together
   * - Link classes to their definitions etc 
   * - Match tagNames for classDocs
   * - Apply inheritance
   */
  mergedPlugins.forEach(({packageLinkPhase}) => {
    packageLinkPhase && packageLinkPhase({customElementsManifest, context});
  });

  return customElementsManifest;
}

function collect(source, context, mergedPlugins) {
  visitNode(source);

  function visitNode(node) {
    mergedPlugins.forEach(({collectPhase}) => {
      collectPhase && collectPhase({ts, node, context});
    });

    ts.forEachChild(node, visitNode);
  }
}

function analyze(source, moduleDoc, context, mergedPlugins) {
  visitNode(source);

  function visitNode(node) {
    mergedPlugins.forEach(({analyzePhase}) => {
      analyzePhase && analyzePhase({ts, node, moduleDoc, context});
    });

    ts.forEachChild(node, visitNode);
  }
}