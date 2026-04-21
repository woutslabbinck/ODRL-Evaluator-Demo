import {
  addEditor,
  setupLsp,
  setupVscodeApi,
  turtleExtension,
} from "swls-codemirror";

import * as monaco from "@codingame/monaco-vscode-editor-api";
import workerUrl from "swls-codemirror/lib/lsp-worker.js?url";

import shapeUrl from "./shapes.ttl?url";
import { fetchDescription } from "./util/util";
import { humanReadableReport } from "./util/ReportInterpretation";

let policyEditor;
let requestEditor;
let sotwEditor;

export async function startLsp() {
  await setupVscodeApi();
  const options = {
    value: "",
    language: "turtle",
    "semanticHighlighting.enabled": true,
    wordBasedSuggestions: "currentDocument",
    inlayHints: {
      enabled: "on",
    },
    theme: "semantic-theme",
    automaticLayout: true,
    minimap: { enabled: false },
  };

  monaco.editor.defineTheme("semantic-theme", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6B7C6F", fontStyle: "italic" },
      { token: "keyword", foreground: "8E44AD", fontStyle: "bold" },
      { token: "langTag", foreground: "8E44AD" },
      { token: "string", foreground: "D35400" },
      { token: "number", foreground: "2E7D32" },
      { token: "boolean", foreground: "1E88E5", fontStyle: "bold" },
      { token: "variable", foreground: "1565C0" },
      { token: "namespace", foreground: "00796B" },
      { token: "property", foreground: "B8860B" },
      { token: "enum", foreground: "0277BD" },
      { token: "enumMember", foreground: "0288D1" },
    ],
    colors: {
      // optional but highly recommended for "pop"
      "editor.foreground": "#1E1E1E",
      "editorLineNumber.foreground": "#9AA0A6",
      "editorCursor.foreground": "#007ACC",
      "editor.selectionBackground": "#B3D4FC",
      "editor.inactiveSelectionBackground": "#E5F1FB",
      "editorIndentGuide.background": "#E0E0E0",
      "editorIndentGuide.activeBackground": "#BDBDBD",
    },
    semanticHighlighting: true,
  });

  const e = await addEditor(
    "inmemory://app/policy.ttl",
    "",
    turtleExtension,
    document.getElementById("policy"),
    options,
  );
  policyEditor = e.getEditor();
  policyEditor.onDidChangeModelContent(() => {
    document.getElementById("policy-info").textContent =
      fetchDescription(fetchPolicy());
  });

  const re = await addEditor(
    "inmemory://app/request.ttl",
    "",
    turtleExtension,
    document.getElementById("request"),
    options,
  );
  requestEditor = re.getEditor();
  requestEditor.onDidChangeModelContent(() => {
    document.getElementById("request-info").textContent =
      fetchDescription(fetchRequest());
  });

  const se = await addEditor(
    "inmemory://app/sotw.ttl",
    "",
    turtleExtension,
    document.getElementById("sotw"),
    options,
  );
  sotwEditor = se.getEditor();

  // Language client configuration
  const thing = await setupLsp(
    workerUrl,
    {
      ontologies: [],
      shapes: [new URL(shapeUrl, window.location.origin).toString()],
    },
    turtleExtension.id,
  );

  thing.getLanguageClient().onRequest("custom/readFile", (a, b, c) => {
    // You can return generated files here
    console.log("read", a, b, c);
    throw "nah";
  });
}
/**
 * Fetches the ODRL policy from DOM.
 * @returns {string} The policy value.
 */
export function fetchPolicy() {
  return policyEditor.getValue();
}
/**
 * Writes a new value to the ODRL policy to DOM.
 * Also calculates and writes the description of the policy to the DOM.
 * @param {string} newValue The new policy value to set.
 */
export function writePolicy(newValue) {
  policyEditor.setValue(newValue);
  const description = fetchDescription(newValue);
  document.getElementById("policy-info").textContent = description;
}
/**
 * Fetches the request from DOM.
 * @returns {string} The request value.
 */
export function fetchRequest() {
  return requestEditor.getValue();
}
/**
 * Writes a new value to the request to DOM.
 * Also calculates and writes the description of the policy to the DOM.
 * @param {string} newValue The new request value to set.
 */
export function writeRequest(newValue) {
  requestEditor.setValue(newValue);
  const description = fetchDescription(newValue);
  document.getElementById("request-info").textContent = description;
}
/**
 * Fetches the SOTW (State of the World) from DOM.
 * @returns {string} The SOTW value.
 */
export function fetchSOTW() {
  return sotwEditor.getValue();
}
/**
 * Writes a new value to the SOTW (State of the World) to DOM.
 * @param {string} newValue The new SOTW value to set.
 */
export function writeSOTW(newValue) {
  sotwEditor.setValue(newValue);
}
/**
 * Fetches the ODRL Compliance Report from DOM.
 * @returns {string} The compliance report value.
 */
function fetchComplianceReport() {
  return document.getElementById("output").value;
}
/**
 * Writes a new value to the ODRL Compliance Report to DOM.
 * @param {string} newValue The new compliance report value to set.
 */
export function writeComplianceReport(complianceReport) {
  document.getElementById("output").innerText = complianceReport;
  const request = fetchRequest();
  try {
    const description = humanReadableReport(complianceReport, request);
    document.getElementById("output-info").innerHTML = description;
  } catch (error) {
    document.getElementById("output-info").innerHTML = "";
  }
}
/**
 * Shows the loading indication in the DOM
 */
export function showLoader() {
  document.getElementById("loader-text").style.display = "block";
}
/**
 * Hides the loading indication in the DOM
 */
export function hideLoader() {
  document.getElementById("loader-text").style.display = "none";
}
