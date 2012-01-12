define("utils/blob", ["require", "exports", "utils/oop"], function (require, exports) {

var Binary = function (buf, len, off) {
    this.buffer = buf;
    this.length = len;
    this.offset = off;
};

Binary.wrap = function (buf, len, off) {
    return new Binary(buf, len || buf.byteLength, off || 0);
}

Binary.extend({
});

if (typeof Uint8Array == "function") {
    Binary.alloc = function (len) {
        return new Binary(new ArrayBuffer(len), len, 0);
    };

    Binary.extend({
        getByteBuffer: function () {
            return new Uint8Array(this.buffer, this.offset, this.length - this.offset);
        },
        writeUtf8String: function (str) {
            var v = this.getByteBuffer();
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
            var v = this.getByteBuffer();
            var chars = [];

            var i;

            for (i=0; i<(len || v.byteLength); i++) {
                var c = v[i];

                if ((c & 224) == 224) {
                    c = ((c & ~224) << 12) | ((v[++i] & ~128) << 6) | (v[++i] & ~128);

                } else if ((c & 192) == 192) {
                    c = ((c & ~192) << 6) | (v[++i] & ~128);
                }

                if (!len && c == 0) break;

                chars.push(c);
            }

            this.offset += i;

            return String.fromCharCode.apply(null, chars);
        },
        writeInt: function (/* num, num, ... */) {
            var v = this.getByteBuffer();

            var idx = 0;

            for (var i=0; i<arguments.length; i++) {
                var arg = arguments[i];
                var num = arg instanceof Number ? arg : parseInt(arg);

                v[idx++] = num & 0xff;
                v[idx++] = (num >> 8) & 0xff;
                v[idx++] = (num >> 16) & 0xff;
                v[idx++] = (num >> 24) & 0xff;
            }

            this.offset += idx;

            return idx;
        },
        readInt: function (count) {
            var v = this.getByteBuffer();

            if (count) {
                var nums = new Array(count);

                for (var i=0; i<count; i++) {
                    nums[i] = this.readInt();
                }

                return nums;
            } else {
                this.offset += 4;

                return v[0] | (v[1] << 8) | (v[2] << 16) | (v[3] << 24);
            }
        }
    });
} else {
    (function () {
        var ArrayBuffer = function (len) {
            this.buffer = new Array((len + 1) >> 1).join('\0');
            this.byteLength = len;
        };

        ArrayBuffer.extend({
            slice: function (begin, end) {
                begin = begin || 0;
                end = end || this.byteLength, this.byteLength;

                var len = end - begin;

                var buf = new ArrayBuffer(len);
                var src = new Uint8Array(this, begin, len);
                var dst = new Uint8Array(buf);

                for (var i=0; i<len; i++) {
                    dst.put(i, src.get(i));
                }

                return buf;
            }
        });

        var ArrayBufferView = function (buf, off, len) {
            this.buffer = buf;
            this.byteOffset = off || 0;
            this.byteLength = len || (buf && buf.byteLength) || 0;
        }

        var Uint8Array = function (buf, off, len) {
            this.parent.constructor.call(this, buf, off, len);
        };

        Uint8Array.inherit(ArrayBufferView).extend({
            get: function (idx) {
                idx = idx ? (this.byteOffset + idx) : this.byteOffset;
                return (this.buffer[idx>>1] >> ((idx % 2) * 8)) & 255;
            },
            put: function (idx, value) {
                idx += this.byteOffset;
                this.buffer[idx>>1] = (this.buffer[idx>>1] & (255 << ((1 - idx % 2) * 8))) | (value << ((idx % 2) * 8));
            }
        });



        Binary.alloc = function (len) {
            return new Binary(new ArrayBuffer(len), len, 0);
        };

        Binary.extend({
            getByteBuffer: function () {
                return new Uint8Array(this.buffer, this.offset, this.length - this.offset);
            },
            writeUtf8String: function (str) {
                var v = this.getByteBuffer();
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
                var v = this.getByteBuffer();
                var chars = [];

                for (var i=0; i<(len || v.byteLength); i++) {
                    var c = v.get(i);

                    if ((c & 224) == 224) {
                        c = ((c & ~224) << 12) | ((v.get(++i) & ~128) << 6) | (v.get(++i) & ~128);
                    } else if ((c & 192) == 192) {
                        c = ((c & ~192) << 6) | (v.get(++i) & ~128);
                    }

                    if (!len && c == 0) break;

                    chars.push(c);
                }

                this.offset += i;

                return String.fromCharCode.apply(null, chars);
            },
            writeInt: function (/* num, num, ... */) {
                var v = this.getByteBuffer();

                var idx = 0;

                for (var i=0; i<arguments.length; i++) {
                    var arg = arguments[i];
                    var num = arg instanceof Number ? arg : parseInt(arg);

                    v.put(idx++, num & 0xff);
                    v.put(idx++, (num >> 8) & 0xff);
                    v.put(idx++, (num >> 16) & 0xff);
                    v.put(idx++, (num >> 24) & 0xff);
                }

                this.offset += idx;

                return idx;
            },
            readInt: function (count) {
                var v = this.getByteBuffer();

                if (count) {
                    var nums = new Array(count);

                    for (var i=0; i<count; i++) {
                        nums[i] = this.readInt();
                    }

                    return nums;
                } else {
                    var num = v.get(0) | (v.get(1) << 8) | (v.get(2) << 16) | (v.get(3) << 24);

                    this.offset += 4;

                    return num;
                }
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
        var bin = Binary.alloc(8);

        ok(bin, "alloc");
        ok(bin.buffer, "buffer");
        equals(bin.offset, 0, "offset");
        equals(bin.length, 8, "length");

        equals(bin.writeUtf8String("测试"), 6, "writeUtf8String");
        equals(bin.offset, 6);

        bin.offset = 0;
        equals(bin.readUtf8String(6), "测试", "readUtf8String with length");
        equals(bin.offset, 6);

        bin.offset = 0;
        equals(bin.readUtf8String(), "测试", "readUtf8String till NULL");
        equals(bin.offset, 6);

        equals(Binary.wrap(bin.buffer.slice(3, 6)).readUtf8String(), "试");

        bin.offset = 0;
        equals(bin.writeInt(123456789, '2'), 8);
        equals(bin.offset, 8);

        bin.offset = 0;
        equals(bin.readInt(), 123456789);
        equals(bin.offset, 4);
        equals(bin.readInt(), 2);
        equals(bin.offset, 8);
    });

    test("basic Blob operation", function () {

    });
};

});