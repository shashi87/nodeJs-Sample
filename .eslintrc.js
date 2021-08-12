module.exports = {
    "extends": ["eslint:recommended"],
    "env": {
        "browser": true,
        "node": true
    },
    rules : {
        "indent": ["error", "tab"],
        "linebreak-style":[ "error", "unix" ],
        'brace-style': [2, '1tbs'],
        'array-bracket-spacing': [2, 'never'],
        'keyword-spacing': [2],
        'eol-last': [2],
        'no-trailing-spaces': [2]
    }

}
