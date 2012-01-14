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

var getClassName = function (obj) {
    var name = Object.prototype.toString.call(obj).slice(1, -1);

    return name.substr(name.indexOf(' ')+1);
};

Function.isFunction = function (obj) {
    return getClassName(obj) == 'Function';
};

// Add ECMA262-5 method binding if not supported natively
//
if (!('bind' in Function.prototype)) {
    Function.prototype.bind= function(owner) {
        var that= this;
        if (arguments.length<=1) {
            return function() {
                return that.apply(owner, arguments);
            };
        } else {
            var args= Array.prototype.slice.call(arguments, 1);
            return function() {
                return that.apply(owner, arguments.length===0? args : args.concat(Array.prototype.slice.call(arguments)));
            };
        }
    };
}

exports.getClassName = getClassName;

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

        equals(getClassName('test'), 'String');
        equals(getClassName(new String('test')), 'String');
        equals(getClassName(123), 'Number');
        equals(getClassName(new Number(123)), 'Number');
        equals(getClassName(true), 'Boolean');
        equals(getClassName(new Boolean(true)), 'Boolean');
        equals(getClassName(function () {}), 'Function');
        equals(getClassName(/test/), 'RegExp');
        equals(getClassName(new RegExp('test')), 'RegExp');
        equals(getClassName({}), 'Object');
        equals(getClassName([]), 'Array');
        equals(getClassName(new Array()), 'Array');
    });
};

});