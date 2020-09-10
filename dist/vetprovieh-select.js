/**
 * Helper to get and set Attributes on Objects
 */
class ObjectHelper {
    /**
     * Checking if the Element is an Object
     * @param obj
     */
    static isObject(obj) {
        return obj != null && typeof (obj) === 'object';
    }
    /**
       * Getting Value from JSON-Object
       * @param {Indexable} object
       * @param {string} key
       * @return {any}
       */
    static get(object, key) {
        try {
            const attributes = key.split('.');
            return this._iterateThrough(object, attributes);
        }
        catch (ex) {
            return undefined;
        }
    }
    /**
       * Iterating Through Object
       * @param {Indexable} obj
       * @param {string[]} attributes
       * @param {number} depth
       * @return {any}
       * @private
       */
    static _iterateThrough(obj, attributes, depth = 0) {
        if (depth < 0)
            return undefined;
        while (attributes.length > depth) {
            const attribute = attributes.shift();
            if (!obj)
                throw new Error('Unknown Key');
            obj = obj[attribute];
        }
        return obj;
    }
    /**
       * Setting value for Object
       * @param {Indexable} object
       * @param {string} key
       * @param {any} value
       */
    static set(object, key, value) {
        const attributes = key.split('.');
        object = this._iterateThrough(object, attributes, 1);
        const property = attributes[0];
        object[property] = value;
    }
    /**
       * Object to String
       * @param {Object} obj
       * @return {string}
       */
    static objectToStringDeep(obj) {
        if (!obj)
            return '';
        return Object.keys(obj).map((k) => {
            const value = obj[k];
            if (typeof (value) == 'object') {
                return ObjectHelper.objectToStringDeep(value);
            }
            else {
                return value;
            }
        }).toString();
    }
}

/**
 * Helpers for View
 */
class ViewHelper {
    /**
       * Mark text yellow inside an element.
       * @param {Node} element
       * @param {string} input
       */
    static markElement(element, input) {
        if (input != '') {
            element.childNodes.forEach((n) => {
                const value = n.nodeValue || '';
                if (n.nodeName === '#text' && value.indexOf(input) >= 0) {
                    element.innerHTML = n['data']
                        .split(input)
                        .join('<mark>' + input + '</mark>');
                }
                else {
                    ViewHelper.markElement(n, input);
                }
            });
        }
    }
    /**
     * Getting URL-Parameter from address
     * @param {string} key
     * @return {string}
     */
    static getParameter(key) {
        const urlString = window.location.href;
        const url = new URL(urlString);
        const value = url.searchParams.get(key);
        return value;
    }
    /**
       * Regex to fill keys in template
       * @return {RegExp}
       */
    static get regexTemplate() {
        return /{{([a-zA-Z0-9\.]+)}}/;
    }
    /**
       * Replacing Placeholders in template from the loaded element
       * @param {HTMLElement} template
       * @param {Indexable} e
       */
    static replacePlaceholders(template, e) {
        let match = null;
        while (match = template.innerHTML.match(ViewHelper.regexTemplate)) {
            let value = ObjectHelper.get(e, match[1]);
            value = value || '';
            template.innerHTML = template.innerHTML.replace(match[0], value);
        }
    }
}

/**
 * BaseClass for view Elements
 */
class VetproviehElement extends HTMLElement {
    /**
       * Callback Implementation
       * @param {string} name
       * @param {any} old
       * @param {any} value
       */
    attributeChangedCallback(name, old, value) {
        if (old !== value) {
            this[name] = value;
        }
    }
    /**
     * Loading HTML-Element From ShadowRoot
     * @param {string} id
     * @return {HTMLElement | undefined}
     */
    getByIdFromShadowRoot(id) {
        if (this.shadowRoot) {
            return this.shadowRoot.getElementById(id);
        }
    }
    /**
       * Hide Or Show Element
       * @param {string} id
       * @param {boolean} show
       */
    updateVisibility(id, show) {
        const search = this.getByIdFromShadowRoot(id);
        if (search) {
            if (!show) {
                search.classList.add('is-hidden');
            }
            else {
                search.classList.remove('is-hidden');
            }
        }
    }
    // -----------------
    // CLASS METHODS
    // -----------------
    /**
       * Getting Template
       * @return {string}
       */
    static get template() {
        return `<link href="/node_modules/bulma/css/bulma.min.css" 
                  rel="stylesheet" type="text/css">`;
    }
}

