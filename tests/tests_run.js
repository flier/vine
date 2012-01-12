TestCase("qunit", {
    "test load": function () {
        assertNotNull(curl);
    }
});

require([
    "utils/oop"
]).then(function () {
    for (var i=0; i<arguments.length; i++) {
        arguments[i].tests();
    }
}, function (ex) {
    console.log(ex);
});
