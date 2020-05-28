import{ VetproviehList } from '@tomuench/vetprovieh-list';
import { ObjectHelper, VetproviehElement } from '@tomuench/vetprovieh-shared';
/**
 * `vetprovieh-select`
 * Element for Selecting a Model out of a Data-Source.
 *
 * @customElement
 * @demo demo/index.html
 */
class VetproviehSelect extends VetproviehElement {

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
        <input id="search" class="input" type="text"/>
        <input id="currentValue" type="hidden"/>
        <div id="list" class="is-hidden">
        </div>
      </div>
    `;
  }

  static get observedAttributes() {
    return ['src','value', 'property', 'display'];
  }

  constructor(props) {
    super(props);

    this._properties = {
      src: null,
      list_element_template: null,
      searchList: null,
      value: null,
      property: null,
      display: null
    }
    let template  = this.querySelector("template");
    if(template) this._properties.list_element_template = template;
  }

  /**
   * @property {string|null} value
   */
  get value() {
    return this._properties.value;
  }

  set value(val) {
    if (val !== this.value) {
      this._properties.value = val;
      this._dispatchChange();
    }
  }

  /**
   * @property {string|null} display
   */
  get display() {
    return this._properties.display;
  }

  set display(val) {
    if (val !== this.display) {
      this._properties.display = val;
    }
  }

  /**
   * @property {string|null} property
   */
  get property() {
    return this._properties.property;
  }

  set property(val) {
    if (val !== this.property) {
      this._properties.property = val;
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
    this._addFieldListener();
  }

  _addFieldListener() {
    let searchField = this.shadowRoot.getElementById("search");

    if(!this._properties.searchList){
      this._properties.searchList = this._buildSearchList();
      this.shadowRoot.getElementById("list").appendChild(this._properties.searchList)
    }

    let searchDiv = this.shadowRoot.getElementById("list");
    let searchList = this._properties.searchList;
    searchField.addEventListener("keyup", (event) => {
        let value = event.target.value;
        if(value){
          searchDiv.classList.remove("is-hidden")
          searchList.search(event.target.value);
        } else {
          searchDiv.classList.add("is-hidden")
        }

    })
  }



  _dispatchChange() {
    let event = new Event('change', {target: this})
    this.dispatchEvent(event);
  }

  /**
   * Building Search-List
   * @returns {VetproviehList}
   * @private
   */
  _buildSearchList() {
    let searchList = new VetproviehList(this._properties.list_element_template);
    searchList.searchable = false;
    searchList.pageable = false;
    searchList.src = this.src;
    searchList.pagesize = 15;

    let _this = this;
    searchList.addEventListener("selected", (event) => {
      let searchField = this.shadowRoot.getElementById("search");
      searchField.value = ObjectHelper.get(event.data,_this.display);
      _this.value = ObjectHelper.get(event.data, _this.property);
      this.updateVisbility("list", false);
    })

    return searchList;
  }
}

window.customElements.define('vetprovieh-select', VetproviehSelect);
