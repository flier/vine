define(["require", "exports"], function (require, exports) {

Object.prototype.clone = function () {
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
};

Function.prototype.inherit = function (parent) {
    if (parent.constructor == Function) {
        this.prototype = new parent();
        this.prototype.constructor = this;
        this.prototype.parent = parent.prototype;
    } else {
        this.prototype = parent;
        this.prototype.constructor = this;
        this.prototype.parent = parent;
    }

    return this;
};

Function.prototype.extend = function (props) {
    for ( var prop in props ) {
        if ( props[prop] === undefined ) {
            delete this.prototype[prop];

            // Avoid "Member not found" error in IE8 caused by setting window.constructor
        } else if ( prop !== "constructor" || this !== window ) {
            this.prototype[prop] = props[prop];
        }
    }

    return this;
};

exports.tests = function () {
    module("OOP utils");

    test("inherit and extend", function () {
        var Animal = function () {
            this.name = function () { return this.type; };
        };

        var Cat = function () {
            this.type = "cat";
        };

        Cat.inherit(Animal).extend({
            hello: function () {
                return "hello from " + this.name();
            }
        })

        var c = new Cat();

        equal(c.parent, Animal.prototype, "parent == super.prototype");

        equal(c.name(), "cat", "super.method");
        equal(c.hello(), "hello from cat", "extend method");

        var o = {a: 1, b: [1, 2, 3], c: { d: 4 }};

        equals(o.clone().a, 1, "object.clone()");
        equals(o.clone().b.length, 3, "object.clone() array");
        equals(o.clone().c.d, 4, "object.clone() object");
    });
};

});