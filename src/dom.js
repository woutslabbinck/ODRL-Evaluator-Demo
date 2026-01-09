const { } = require(".");
const { fetchDescription } = require('./util/util');
const { humanReadableReport } = require("./util/ReportInterpretation");


/**
 * Fetches the ODRL policy from DOM.
 * @returns {string} The policy value.
 */
export function fetchPolicy() {
    return document.getElementById('policy').value;
}
/**
 * Writes a new value to the ODRL policy to DOM.
 * Also calculates and writes the description of the policy to the DOM.
 * @param {string} newValue The new policy value to set.
 */
export function writePolicy(newValue) {
    document.getElementById('policy').value = newValue;
    const description = fetchDescription(newValue);
    document.getElementById('policy-info').textContent = description;

}
/**
 * Fetches the request from DOM.
 * @returns {string} The request value.
 */
export function fetchRequest() {
    return document.getElementById('request').value;

}
/**
 * Writes a new value to the request to DOM.
 * Also calculates and writes the description of the policy to the DOM.
 * @param {string} newValue The new request value to set.
 */
export function writeRequest(newValue) {
    document.getElementById('request').value = newValue;
    const description = fetchDescription(newValue);
    document.getElementById('request-info').textContent = description;
}
/**
 * Fetches the SOTW (State of the World) from DOM.
 * @returns {string} The SOTW value.
 */
export function fetchSOTW() {
    return document.getElementById('sotw').value;
}
/**
 * Writes a new value to the SOTW (State of the World) to DOM.
 * @param {string} newValue The new SOTW value to set.
 */
export function writeSOTW(newValue) {
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
 * Writes a new value to the ODRL Compliance Report to DOM.
 * @param {string} newValue The new compliance report value to set.
 */
export function writeComplianceReport(complianceReport) {
    document.getElementById('output').innerText = complianceReport;
    const request = fetchRequest();
    try {
        const description = humanReadableReport(complianceReport, request);
        document.getElementById('output-info').innerHTML = description;
    } catch (error) {
        document.getElementById('output-info').innerHTML = "";
    }
}
/**
 * Shows the loading indication in the DOM
 */
export function showLoader() {
    document.getElementById('loader-text').style.display = 'block';
}
/**
 * Hides the loading indication in the DOM
 */
export function hideLoader() {
    document.getElementById('loader-text').style.display = 'none';
}
