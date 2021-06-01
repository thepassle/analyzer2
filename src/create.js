import ts from 'typescript';
import { FEATURES } from './features/index.js';

/**
 * 🚨🚨🚨 NOTES TO SELF 🚨🚨🚨
 *
 * - TODO:
 * 
 *  - Tests
 *   - lit
 */

/**
 * CORE
 * 
 * This function is the core of the analyzer. It takes an array of ts sourceFiles, and creates a
 * custom elements manifest.
 */
export function create({modules, plugins = []}) {
  const CEM = {
    schemaVersion: '0.1.0',
    readme: '',
    modules: [],
  };

  const mergedPlugins = [
    ...FEATURES,
    ...plugins
  ];

  modules.forEach(currModule => {

    const moduleDoc = {
      kind: "javascript-module",
      path: currModule.fileName,
      declarations: [],
      exports: []
    };

    /**
     * COLLECT PHASE
     * First pass through the module. Can be used to gather imports, exports, types, default values, 
     * which you may need to know the existence of in a later phase.
     */
    collect(currModule, moduleDoc, mergedPlugins);

    /**
     * ANALYZE PHASE
     * Go through the AST of every separate module, and gather as much as information as we can
     * This includes a modules imports, which are not specified in custom-elements.json, but are
     * required for the LINK PHASE, and deleted when processed
     */
    analyze(currModule, moduleDoc, mergedPlugins);
    CEM.modules.push(moduleDoc);

    /**
     * LINK PHASE
     * All information for a module has been gathered, now we can link information together. Like:
     * - Finding a CustomElement's tagname by finding its customElements.define() call (or 'export')
     * - Applying inheritance to classes (adding `inheritedFrom` properties/attrs/events/methods)
     */
    mergedPlugins.forEach(({moduleLinkPhase}) => {
      moduleLinkPhase && moduleLinkPhase({ts, moduleDoc});
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
    packageLinkPhase && packageLinkPhase(CEM);
  });

  return CEM;
}

function collect(source, moduleDoc, mergedPlugins) {
  visitNode(source);

  function visitNode(node) {
    mergedPlugins.forEach(({collectPhase}) => {
      collectPhase && collectPhase({ts, node, moduleDoc});
    });

    ts.forEachChild(node, visitNode);
  }
}

function analyze(source, moduleDoc, mergedPlugins) {
  visitNode(source);

  function visitNode(node) {
    mergedPlugins.forEach(({analyzePhase}) => {
      analyzePhase && analyzePhase({ts, node, moduleDoc});
    });

    ts.forEachChild(node, visitNode);
  }
}