/*
    Base Constants class to manage game constants
    Allows loading from JSON and accessing constants by key
*/
class Constants {
    constructor(constants) {
        this.constants = constants || {};
    }

    get(key, defaultValue = null) {
        return this.constants.hasOwnProperty(key) ? this.constants[key] : defaultValue;
    }

    set(key, value) {
        this.constants[key] = value;
    }

    loadFromJSON(json) {
        try {
            const obj = JSON.parse(json);
            this.constants = { ...this.constants, ...obj };
        } catch (e) {
            console.error("Failed to load constants from JSON:", e);
        }
    }

    toJSON() {
        return JSON.stringify(this.constants, null, 2);
    }
}
