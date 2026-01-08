
import { ODRLEvaluator, ODRLEngineMultipleSteps } from 'odrl-evaluator';
import { Parser, Store } from 'n3';
import { loadWebTestCase } from 'odrl-test-suite';
import { write } from '@jeswr/pretty-turtle';
import { writePolicy, fetchPolicy, writeRequest, fetchRequest, showLoader, fetchSOTW, hideLoader, writeComplianceReport, writeSOTW } from './dom';

let indexStore = new Store()
let index = {}
const parser = new Parser();
const evaluator = new ODRLEvaluator(new ODRLEngineMultipleSteps());


const prefixes = {
    'odrl': 'http://www.w3.org/ns/odrl/2/',
    'ex': 'http://example.org/',
    'temp': 'http://example.com/request/',
    'dct': 'http://purl.org/dc/terms/',
    'xsd': 'http://www.w3.org/2001/XMLSchema#',
    'foaf': 'http://xmlns.com/foaf/0.1/',
    'report': 'https://w3id.org/force/compliance-report#',
    'odrl3proposal': 'https://w3id.org/force/odrl3proposal#',
}

const DEFAULT = "default"
const ODRL3 = "odrl3"
// variable used across index.js to know which mode is being used
/**
 * Allowed values:
 *  "default":  dropdown contains the ODRL Test Suite test cases
 *  "odrl3":    dropdown contains the ODRL 3.0 proposal test cases
 */
let mode = DEFAULT

// only in the normal version
let dropdownDefault

// only in the odrl 3.0 version
let dropdownODRL3Cases;

document.addEventListener('DOMContentLoaded', (event) => {
    dropdownDefault = document.getElementById("dropdown");
    dropdownODRL3Cases = document.getElementById("odrl3-dropdown");

    if (dropdownDefault) {
        dropdownDefault.addEventListener('change', loadTestCase)
    }
    document.getElementById('evaluate').addEventListener('click', odrlEvaluate)

    if (dropdownODRL3Cases) {
        mode = ODRL3
        dropdownODRL3Cases.addEventListener('change', loadODRL3Cases);

    }
    
    init();
    // allows to edit the description live (kind of ugly, but it works)
    document.getElementById('policy').addEventListener('input', () => {
        writePolicy(fetchPolicy());
    })
    document.getElementById('request').addEventListener('input', () => {
        writeRequest(fetchRequest());
    })
})

function init() {
    // Initialise the policies
    reset();
    // load test cases when application starts
    switch (mode) {
        case DEFAULT:
            loadTestCaseIndex();
            break;
        case ODRL3:
            generateDropdownODRL3Cases();
            break;
        default:
            loadTestCaseIndex();
            break;
    }
}

/**
 * Evaluate the policy using the {@link ODRLEvaluator}
 * Also shows effects (loading) and visualizes the output.
 * Furthermore, outputs a human-readable output (right above the actual report)
 * @returns 
 */
async function odrlEvaluate() {
    showLoader()
    const odrlPolicyText = fetchPolicy();
    const odrlRequestText = fetchRequest();
    const stateOfTheWorldText = fetchSOTW();
    let odrlPolicyQuads, odrlRequestQuads, stateOfTheWorldQuads;
    try {
        odrlPolicyQuads = parser.parse(odrlPolicyText);
        odrlRequestQuads = parser.parse(odrlRequestText);
        stateOfTheWorldQuads = parser.parse(stateOfTheWorldText);
    } catch (error) {
        const option = confirm("Error parsing the input, not all of them are valid RDF.\nDo you want to reset the input fields?");
        if (option) {
            reset()
        }
        return
    }


    // evaluator (assumes proper policies, requests and sotw)
    const reasoningResult = await evaluator.evaluate(
        odrlPolicyQuads,
        odrlRequestQuads,
        stateOfTheWorldQuads)

    const prettyResult = await write(reasoningResult, { prefixes })
    hideLoader()
    writeComplianceReport(prettyResult);
}


/**
 * Reset the content of the policy, request and sotw to the default state.
 */
function reset() {
    hideLoader()
    switch (mode) {
        case DEFAULT:
            writePolicy(defaultPolicy)
            writeRequest(defaultRequest)
            writeSOTW(defaultSOTW)
            break;
        case ODRL3:
            writePolicy(dynamicPolicy);
            writeRequest(defaultRequest);
            writeSOTW(dynamicSOTWPositive);
            break;
        default:
            writePolicy(defaultPolicy)
            writeRequest(defaultRequest)
            writeSOTW(defaultSOTW)
            break;
    }
    writeComplianceReport("")
}

/**
 * Fetches the index and writes them to the dropdown menu
 */
