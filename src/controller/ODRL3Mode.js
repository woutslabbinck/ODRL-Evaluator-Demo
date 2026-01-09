// contains the odrl3 behaviour


import { defaultRequest } from "./DefaultMode";
import { writePolicy, writeRequest, writeSOTW, writeComplianceReport } from "../dom";
import { BaseMode } from "./BaseMode";

/**
 * ODRL3Mode implements the behavior for the ODRL 3 test suite mode.
 * It follows the shared interface used by all mode classes and is
 * responsible for populating the dropdown, handling selection changes,
 * and resetting the UI state.
 */
export class ODRL3Mode extends BaseMode {
    /**
     * @param {HTMLSelectElement} dropdownMenu - The dropdown element used to select test cases.
     */
    constructor(dropdownMenu) {
        super(dropdownMenu)
    }

    /**
     * Populates the dropdown menu with ODRL 3 test cases.
     *
     * TODO: should be hosted somewhere dynamically
     *     Preferably in the github repo of https://w3id.org/force/odrl3proposal
     * @async
     * @returns {Promise<void>} Resolves when the dropdown is fully populated.
     */
    async populateDropdown() {
        const option = document.createElement("option");
        option.value = "dynamic-positive"; // Store the key
        option.textContent = "Dynamic ODRL Constraint (positive)"; // Display the value
        this.dropdownMenu.appendChild(option);

        const option2 = document.createElement("option");
        option2.value = "dynamic-negative"; // Store the key
        option2.textContent = "Dynamic ODRL Constraint (negative)"; // Display the value
        this.dropdownMenu.appendChild(option2);
    }

    /**
     * Handles the selection of a dropdown value and loads the
     * corresponding ODRL 3 test case into the UI.
     *
     * NOTE: currently, these test cases are hard coded as there only a few of them.
     * It is based on the keys defined in the function `generateDropdownODRL3Cases`
     * @async
     * @returns {Promise<void>} Resolves when the UI is updated.
     */
    async selectDropdownValue() {
        const testCase = this.dropdownMenu.value;

        switch (testCase) {
            case "dynamic-positive":
                writeSOTW(dynamicSOTWPositive);
                break;
            case "dynamic-negative":
                writeSOTW(dynamicSOTWNegative);
                break;
            default:
                break;
        }
        writePolicy(dynamicPolicy);
        writeRequest(defaultRequest);
        writeComplianceReport("");
    }

    /**
     * Resets the UI to the default ODRL 3 state.
     *
     * @returns {void}
     */
    reset() {
        super.reset();
        writePolicy(dynamicPolicy);
        writeRequest(defaultRequest);
        writeSOTW(dynamicSOTWPositive);
        writeComplianceReport("");
    }
}

const dynamicPolicy = `
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .
@prefix ex: <http://example.org/> .
@prefix dct: <http://purl.org/dc/terms/> .
@prefix odrl3proposal: <https://w3id.org/force/odrl3proposal#> .

<urn:uuid:5297a939-c364-4f93-a8bc-187cc58c8617> a odrl:Set ;
  odrl:uid <urn:uuid:5297a939-c364-4f93-a8bc-187cc58c8617> ;
  dct:description "ALICE may READ resource X when the current time (SotW) is before 'ex:updateValue' (see SotW)." ;
  odrl:permission <urn:uuid:3b03885a-b6dc-4800-9938-f518122c9706> .

<urn:uuid:3b03885a-b6dc-4800-9938-f518122c9706> a odrl:Permission ;
  odrl:assignee ex:alice ;
  odrl:action odrl:read ;
  odrl:target ex:x ;
  odrl:constraint <urn:uuid:constraint:ab67b414-d0c8-48f6-8554-524130561f84> .

<urn:uuid:constraint:ab67b414-d0c8-48f6-8554-524130561f84> odrl:leftOperand odrl:dateTime ;
  odrl:operator odrl:lt ;
  odrl:rightOperandReference ex:operandReference1 .

ex:operandReference1 a odrl3proposal:OperandReference ;
    odrl3proposal:reference ex:externalSource ;
    odrl3proposal:path ex:updatedValue .`;
    
const dynamicSOTWPositive = `@prefix ex: <http://example.org/> .
@prefix temp: <http://example.com/request/> .
@prefix dct: <http://purl.org/dc/terms/> .

<urn:uuid:192620fa-06d9-447b-adbd-bd1ece4f9b12> a ex:Sotw ;
  ex:includes temp:currentTime .

temp:currentTime dct:issued "2017-02-12T11:20:10.999Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> .

# external value that will be materialized in the policy
ex:externalSource ex:updatedValue "2018-02-12T11:20:10.999Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> .`;

const dynamicSOTWNegative = `@prefix ex: <http://example.org/> .
@prefix temp: <http://example.com/request/> .
@prefix dct: <http://purl.org/dc/terms/> .

<urn:uuid:192620fa-06d9-447b-adbd-bd1ece4f9b12> a ex:Sotw ;
  ex:includes temp:currentTime .

temp:currentTime dct:issued "2017-02-12T11:20:10.999Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> .

# external value that will be materialized in the policy
ex:externalSource ex:updatedValue "2016-02-12T11:20:10.999Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> .`;
