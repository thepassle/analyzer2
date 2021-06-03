const BASECLASSES = [
  'htmlelement', 
  'litelement', 
  'fastelement'
];

/**
 * ISCUSTOMELEMENT
 * 
 * Heuristic to see whether or not a class is a custom element
 */
export function isCustomElementPlugin() {
  return {
    analyzePhase({ts, node, moduleDoc}){
      switch(node.kind) {
        case ts.SyntaxKind.ClassDeclaration:
          const klass = moduleDoc?.declarations?.find(declaration => declaration.name === node.name.getText());

          if(klass) {
            /** If a class has a tagName, that means its been defined, and is a custom element */
            if(klass?.tagName) {
              klass.isCustomElement = true;
            }

            /** If a class extends from any of these, its a custom element */
            if(BASECLASSES.includes(klass?.superclass?.name?.toLowerCase())) {
              klass.isCustomElement = true;
            }
          }
          break;
      }
    }
  }
}

