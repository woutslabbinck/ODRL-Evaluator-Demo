
import { ODRLEvaluator, ODRLEngineMultipleSteps } from 'odrl-evaluator';
import { Parser, Store } from 'n3';
import { loadWebTestCase } from 'odrl-test-suite';
import { write } from '@jeswr/pretty-turtle';
import { createVocabulary } from 'rdf-vocabulary'
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
    'report': 'https://w3id.org/force/compliance-report#'
}
document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('evaluate').addEventListener('click', odrlEvaluate)
    document.getElementById('dropdown').addEventListener('change', loadTestCase)
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
    loadTestCaseIndex();
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
    writePolicy(defaultPolicy)
    writeRequest(defaultRequest)
    writeSOTW(defaultSOTW)
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
    const dropdown = document.getElementById("dropdown");
    Object.entries(index).forEach(([key, value]) => {
        const option = document.createElement("option");
        option.value = key; // Store the key
        option.textContent = value; // Display the value
        dropdown.appendChild(option);
    });

}

/**
 * Loads the selected test case in the DOM.
 * Also resets potential created compliance Reports.
 */
async function loadTestCase() {
    const dropdown = document.getElementById("dropdown");
    const testCase = await loadWebTestCase(dropdown.value, [...indexStore]);

    writePolicy(await write(testCase.policy.quads, { prefixes }));
    writeRequest(await write(testCase.request.quads, { prefixes }));
    writeSOTW(await write(testCase.stateOfTheWorld.quads, { prefixes }));
    writeComplianceReport("")
}

/**
 * Fetches the description from data (that contains a description).
 * Note that it fetches the first description, so you might give an error if an extra description is added.
 * @param {string} data 
 * @returns 
 */
