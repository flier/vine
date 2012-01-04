define(["require", "exports"], function (require, exports) {

var List = function (array) {
    this.array = array;
};

List.fn = List.prototype = {

    length: function () {
        return this.array.length;
    },

    lpush: function () {

    },

    rpush: function () {

    },

    lpop: function () {

    },

    rpop: function () {

    }

};

exports.List = List;
exports.tests = function () {
    module("List API");
};

});