import { has, decorator, resolveModuleOrPackageSpecifier } from '../../../utils/index.js';

/**
 * CUSTOMELEMENT
 * 
 * Handles the customElement decorator
 * @example @customElement('my-el');
 */
export function customElementDecoratorPlugin() {
  return {
    analyzePhase({node, moduleDoc}){
      if(has(node.decorators)) {
        const customElementDecorator = node.decorators?.find(decorator('customElement'));

        if(customElementDecorator) {
          const className = node.name.text;
          const tagName = customElementDecorator.expression.arguments[0].text;
          
          const definitionDoc = {
            kind: 'custom-element-definition',
            name: tagName,
            declaration: {
              name: className,
              ...resolveModuleOrPackageSpecifier(moduleDoc, className)
            },
          };


          moduleDoc.exports = [...(moduleDoc.exports || []), definitionDoc];
        }
      }
    }
  }
}