/**
 * Repeats Template Element. Amount is set by the amount of objects
 * inside
 */
class VetproviehRepeat extends VetproviehElement {
    /**
     * Default-Contructor
     * @param {HTMLTemplateElement} pListTemplate
     */
    constructor(pListTemplate = undefined) {
        super();
        this._objects = [];
        this._orderBy = "+position";
        const listTemplate = pListTemplate || this.querySelector('template');
        if (listTemplate) {
            this._listTemplate = listTemplate.content;
        }
        else {
            this._listTemplate = new DocumentFragment();
        }
    }
    /**
      * Getting View Template
      * @return {string}
      */
    static get template() {
        return VetproviehElement.template + `<div id="listElements"></div>`;
    }
    /**
       * Getting observed Attributes
       * @return {string[]}
       */
    static get observedAttributes() {
        return ['objects', 'orderBy'];
    }
    /**
     * Get objects
     * @return {Array<any>}
     */
    get objects() {
        return this._objects;
    }
    /**
     * Set objects
     * @param {Array<any>} v
     */
    set objects(v) {
        if (this._objects != v) {
            this._objects = v;
            this.clearAndRender();
        }
    }
    /**
    * Get OrderBy
    * Expect "+position" for asceding positon
    * Expect "-position" for descending position
    * @return {string}
    */
    get orderBy() {
        return this._orderBy;
    }
    /**
     * Set OrderBy
     * @param {string} v
     */
    set orderBy(v) {
        if (this._orderBy != v) {
            this._orderBy = v;
            this.clearAndRender();
        }
    }
    /**
    * Connected Callback
    */
    connectedCallback() {
        this._initalizeShadowRoot(VetproviehRepeat.template);
        this.renderList();
    }
    /**
     * Clear and Render
     */
    clearAndRender() {
        this.clear();
        this._sortObjects();
        this.renderList();
    }
    /**
     * Sorting Objects
     */
    _sortObjects() {
        try {
            let asc = this.orderBy.substring(0, 1) == "+" ? 1 : -1;
            let argument = this.orderBy.substring(1);
            this.objects = this.objects
                .sort((a, b) => {
                let aValue = a[argument];
                let bValue = b[argument];
                return (aValue - bValue) * asc;
            });
        }
        catch (e) {
        }
    }
    /**
     * List will be cleared
     */
    clear() {
        const list = this.list;
        if (list)
            list.innerHTML = '';
    }
    /**
     * Rendering List-Content
     */
    renderList() {
        this.objects
            .forEach((obj, index) => {
            this._attachToList(obj, index);
        });
    }
    /**
     * Inserts Element to List
     * @param {any} dataItem
     * @param {index} number
     * @private
     */
    _attachToList(dataItem, index = 0) {
        if (this.shadowRoot) {
            const newListItem = this._generateListItem(dataItem);
            dataItem["index"] = index;
            ViewHelper.replacePlaceholders(newListItem, dataItem);
            const list = this.list;
            if (list) {
                list.appendChild(newListItem.children[0]);
            }
        }
    }
    /**
     * Getting List Element
     * @return {HTMLElement | undefined}
     */
    get list() {
        if (this.shadowRoot) {
            return this.shadowRoot.getElementById('listElements');
        }
        else {
            return undefined;
        }
    }
    /**
    * Generate new Item for List which is based on the template
    * @param {any} dataItem
    * @param {boolean} activatedEventListener
    * @return {HTMLDivElement}
    * @private
    */
    _generateListItem(dataItem, activatedEventListener = false) {
        const newNode = document.importNode(this._listTemplate, true);
        const div = document.createElement('div');
        if (activatedEventListener) {
            div.addEventListener('click', () => {
                const selectedEvent = new Event('selected');
                selectedEvent['data'] = dataItem;
                this.dispatchEvent(selectedEvent);
            });
        }
        div.appendChild(newNode);
        return div;
    }
    /**
     * Intializing Shadow-Root
     * @param {string} template
     * @protected
     */
    _initalizeShadowRoot(template) {
        // Lazy creation of shadowRoot.
        if (!this.shadowRoot) {
            super.attachShadow({
                mode: 'open',
            }).innerHTML = template;
        }
    }
}
if (!customElements.get('vp-repeat')) {
    customElements.define('vp-repeat', VetproviehRepeat);
}

