
const { ODRLEvaluator, ODRLEngineMultipleSteps } = require('odrl-evaluator');
const N3 = require('n3')
const { Parser } = N3
import { write } from '@jeswr/pretty-turtle';
const prefixes = {
    'odrl': 'http://www.w3.org/ns/odrl/2/',
    'ex': 'http://example.org/',
    'temp': 'http://example.com/request/',
    'dct': 'http://purl.org/dc/terms/',
    'xsd': 'http://www.w3.org/2001/XMLSchema#',
    'foaf': 'http://xmlns.com/foaf/0.1/',
    'report': 'http://example.com/report/temp/'
}
async function odrlEvaluate() {
    const odrlPolicyText = document.getElementById('policy').value;
    const odrlRequestText = document.getElementById('request').value;
    const stateOfTheWorldText = document.getElementById('sotw').value;
    const parser = new Parser();
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
    document.getElementById('output').innerText = prettyResult;

}

document.addEventListener('DOMContentLoaded', (event) => {
    console.log('main.js loaded');
    document.getElementById('evaluate').addEventListener('click', odrlEvaluate)
})

function reset() {
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
    document.getElementById('request').value=
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