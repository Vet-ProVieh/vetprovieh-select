import { VetproviehList } from '@tomuench/vetprovieh-list/lib/vetprovieh-list';
import { ObjectHelper, VetproviehElement } from '@tomuench/vetprovieh-shared/lib';
import { WebComponent, BaseRepository } from '@tomuench/vetprovieh-shared/lib';
/**
 * `vetprovieh-select`
 * Element for Selecting a Model out of a Data-Source.
 *
 * @customElement
 * @demo demo/index.html
 */

@WebComponent({
  template: VetproviehElement.template + `
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
            :host(.is-danger) input {
              border-color: #f14668;
             }
             :host(.is-success) input {
               border-color: #48c774;
             }
                 
            </style>
            <div>
              <input id="search" class="input" type="search"/>
              <input id="currentValue" type="hidden"/>
              <div id="list" class="is-hidden" style="overflow-y:scroll; max-height:12em">
                <vetprovieh-list id="farmerList"></vetprovieh-list>
              </div>
            </div>`,
  tag: 'vetprovieh-select'
})
export class VetproviehSelect extends VetproviehElement {

  /**
   * Observered Attributes
   * @return {Array<string>}
   */
  static get observedAttributes() {
    return ['value', 'property', 'display', 'internalprop'];
  }


  private _repository: BaseRepository<any>;
  private _list_element_template: HTMLTemplateElement;
  private _searchList: VetproviehList;
  private _value: string;
  private _property: string;
  private _internalProperty: string;
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


  get internalprop(): string {
    return this._internalProperty;
  }

  set internalprop(v: string) {
    this._internalProperty = v;
  }

  /**
   * @property {BaseRepository|null} value
   */
  get repository() {
    return this._repository;
  }

  set repository(val) {
    if (val !== this.repository) {
      this._repository = val;
      this._addFieldListener();
    }
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
      if (val && !this.internalprop) this._internalProperty = val.substring(val.indexOf(".") + 1);
    }
  }

  /**
   * Deactivate-Field
   */
  public disable() {
    console.log("Disable field")
    this.searchField.disabled = true;
  }

  connectedCallback() {
    super.connectedCallback();
  }

  /**
   * Add Listener to Search
   */
  _addFieldListener() {
    let searchField = this.shadowRoot.getElementById("search");

    if (!this._searchList) {
      this._searchList = this._buildSearchList();
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
   * Is Element Valid?
   * @return {Boolean}
   */
  public reportValidity(): Boolean {
    return this.value !== undefined && this.value !== null;
  }

  /**
   * Dispatch Change event to the outer World
   */
  _dispatchChange() {
    let eventData = { target: this };
    let event = new Event('change')
    this.dispatchEvent(event);
    this.dispatchEvent(new Event("blur"));
  }

  _presetInput(searchList: VetproviehList) {
    if (this.value) {
      searchList._filterObjects(this.value);
      searchList.addEventListener("loaded", (event) => {
        let obj = searchList.objects.filter((obj) => obj[this._internalProperty].toString() === this.value.toString())[0];
        console.log("loaded select");
        if (obj) {
          this.searchField.value = ObjectHelper.get(obj, this.display);
        }
      })
    }
  }

  private get searchField(): HTMLInputElement {
    return this.shadowRoot.getElementById("search") as HTMLInputElement;
  }

  /**
   * Building Search-List
   * @returns {VetproviehList}
   * @private
   */
  _buildSearchList() {
    let searchList = this.shadowRoot.getElementById("farmerList") as VetproviehList;
    searchList.setlistTemplate(this._list_element_template);
    searchList.searchable = false;
    searchList.pageable = false;
    searchList.repository = this.repository;
    searchList.pagesize = 15;

    this._presetInput(searchList);

    let _this = this;
    searchList.addEventListener("selected", (event) => {
      let data = (event as any).detail;
      this.searchField.value = ObjectHelper.get(data, _this.display);
      _this.value = ObjectHelper.get(data, _this._internalProperty);
      this.updateVisibility("list", false);
    })

    return searchList;
  }
}

