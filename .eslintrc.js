module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true
    },
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },

    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module",
        "ecmaFeatures": {
            "jsx": true,
            "arrowFunctions": true,
            "classes": true,
            "experimentalObjectRestSpread": true,
            "superInFunctions": true,
            "modules": true,
            "blockBindings": true,
            "spread": true,
            "octalLiterals": true,
            "objectLiteralShorthandMethods": true
        }
    },
    "rules": { ...{} }
};