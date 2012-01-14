define("utils/string", ["require", "exports", "utils/oop", "js!sprintf"], function (require, exports, oop) {

String.isString = function (obj) {
    return oop.getClassName(obj) == 'String';
};

String.extend({
    sprintf: function () {
        var args = [this].concat(Array.prototype.slice.call(arguments));

        return sprintf.apply(null, args);
    },
    vsprintf: function (args) {
        return vsprintf(this, args);
    }
});

// Add ECMA262-5 string trim if not supported natively
//
if (!('trim' in String.prototype)) {
    String.prototype.trim= function() {
        return this.replace(/^\s+/, '').replace(/\s+$/, '');
    };
}

exports.tests = function () {
    module("String Utils");

    test("basic String operation", function () {
        ok(String.isString('test'));
        ok(String.isString(new String('test')));
        ok(!String.isString(123));

        var fmt = "number=%d, str=%s, float=%.2f",
            msg = "number=123, str=test, float=3.14";

        equals(fmt.sprintf(123, 'test', 3.1415926), msg);
        equals(fmt.vsprintf([123, 'test', 3.1415926]), msg);

        equals(' \t\r\ntest '.trim(), 'test');
    });
};

});