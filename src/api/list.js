define(["require", "exports", "utils/oop"], function (require, exports) {

Array.extend({
    range: function (start, stop) {
        if (stop < 0) stop += this.length;

        return this.slice(start, stop+1);
    },
    equals: function (list) {
        if (this.length != list.length) return false;

        for (var i=0; i<this.length; i++) {
            if (this[i] != list[i]) return false;
        }

        return true;
    },
    find: function (value) {
        for (var i=0; i<this.length; i++) {
            if (this[i] == value) return i;
        }
        return -1;
    },
    insert: function () {
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

        this.splice(stop);
        this.splice(0, start);

        return this;
    },
    clone: function () {
        return this.slice(0);
    }
});

exports.tests = function () {
    module("List API");

    test("basic list operation", function () {
        var l = [1, 2, 3];

        ok(l.range(-100, 100).equals([1, 2, 3]), "range(-100, 100)");
        ok(l.range(0, 0).equals([1]), "range(0, 0)");
        ok(l.range(-3, 2).equals([1, 2, 3]), "range(-3, 2)");
        ok(l.range(5, 10).equals([]), "range(5, 10)");

        ok([1, 2, 1, 2, 1, 2, 1].remove(2, 1).equals([2, 2, 1, 2, 1]), "remove(2, 1)");
        ok([1, 2, 1, 2, 1, 2, 1].remove(-2, 1).equals([1, 2, 1, 2, 2]), "remove(-2, 1)");
        ok([1, 2, 1, 2, 1, 2, 1].remove(0, 1).equals([2, 2, 2]), "remove(0, 1)");

        ok([1, 2, 3, 4].trim(1, -1).equals([2, 3]), "trim(1, -1)");

        equals(l.find(3), 2, "find(3)");
        equals(l.find(4), -1, "!find(4)");

        equals(l.insert(1, 4, 5), 5, "insert(1, 4, 5)");
        ok(l.equals([1, 4, 5, 2, 3]), "equals([1, ...])");

        ok(l.clone().equals(l), "clone()");
    });
};

});