/**
 * Helper to get and set Attributes on Objects
 */
class ObjectHelper$1 {
    /**
       * Getting Value from JSON-Object
       * @param {Indexable} object
       * @param {string} key
       * @return {any}
       */
    static get(object, key) {
        try {
            const attributes = key.split('.');
            return this._iterateThrough(object, attributes);
        }
        catch (ex) {
            return undefined;
        }
    }
    /**
       * Iterating Through Object
       * @param {Indexable} obj
       * @param {string[]} attributes
       * @param {number} depth
       * @return {any}
       * @private
       */
    static _iterateThrough(obj, attributes, depth = 0) {
        if (depth < 0)
            return undefined;
        while (attributes.length > depth) {
            const attribute = attributes.shift();
            if (!obj)
                throw new Error('Unknown Key');
            obj = obj[attribute];
        }
        return obj;
    }
    /**
       * Setting value for Object
       * @param {Indexable} object
       * @param {string} key
       * @param {any} value
       */
    static set(object, key, value) {
        const attributes = key.split('.');
        object = this._iterateThrough(object, attributes, 1);
        const property = attributes[0];
        object[property] = value;
    }
    /**
       * Object to String
       * @param {Object} obj
       * @return {string}
       */
    static objectToStringDeep(obj) {
        if (!obj)
            return '';
        return Object.keys(obj).map((k) => {
            const value = obj[k];
            if (typeof (value) == 'object') {
                return ObjectHelper$1.objectToStringDeep(value);
            }
            else {
                return value;
            }
        }).toString();
    }
}

/**
 * Helpers for View
 */
class ViewHelper$1 {
    /**
       * Mark text yellow inside an element.
       * @param {Node} element
       * @param {string} input
       */
    static markElement(element, input) {
        if (input != '') {
            element.childNodes.forEach((n) => {
                const value = n.nodeValue || '';
                if (n.nodeName === '#text' && value.indexOf(input) >= 0) {
                    element.innerHTML = n['data']
                        .split(input)
                        .join('<mark>' + input + '</mark>');
                }
                else {
                    ViewHelper$1.markElement(n, input);
                }
            });
        }
    }
    /**
     * Getting URL-Parameter from address
     * @param {string} key
     * @return {string}
     */
    static getParameter(key) {
        const urlString = window.location.href;
        const url = new URL(urlString);
        const value = url.searchParams.get(key);
        return value;
    }
    /**
       * Regex to fill keys in template
       * @return {RegExp}
       */
    static get regexTemplate() {
        return /{{([a-zA-Z0-9\.]+)}}/;
    }
    /**
       * Replacing Placeholders in template from the loaded element
       * @param {HTMLElement} template
       * @param {Indexable} e
       */
    static replacePlaceholders(template, e) {
        let match = null;
        while (match = template.innerHTML.match(ViewHelper$1.regexTemplate)) {
            let value = ObjectHelper$1.get(e, match[1]);
            value = value || '';
            template.innerHTML = template.innerHTML.replace(match[0], value);
        }
    }
}

