define("utils/string", ["require", "exports", "utils/oop", "js!sprintf"], function (require, exports, oop) {

String.extend({
    isString:  function (obj) {
        return oop.getClassName(obj) == 'String';
    },
    sprintf: function () {
        var args = [this].concat(Array.prototype.slice.call(arguments));

        return sprintf.apply(null, args);
    },
    vsprintf: function (args) {
        return vsprintf(this, args);
    }
});

exports.tests = function () {
    module("String Utils");

    test("basic String operation", function () {
        var fmt = "number=%d, str=%s, float=%.2f",
            msg = "number=123, str=test, float=3.14";

        equals(fmt.sprintf(123, 'test', 3.1415926), msg);
        equals(fmt.vsprintf([123, 'test', 3.1415926]), msg);
    });
};

});