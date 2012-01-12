define("utils/blob", ["require", "exports", "utils/oop"], function (require, exports) {

var Binary = function (buf, len, off) {
    this.buffer = buf;
    this.length = len;
    this.offset = off;
};

Binary.extend({
});

if (typeof Uint8Array == "function") {
    Binary.alloc = function (len) {
        return new Binary(new ArrayBuffer(len), len, 0);
    };

    Binary.extend({
        writeUtf8String: function (str) {
            var v = new Uint8Array(this.buffer, this.offset, this.length - this.offset);
            var idx = 0;

            for (var i=0; i<str.length; i++) {
                var c = str.charCodeAt(i);

                if (c < 128) {
                    v[idx++] = c;
                } else if (c < 2048) {
                    v[idx++] = (c >> 6) | 192;
                    v[idx++] = (c & 63) | 128;
                } else {
                    v[idx++] = (c >> 12) | 224;
                    v[idx++] = ((c >> 6) & 63) | 128;
                    v[idx++] = (c & 63) | 128;
                }
            }

            this.offset += idx;

            return idx;
        },
        readUtf8String: function (len) {
            var v = new Uint8Array(this.buffer, this.offset, len || (this.length - this.offset));
            var chars = [];

            for (var i=0; i<v.byteLength; i++) {
                var c = v[i];

                if ((c & 224) == 224) {
                    var c2 = v[++i] & ~128;
                    var c3 = v[++i] & ~128;

                    c = ((c & ~224) << 12) | (c2 << 6) | c3;

                } else if ((c & 192) == 192) {
                    var c2 = v[++i] & ~128;

                    c = ((c & ~192) << 6) | c2;
                }

                if (!len && c == 0) break;

                chars.push(c);
            }

            return String.fromCharCode.apply(null, chars);
        }
    });
} else {
    (function () {
        var ArrayBuffer = function (len) {
            this.buffer = new Array((len + 1) / 2 + 1).join('\0');
            this.byteLength = len;
        };

        var ArrayBufferView = function (buf, off, len) {
            this.buffer = buf;
            this.byteOffset = off;
            this.byteLength = len;
        }

        var Uint8Array = function (buf, off, len) {
            this.parent.constructor.call(this, buf, off, len);
        };

        Uint8Array.inherit(ArrayBufferView).extend({
            get: function (idx) {
                return (this.buffer[idx>>1] >> ((idx % 2) * 8)) & 255;
            },
            put: function (idx, value) {
                this.buffer[idx>>1] = (this.buffer[idx>>1] & (255 << ((1 - idx % 2) * 8))) | (value << ((idx % 2) * 8));
            }
        })

        Binary.alloc = function (len) {
            return new Binary(new ArrayBuffer(len), len, 0);
        };

        Binary.extend({
            writeUtf8String: function (str) {
                var v = new Uint8Array(this.buffer, this.offset, this.length - this.offset);
                var idx = 0;

                for (var i=0; i<str.length; i++) {
                    var c = str.charCodeAt(i);

                    if (c < 128) {
                        v.put(idx++, c);
                    } else if (c < 2048) {
                        v.put(idx++, (c >> 6) | 192);
                        v.put(idx++, (c & 63) | 128);
                    } else {
                        v.put(idx++, (c >> 12) | 224);
                        v.put(idx++, ((c >> 6) & 63) | 128);
                        v.put(idx++, (c & 63) | 128);
                    }
                }

                this.offset += idx;

                return idx;
            },
            readUtf8String: function (len) {
                var v = new Uint8Array(this.buffer, this.offset, len || (this.length - this.offset));
                var chars = [];

                for (var i=0; i<v.byteLength; i++) {
                    var c = v.get(i);

                    if ((c & 224) == 224) {
                        var c2 = v.get(++i) & ~128;
                        var c3 = v.get(++i) & ~128;

                        c = ((c & ~224) << 12) | (c2 << 6) | c3;

                    } else if ((c & 192) == 192) {
                        var c2 = v.get(++i) & ~128;

                        c = ((c & ~192) << 6) | c2;
                    }

                    if (!len && c == 0) break;

                    chars.push(c);
                }

                return String.fromCharCode.apply(null, chars);
            }
        });
    })();
}

var Blob = function () {
};

exports.Blob = Blob;

exports.tests = function () {
    module("Blob Utils");

    test("basic Binary operation", function () {
        var bin = Binary.alloc(7);

        ok(bin, "alloc");
        ok(bin.buffer, "buffer");
        equals(bin.offset, 0, "offset");
        equals(bin.length, 7, "length");

        equals(bin.writeUtf8String("测试"), 6, "writeUtf8String");
        equals(bin.offset, 6);

        bin.offset = 0;

        equals(bin.readUtf8String(6), "测试", "readUtf8String with length");

        bin.offset = 0;

        equals(bin.readUtf8String(), "测试", "readUtf8String till NULL");
    });

    test("basic Blob operation", function () {

    });
};

});