async function loadTestCaseIndex() {
    const indexResponse = await fetch("https://raw.githubusercontent.com/SolidLabResearch/ODRL-Test-Suite/refs/heads/main/data/index.ttl")
    const indexText = await indexResponse.text();
    indexStore.addQuads(parser.parse(indexText))

    const titles = indexStore.getQuads(null, 'http://purl.org/dc/terms/title', null, null);
    for (const title of titles) {
        index[title.subject.id] = title.object.value
    }

    if (dropdownDefault) {
        Object.entries(index).forEach(([key, value]) => {
            const option = document.createElement("option");
            option.value = key; // Store the key
            option.textContent = value; // Display the value
            dropdownDefault.appendChild(option);
        });
    }
}

/**
 * Creates the dropdown menu for ODRL proposals
 * TODO: should be hosted somewhere dynamically
 *      Preferably in the github repo of https://w3id.org/force/odrl3proposal
 */
async function generateDropdownODRL3Cases() {
    const option = document.createElement("option");
    option.value = "dynamic-positive"; // Store the key
    option.textContent = "Dynamic ODRL Constraint (positive)"; // Display the value
    dropdownODRL3Cases.appendChild(option);

    const option2 = document.createElement("option");
    option2.value = "dynamic-negative"; // Store the key
    option2.textContent = "Dynamic ODRL Constraint (negative)"; // Display the value
    dropdownODRL3Cases.appendChild(option2);
}
/**
 * Loads the selected test case in the DOM.
 * Also resets potential created compliance Reports.
 */
async function loadTestCase() {
    if (dropdownDefault) {
        const testCase = await loadWebTestCase(dropdownDefault.value, [...indexStore]);

        writePolicy(await write(testCase.policy.quads, { prefixes }));
        writeRequest(await write(testCase.request.quads, { prefixes }));
        writeSOTW(await write(testCase.stateOfTheWorld.quads, { prefixes }));
        writeComplianceReport("")
    }
}

/**
 * Loads the selected test case in the DOM.
 * Also resets potential created compliance Reports.
 * 
 * NOTE: currently, these test cases are hard coded as there only a few of them. 
 *      It is based on the keys defined in the function `generateDropdownODRL3Cases`
 * TODO: fix after `generateDropdownODRL3Cases` it is issue is fixed
*/
function loadODRL3Cases() {
    if (dropdownODRL3Cases) {
        const testCase = dropdownODRL3Cases.value

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
        writeComplianceReport("")
    }
}

/**
 * Fetches the description from data (that contains a description).
 * Note that it fetches the first description, so you might give an error if an extra description is added.
 * @param {string} data 
 * @returns 
 */
export function fetchDescription(data) {
    let store
    try {
        store = new Store(parser.parse(data));
    } catch (error) {
        return
    }
    if (!store) {
        return
    }
    const description = store.getQuads(null, 'http://purl.org/dc/terms/description', null, null)[0];
    if (!description) {
        // no description exist,
        return
    }
    return description.object.value
}

const defaultPolicy = `@prefix odrl: <http://www.w3.org/ns/odrl/2/>.
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
    odrl:assigner ex:zeno.`
const defaultRequest = `@prefix odrl: <http://www.w3.org/ns/odrl/2/>.
@prefix ex: <http://example.org/>.
@prefix dct: <http://purl.org/dc/terms/>.

<urn:uuid:1bafee59-006c-46a3-810c-5d176b4be364> a odrl:Request;
    dct:description "Requesting Party ALICE requests to READ resource X.";
    odrl:permission <urn:uuid:186be541-5857-4ce3-9f03-1a274f16bf59>.
<urn:uuid:186be541-5857-4ce3-9f03-1a274f16bf59> a odrl:Permission;
    odrl:assignee ex:alice;
    odrl:action odrl:read;
    odrl:target ex:x.`
const defaultSOTW = `@prefix temp: <http://example.com/request/>.
@prefix dct: <http://purl.org/dc/terms/>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.

temp:currentTime dct:issued "2024-02-12T11:20:10.999Z"^^xsd:dateTime.`

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
    odrl3proposal:path ex:updatedValue .`

const dynamicSOTWPositive =
    `@prefix ex: <http://example.org/> .
@prefix temp: <http://example.com/request/> .
@prefix dct: <http://purl.org/dc/terms/> .

<urn:uuid:192620fa-06d9-447b-adbd-bd1ece4f9b12> a ex:Sotw ;
  ex:includes temp:currentTime .

temp:currentTime dct:issued "2017-02-12T11:20:10.999Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> .

# external value that will be materialized in the policy
ex:externalSource ex:updatedValue "2018-02-12T11:20:10.999Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> .`

const dynamicSOTWNegative =
    `@prefix ex: <http://example.org/> .
@prefix temp: <http://example.com/request/> .
@prefix dct: <http://purl.org/dc/terms/> .

<urn:uuid:192620fa-06d9-447b-adbd-bd1ece4f9b12> a ex:Sotw ;
  ex:includes temp:currentTime .

temp:currentTime dct:issued "2017-02-12T11:20:10.999Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> .

# external value that will be materialized in the policy
ex:externalSource ex:updatedValue "2016-02-12T11:20:10.999Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> .`