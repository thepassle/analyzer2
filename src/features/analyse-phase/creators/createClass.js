import ts from 'typescript';
import { createFunctionLike } from './createFunctionLike.js';
import { createAttribute, createAttributeFromField } from './createAttribute.js';
import { createField } from './createClassField.js';
import { handleHeritage, handleJsDoc } from './handlers.js';
import { hasDefaultModifier } from '../../../utils/exports.js';
import { isProperty, isDispatchEvent, hasAttrAnnotation, isReturnStatement, isPrimitive } from '../../../utils/ast-helpers.js';


/**
 * Creates a classDoc
 */
export function createClass(node, moduleDoc) {
  const isDefault = hasDefaultModifier(node);
  
  let classTemplate = {
    kind: 'class',
    description: '',
    name: isDefault ? 'default' : node?.name?.getText() || node?.parent?.parent?.name?.getText() || '',
    cssProperties: [],
    cssParts: [],
    slots: [],
    members: [],
    events: [],
    attributes: []
  };

  node?.members?.forEach(member => {
    /**
     * Handle attributes
     */
    if (isProperty(member)) {
      if (member?.name?.getText() === 'observedAttributes') {
        /** 
         * @example static observedAttributes
         */
        if (ts.isPropertyDeclaration(member)) {
          member?.initializer?.elements?.forEach((element) => {
            if (ts.isStringLiteral(element)) {
              const attribute = createAttribute(element);
              classTemplate.attributes.push(attribute);
            }
          });
        }

        /**
         * @example static get observedAttributes() {}
         */
        if (ts.isGetAccessor(member)) {
          const returnStatement = member?.body?.statements?.find(isReturnStatement);

          returnStatement?.expression?.elements?.forEach((element) => {
            if (ts.isStringLiteral(element)) {
              const attribute = createAttribute(element);
              classTemplate.attributes.push(attribute);
            }
          });
        }
      }
    }
  });

  /**
   * Second pass through a class's members.
   * We do this in two passes, because we need to know whether or not a class has any 
   * attributes, so we handle those first.
   */
  const gettersAndSetters = [];
  node?.members?.forEach(member => {
    /**
     * Handle class methods
     */
    if(ts.isMethodDeclaration(member)) {
      const method = createFunctionLike(member);
      classTemplate.members.push(method);
    }

    /**
     * Handle fields
     */
    if (isProperty(member)) {
      if (gettersAndSetters.includes(member?.name?.getText())) {
        return;
      } else {
        gettersAndSetters.push(member?.name?.getText());
      }

      const field = createField(member);
      classTemplate.members.push(field);

      /**
       * Handle @attr
       * If a field has a @attr annotation, also create an attribute for it
       */
      if(hasAttrAnnotation(member)) {
        const attribute = createAttributeFromField(field);

        /**
         * If the attribute already exists, merge it together with the extra
         * information we got from the field (like type, summary, description, etc)
         */
        let attrAlreadyExists = classTemplate.attributes.find(attr => attr.name === attribute.name);
        
        if(attrAlreadyExists) {
          classTemplate.attributes = classTemplate.attributes.map(attr => {
            return attr.name === attribute.name ? { ...attrAlreadyExists, ...attribute } : attr;
          });
        } else {
          classTemplate.attributes.push(attribute);
        }
      }
    }

    /**
     * Handle events
     * 
     * In order to find `this.dispatchEvent` calls, we have to traverse a method's AST
     */
    if (ts.isMethodDeclaration(member)) {
      eventsVisitor(member, classTemplate);
    }
  });

  classTemplate?.members?.forEach(member => {
    getDefaultValuesFromConstructorVisitor(node, member);
  });

  /**
   * Inheritance
   */
  classTemplate = handleHeritage(classTemplate, moduleDoc, node);

  return classTemplate;
}

function eventsVisitor(source, classTemplate) {
  visitNode(source);

  function visitNode(node) {
    switch (node.kind) {
      case ts.SyntaxKind.CallExpression:

        /** If callexpression is `this.dispatchEvent` */
        if (isDispatchEvent(node)) {
          node?.arguments?.forEach((arg) => {
            if (arg.kind === ts.SyntaxKind.NewExpression) {
              let eventDoc = {
                name: '',
                type: {
                  text: '',
                },
              };

              eventDoc.name = arg.arguments[0].text;
              eventDoc.type = { text: arg.expression.text };
              eventDoc = handleJsDoc(eventDoc, node?.parent);

              classTemplate.events.push(eventDoc);
            }
          });

        }
    }

    ts.forEachChild(node, visitNode);
  }
}

export function getDefaultValuesFromConstructorVisitor(source, member) {
  visitNode(source);

  function visitNode(node) {
    switch (node.kind) {
      case ts.SyntaxKind.Constructor:
        /** 
         * For every member that was added in the classDoc, we want to add a default value if we can
         * To do this, we visit a class's constructor, and loop through the statements
         */
        node.body?.statements?.filter((statement) => statement.kind === ts.SyntaxKind.ExpressionStatement)
          .filter((statement) => statement.expression.kind === ts.SyntaxKind.BinaryExpression)
          .forEach((statement) => {
            if (
              statement.expression?.left?.name?.getText() === member.name &&
              member.kind === 'field'
            ) {
              member = handleJsDoc(member, statement);

              /** Only add defaults for primitives for now */
              if(isPrimitive(statement.expression.right)) {
                member.default = statement.expression.right.getText();
              }
            }
          });
        break;
    }

    ts.forEachChild(node, visitNode);
  }
}
