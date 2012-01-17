define("api/list", ["require", "exports", "utils/oop"], function (require, exports) {

Array.extend({
    range: function (start, stop) {
        if (stop < 0) stop += this.length;

        return this.slice(start, stop+1);
    },
    equals: function (list) {
        if (this === list) return true;
        if (!this || !list) return false;
        if (this.length != list.length) return false;

        for (var i=0, len=this.length; i<len; i++) {
            if (this[i] != list[i]) return false;
        }

        return true;
    },
    insert: function (/* value, value, ... */) {
        var args = Array.prototype.slice.call(arguments);

        args.splice(1, 0, 0);

        Array.prototype.splice.apply(this, args);

        return this.length;
    },
    remove: function (count, value) {
        var found = 0;

        if (count > 0) {
            var i = 0;

            while (count > found && i < this.length) {
                if (this[i] == value) {
                    found++;
                    this.splice(i, 1);
                } else {
                    i++;
                }
            }
        } else if (count < 0) {
            for (var i = this.length-1; count < -found && i >= 0; i--) {
                if (this[i] == value) {
                    found++;
                    this.splice(i, 1);
                }
            }
        } else {
            for (var i=this.length-1; i>= 0; i--) {
                if (this[i] == value) {
                    found++;
                    this.splice(i, 1);
                }
            }
        }

        return this;
    },
    trim: function (start, stop) {
        if (start < 0) start += this.length;
        if (stop < 0) stop += this.length;

        this.splice(stop, this.length);
        this.splice(0, start);

        return this;
    },
    clone: function () {
        return this.slice(0);
    },
    fill: function (value) {
        for (var i=0, len=this.length; i<len; i++) {
            this[i] = value;
        }
        return this;
    }
});

// Add ECMA262-5 Array methods if not supported natively
//
if(!('isArray' in Array.prototype)) {
    Array.isArray = function (arg) {
        return Object.prototype.toString.call(arg) == '[object Array]';
    };
}

if (!('indexOf' in Array.prototype)) {
    Array.prototype.indexOf= function(find, i /*opt*/) {
        if (this === null)
            throw new TypeError("`this` is null or not defined");

        if (i===undefined) i= 0;
        if (i<0) i+= this.length;
        if (i<0) i= 0;
        for (var n= this.length; i<n; i++)
            if (i in this && this[i]===find)
                return i;
        return -1;
    };
}
if (!('lastIndexOf' in Array.prototype)) {
    Array.prototype.lastIndexOf= function(find, i /*opt*/) {
        if (this === null)
            throw new TypeError("`this` is null or not defined");

        if (i===undefined) i= this.length-1;
        if (i<0) i+= this.length;
        if (i>this.length-1) i= this.length-1;
        for (i++; i-->0;) /* i++ because from-argument is sadly inclusive */
            if (i in this && this[i]===find)
                return i;
        return -1;
    };
}
if (!('forEach' in Array.prototype)) {
    Array.prototype.forEach= function(callback, that /*opt*/) {
        if (this === null)
            throw new TypeError("`this` is null or not defined");

        // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
        var obj = Object(this);

        // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
        // 3. Let len be ToUint32(lenValue).
        var len = obj.length >>> 0; // Hack to convert O.length to a UInt32

        // 4. If IsCallable(callback) is false, throw a TypeError exception.
        // See: http://es5.github.com/#x9.11
        if (!Function.isFunction(callback))
            throw new TypeError(callback + " is not a function");

        for (var i= 0; i<len; i++) {
            if (i in obj) {
                callback.call(that, obj[i], i, obj);
            }
        }
    };
}
if (!('map' in Array.prototype)) {
    Array.prototype.map= function(mapper, that /*opt*/) {
        if (this === null)
            throw new TypeError("`this` is null or not defined");

        var other= new Array(this.length);
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this)
                other[i]= mapper.call(that, this[i], i, this);
        return other;
    };
}
if (!('filter' in Array.prototype)) {
    Array.prototype.filter= function(filter, that /*opt*/) {
        if (this === null)
            throw new TypeError("`this` is null or not defined");

        var other= [], v;
        for (var i=0, n= this.length; i<n; i++)
            if (i in this && filter.call(that, v= this[i], i, this))
                other.push(v);
        return other;
    };
}
if (!('every' in Array.prototype)) {
    Array.prototype.every= function(tester, that /*opt*/) {
        if (this === null)
            throw new TypeError("`this` is null or not defined");

        for (var i= 0, n= this.length; i<n; i++)
            if (i in this && !tester.call(that, this[i], i, this))
                return false;
        return true;
    };
}
if (!('some' in Array.prototype)) {
    Array.prototype.some= function(tester, that /*opt*/) {
        if (this === null)
            throw new TypeError("`this` is null or not defined");

        for (var i= 0, n= this.length; i<n; i++)
            if (i in this && tester.call(that, this[i], i, this))
                return true;
        return false;
    };
}

exports.tests = function () {
    module("List API");

    test("basic list operation", function () {
        var l = [1, 2, 3];

        ok(l.range(-100, 100).equals([1, 2, 3]), "range(-100, 100)");
        ok(l.range(0, 0).equals([1]), "range(0, 0)");
        ok(l.range(-3, 2).equals([1, 2, 3]), "range(-3, 2)");
        ok(l.range(5, 10).equals([]), "range(5, 10)");

        ok(l.equals(l));
        ok(![].equals(null));
        ok(![].equals(undefined));

        ok([1, 2, 1, 2, 1, 2, 1].remove(2, 1).equals([2, 2, 1, 2, 1]), "remove(2, 1)");
        ok([1, 2, 1, 2, 1, 2, 1].remove(-2, 1).equals([1, 2, 1, 2, 2]), "remove(-2, 1)");
        ok([1, 2, 1, 2, 1, 2, 1].remove(0, 1).equals([2, 2, 2]), "remove(0, 1)");

        ok([1, 2, 3, 4].trim(1, -1).equals([2, 3]), "trim(1, -1)");

        equals(l.indexOf(3), 2, "find(3)");
        equals(l.indexOf(4), -1, "!find(4)");

        equals(l.insert(1, 4, 5), 5, "insert(1, 4, 5)");
        ok(l.equals([1, 4, 5, 2, 3]), "equals([1, ...])");

        ok(l.clone().equals(l), "clone()");

        var sum = 0;

        [1, 2, 3].forEach(function (value) {
            sum += value;
        });

        equals(sum, 6, "each()");

        ok([1, 2, 3].fill(5).equals([5, 5, 5]), "fill");
    });
};

});