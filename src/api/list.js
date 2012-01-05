define(["require", "exports", "utils/oop"], function (require, exports) {

var List = function (array) {
    array = array || [];

    for (var i in array) {
        this.push(array[i]);
    }

    this.lpush = this.unshift;
    this.rpush = this.push;
    this.lpop = this.shift;
    this.rpop = this.pop;
    this.range = this.slice;
};

List.inherit(Array);
List.extend({
    equals: function (list) {
        if (this.length != list.length) return false;

        for (var i in this) {
            if (this[i] != list[i]) return false;
        }

        return true;
    },
    remove: function (count, value) {
        var found = 0;

        if (count > 0) {
            var i = 0;

            while (count > found && i < this.array.length) {
                if (this.array[i] == value) {
                    found++;
                    this.array.splice(i);
                } else {
                    i++;
                }
            }
        } else if (count < 0) {
            for (var i = this.array.length-1; count <= -found && i >= 0; i--) {
                if (this.array[i] == value) {
                    found++;
                    this.array.splice(i);
                }
            }
        } else {
            for (var i=this.array.length-1; i>= 0; i--) {
                if (this.array[i] == value) {
                    found++;
                    this.array.splice(i);
                }
            }
        }

        return found;
    }
});

exports.List = List;
exports.tests = function () {
    module("List API");

    test("basic list operation", function () {
        var l = new List();

        equal(l.length, 0);

        equal(l.rpush('hello'), 1);
        equal(l.rpush('world'), 2);

        equal(l.length, 2);

        equal(l.lpop(), 'hello');

        equal(l.length, 1);

        equal(l.rpop(), 'world');

        equal(l.lpush(3, 2, 1), 3);

        equal(new List([3, 2, 1]).equals(l.range(-100, 100)));
    });
};

});