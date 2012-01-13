define("utils/blob", ["require", "exports", "utils/oop"], function (require, exports) {

var Binary = function (buf, off, len) {
    this.buffer = this.getByteView(buf, off, len);
    this.offset = 0;
    this.length = len;
};

Binary.alloc = function (len) {
    return new Binary(Binary.getBuffer(len), 0, len);
};
Binary.wrap = function (buf, off, len) {
    return new Binary(buf, len || buf.byteLength, off || 0);
};
Binary.extend({
    seek: function (off) {
        this.offset = off || 0;
    },
    reset: function () {
        this.offset = 0;
    },
    save: function () {
        return {
            offset: this.offset
        };
    },
    restore: function (state) {
        this.offset = state.offset;
    },
    slice: function (begin, end) {
        begin = begin || 0;
        end = end || this.length;

        var len = end - begin;

        var bin = new Binary(Binary.getBuffer(len), 0, len);

        var state = this.save();

        this.seek(begin);

        for (var i=0; i<len; i++) {
            bin.put(i, this.get(i));
        }

        this.restore(state);
        bin.reset();

        return bin;
    },
    writeUtf8String: function (str) {
        var idx = 0;

        for (var i=0; i<str.length; i++) {
            var c = str.charCodeAt(i);

            if (c < 128) {
                this.put(idx++, c);
            } else if (c < 2048) {
                this.put(idx++, (c >> 6) | 192);
                this.put(idx++, (c & 63) | 128);
            } else {
                this.put(idx++, (c >> 12) | 224);
                this.put(idx++, ((c >> 6) & 63) | 128);
                this.put(idx++, (c & 63) | 128);
            }
        }

        this.offset += idx;

        return idx;
    },
    readUtf8String: function (len) {
        var chars = [];

        for (var i=0; i<(len || this.length); i++) {
            var c = this.get(i);

            if ((c & 224) == 224) {
                c = ((c & ~224) << 12) | ((this.get(++i) & ~128) << 6) | (this.get(++i) & ~128);
            } else if ((c & 192) == 192) {
                c = ((c & ~192) << 6) | (this.get(++i) & ~128);
            }

            if (!len && c == 0) break;

            chars.push(c);
        }

        this.offset += i;

        return String.fromCharCode.apply(null, chars);
    },
    writeInt: function (/* num, num, ... */) {
        var idx = 0;

        for (var i=0; i<arguments.length; i++) {
            var arg = arguments[i];
            var num = arg instanceof Number ? arg : parseInt(arg);

            this.put(idx++, num & 0xff);
            this.put(idx++, (num >> 8) & 0xff);
            this.put(idx++, (num >> 16) & 0xff);
            this.put(idx++, (num >> 24) & 0xff);
        }

        this.offset += idx;

        return idx;
    },
    readInt: function (count) {
        if (count) {
            var nums = new Array(count);

            for (var i=0; i<count; i++) {
                nums[i] = this.readInt();
            }

            return nums;
        } else {
            var num = this.get(0) | (this.get(1) << 8) | (this.get(2) << 16) | (this.get(3) << 24);

            this.offset += 4;

            return num;
        }
    }
});

if (typeof Uint8Array == "function") {
    Binary.getBuffer = function (len) {
        return new Binary(new ArrayBuffer(len), 0, len);
    };

    Binary.extend({
        get: function (idx) {
            return this.buffer[this.offset + idx];
        },
        put: function (idx, value) {
            if (value == undefined) {
                idx = 0;
                value = idx;
            }
            this.buffer[this.offset + idx] = value;
        },
        getByteView: function (buf, off, len) {
            var buf = new Uint8Array(buf, off, len);

            buf.bin = this;

            return buf;
        }
    });
} else {
    (function () {
        var ArrayBuffer = function (len) {
            this.buffer = new Array((len + 1) >> 1).join('\0');
            this.byteLength = len;
        };

        var ArrayBufferView = function (buf, off, len) {
            this.buffer = buf;
            this.byteOffset = off || 0;
            this.byteLength = len || (buf && buf.byteLength) || 0;
        }

        var Uint8Array = function (buf, off, len) {
            this.parent.constructor.call(this, buf, off, len);
        };

        Uint8Array.inherit(ArrayBufferView);

        Binary.getBuffer = function (len) {
            return new Binary(new ArrayBuffer(len), 0, len);
        };

        Binary.extend({
            getByteView: function (buf, off, len) {
                var buf = new Uint8Array(buf, off, len);

                buf.bin = this;

                return buf;
            },
            get: function (idx) {
                idx = this.offset + (idx || 0);
                return ((this.buffer.buffer[idx>>1] >> ((idx % 2) * 8))) & 255;
            },
            put: function (idx, value) {
                if (value != undefined) {
                    idx += this.offset;
                } else {
                    idx = this.offset;
                    value = idx;
                }
                this.buffer.buffer[idx>>1] = (this.buffer.buffer[idx>>1] & (255 << ((1 - idx % 2) * 8))) | (value << ((idx % 2) * 8));
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

        bin.reset();
        equals(bin.readUtf8String(6), "测试", "readUtf8String with length");
        equals(bin.offset, 6);

        bin.reset();
        equals(bin.readUtf8String(), "测试", "readUtf8String till NULL");
        equals(bin.offset, 6);

        equals(bin.slice(3, 6).readUtf8String(), "试");

        bin.reset();
        equals(bin.writeInt(123456789, '2'), 8);
        equals(bin.offset, 8);

        bin.reset();
        equals(bin.readInt(), 123456789);
        equals(bin.offset, 4);
        equals(bin.readInt(), 2);
        equals(bin.offset, 8);
    });

    test("basic Blob operation", function () {

    });
};

});