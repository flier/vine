var logger;

require("utils/log", function (log) {
    logger = log.basicConfig().getLogger('runner');

    logger.info("loading the test cases...");
}).next(TESTING_MODULES, function () {
    for (var i=0; i<arguments.length; i++) {
        logger.info("testing %s module...", TESTING_MODULES[i]);

        arguments[i].tests();
    }
});
