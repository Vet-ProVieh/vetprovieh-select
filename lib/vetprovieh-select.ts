import {VetproviehList} from '@vetprovieh/vetprovieh-list/lib/vetprovieh-list';
import {
  ObjectHelper,
  VetproviehElement,
} from '@vetprovieh/vetprovieh-shared/lib';
import {WebComponent, BaseRepository} from '@vetprovieh/vetprovieh-shared/lib';
/**
 * `vetprovieh-select`
 * Element for Selecting a Model out of a Data-Source.
 *
 * @customElement
 * @demo demo/index.html
 */

// eslint-disable-next-line new-cap
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
              <div id="list" class="is-hidden"
                style="overflow-y:scroll; max-height:12em">
                <vetprovieh-list id="farmerList"></vetprovieh-list>
              </div>
            </div>`,
  tag: 'vetprovieh-select',
})
/**
 * VetproviehSelect
 * Select an Element out of a Datasource.
 */
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

  public selectedObject: any;

  /**
   * Defaultkonstructor
   * @param {HTMLTemplateElement} template
   */
  constructor(template: HTMLTemplateElement = undefined) {
    super();

    const templateInHTML = this.querySelector('template');
    if (template) this._list_element_template = template;
    else if (templateInHTML) this._list_element_template = templateInHTML;
  }


  /**
   * Getting InternalProp
   * @return {string}
   */
  get internalprop(): string {
    return this._internalProperty;
  }

  /**
   * Setter InternalProp
   * @param {string} v
   */
  set internalprop(v: string) {
    if (this._internalProperty !== v) {
      this._internalProperty = v;
    }
  }

  /**
   * Get Repository
   * @return {BaseRepository|null}
   */
  get repository() : BaseRepository<any> | null {
    return this._repository;
  }

  /**
   * Set Repository
   * @param {BaseRepository|null} val
   */
  set repository(val : BaseRepository<any> | null) {
    if (val !== this.repository) {
      this._repository = val;
      this._addFieldListener();
    }
  }

  /**
   * Get Selected value
   * @return {string|null}
   */
  get value() : string | null {
    return this._value;
  }

  /**
   * Set Selected value
   * @param {string|null} val
   */
  set value(val: string | null) {
    if (val !== this.value) {
      this._value = val;
      this._dispatchChange();
    }
  }

  /**
   * get Display
   * @return {string|null}
   */
  get display() : string | null {
    return this._display;
  }

  /**
   * Set Display
   * @param {string|null} val
   */
  set display(val : string | null) {
    if (val !== this.display) {
      this._display = val;
    }
  }

  /**
   * Property for select
   * @return {string|null}
   */
  get property() : string | null {
    return this._property;
  }

  /**
   * Set Property for select
   * @param {string|null} val
   */
  set property(val : string | null) {
    if (val !== this.property) {
      this._property = val;
      if (val && !this.internalprop) {
        this._internalProperty = val.substring(val.indexOf('.') + 1);
      }
    }
  }

  /**
   * Deactivate-Field
   */
  public disable() {
    console.log('Disable field');
    this.searchField.disabled = true;
  }

  /**
   * ConnectedCallback
   */
  connectedCallback() {
    super.connectedCallback();
  }

  /**
   * Add Listener to Search
   * @private
   */
  private _addFieldListener() {
    const searchField = this.shadowRoot.getElementById('search');

    if (!this._searchList) {
      this._searchList = this._buildSearchList();
    }

    searchField.addEventListener('keyup', (event) => {
      const target = event.target as HTMLInputElement;
      this.search(target.value);
    });
  }

  /**
   * Search vor Value
   * @param {string} value
   */
  public search(value: string) {
    const searchDiv = this.shadowRoot.getElementById('list');
    const searchList = this._searchList;

    if (value) {
      searchDiv.classList.remove('is-hidden');
      searchList.search(value);
    } else {
      searchDiv.classList.add('is-hidden');
    }
  }

  /**
   * Is Element Valid?
   * @return {Boolean}
   */
  public reportValidity(): boolean {
    return this.value !== undefined && this.value !== null;
  }

  /**
   * Dispatch Change event to the outer World
   * @private
   */
  private _dispatchChange() {
    const event = new Event('change');
    this.dispatchEvent(event);
    this.dispatchEvent(new Event('blur'));
  }

  /**
   * Preset Input
   * @private
   * @param {VetproviehList} searchList
   */
  private _presetInput(searchList: VetproviehList) {
    if (this.value) {
      searchList._filterObjects(this.value);
      searchList.addEventListener('loaded', () => {
        const obj = searchList.objects
            .filter((obj) => {
              const internalValue = obj[this._internalProperty];
              return internalValue.toString() === this.value.toString();
            })[0];
        console.log('loaded select');
        if (obj) {
          this.searchField.value = ObjectHelper.get(obj, this.display);
        }
      });
    }
  }

  /**
   * Getting Search-Input
   * @return {HTMLInputElement}
   */
  private get searchField(): HTMLInputElement {
    return this.shadowRoot.getElementById('search') as HTMLInputElement;
  }

  /**
   * Getting Vetprovieh-List
   * @return {VetproviehList}
   */
  private get list() : VetproviehList {
    return this.shadowRoot.getElementById('farmerList') as VetproviehList;
  }

  /**
   * Building Search-List
   * @return {VetproviehList}
   * @private
   */
  private _buildSearchList() {
    const searchList = this.list;
    searchList.setlistTemplate(this._list_element_template);
    searchList.searchable = false;
    searchList.pageable = false;
    searchList.repository = this.repository;
    searchList.pagesize = 15;

    this._presetInput(searchList);

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;
    searchList.addEventListener('selected', (event) => {
      const data = (event as any).detail;
      this.searchField.value = ObjectHelper.get(data, _this.display);
      _this.selectedObject = data;
      _this.value = ObjectHelper.get(data, _this._internalProperty);
      this.updateVisibility('list', false);
    });

    return searchList;
  }
}

