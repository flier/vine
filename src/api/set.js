define("api/set", ["require", "exports", "utils/oop"], function (require, exports) {

var Set = function (set_or_array) {
    if (set_or_array instanceof Set) {
        this.items = set_or_array.items.clone();
    } else  {
        this.items = [];

        if (set_or_array instanceof Array) {
            for (var i=0; i<set_or_array.length; i++) {
                this.add(set_or_array[i]);
            }
        }
    }
};

Set.extend({
    length: function () {
        return this.items.length;
    },
    members: function () {
        return this.items;
    },
    add: function (/* value, value, ... */) {
        var added = 0;

        for (var i=0; i<arguments.length; i++) {
            if (this.items.indexOf(arguments[i]) < 0) {
                this.items.push(arguments[i]);
                added++;
            }
        }

        return added;
    },
    remove: function (/* value, value, ... */) {
        var removed = 0;

        for (var i=0; i<arguments.length; i++) {
            var idx = this.items.indexOf(arguments[i]);

            if (idx >= 0) {
                this.items.splice(idx, 1);

                removed++;
            }
        }

        return removed;
    },
    contains: function (/* value, value, ... */) {
        for (var i=0; i<arguments.length; i++) {
            if (this.items.indexOf(arguments[i]) < 0) {
                return false;
            }
        }
        return true;
    },
    pop: function () {
        var idx = Math.floor(this.items.length * Math.random());

        return this.items.splice(idx, 1)[0];
    },
    random: function () {
        var idx = Math.floor(this.items.length * Math.random());

        return this.items[idx];
    },
    forEach: function (callback /* (value, index, set) */) {
        return this.items.forEach(callback);
    },

    _collect: function (args) {
        var items = this.items.clone();

        for (var i=0; i<args.length; i++) {
            var set = args[i] instanceof Set ? args[i] : new Set(args[i]);

            Array.prototype.push.apply(items, set.items.clone());
        }

        items.sort();

        return items;
    },
    diff: function (/* set, set, ... */) {
        var items = this._collect(arguments);

        var value;

        for (var i=0; i<items.length; i++) {
            if (items[i] != value) {
                value = items[i];
            } else {
                items.remove(0, value);
                i -= 1;
            }
        }

        return new Set(items);
    },
    inter: function (/* set, set, ... */) {
        var items = this._collect(arguments);

        var value, count=0;
        var set = new Set();

        for (var i=0; i<items.length; i++) {
            if (items[i] != value) {
                if (count == arguments.length+1) {
                    set.add(value);
                }

                value = items[i];
                count = 1;
            } else {
                count++;
            }
        }

        return set;
    },
    union: function (/* set, set, ... */) {
        return new Set(this._collect(arguments));
    },
    move: function (/* dst set, value, value, ... */) {
        var dst = arguments[0];
        var moved = 0;

        for (var i=1; i<arguments.length; i++) {
            if (this.remove(arguments[i]) > 0) {
                dst.add(arguments[i]);
                moved++;
            }
        }

        return moved;
    }
});

exports.tests = function () {
    module("Set API");

    test("basic set operation", function () {
        var s = new Set();

        equals(s.add(1, 2, 3, 3), 3, "add(1, ...)");
        equals(s.length(), 3, "length()");
        ok(s.members().equals([1, 2, 3]), "members()");
        ok(s.contains(3), "contains(3)");
        ok(!s.contains(4), "!contains(4)");

        equals(s.add(4, 5), 2, "add(4, 5)");
        equals(s.remove(4, 5), 2, "remove(4, 5)");
        equals(s.length(), 3, "length()");
        equals(s.remove(4, 5), 0, "!remove(4, 5)");

        ok(s.contains(s.random()), "random()");
        ok(!s.contains(s.pop()), "pop()");
        equals(s.length(), 2, "length()");

        var sum = 0;

        new Set([1, 2, 3]).forEach(function (value) {
            sum += value;
        });

        equals(sum, 6, "forEach()");
    });

    test("interop set operation", function () {
        ok(new Set([1, 2, 3, 4]).diff([3], [1, 3, 5]).members().equals([2, 4, 5]), "diff()");
        ok(new Set([1, 2, 3, 4]).inter([3], [1, 3, 5]).members().equals([3]), "inter");
        ok(new Set([1, 2, 3, 4]).union([3], [1, 3, 5]).members().equals([1, 2, 3, 4, 5]), "union");

        var s1 = new Set([1, 2]), s2 = new Set([3]);

        equals(s1.move(s2, 2, 3), 1, "move");
        ok(s1.members().equals([1]), "move from");
        ok(s2.members().equals([3, 2]), "move to");
        equals(s1.move(s2, 4), 0, "move nonexists");
    });
};

});