export class BatchingElement extends HTMLElement {
  superClassField;
  static observedAttributes = [...super.observedAttributes, 'superClass-attr'];
  superClassMethod() {
    this.dispatchEvent(new Event('superClass-event'))
  }
}
export class MyElement extends BatchingElement {
  classField;
  static observedAttributes = [...super.observedAttributes, 'class-attr'];
  classMethod() {
    this.dispatchEvent(new Event('class-event'))
  }
}