/**
 * BaseClass for view Elements
 */
class VetproviehElement$1 extends HTMLElement {
    /**
       * Callback Implementation
       * @param {string} name
       * @param {any} old
       * @param {any} value
       */
    attributeChangedCallback(name, old, value) {
        if (old !== value) {
            this[name] = value;
        }
    }
    /**
     * Loading HTML-Element From ShadowRoot
     * @param {string} id
     * @return {HTMLElement | undefined}
     */
    getByIdFromShadowRoot(id) {
        if (this.shadowRoot) {
            return this.shadowRoot.getElementById(id);
        }
    }
    /**
       * Hide Or Show Element
       * @param {string} id
       * @param {boolean} show
       */
    updateVisibility(id, show) {
        const search = this.getByIdFromShadowRoot(id);
        if (search) {
            if (!show) {
                search.classList.add('is-hidden');
            }
            else {
                search.classList.remove('is-hidden');
            }
        }
    }
    // -----------------
    // CLASS METHODS
    // -----------------
    /**
       * Getting Template
       * @return {string}
       */
    static get template() {
        return `<link href="/node_modules/bulma/css/bulma.min.css" 
                  rel="stylesheet" type="text/css">`;
    }
}

/**
 * Repeats Template Element. Amount is set by the amount of objects
 * inside
 */
class VetproviehRepeat$1 extends VetproviehElement$1 {
    /**
     * Default-Contructor
     * @param {HTMLTemplateElement} pListTemplate
     */
    constructor(pListTemplate = undefined) {
        super();
        this._objects = [];
        const listTemplate = pListTemplate || this.querySelector('template');
        if (listTemplate) {
            this._listTemplate = listTemplate.content;
        }
        else {
            this._listTemplate = new DocumentFragment();
        }
    }
    /**
      * Getting View Template
      * @return {string}
      */
    static get template() {
        return VetproviehElement$1.template + `<div id="listElements"></div>`;
    }
    /**
       * Getting observed Attributes
       * @return {string[]}
       */
    static get observedAttributes() {
        return ['objects'];
    }
    /**
     * Get objects
     * @return {Array<any>}
     */
    get objects() {
        return this._objects;
    }
    /**
     * Set objects
     * @param {Array<any>} v
     */
    set objects(v) {
        if (this._objects != v) {
            this._objects = v;
            this.clearAndRender();
        }
    }
    /**
    * Connected Callback
    */
    connectedCallback() {
        this._initalizeShadowRoot(VetproviehRepeat$1.template);
        this.renderList();
    }
    /**
     * Clear and Render
     */
    clearAndRender() {
        this.clear();
        this.renderList();
    }
    /**
     * List will be cleared
     */
    clear() {
        const list = this.list;
        if (list)
            list.innerHTML = '';
    }
    /**
     * Rendering List-Content
     */
    renderList() {
        this.objects.forEach((obj) => {
            this._attachToList(obj);
        });
    }
    /**
     * Inserts Element to List
     * @param {any} dataItem
     * @private
     */
    _attachToList(dataItem) {
        console.log('w');
        if (this.shadowRoot) {
            const newListItem = this._generateListItem(dataItem);
            ViewHelper$1.replacePlaceholders(newListItem, dataItem);
            const list = this.list;
            if (list) {
                list.appendChild(newListItem);
            }
        }
    }
    /**
     * Getting List Element
     * @return {HTMLElement | undefined}
     */
    get list() {
        if (this.shadowRoot) {
            return this.shadowRoot.getElementById('listElements');
        }
        else {
            return undefined;
        }
    }
    /**
    * Generate new Item for List which is based on the template
    * @param {any} dataItem
    * @param {boolean} activatedEventListener
    * @return {HTMLDivElement}
    * @private
    */
    _generateListItem(dataItem, activatedEventListener = false) {
        const newNode = document.importNode(this._listTemplate, true);
        const div = document.createElement('div');
        if (activatedEventListener) {
            div.addEventListener('click', () => {
                const selectedEvent = new Event('selected');
                selectedEvent['data'] = dataItem;
                this.dispatchEvent(selectedEvent);
            });
        }
        div.appendChild(newNode);
        return div;
    }
    /**
     * Intializing Shadow-Root
     * @param {string} template
     */
    _initalizeShadowRoot(template) {
        // Lazy creation of shadowRoot.
        if (!this.shadowRoot) {
            super.attachShadow({
                mode: 'open',
            }).innerHTML = template;
        }
    }
}
if (!customElements.get('vp-repeat')) {
    customElements.define('vp-repeat', VetproviehRepeat$1);
}

