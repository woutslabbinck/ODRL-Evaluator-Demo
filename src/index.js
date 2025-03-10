
const { ODRLEvaluator, ODRLEngineMultipleSteps } = require('odrl-evaluator');
const N3 = require('n3')
const { Parser, Store } = N3
const { loadWebTestCase } = require('odrl-test-suite')
import { write } from '@jeswr/pretty-turtle';

let indexStore = new Store()
let index = {}
const parser = new Parser();

const prefixes = {
    'odrl': 'http://www.w3.org/ns/odrl/2/',
    'ex': 'http://example.org/',
    'temp': 'http://example.com/request/',
    'dct': 'http://purl.org/dc/terms/',
    'xsd': 'http://www.w3.org/2001/XMLSchema#',
    'foaf': 'http://xmlns.com/foaf/0.1/',
    'report': 'http://example.com/report/temp/'
}

document.addEventListener('DOMContentLoaded', (event) => {
    console.log('main.js loaded');
    document.getElementById('evaluate').addEventListener('click', odrlEvaluate)
    document.getElementById('dropdown').addEventListener('change', loadTestCase)
})


async function odrlEvaluate() {
    showLoader()
    const odrlPolicyText = document.getElementById('policy').value;
    const odrlRequestText = document.getElementById('request').value;
    const stateOfTheWorldText = document.getElementById('sotw').value;
    let odrlPolicyStore, odrlRequestStore, stateOfTheWorldStore;
    try {
        odrlPolicyStore = parser.parse(odrlPolicyText);
        odrlRequestStore = parser.parse(odrlRequestText);
        stateOfTheWorldStore = parser.parse(stateOfTheWorldText);
    } catch (error) {
        const option = confirm("Error parsing the input, not all of them are valid RDF.\nDo you want to reset the input fields?");
        if (option) {
            reset()
        }
        return
    }


    // evaluator (assumes proper policies, requests and sotw)
    const evaluator = new ODRLEvaluator(new ODRLEngineMultipleSteps());

    const reasoningResult = await evaluator.evaluate(
        odrlPolicyStore,
        odrlRequestStore,
        stateOfTheWorldStore)

    const prettyResult = await write(reasoningResult, { prefixes })
    hideLoader()
    document.getElementById('output').innerText = prettyResult;

}



function reset() {
    hideLoader()
    document.getElementById('policy').value =
        `@prefix odrl: <http://www.w3.org/ns/odrl/2/>.
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
    odrl:assigner ex:zeno.
    `
    document.getElementById('request').value =
        `@prefix odrl: <http://www.w3.org/ns/odrl/2/>.
@prefix ex: <http://example.org/>.
@prefix dct: <http://purl.org/dc/terms/>.

<urn:uuid:1bafee59-006c-46a3-810c-5d176b4be364> a odrl:Request;
    dct:description "Requesting Party ALICE requests to READ resource X.";
    odrl:permission <urn:uuid:186be541-5857-4ce3-9f03-1a274f16bf59>.
<urn:uuid:186be541-5857-4ce3-9f03-1a274f16bf59> a odrl:Permission;
    odrl:assignee ex:alice;
    odrl:action odrl:read;
    odrl:target ex:x.`
    document.getElementById('sotw').value =
        `@prefix temp: <http://example.com/request/>.
@prefix dct: <http://purl.org/dc/terms/>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.

temp:currentTime dct:issued "2024-02-12T11:20:10.999Z"^^xsd:dateTime.`
}


function showLoader() {
    document.getElementById('loader-text').style.display = 'block';
}

// Function to hide the loader and show content
function hideLoader() {
    document.getElementById('loader-text').style.display = 'none';
}

async function loadTestCaseIndex() {
    const indexResponse = await fetch("https://raw.githubusercontent.com/SolidLabResearch/ODRL-Test-Suite/refs/heads/main/data/index.ttl")
    const indexText = await indexResponse.text();
    indexStore.addQuads(parser.parse(indexText))
    
    const titles = indexStore.getQuads(null, 'http://purl.org/dc/terms/title', null, null);
    for (const title of titles) {
        index[title.subject.id] = title.object.value
    }
    const dropdown = document.getElementById("dropdown");
    Object.entries(index).forEach(([key, value]) => {
        const option = document.createElement("option");
        option.value = key; // Store the key
        option.textContent = value; // Display the value
        dropdown.appendChild(option);
    });
    
}
loadTestCaseIndex();

async function loadTestCase() {
    const dropdown = document.getElementById("dropdown");
    const testCase = await loadWebTestCase(dropdown.value, [...indexStore]);
    
    document.getElementById('policy').value = await write(testCase.policy.quads, { prefixes });
    document.getElementById('request').value = await write(testCase.request.quads, { prefixes });
    document.getElementById('sotw').value = await write(testCase.stateOfTheWorld.quads, { prefixes });

}
