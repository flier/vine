require(TESTING_MODULES, function () {
    for (var i=0; i<arguments.length; i++) {
        var ts = new Date();

        arguments[i].tests();

        var msg = "test the " + TESTING_MODULES[i] + " module in " + (new Date().getSeconds() - ts.getSeconds()) + "ms";

        console.log(msg);
    }
});
