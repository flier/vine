define(["require", "exports", "utils/oop"], function (require, exports) {

var Binary = function (buf, off) {
    this.buf = buf;
    this.off = off;
};

Binary.extend({
    writeUtf8String: function (str) {

    }
})

var Blob = function () {
};

exports.Blob = Blob;

exports.tests = function () {
    module("Blob Utils");

    test("basic Blob operation", function () {
    });
};

});