define(["require", "exports", "api/list", "utils/oop"], function (require, exports) {

var Set = function (items) {
    this.items = items || [];
};

Set.extend({
    length: function () {
        return this.items.length;
    },
    members: function () {
        return this.items;
    },
    add: function () {
        var added = 0;

        for (var i=0; i<arguments.length; i++) {
            if (this.items.find(arguments[i]) < 0) {
                this.items.push(arguments[i]);
                added++;
            }
        }

        return added;
    },
    remove: function () {
        var removed = 0;

        for (var i=0; i<arguments.length; i++) {
            var idx = this.items.find(arguments[i]);

            if (idx >= 0) {
                this.items.splice(idx, 1);

                removed++;
            }
        }

        return removed;
    },
    contains: function () {
        for (var i=0; i<arguments.length; i++) {
            if (this.items.find(arguments[i]) < 0) {
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
    });
};

});