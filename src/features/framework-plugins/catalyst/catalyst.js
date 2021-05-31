import { toKebabCase, resolveModuleOrPackageSpecifier, decorator } from '../../../utils/index.js'
import { createAttributeFromField } from '../../analyse-phase/creators/createAttribute.js';

export function catalystPlugin() {
  return {
    analyzePhase({ts, node, moduleDoc}){
      switch(node.kind) {
        case ts.SyntaxKind.ClassDeclaration:
          /**
           * handle @controller
           */
          const className = node?.name?.text;
          const classDoc = moduleDoc?.declarations?.find(declaration => declaration.name === className);
          const hasController = node?.decorators?.find(decorator('controller'));

          if(hasController) {
            const className = node?.name?.getText();
            
            const definitionDoc = {
              kind: 'custom-element-definition',
              name: toKebabCase(className).replace('-element', ''),
              declaration: {
                name: className,
                ...resolveModuleOrPackageSpecifier(moduleDoc, className)
              },
            };


            moduleDoc.exports.push(definitionDoc);
          }

          /**
           * If a field has the @attr decorator, create an attr from the field in the classDoc
           */
          node?.members?.forEach(member => {
            const hasAttrDecorator = member?.decorators?.find(decorator('attr'));
            if(hasAttrDecorator) {
              const correspondingField = classDoc?.members?.find(classMember => classMember.name === member.name.getText());
              const attribute = createAttributeFromField(correspondingField);
              classDoc.attributes = [...(classDoc.attributes || []), attribute];
            }
          });
          break;
      }
    },
  }
}
