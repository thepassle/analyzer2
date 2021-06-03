@customElement('my-el1')
export class MyEl1 extends BlaElement {}

export class MyEl2 extends HTMLElement {}
export class MyEl3 extends LitElement {}
export class MyEl4 extends FASTElement {}

class MyEl5 extends BlaElement {}
customElements.define('my-el5', MyEl5);

// isCustomElement = false
export class Foo extends Something {}
// isCustomElement = false
export class Bar {}
