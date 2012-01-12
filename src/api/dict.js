define(["require", "exports", "api/list", "utils/oop"], function (require, exports) {

Object.extend({
    clone: function () {
        console.log(this);

        var obj = this instanceof Array ? [] : {};

        for (var prop in this) {
            if (prop == 'clone') continue;

            if (this[prop] && typeof this[prop] == 'object') {
                obj[prop] = this[prop].clone();
            } else {
                obj[prop] = this[prop];
            }
        }

        return obj;
    }
});

var Dict = function (obj) {
    obj = obj || {};

    var props = Object.getOwnPropertyNames(obj);

    for (var i=0; i<props.length; i++) {
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

        for (var i=0; i<props.length; i++) {
            values.push(this[props[i]]);
        }

        return values;
    },
    length: function () {
        return Object.getOwnPropertyNames(this).length;
    },
    clear: function () {
        var props = Object.getOwnPropertyNames(this);

        for (var i=0; i<props.length; i++) {
            delete this[props[i]];
        }
    },
    each: function (callback /* boolean callback(key, value) */) {
        var props = Object.getOwnPropertyNames(this);

        for (var i=0; i<props.length; i++) {
            var ret = callback(props[i], this[props[i]]);

            if (ret) return ret;
        }
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

        new Dict({ a: 1, b: 2, c: 3 }).each(function (k, v) {
            sum += v;
        });

        equals(sum, 6, "each()");

        var o = {a: 1, b: [1, 2, 3], c: { d: 4 }};

        equals(o.clone().a, 1, "object.clone()");
        equals(o.clone().b.length, 3, "object.clone() array");
        equals(o.clone().c.d, 4, "object.clone() object");
    });
};

});