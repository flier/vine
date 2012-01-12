var TESTING_MODULES = [
    "utils/oop",
    "utils/string",
    "utils/log",
    "utils/shell",
    "utils/blob",
    "utils/bson",
    "api/list",
    "api/set",
    "api/dict",
    "api/collection"
];

require(TESTING_MODULES, function () {
    for (var i=0; i<arguments.length; i++) {
        var ts = new Date();

        arguments[i].tests();

        var msg = "test the " + TESTING_MODULES[i] + " module in " + (new Date().getSeconds() - ts.getSeconds()) + "ms";

        console.log(msg);
    }
});
