import { BaseMode } from "./BaseMode";
import { defaultRequest, defaultSOTW } from "./DefaultMode";
import { writePolicy, writeRequest, writeSOTW, writeComplianceReport } from "../dom";

export class SolidLabMode extends BaseMode {
    /**
     * @param {HTMLSelectElement} dropdownMenu - The dropdown element used to select test cases.
     */
    constructor(dropdownMenu) { 
        super(dropdownMenu); 
                console.log(scenarios);

    }

    async populateDropdown() {
        for (const [value, scenario] of Object.entries(scenarios)) {
            const option = document.createElement("option");
            option.value = value
            option.textContent = scenario.textContext
            this.dropdownMenu.appendChild(option);
        }
    }

    async selectDropdownValue() {
        const key = this.dropdownMenu.value;
        writePolicy(scenarios[key].policy);
        writeRequest(scenarios[key].request);
        writeSOTW(scenarios[key].sotw);
        writeComplianceReport("");

    }

    reset() {
        super.reset();
        writePolicy(simplePolicy);
        writeRequest(defaultRequest);
        writeSOTW(defaultSOTW);
        writeComplianceReport("");
    }
}

const simplePolicy = `@prefix odrl: <http://www.w3.org/ns/odrl/2/> .
@prefix ex: <http://example.org/> .
@prefix dct: <http://purl.org/dc/terms/> .

<urn:uuid:f42a700b-3314-4cf0-8b8d-1581f203cfa1> a odrl:Set ;
  odrl:uid <urn:uuid:f42a700b-3314-4cf0-8b8d-1581f203cfa1> ;
  dct:description "Alice can only read x." ;
  dct:source <https://github.com/SolidLabResearch/ODRL-Test-Suite/> ;
  odrl:permission <urn:uuid:69d57d36-74e5-443c-bae5-30159b0cbd3e> .

<urn:uuid:69d57d36-74e5-443c-bae5-30159b0cbd3e> a odrl:Permission ;
  odrl:assignee ex:alice ;
  odrl:action odrl:read ;
  odrl:target ex:x .`
const timeConstrainedPolicy = `@prefix odrl: <http://www.w3.org/ns/odrl/2/> .
@prefix ex: <http://example.org/> .
@prefix dct: <http://purl.org/dc/terms/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<urn:uuid:32127a3f-5296-4cc6-b9d6-ef6c647a721d> a odrl:Set ;
  odrl:uid <urn:uuid:32127a3f-5296-4cc6-b9d6-ef6c647a721d> ;
  dct:description "ALICE may READ resource X between 2024-02-12T11:20:10.999Z and 2024-02-12T11:20:40.999Z." ;
  dct:source <https://github.com/SolidLabResearch/ODRL-Test-Suite/> ;
  odrl:permission <urn:uuid:d6ab4a38-68fb-418e-8af5-e77649a2187a> .

<urn:uuid:d6ab4a38-68fb-418e-8af5-e77649a2187a> a odrl:Permission ;
  odrl:assignee ex:alice ;
  odrl:action odrl:read ;
  odrl:target ex:x ;
  odrl:constraint <urn:uuid:constraint:86526f9b-57c2-4c94-b079-9762fec562f1>, <urn:uuid:29120bf0-065f-4622-b514-2b911a431c20> .

<urn:uuid:constraint:86526f9b-57c2-4c94-b079-9762fec562f1> odrl:leftOperand odrl:dateTime ;
  odrl:operator odrl:lteq ;
  odrl:rightOperand "2024-02-12T11:20:40.999Z"^^xsd:dateTime .

<urn:uuid:29120bf0-065f-4622-b514-2b911a431c20> odrl:leftOperand odrl:dateTime ;
  odrl:operator odrl:gteq ;
  odrl:rightOperand "2024-02-12T11:20:10.999Z"^^xsd:dateTime .
`
const purposeConstrainedPolicy = `@prefix dct: <http://purl.org/dc/terms/> .
@prefix ex: <http://example.org/> .
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .
@prefix dpv: <https://w3id.org/dpv#>.

<urn:uuid:18a5175e-33e4-4f66-895d-97bcbd4e427b> a odrl:Set ;
    odrl:uid <urn:uuid:18a5175e-33e4-4f66-895d-97bcbd4e427b> ;
    dct:description "ALICE may READ resource X for the purpose of dpv:AccountManagement." ;
    dct:source <https://github.com/besteves4/pacsoi-policies/blob/main/PoC2/policy-22.ttl> ;
    odrl:permission <urn:uuid:1c63f3af-7c09-4748-9002-1868f6816b16> .

<urn:uuid:1c63f3af-7c09-4748-9002-1868f6816b16> a odrl:Permission ;
    odrl:assignee ex:alice ;
    odrl:action odrl:read ;
    odrl:target ex:x ;
    odrl:constraint <urn:uuid:ccce2874-20f2-4281-a56c-ec2614282bda> .

<urn:uuid:ccce2874-20f2-4281-a56c-ec2614282bda> odrl:leftOperand odrl:purpose ;
    odrl:operator odrl:eq ;
    odrl:rightOperand dpv:AccountManagement .`
