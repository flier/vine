define("api/dict", ["require", "exports", "api/list", "utils/oop"], function (require, exports) {

var Dict = function (obj) {
    obj = obj || {};

    var props = Object.getOwnPropertyNames(obj);

    for (var i=0, len=props.length; i<len; i++) {
        var prop = props[i];

        this[prop] = obj[prop];
    }
};

Dict.inherit(Object).extend({
    contains: function (prop) {
        return typeof(this[prop]) !== 'undefined';
    },
    keys: function () {
        return Object.getOwnPropertyNames(this);
    },
    values: function () {
        var props = Object.getOwnPropertyNames(this);
        var values = [];

        for (var i=0, len=props.length; i<len; i++) {
            values.push(this[props[i]]);
        }

        return values;
    },
    length: function () {
        return Object.getOwnPropertyNames(this).length;
    },
    clear: function () {
        var props = Object.getOwnPropertyNames(this);

        for (var i=0, len=props.length; i<len; i++) {
            delete this[props[i]];
        }
    },
    forEach: function (callback /* (value, key, dict) */, that /*opt*/) {
        if (this === null) {
            throw new TypeError("`this` is null or not defined");
        }

        var obj = Object(this);

        if ({}.toString.call(callback) != "[object Function]") {
            throw new TypeError(callback + " is not a function");
        }

        var props = Object.getOwnPropertyNames(this);

        for (var i=0; i<props.length; i++) {
            callback.call(that, this[props[i]], props[i], this);
        }
    },
    clone: function () {
        var obj = {};

        var props = Object.getOwnPropertyNames(this);

        for (var i=0, len=props.length; i<len; i++) {
            var name = props[i];

            if (name == 'clone') return;

            var value = this[name];

            if (value &&
                typeof value == 'object' &&
                typeof value['clone'] == 'function') {
                obj[name] = value.clone();
            } else {
                obj[name] = value;
            }
        }

        return obj;
    }
});

exports.Dict = Dict;
exports.tests = function () {
    module("Dictionary API");

    test("basic dict operation", function () {
        var d = new Dict({
            a: 1,
            b: 2
        });

        ok(d.contains('a'), "contains()");
        equals(d.a, 1, "get()");

        ok(d.keys().sort().equals(["a", "b"]), "keys()");
        ok(d.values().sort().equals([1, 2]), "values()");

        equals(d.length(), 2, "length()");
        d.clear();
        equals(d.length(), 0, "clear()");

        var sum = 0;

        new Dict({ a: 1, b: 2, c: 3 }).forEach(function (v) {
            sum += v;
        });

        equals(sum, 6, "each()");

        var o = new Dict({a: 1, b: [1, 2, 3], c: { d: 4 }});

        equals(o.clone().a, 1, "object.clone()");
        equals(o.clone().b.length, 3, "object.clone() array");
        equals(o.clone().c.d, 4, "object.clone() object");
    });
};

});