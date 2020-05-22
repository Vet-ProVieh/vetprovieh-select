import{ VetproviehList } from '@tomuench/vetprovieh-list';

/**
 * `vetprovieh-select`
 * Element for Selecting a Model out of a Data-Source.
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class VetproviehSelect extends HTMLElement {

  static get template() {
    return `
      <link href="../node_modules/bulma/css/bulma.min.css" rel="stylesheet" type="text/css">
      <input id="search" class="input" type="text"/>
      <div id="list">
      x
        <vetprovieh-list src="names/index.json" pagesize="5">
            <template>
                <span>{{firstname}}</span>
            </template>
        </vetprovieh-list>
      </div>
    `;
  }

  constructor(props) {
    super(props);

    this._properties = {
      src: null
    }
  }


  /**
   * @property {string|null} src
   */
  get src() {
    return this._properties.src;
  }

  set src(val) {
    if (val !== this.src) {
      this._properties.src = val;
    }
  }

  connectedCallback() {
    // Lazy creation of shadowRoot.
    if (!this.shadowRoot) {
      this.attachShadow({
        mode: 'open'
      }).innerHTML = VetproviehSelect.template;
    }
  }

}

window.customElements.define('vetprovieh-select', VetproviehSelect);