const timeAndPurposeConstrainedPolicy = `@prefix dct: <http://purl.org/dc/terms/> .
@prefix ex: <http://example.org/> .
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .
@prefix dpv: <https://w3id.org/dpv#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<urn:uuid:18a5175e-33e4-4f66-895d-97bcbd4e427b> a odrl:Set ;
    odrl:uid <urn:uuid:18a5175e-33e4-4f66-895d-97bcbd4e427b> ;
    dct:description "ALICE may READ resource X for the purpose of dpv:AccountManagement and between 2024-02-12T11:20:10.999Z and 2024-02-12T11:20:40.999Z." ;
    dct:source <https://github.com/besteves4/pacsoi-policies/blob/main/PoC2/policy-22.ttl> ;
    odrl:permission <urn:uuid:1c63f3af-7c09-4748-9002-1868f6816b16> .

<urn:uuid:1c63f3af-7c09-4748-9002-1868f6816b16> a odrl:Permission ;
    odrl:assignee ex:alice ;
    odrl:action odrl:read ;
    odrl:target ex:x ;
    odrl:constraint <urn:uuid:ccce2874-20f2-4281-a56c-ec2614282bda> , <urn:uuid:constraint:86526f9b-57c2-4c94-b079-9762fec562f1>, <urn:uuid:29120bf0-065f-4622-b514-2b911a431c20>  .

<urn:uuid:ccce2874-20f2-4281-a56c-ec2614282bda> odrl:leftOperand odrl:purpose ;
    odrl:operator odrl:eq ;
    odrl:rightOperand dpv:AccountManagement .
    
<urn:uuid:constraint:86526f9b-57c2-4c94-b079-9762fec562f1> odrl:leftOperand odrl:dateTime ;
  odrl:operator odrl:lteq ;
  odrl:rightOperand "2024-02-12T11:20:40.999Z"^^xsd:dateTime .

<urn:uuid:29120bf0-065f-4622-b514-2b911a431c20> odrl:leftOperand odrl:dateTime ;
  odrl:operator odrl:gteq ;
  odrl:rightOperand "2024-02-12T11:20:10.999Z"^^xsd:dateTime .`

const purposeRequest = `@prefix dct: <http://purl.org/dc/terms/> .
@prefix ex: <http://example.org/> .
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .
@prefix dpv: <https://w3id.org/dpv#> .

<urn:uuid:ce9fc20e-7c79-474e-8afe-7605accccee8> a odrl:Request ;
    odrl:uid <urn:uuid:ce9fc20e-7c79-474e-8afe-7605accccee8> ;
    dct:description "Requesting Party ALICE requests to READ resource X for the purpose of dpv:AccountManagement." ;
    odrl:permission <urn:uuid:e51a43e4-616f-4f32-906b-2359955228e5> .

<urn:uuid:e51a43e4-616f-4f32-906b-2359955228e5> a odrl:Permission ;
    odrl:assignee ex:alice ;
    odrl:action odrl:read ;
    odrl:target ex:x ;
    <https://w3id.org/force/sotw#context> <urn:uuid:963698fe-3b44-4b88-8527-501b6c5765a6> .

<urn:uuid:963698fe-3b44-4b88-8527-501b6c5765a6> a odrl:Constraint ;
    odrl:leftOperand odrl:purpose ;
    odrl:operator odrl:eq ;
    odrl:rightOperand dpv:AccountManagement .`

const scenarios = {
  "simple-policy": {
    textContext: "A simple policy example",
    policy: simplePolicy,
    request: defaultRequest,
    sotw: defaultSOTW
  },

  "time-policy": {
    textContext: "A policy scenario with time constraints",
    policy: timeConstrainedPolicy,
    request: defaultRequest,
    sotw: defaultSOTW
  },

  "purpose-policy": {
    textContext: "A policy scenario with a purpose constraint",
    policy: purposeConstrainedPolicy,
    request: purposeRequest,
    sotw: defaultSOTW
  },

  "time-purpose-policy": {
    textContext: "A policy scenario with both time and purpose constraints",
    policy: timeAndPurposeConstrainedPolicy,
    request: purposeRequest,
    sotw: defaultSOTW
  }
};