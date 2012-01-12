define("utils/blob", ["require", "exports", "utils/oop"], function (require, exports) {

var Binary = function (buf, off) {
    this.buffer = buf;
    this.offset = off;
};

Binary.extend({
    writeUtf8String: function (str) {

    }
});

if (typeof ArrayBuffer == 'function') {
    Binary.extend({
        writeUtf8String: function (str) {

        }
    });

    Binary.alloc = function (len) {
        return new Binary(new ArrayBuffer(len), 0);
    };
} else {

    var ArrayBuffer = function(buf, len) {
        this.str = buf;
        this.length = len;
    };

    ArrayBuffer.extend({

    });

    Binary.extend({
        writeUtf8String: function (str) {

        }
    });

    Binary.alloc = function (len) {
        var buf = new Array((len + 1) / 2 + 1).join('\0');

        return new Binary(new ArrayBuffer(buf, len), 0);
    };
}

var Blob = function () {
};

exports.Blob = Blob;

exports.tests = function () {
    module("Blob Utils");

    test("basic Binary operation", function () {
        var bin = Binary.alloc(5);

        ok(bin, "Binary.alloc");
        equals(bin.offset, 0, "Binary.offset");

        ok(bin.buffer, "Binary.buffer");
        ok(bin.buffer instanceof ArrayBuffer, "ArrayBuffer");
        equals(bin.buffer.length, 5, "ArrayBuffer.length");
    });

    test("basic Blob operation", function () {

    });
};

});