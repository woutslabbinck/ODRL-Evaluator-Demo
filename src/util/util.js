import { Parser, Store } from "n3";


/**
 * Fetches the description from data (that contains a description).
 * Note that it fetches the first description, so you might give an error if an extra description is added.
 * @param {string} data
 * @returns
 */

export function fetchDescription(data) {
    const parser = new Parser();
    let store;
    try {
        store = new Store(parser.parse(data));
    } catch (error) {
        return;
    }
    if (!store) {
        return;
    }
    const description = store.getQuads(null, 'http://purl.org/dc/terms/description', null, null)[0];
    if (!description) {
        // no description exist,
        return;
    }
    return description.object.value;
}
