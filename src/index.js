
import { write } from '@jeswr/pretty-turtle';
import { Parser } from 'n3';
import { ODRLEngineMultipleSteps, ODRLEvaluator } from 'odrl-evaluator';
import { DefaultMode } from './controller/DefaultMode';
import { fetchPolicy, fetchRequest, fetchSOTW, hideLoader, showLoader, writeComplianceReport, writePolicy, writeRequest } from './dom';
import { ODRL3Mode } from './controller/ODRL3Mode';
import { prefixes } from './util/prefixes';
const evaluator = new ODRLEvaluator(new ODRLEngineMultipleSteps());


const DEFAULT = "default"
const ODRL3 = "odrl3"
// variable used across index.js to know which mode is being used
/**
 * Allowed values:
 *  "default":  dropdown contains the ODRL Test Suite test cases
 *  "odrl3":    dropdown contains the ODRL 3.0 proposal test cases
 */
let mode = DEFAULT

// the dropdown for loading in test cases
let dropdownMenu

// loading function: creating the testcases index and loading that into the dropdown menu
// change function: selects the testcase and loads the appropriate inputs into the dropdown menu
// reset function: reset to the default state in case there was an error


let controller

class SolidLabDemoMode {

}
document.addEventListener('DOMContentLoaded', (event) => {
    dropdownMenu = document.getElementById("dropdown");

    mode = document.body.dataset.mode;
    switch (mode) {
        case DEFAULT:
            controller = new DefaultMode(dropdownMenu)            
            break;
        case ODRL3:
            controller = new ODRL3Mode(dropdownMenu)            
            break;
        default:
            controller = new DefaultMode(dropdownMenu)            
            break;
    }
    dropdownMenu.addEventListener('change', controller.selectDropdownValue.bind(controller))

    document.getElementById('evaluate').addEventListener('click', odrlEvaluate)

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
    controller.reset();
    // load test cases when application starts
    controller.populateDropdown()

}



/**
 * Evaluate the policy using the {@link ODRLEvaluator}
 * Also shows effects (loading) and visualizes the output.
 * Furthermore, outputs a human-readable output (right above the actual report)
 * @returns 
 */
async function odrlEvaluate() {
    const parser = new Parser();

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
            controller.reset();

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


