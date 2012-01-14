define("utils/oop", ["require", "exports"], function (require, exports) {

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

exports.getClassName = function (obj) {
    var name = Object.prototype.toString.call(obj).slice(1, -1);

    return name.substr(name.indexOf(' ')+1);
}

exports.tests = function () {
    module("OOP Utils");

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

        equals(c.parent, Animal.prototype, "parent == super.prototype");

        equals(c.name(), "cat", "super.method");
        equals(c.hello(), "hello from cat", "extend method");
    });
};

});