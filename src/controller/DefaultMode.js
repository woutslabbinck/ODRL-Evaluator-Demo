
// contains the default behaviour
import { write } from "@jeswr/pretty-turtle/dist";
import { loadWebTestCase } from "odrl-test-suite";
import { writePolicy, writeRequest, writeSOTW, writeComplianceReport } from "../dom";
import { Store, Parser } from "n3"
import { prefixes } from '../util/prefixes';
import { BaseMode } from "./BaseMode";

let indexStore = new Store()
let index = {}

/**
 * DefaultMode handles the default behavior for populating and reacting to
 * dropdown selections. It loads test cases, updates the DOM, and resets
 * the UI to a known state.
 */
export class DefaultMode extends BaseMode{
    /** * @param {HTMLSelectElement} dropdownMenu - The dropdown element used to select test cases. */
    constructor(dropdownMenu) {
        super(dropdownMenu)
    }

    /**
     * Fetches the test case index, parses it, and populates the dropdown menu
     * with available test case titles.
     *
     * @async
     * @returns {Promise<void>} Resolves when the dropdown is fully populated.
     */
    async populateDropdown() {
        const parser = new Parser();
        const indexResponse = await fetch("https://raw.githubusercontent.com/SolidLabResearch/ODRL-Test-Suite/refs/heads/main/data/index.ttl");
        const indexText = await indexResponse.text();
        indexStore.addQuads(parser.parse(indexText));

        const titles = indexStore.getQuads(null, 'http://purl.org/dc/terms/title', null, null);
        for (const title of titles) {
            index[title.subject.id] = title.object.value;
        }

        Object.entries(index).forEach(([key, value]) => {
            const option = document.createElement("option");
            option.value = key; // Store the key
            option.textContent = value; // Display the value
            this.dropdownMenu.appendChild(option);
        });
    }

    /**
     * Loads the selected test case and updates the policy, request,
     * state-of-the-world, and compliance report sections in the UI.
     *
     * @async
     * @returns {Promise<void>} Resolves when all UI sections are updated.
     */
    async selectDropdownValue() {
        const testCase = await loadWebTestCase(this.dropdownMenu.value, [...indexStore]);

        writePolicy(await write(testCase.policy.quads, { prefixes }));
        writeRequest(await write(testCase.request.quads, { prefixes }));
        writeSOTW(await write(testCase.stateOfTheWorld.quads, { prefixes }));
        writeComplianceReport("");
    }

    /**
     * Resets the UI to the default state, restoring the default policy,
     * request, state-of-the-world, and clearing the compliance report.
     *
     * @returns {void}
     */
    reset() {
        super.reset();
        writePolicy(defaultPolicy);
        writeRequest(defaultRequest);
        writeSOTW(defaultSOTW);
        writeComplianceReport("");
    }

}

export function resetDefault() {
    this.reset();
    writePolicy(defaultPolicy);
    writeRequest(defaultRequest);
    writeSOTW(defaultSOTW);
    writeComplianceReport("");
}

export const defaultPolicy = `@prefix odrl: <http://www.w3.org/ns/odrl/2/>.
@prefix ex: <http://example.org/>.
@prefix dct: <http://purl.org/dc/terms/>.

<urn:uuid:95efe0e8-4fb7-496d-8f3c-4d78c97829bc> a odrl:Set;
    dct:description "ZENO is data owner of resource X. ALICE may READ resource X.";
    dct:source <https://github.com/woutslabbinck/UCR-test-suite/blob/main/ODRL-Example.md>;
    odrl:permission <urn:uuid:f5199b0a-d824-45a0-bc08-1caa8d19a001>.
<urn:uuid:f5199b0a-d824-45a0-bc08-1caa8d19a001> a odrl:Permission;
    odrl:action odrl:read;
    odrl:target ex:x;
    odrl:assignee ex:alice;
    odrl:assigner ex:zeno.`;
export const defaultRequest = `@prefix odrl: <http://www.w3.org/ns/odrl/2/>.
@prefix ex: <http://example.org/>.
@prefix dct: <http://purl.org/dc/terms/>.

<urn:uuid:1bafee59-006c-46a3-810c-5d176b4be364> a odrl:Request;
    dct:description "Requesting Party ALICE requests to READ resource X.";
    odrl:permission <urn:uuid:186be541-5857-4ce3-9f03-1a274f16bf59>.
<urn:uuid:186be541-5857-4ce3-9f03-1a274f16bf59> a odrl:Permission;
    odrl:assignee ex:alice;
    odrl:action odrl:read;
    odrl:target ex:x.`;
export const defaultSOTW = `@prefix temp: <http://example.com/request/>.
@prefix dct: <http://purl.org/dc/terms/>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.

temp:currentTime dct:issued "2024-02-12T11:20:10.999Z"^^xsd:dateTime.`;

