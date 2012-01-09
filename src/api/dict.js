define(["require", "exports", "api/list", "utils/oop"], function (require, exports) {

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

        ok(d.contains('a'));
        equals(d.a, 1);

        ok(d.keys().equals(["b", "a"]));
        ok(d.values().equals([2, 1]));

        equals(d.length(), 2);
        d.clear();
        equals(d.length(), 0);
    });
};

});