/**
 * Paging Class
 */
class VetproviehPager extends VetproviehElement$1 {
    constructor() {
        super(...arguments);
        this._properties = {
            page: 1,
            maximum: 1,
        };
    }
    /**
     * Observed Attributes
     * @return {Array<string>}
     */
    static get observedAttributes() {
        return ['page', 'maximum'];
    }
    /**
     * Template for Pager
     * @return {string}
     */
    static get template() {
        return super.template + `
        <style>
          :host {
            display: block;
          }
        </style>
        <nav class="pagination is-centered is-small" role="navigation" 
             aria-label="pagination">
          <ul id="pager" class="pagination-list">
          </ul>
        </nav>`;
    }
    /**
     * Page Getter
     * @property {number|null} page
     */
    get page() {
        return this._properties.page;
    }
    /**
     * Setting page
     * @param {number} val
     */
    set page(val) {
        if (typeof (val) === 'string')
            val = parseInt(val);
        if (val !== this.page && val <= this.maximum && val > 0) {
            this._properties.page = val;
            this._updateRendering();
        }
    }
    /**
     * @property {number|null} maximum
     */
    get maximum() {
        return this._properties.maximum;
    }
    /**
     * Setting Maximum
     * @param {number} val
     */
    set maximum(val) {
        if (val !== this.maximum) {
            this._properties.maximum = val;
            this._updateRendering();
        }
    }
    /**
     * Render Pages for Pager
     * @private
     */
    _renderPages() {
        const pager = this.getByIdFromShadowRoot('pager');
        pager.appendChild(this._renderPage(1));
        this._addBlankPage(pager, this.page > 3);
        for (let i = -1; i < 2; i++) {
            const toDisplayPage = this.page + i;
            if (toDisplayPage > 1 && toDisplayPage < this.maximum) {
                pager.appendChild(this._renderPage(toDisplayPage));
            }
        }
        this._addBlankPage(pager, this.page < this.maximum - 2);
        if (this.maximum != 1) {
            pager.appendChild(this._renderPage(this.maximum));
        }
    }
    /**
     * render Page placeholder
     * @param {HTMLElement} pager
     * @param {boolean} show
     * @private
     */
    _addBlankPage(pager, show) {
        if (show) {
            const li = document.createElement('li');
            const span = document.createElement('span');
            span.classList.add('pagination-ellipsis');
            span.innerHTML = '&hellip;';
            li.appendChild(span);
            pager.appendChild(li);
        }
    }
    /**
     * Render Single page Button
     * @param {number} page
     * @return {HTMLLIElement} Element
     * @private
     */
    _renderPage(page) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.classList.add('pagination-link');
        if (page === this.page) {
            a.classList.add('is-current');
        }
        a.onclick = (event) => this._pageClickedEvent(this, event);
        a.title = 'Open Page #' + this.page;
        const linkText = document.createTextNode(page.toString());
        a.appendChild(linkText);
        li.appendChild(a);
        return li;
    }
    /**
     * Page-Button has been clicked
     * @param {VetproviehPager} pager
     * @param {Event} event
     * @private
     */
    _pageClickedEvent(pager, event) {
        pager.page = parseInt(event.target.innerText);
        pager.dispatchEvent(new Event('change'));
    }
    /**
     * Connected Callback
     */
    connectedCallback() {
        // Lazy creation of shadowRoot.
        if (!this.shadowRoot) {
            this.attachShadow({
                mode: 'open',
            }).innerHTML = VetproviehPager.template;
        }
        this._updateRendering();
    }
    /**
     * @private
     */
    _updateRendering() {
        if (this.shadowRoot) {
            const pager = this.getByIdFromShadowRoot('pager');
            pager.innerHTML = '';
            this._renderPages();
        }
    }
}
if (!customElements.get('vetprovieh-pager')) {
    customElements.define('vetprovieh-pager', VetproviehPager);
}

