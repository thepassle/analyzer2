export class GenericDisclosure extends HTMLElement {
  __open(dispatch) {
    if (dispatch) {
      this.dispatchEvent(
        new CustomEvent('opened-changed', {
          detail: true,
        }),
      );
    }
  }

  __close() {
    this.dispatchEvent(
      new CustomEvent('opened-changed', {
        detail: false,
      }),
    );
  }
}
