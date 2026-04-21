import { Parser, Store } from "n3";
import { REPORT, parseComplianceReport } from "odrl-evaluator";


/**
 * Calculates human readable feedback based on an ODRL Compliance Report
 * @param {string} report
 */
export function humanReadableReport(report, request) {
    const parser = new Parser();
    const reportStore = new Store(parser.parse(report));
    const requestStore = new Store(parser.parse(request)); // technically can error, tho chances are slim

    const reportNodes = reportStore.getQuads(null, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", REPORT.terms.PolicyReport, null);
    if (reportNodes.length !== 1) {
        throw Error(`Expected one expected report identifier. Found ${reportNodes.length}`);
    }
    const reportID = reportNodes[0].subject.id;
    const policyReport = parseComplianceReport(reportID, reportStore);

    // assumes only one request permission
    const requestSubject = requestStore.getQuads(null, "http://www.w3.org/ns/odrl/2/assignee", null, null)[0].object.value;
    const requestAction = requestStore.getQuads(null, "http://www.w3.org/ns/odrl/2/action", null, null)[0].object.value;
    const requestResource = requestStore.getQuads(null, "http://www.w3.org/ns/odrl/2/target", null, null)[0].object.value;

    let humanReadable = "";
    // Note: currently, we only care about one report
    switch (policyReport.ruleReport[0].type) {
        case REPORT.PermissionReport:
            if (policyReport.ruleReport[0].activationState === REPORT.Active) {
                humanReadable = `<b>${requestSubject}</b> is ALLOWED to perform <b>${requestAction}</b> on <b>${requestResource}</b>.`;
            } else {
                humanReadable = `<b>${requestSubject}</b> is NOT ALLOWED to perform <b>${requestAction}</b> on <b>${requestResource}</b>.`;
            }
            break;
        case REPORT.ProhibitionReport:
            if (policyReport.ruleReport[0].activationState === REPORT.Active) {
                humanReadable = `<b>${requestSubject}</b> is NOT ALLOWED to perform <b>${requestAction}</b> on <b>${requestResource}</b>.`;
            } else {
                humanReadable = `Not enough information is present to determine whether <b>${requestSubject}</b> is allowed to perform <b>${requestAction}</b> on <b>${requestResource}</b>.`;
            }
            break;
        default:
            humanReadable = `Not enough information is present to determine whether <b>${requestSubject}</b> is allowed to perform <b>${requestAction}</b> on <b>${requestResource}</b>.`;
    }
    return humanReadable;
}
