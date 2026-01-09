import { hideLoader, writePolicy, writeRequest, writeSOTW, writeComplianceReport } from "../dom";

/**
 * BaseMode defines the shared interface for all mode classes.
 * It cannot be instantiated directly and must be extended by
 * concrete implementations.
 *
 * @abstract
 */
export class BaseMode {
    /**
     * @param {HTMLSelectElement} dropdownMenu - The dropdown element used by the mode.
     * @throws {Error} If instantiated directly.
     */
    constructor(dropdownMenu) {
        if (new.target === BaseMode) {
            throw new Error("BaseMode is abstract and cannot be instantiated directly");
        }

        this.dropdownMenu = dropdownMenu;
    }

    /**
     * Populates the dropdown menu with mode‑specific entries.
     *
     * @abstract
     * @async
     * @returns {Promise<void>}
     */
    async populateDropdown() {
        throw new Error("populateDropdown() must be implemented by subclass");
    }

    /**
     * Handles selection of a dropdown value and loads the corresponding
     * test case or data into the UI.
     *
     * @abstract
     * @async
     * @returns {Promise<void>}
     */
    async selectDropdownValue() {
        throw new Error("selectDropdownValue() must be implemented by subclass");
    }

    /**
     * Resets the UI to the mode's default state.
     *
     * @abstract
     * @returns {void}
     */
    reset() {
        hideLoader();
        writePolicy("");
        writeRequest("");
        writeSOTW("");
        writeComplianceReport("");
    }
}
