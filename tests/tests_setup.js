var curl = {
    debug: true,
    baseUrl: "/test/src",
    apiName: "require",
    paths: {
        jquery: "../lib/jquery/jquery",
        qunit: "../lib/qunit/qunit.js",
        modernizr: "../lib/modernizr/modernizr.js",
        sprintf: "../lib/sprintf/sprintf-0.7-beta1.js",
        zip_inflate: "../lib/zip/inflate.js",
        zip_deflate: "../lib/zip/deflate.js",
        json: "../lib/JSON-js/json2.js"
    }
};

var TESTING_MODULES = [
    "utils/oop",
    "utils/string",
    "utils/log",
    "utils/shell",
    "utils/blob",
    "utils/bson",
    "utils/zip",
    "utils/bitarray",
    "utils/avltree",
    "utils/btree",
    "utils/storage",
    "utils/chunk",
    "utils/sync",
    "api/list",
    "api/set",
    "api/dict",
    "api/oid",
    "api/timestamp",
    "api/collection"
];
