
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
    const stateOfTheWorldText = document.getElementById('sotw').value
    const parser = new Parser();
    const odrlPolicyStore = parser.parse(odrlPolicyText);
    const odrlRequestStore = parser.parse(odrlRequestText);
    const stateOfTheWorldStore = parser.parse(stateOfTheWorldText);

    // evaluator (assumes proper policies, requests and sotw)
    const evaluator = new ODRLEvaluator(new ODRLEngineMultipleSteps());

    const reasoningResult = await evaluator.evaluate(
        odrlPolicyStore,
        odrlRequestStore,
        stateOfTheWorldStore)

    const prettyResult = await write(reasoningResult, {prefixes})
    document.getElementById('output').innerText = prettyResult;
    
}

document.addEventListener('DOMContentLoaded', (event) => {
    console.log('main.js loaded');
    document.getElementById('evaluate').addEventListener('click', odrlEvaluate)
})