function fetchDescription(data) {
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

/**
 * Calculates human readable feedback based on an ODRL Compliance Report
 * @param {string} report 
 */
function humanReadableReport(report) {
    const reportStore = new Store(parser.parse(report));
    const requestStore = new Store(parser.parse(fetchRequest())); // technically can error, tho chances are slim

    const reportNodes = reportStore.getQuads(null, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", CR.terms.PolicyReport, null);
    if (reportNodes.length !== 1) {
        throw Error(`Expected one expected report identifier. Found ${reportNodes.length}`);
    }
    const reportID = reportNodes[0].subject.id;
    const policyReport = parseComplianceReport(reportID, reportStore);

    // assumes only one request permission
    const requestSubject = requestStore.getQuads(null, "http://www.w3.org/ns/odrl/2/assignee", null, null)[0].object.value;
    const requestAction = requestStore.getQuads(null, "http://www.w3.org/ns/odrl/2/action", null, null)[0].object.value;
    const requestResource = requestStore.getQuads(null, "http://www.w3.org/ns/odrl/2/target", null, null)[0].object.value;

    let humanReadable = ""
    // Note: currently, we only care about one report
    switch (policyReport.ruleReport[0].type) {
        case CR.PermissionReport:
            if (policyReport.ruleReport[0].activationState === CR.Active) {
                humanReadable = `<b>${requestSubject}</b> is ALLOWED to perform <b>${requestAction}</b> on <b>${requestResource}</b>.`
            } else {
                humanReadable = `<b>${requestSubject}</b> is NOT ALLOWED to perform <b>${requestAction}</b> on <b>${requestResource}</b>.`
            }
            break;
        case CR.ProhibitionReport:
            if (policyReport.ruleReport[0].activationState === CR.Active) {
                humanReadable = `<b>${requestSubject}</b> is NOT ALLOWED to perform <b>${requestAction}</b> on <b>${requestResource}</b>.`
            } else {
                humanReadable = `Not enough information is present to determine whether <b>${requestSubject}</b> is allowed to perform <b>${requestAction}</b> on <b>${requestResource}</b>.`
            }
            break;
        default:
            humanReadable = `Not enough information is present to determine whether <b>${requestSubject}</b> is allowed to perform <b>${requestAction}</b> on <b>${requestResource}</b>.`
    }
    return humanReadable
}

/**
 * Fetches the ODRL policy from DOM.
 * @returns {string} The policy value.
 */
function fetchPolicy() {
    return document.getElementById('policy').value;
}

/**
 * Writes a new value to the ODRL policy to DOM.
 * Also calculates and writes the description of the policy to the DOM.
 * @param {string} newValue The new policy value to set.
 */
function writePolicy(newValue) {
    document.getElementById('policy').value = newValue;
    const description = fetchDescription(newValue);
    document.getElementById('policy-info').textContent = description

}

/**
 * Fetches the request from DOM.
 * @returns {string} The request value.
 */
function fetchRequest() {
    return document.getElementById('request').value;

}

/**
 * Writes a new value to the request to DOM.
 * Also calculates and writes the description of the policy to the DOM.
 * @param {string} newValue The new request value to set.
 */
function writeRequest(newValue) {
    document.getElementById('request').value = newValue;
    const description = fetchDescription(newValue);
    document.getElementById('request-info').textContent = description
}

/**
 * Fetches the SOTW (State of the World) from DOM.
 * @returns {string} The SOTW value.
 */
function fetchSOTW() {
    return document.getElementById('sotw').value;
}

/**
 * Writes a new value to the SOTW (State of the World) to DOM.
 * @param {string} newValue The new SOTW value to set.
 */
function writeSOTW(newValue) {
    document.getElementById('sotw').value = newValue;
}

/**
 * Fetches the ODRL Compliance Report from DOM.
 * @returns {string} The compliance report value.
 */
function fetchComplianceReport() {
    return document.getElementById('output').value;
}

/**
 * Writes a new value to the ODRL Compliance Reportto DOM.
 * @param {string} newValue The new compliance report value to set.
 */
function writeComplianceReport(newValue) {
    document.getElementById('output').innerText = newValue;
    try {
        const description = humanReadableReport(newValue);
        document.getElementById('output-info').innerHTML = description;
    } catch (error) {
        document.getElementById('output-info').innerHTML = "";
    }
}

/**
 * Shows the loading indication in the DOM
 */
function showLoader() {
    document.getElementById('loader-text').style.display = 'block';
}

/**
 * Hides the loading indication in the DOM
 */
function hideLoader() {
    document.getElementById('loader-text').style.display = 'none';
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


// copied from https://github.com/SolidLabResearch/user-managed-access/blob/feat/ODRL-evaluator/packages/uma/src/policies/authorizers/OdrlAuthorizer.ts
const CR = createVocabulary('http://example.com/report/temp/',
    'PolicyReport',
    'RuleReport',
    'PermissionReport',
    'ProhibitionReport',
    'DutyReport',
    'PremiseReport',
    'ConstraintReport',
    'PartyReport',
    'ActionReport',
    'TargetReport',
    'ActivationState',
    'Active',
    'Inactive',
    'AttemptState',
    'Attempted',
    'NotAttempted',
    'PerformanceState',
    'Performed',
    'Unperformed',
    'Unknown',
    'DeonticState',
    'NonSet',
    'Violated',
    'Fulfilled',
    'SatisfactionState',
    'Satisfied',
    'Unsatisfied',
    'policy',
    'policyRequest',
    'ruleReport',
    'conditionReport',
    'premiseReport',
    'rule',
    'ruleRequest',
    'activationState',
    'attemptState',
    'performanceState',
    'deonticState',
    'constraint',
    'satisfactionState',
);

// Enum-like structures using Object.freeze()
const RuleReportType = Object.freeze({
    PermissionReport: 'http://example.com/report/temp/PermissionReport',
    ProhibitionReport: 'http://example.com/report/temp/ProhibitionReport',
    ObligationReport: 'http://example.com/report/temp/ObligationReport',
});

const SatisfactionState = Object.freeze({
    Satisfied: 'http://example.com/report/temp/Satisfied',
    Unsatisfied: 'http://example.com/report/temp/Unsatisfied',
});

const PremiseReportType = Object.freeze({
    ConstraintReport: 'http://example.com/report/temp/ConstraintReport',
    PartyReport: 'http://example.com/report/temp/PartyReport',
    TargetReport: 'http://example.com/report/temp/TargetReport',
    ActionReport: 'http://example.com/report/temp/ActionReport',
});

const ActivationState = Object.freeze({
    Active: 'http://example.com/report/temp/Active',
    Inactive: 'http://example.com/report/temp/Inactive',
});

// Functions rewritten in plain JavaScript
function parseComplianceReport(identifier, store) {
    const exists = store.getQuads(identifier, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", CR.PolicyReport, null).length === 1;
    if (!exists) {
        throw new Error(`No Policy Report found with: ${identifier}.`);
    }
    const ruleReportNodes = store.getObjects(identifier, CR.ruleReport, null);

    return {
        id: identifier,
        created: store.getObjects(identifier, "http://purl.org/dc/terms/created", null)[0],
        policy: store.getObjects(identifier, CR.policy, null)[0],
        request: store.getObjects(identifier, CR.policyRequest, null)[0],
        ruleReport: ruleReportNodes.map(ruleReportNode => parseRuleReport(ruleReportNode, store)),
    };
}

function parseRuleReport(identifier, store) {
    const premiseNodes = store.getObjects(identifier, CR.premiseReport, null);
    return {
        id: identifier,
        type: store.getObjects(identifier, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", null)[0].value,
        activationState: store.getObjects(identifier, CR.activationState, null)[0].value,
        requestedRule: store.getObjects(identifier, CR.ruleRequest, null)[0],
        rule: store.getObjects(identifier, CR.rule, null)[0],
        premiseReport: premiseNodes.map(prem => parsePremiseReport(prem, store)),
    };
}

function parsePremiseReport(identifier, store) {
    const nestedPremises = store.getObjects(identifier, CR.PremiseReport, null);
    return {
        id: identifier,
        type: store.getObjects(identifier, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", null)[0].value,
        premiseReport: nestedPremises.map(prem => parsePremiseReport(prem, store)),
        satisfactionState: store.getObjects(identifier, CR.satisfactionState, null)[0].value,
    };
}