/**
 * List Element for Vet:Provieh
 * Reads Data from Webservice an shows it.
 * @property {boolean} searchable
 * @property {boolean} pageable
 * @property {string} src
 */
class VetproviehList extends VetproviehElement {
    /**
     * Default Constructor
     * accepts a template as parameter
     * @param {HTMLTemplateElement} pListTemplate
     */
    constructor(pListTemplate = undefined) {
        super();
        this._src = "";
        this._pagesize = 0;
        this._searchable = true;
        this._pageable = true;
        this._page = 1;
        this._maxPage = 1;
        const listTemplate = pListTemplate || this.querySelector('template');
        if (listTemplate) {
            this._listTemplate = listTemplate.content;
        }
    }
    /**
     * Getting View Template
     * @return {string}
     */
    static get template() {
        return VetproviehElement.template + ` 
    <style>
      :host {
        display: block;
      }
      #listElements div{
        cursor: pointer;
      }
      #listElements div:hover {
        background-color: #F0F0F0 !important;
      }
    </style>
  
    <!-- SearchControl on Top -->
    <div id="searchControl" class="control">
      <input id="search" class="input" type="text" 
             placeholder="Bitte Suchbegriff eingeben">
    </div>
  
    <!-- Listing Elements here -->
    <div id="listElements" style="margin-top:20px;">
  
    </div>
    <!-- Pager for Paging through List-->
    <vetprovieh-pager id="pager" page="1" maximum="7">
    </vetprovieh-pager>`;
    }
    /**
     * Getting observed Attributes
     * @return {string[]}
     */
    static get observedAttributes() {
        return ['src', 'pagesize', 'searchable', 'pageable'];
    }
    /**
     * Getter searchable
     * @property {string|null} searchable
     */
    get searchable() {
        return this._searchable;
    }
    /**
     * Setter Searchable
     * @param {boolean} val
     */
    set searchable(val) {
        if (val !== this.searchable) {
            this._searchable = val;
            super.updateVisibility('searchControl', this.searchable);
        }
    }
    /**
     * Getter Pageable
     * @property {string|null} pageable
     */
    get pageable() {
        return this._pageable;
    }
    /**
     * Setter Pageable
     * @param {boolean} val
     */
    set pageable(val) {
        if (val !== this.pageable) {
            this._pageable = val;
            this._updatePager();
        }
    }
    /**
     * Getter src
     * @property {string|null} src
     * @return {string}
     */
    get src() {
        return this._src;
    }
    /** *
     * Setter Src
     * @param {string} val
     */
    set src(val) {
        if (val !== this.src) {
            this._src = this._replaceParams(val);
            this._fetchDataFromServer();
        }
    }
    _replaceParams(val) {
        let newSrc = val;
        let regex = /{{([a-zA-Z0-9]+)}}/;
        const url = new URL(window.location.href);
        const matches = newSrc.match(regex);
        if (matches) {
            matches.shift();
            matches.forEach((m) => {
                newSrc = newSrc.replace("{{" + m + "}}", url.searchParams.get(m));
            });
        }
        return newSrc;
    }
    /**
     * Getter pagesize
     * @property {int} pagesize
     * @return {int}
     */
    get pagesize() {
        return this._pagesize;
    }
    /**
     * Setter Pagesize
     * @param {int} val
     */
    set pagesize(val) {
        if (val !== this.pagesize) {
            this._pagesize = val;
            this._fetchDataFromServer();
        }
    }
    /**
     * Getter CurrentPage
     * @property {int} page
     * @return {int}
     */
    get page() {
        return this._page;
    }
    /**
     * Setter CurrentPage
     * @param {int} val
     */
    set page(val) {
        if (val !== this.page && val <= this.maxPage) {
            this._page = val;
            this._updatePager();
        }
    }
    /**
     * Getter MaxPage
     * @property {int} maxPage
     * @return {int}
     */
    get maxPage() {
        return this._maxPage;
    }
    /**
     * Setter MaxPage
     * @param {int} val
     */
    set maxPage(val) {
        if (val !== this.maxPage) {
            this._maxPage = val;
            this._updatePager();
        }
    }
    /**
     * Connected Callback
     */
    connectedCallback() {
        // Lazy creation of shadowRoot.
        if (!this.shadowRoot) {
            super.attachShadow({
                mode: 'open',
            }).innerHTML = VetproviehList.template;
        }
        this._addSearchFieldListener();
        this._fetchDataFromServer();
        this._updatePager();
        this._addPagerListener();
    }
    /**
     * Attach Data to List
     * @param {Array} data
     * @param {string} searchValue
     * @param {boolean} clear
     */
    attachData(data, searchValue, clear = false) {
        if (clear) {
            this.shadowRoot.getElementById('listElements').innerHTML = '';
        }
        data.forEach((element) => this._attachToList(element, searchValue));
        this._data = data;
    }
    /**
     * Search for a string
     * @param {string} searchString
     */
    search(searchString) {
        this._fetchDataFromServer(searchString);
    }
    // -----------------
    // PRIVATE METHODS
    // -----------------
    /**
     * Adding PageListener
     * @private
     */
    _addPagerListener() {
        if (this._pager) {
            this._pager.addEventListener('change', (event) => {
                this.page = event.target.page;
                this._fetchDataFromServer();
            });
        }
    }
    /**
     * Input in search has Changed
     * @private
     */
    _addSearchFieldListener() {
        if (this.shadowRoot) {
            let searchTimer;
            let value = null;
            const searchField = this.shadowRoot.querySelector('#search');
            searchField.addEventListener('keyup', (event) => {
                let target = event.target;
                if (value != target.value) {
                    clearTimeout(searchTimer);
                    value = target.value;
                    searchTimer = setTimeout((_) => {
                        this.search(value);
                    }, 300);
                }
            });
            this.updateVisibility('searchControl', this.searchable);
        }
    }
    /**
     * Updating Pager
     */
    _updatePager() {
        if (this.shadowRoot) {
            this.updateVisibility(this._pager.id, this.pageable);
            this._pager.page = this.page;
            this._pager.maximum = this.maxPage;
        }
    }
    /**
     * GET Pager Element
     * @return {VetproviehPager}
     * @private
     */
    get _pager() {
        return this.shadowRoot.getElementById('pager');
    }
    /**
     * Can component fetch new data?
     * @private
     */
    get _readyToFetch() {
        return this.pagesize && this.src && this.shadowRoot;
    }
    /**
     * Loading Data from Remote-Server
     * @param {string | undefined} searchValue
     * @private
     */
    _fetchDataFromServer(searchValue = undefined) {
        if (this._readyToFetch) {
            const self = this;
            fetch(this.src)
                .then((response) => response.json())
                .then((data) => VetproviehList.search(data, searchValue))
                .then((data) => this._sort(data))
                .then((data) => { self._setMaxPage(data.length); return data; })
                .then((data) => self._filterByPage(data))
                .then((data) => self.attachData(data, searchValue, true));
        }
    }
    /**
     * Sorting Data. can be overwritten
     * @param data
     */
    _sort(data) {
        return data;
    }
    /**
     * Set Max-Page by lenth of data
     * @param {number} dataLength
     * @return {boolean}
     */
    _setMaxPage(dataLength) {
        this.maxPage = Math.ceil(dataLength / this.pagesize);
        return true;
    }
    /**
     * Inserts Element to List
     * @param {object} element
     * @param {string} searchValue
     * @private
     */
    _attachToList(element, searchValue) {
        if (this.shadowRoot) {
            const list = this.shadowRoot.getElementById('listElements');
            const newListItem = this._generateListItem(element);
            ViewHelper.replacePlaceholders(newListItem, element);
            if (searchValue) {
                ViewHelper.markElement(newListItem, searchValue);
            }
            if (list) {
                this._attachDataToStoreLocalLink(element, newListItem);
                list.appendChild(newListItem);
            }
        }
    }
    /**
     * Inserts Element to List
     * @param {object} element
     * @param {HTMLElement} newListItem
     * @private
     */
    _attachDataToStoreLocalLink(element, newListItem) {
        const link = newListItem.getElementsByTagName("a")[0];
        if (link && link.attributes["is"] && link.attributes["is"].value === "local-store") {
            link.params = element;
        }
    }
    /**
     * Generate new Item for List which is based on the template
     * @param {any} dataItem
     * @return {HTMLDivElement}
     * @private
     */
    _generateListItem(dataItem) {
        const newNode = document.importNode(this._listTemplate, true);
        const div = document.createElement('div');
        console.log(div.getElementsByTagName("a"));
        div.addEventListener('click', (event) => {
            const selectedEvent = new Event('selected');
            selectedEvent['data'] = dataItem;
            this.dispatchEvent(selectedEvent);
        });
        div.appendChild(newNode);
        return div;
    }
    /**
     * Filter Data by Page
     * @param {Array} data
     * @param {number} currentPage
     * @param {number} pageSize
     * @return {Array}
     * @private
     */
    _filterByPage(data) {
        return data.slice((this.page - 1) * this.pagesize, this.page * this.pagesize);
    }
    // -----------------
    // CLASS METHODS
    // -----------------
    /**
     * Search by Value in Array
     * @param {Array} data
     * @param {string | undefined} searchValue
     * @return {Array}
     */
    static search(data, searchValue) {
        if (searchValue) {
            return data.filter((e) => {
                return ObjectHelper.objectToStringDeep(e).indexOf(searchValue) >= 0;
            });
        }
        else {
            return data;
        }
    }
}
if (!customElements.get('vetprovieh-list')) {
    customElements.define('vetprovieh-list', VetproviehList);
}

