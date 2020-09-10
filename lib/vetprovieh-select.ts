import { VetproviehList } from '@tomuench/vetprovieh-list/lib/vetprovieh-list';
import { ObjectHelper, VetproviehElement } from '@tomuench/vetprovieh-shared';
/**
 * `vetprovieh-select`
 * Element for Selecting a Model out of a Data-Source.
 *
 * @customElement
 * @demo demo/index.html
 */
export class VetproviehSelect extends VetproviehElement {

  /**
   * Getting Template
   * @return {string}
   */
  static get template() {
    return super.template + `
      <style>
      #list {
        box-shadow: 1px 3px 5px #C0C0C0;
        margin-top: -20px;
        margin-left: 10px;
        width:100%;
        position: absolute;
        z-index: 1000;
        background: white;
        }
      </style>
      <div>
        <input id="search" class="input" type="search"/>
        <input id="currentValue" type="hidden"/>
        <div id="list" class="is-hidden">
        </div>
      </div>
    `;
  }

  /**
   * Observered Attributes
   * @return {Array<string>}
   */
  static get observedAttributes() {
    return ['src', 'value', 'property', 'display'];
  }


  private _src: string = "";
  private _list_element_template: HTMLTemplateElement;
  private _searchList: VetproviehList;
  private _value: string;
  private _property: string;
  private _display: string;

  /**
   * Defaultkonstructor
   * @param props 
   */
  constructor(props = {}) {
    super();

    let template = this.querySelector("template");
    if (template) this._list_element_template = template;
  }

  /**
   * @property {string|null} value
   */
  get value() {
    return this._value;
  }

  set value(val) {
    if (val !== this.value) {
      this._value = val;
      this._dispatchChange();
    }
  }

  /**
   * @property {string|null} display
   */
  get display() {
    return this._display;
  }

  set display(val) {
    if (val !== this.display) {
      this._display = val;
    }
  }

  /**
   * @property {string|null} property
   */
  get property() {
    return this._property;
  }

  set property(val) {
    if (val !== this.property) {
      this._property = val;
    }
  }

  /**
   * @property {string|null} src
   */
  get src() {
    return this._src;
  }

  set src(val) {
    if (val !== this.src) {
      this._src = val;
    }
  }

  connectedCallback() {
    // Lazy creation of shadowRoot.
    if (!this.shadowRoot) {
      this.attachShadow({
        mode: 'open'
      }).innerHTML = VetproviehSelect.template;
    }
    this._addFieldListener();
  }

  /**
   * Add Listener to Search
   */
  _addFieldListener() {
    let searchField = this.shadowRoot.getElementById("search");

    if (!this._searchList) {
      this._searchList = this._buildSearchList();
      this.shadowRoot.getElementById("list").appendChild(this._searchList)
    }

    let searchDiv = this.shadowRoot.getElementById("list");
    let searchList = this._searchList;
    searchField.addEventListener("keyup", (event) => {
      let target = event.target as HTMLInputElement;
      let value = target.value;
      if (value) {
        searchDiv.classList.remove("is-hidden")
        searchList.search(target.value);
      } else {
        searchDiv.classList.add("is-hidden")
      }

    })
  }


  /**
   * Dispatch Change event to the outer World
   */
  _dispatchChange() {
    let eventData =  { target: this };
    let event = new Event('change')
    this.dispatchEvent(event);
  }

  /**
   * Building Search-List
   * @returns {VetproviehList}
   * @private
   */
  _buildSearchList() {
    let searchList = new VetproviehList(this._list_element_template);
    searchList.searchable = false;
    searchList.pageable = false;
    searchList.src = this.src;
    searchList.pagesize = 15;

    let _this = this;
    searchList.addEventListener("selected", (event) => {
      let searchField = this.shadowRoot.getElementById("search") as HTMLInputElement;
      let data = (event as any).data;
      searchField.value = ObjectHelper.get(data, _this.display);
      _this.value = ObjectHelper.get(data, _this.property);
      this.updateVisibility("list", false);
    })

    return searchList;
  }
}

window.customElements.define('vetprovieh-select', VetproviehSelect);
