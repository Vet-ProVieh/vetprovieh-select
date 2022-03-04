import { ListItem } from '@vetprovieh/vetprovieh-list/lib/list-item';
import { VetproviehList } from '@vetprovieh/vetprovieh-list/lib/vetprovieh-list';
import fetch, { enableFetchMocks } from 'jest-fetch-mock';
import { VetproviehSelect } from "../lib/vetprovieh-select";
import { PersonRepository } from './mockups/personRepository';
enableFetchMocks();

new VetproviehList();


// Test-Data for the Tests
const data = [
    {
        "id": "1",
        "name": "Paul Panzer"
    },
    {
        "id": "2",
        "name": "Dagobert Duck"

    }];

// Mock Responses
fetch.mockResponse(JSON.stringify(data));


/**
 * Generating Demo-Select
 */
const generateSelect = (presetValue = undefined) => {
    const template = document.createElement("template");
    template.innerHTML = "{{id}} {{name}}";
    
    const select = new VetproviehSelect(template);
    
    select.property="name";
    select.display="name";
    select.internalprop="id";

    if(presetValue){
        select.value = presetValue;
    }
    
    select.repository = new PersonRepository()

    select.connectedCallback();

    return select;
}

const listFromSelect = (select : VetproviehSelect) => {
    return select.shadowRoot.getElementById("farmerList");
}

describe("search", () => {
    const selector = generateSelect();
    const list = listFromSelect(selector) as VetproviehList;
    list.connectedCallback();

    test('should show all Elements', () => {
        expect(list.objects.length).toEqual(2)
    });

    test('should filter Elements', () => {
        selector.search("Paul");
        setTimeout(() => expect(list.objects.length).toEqual(1), 200);
    });

    test('should show searchDiv', () => {
        const searchDiv = selector.shadowRoot.getElementById('list');

        selector.search("");

        expect(searchDiv.classList.contains("is-hidden")).toEqual(true);

        selector.search("Paul");

        expect(searchDiv.classList.contains("is-hidden")).toEqual(false);
        
    });


    test('should search with searchField', () => {
        const searchField = (selector as any).searchField as HTMLInputElement;
        searchField.value = "Paul";
        searchField.dispatchEvent(new Event("keyup"));
        setTimeout(() => expect(list.objects.length).toEqual(1), 200);        
    });
})

describe('disable', () => {
    const selector = generateSelect();
    const searchField = (selector as any).searchField as HTMLInputElement;

    test('should disable searchField', () => {
        selector.disable();
        expect(searchField.disabled).toEqual(true);
    })
});


describe('select', () => {
    const selector = generateSelect();
    const list = listFromSelect(selector) as VetproviehList;
    list.connectedCallback();


    test('should select object', () => {
        const listItem = list.shadowRoot.querySelector("list-item") as any; 
        listItem.dispatchEvent(new Event("click"));
        expect(selector.selectedObject).toEqual(listItem._data);
    });


    test('should set value to internalProperty', () => {
        const listItem = list.shadowRoot.querySelector("list-item") as any; 
        listItem.dispatchEvent(new Event("click"));
        expect(selector.value).toEqual(listItem._data.id);
    });
    
});

describe('reportValidity', () => {
    const selector = generateSelect();
    const list = listFromSelect(selector) as VetproviehList;
    list.connectedCallback();
    
    test('should be false if nothing is set', () => {
        expect(selector.reportValidity()).toBeFalsy();
    });

    test('should be true if something is set', () => {
        const listItem = list.shadowRoot.querySelector("list-item") as any; 
        listItem.dispatchEvent(new Event("click"));

        expect(selector.reportValidity()).toBeTruthy();        
    });
});


describe('presetInput', () => {
    const selector = generateSelect("1");
    const list = listFromSelect(selector) as VetproviehList;
    list.connectedCallback();
    
    test('should filter directly', () => {
        setTimeout(() => expect(list.objects.length).toEqual(1), 200);   
    });
});