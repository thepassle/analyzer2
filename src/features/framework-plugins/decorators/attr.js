import { decorator } from '../../../utils/index.js'
import { createAttributeFromField } from '../../analyse-phase/creators/createAttribute.js';

export function attrDecoratorPlugin() {
  return {
    analyzePhase({ts, node, moduleDoc}){
      switch(node.kind) {
        case ts.SyntaxKind.ClassDeclaration:
          const className = node?.name?.text;
          const classDoc = moduleDoc?.declarations?.find(declaration => declaration.name === className);

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