/**
 * `vetprovieh-select`
 * Element for Selecting a Model out of a Data-Source.
 *
 * @customElement
 * @demo demo/index.html
 */
class VetproviehSelect extends VetproviehElement {
    /**
     * Defaultkonstructor
     * @param props
     */
    constructor(props = {}) {
        super();
        this._src = "";
        let template = this.querySelector("template");
        if (template)
            this._list_element_template = template;
    }
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
            this.shadowRoot.getElementById("list").appendChild(this._searchList);
        }
        let searchDiv = this.shadowRoot.getElementById("list");
        let searchList = this._searchList;
        searchField.addEventListener("keyup", (event) => {
            let target = event.target;
            let value = target.value;
            if (value) {
                searchDiv.classList.remove("is-hidden");
                searchList.search(target.value);
            }
            else {
                searchDiv.classList.add("is-hidden");
            }
        });
    }
    /**
     * Dispatch Change event to the outer World
     */
    _dispatchChange() {
        let event = new Event('change');
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
            let searchField = this.shadowRoot.getElementById("search");
            let data = event.data;
            searchField.value = ObjectHelper.get(data, _this.display);
            _this.value = ObjectHelper.get(data, _this.property);
            this.updateVisibility("list", false);
        });
        return searchList;
    }
}
window.customElements.define('vetprovieh-select', VetproviehSelect);

export { VetproviehSelect };
//# sourceMappingURL=vetprovieh-select.js.map
