define("utils/blob", ["require", "exports", "api/long", "utils/oop", "api/list"], function (require, exports, long) {

var Binary = function (buf, off, len) {
    off = off || 0;
    len = len || (buf && buf.byteLength) || 0;

    this.buffer = buf ? this.getByteView(buf, off, len) : null;
    this.offset = off;
    this.length = len;
};

var NULL = 0;

Binary.alloc = function (len) {
    return new Binary(Binary.getBuffer(len), 0, len);
};

Binary.fromArray = function (arr) {
    var bin = Binary.alloc(arr.length);

    for (var i=0; i<arr.length; i++) {
        bin.put(arr[i]);
    }

    bin.reset();

    return bin;
};

Binary.extend({
    seek: function (off) {
        var cur = this.offset;

        this.offset = off || 0;

        return cur;
    },
    reset: function () {
        this.offset = 0;
    },
    slice: function (begin, end) {
        begin = begin || 0;
        end = end || this.length;

        var len = end - begin;

        var bin = new Binary(Binary.getBuffer(len), 0, len);

        var start = this.seek(begin);

        for (var i=0; i<len; i++) {
            bin.put(i, this.get(i));
        }

        this.seek(start);
        bin.reset();

        return bin;
    },
    toArray: function () {
        var result = [];

        for (var i=this.offset; i<this.length; i++) {
            result.push(this.get());
        }

        return result;
    },
    writeBytes: function (bytes) {
        for (var i=0; i<bytes.length; i++) {
            this.put(bytes[i]);
        }

        return bytes.length;
    },
    readBytes: function (count) {
        var bytes = new Array(count);

        for (var i=0; i<count; i++) {
            bytes[i] = this.get();
        }

        return bytes;
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

            if (!len && c == NULL) break;

            chars.push(c);
        }

        this.offset += i;

        return String.fromCharCode.apply(null, chars);
    },
    writeCString: function (str) {
        var len = this.writeUtf8String(str);

        this.put(NULL); // NULL

        return len + 1;
    },
    readCString: function () {
        var str = this.readUtf8String();

        this.get(); // skip NULL

        return str;
    },
    writeString: function (str) {
        var off = this.offset;

        this.writeInt(0);
        var len = this.writeCString(str);

        off = this.seek(off);

        len += this.writeInt(len);

        this.seek(off);

        return len;
    },
    readString: function () {
        var len = this.readInt();

        return this.readCString();
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
    },
    isInteger: function (num) {
        return num % 1 == 0;
    },
    writeLong: function (/* num, num, ... */) {
        for (var i=0; i<arguments.length; i++) {
            var arg = arguments[i];

            var num;

            if (arg instanceof long.Long) {
                num = arg;
            } else if (arg instanceof Number) {
                num = this.isInteger(arg) ? long.Long.fromInt(arg) : long.Long.fromNumber(arg);
            } else {
                num = long.Long.fromString(arg);
            }

            this.writeInt(num.low_, num.high_);
        }

        return 8 * arguments.length;
    },
    readLong: function (count) {
        if (count) {
            var nums = new Array(count);

            for (var i=0; i<count; i++) {
                nums[i] = this.readLong();
            }

            return nums;
        } else {
            var num = new long.Long(this.readInt(), this.readInt());

            return num;
        }
    },
    writeDouble: function (/* num, num, ... */) {
        for (var i=0; i<arguments.length; i++) {
            var arg = arguments[i];
            var num = arg instanceof Number ? arg : parseFloat(arg);

            this.writeIEEE754(num, 'little', 52, 8);

            this.offset += 8;
        }

        return 8 * arguments.length;
    },
    readDouble: function (count) {
        if (count) {
            var nums = new Array(count);

            for (var i=0; i<count; i++) {
                nums[i] = this.readDouble();
            }

            return nums;
        } else {
            var num = this.readIEEE754('little', 52, 8);

            this.offset += 8;

            return num;
        }
    },
    writeIEEE754: function(value, endian, mLen, nBytes) {
        var e, m, c,
          bBE = (endian === 'big'),
          eLen = nBytes * 8 - mLen - 1,
          eMax = (1 << eLen) - 1,
          eBias = eMax >> 1,
          rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
          i = bBE ? (nBytes-1) : 0,
          d = bBE ? -1 : 1,
          s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

        value = Math.abs(value);

        if (isNaN(value) || value === Infinity) {
            m = isNaN(value) ? 1 : 0;
            e = eMax;
        } else {
            e = Math.floor(Math.log(value) / Math.LN2);
            if (value * (c = Math.pow(2, -e)) < 1) {
                e--;
                c *= 2;
            }
            if (e+eBias >= 1) {
                value += rt / c;
            } else {
                value += rt * Math.pow(2, 1 - eBias);
            }
            if (value * c >= 2) {
                e++;
                c /= 2;
            }

            if (e + eBias >= eMax) {
                m = 0;
                e = eMax;
            } else if (e + eBias >= 1) {
                m = (value * c - 1) * Math.pow(2, mLen);
                e = e + eBias;
            } else {
                m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
                e = 0;
            }
        }

        for (; mLen >= 8; this.put(i, m & 0xff), i += d, m /= 256, mLen -= 8);

        e = (e << mLen) | m;
        eLen += mLen;

        for (; eLen > 0; this.put(i, e & 0xff), i += d, e /= 256, eLen -= 8);

        this.put(i - d, this.get(i - d) | s * 128);
    },
    readIEEE754: function(endian, mLen, nBytes) {
      var e, m,
          bBE = (endian === 'big'),
          eLen = nBytes * 8 - mLen - 1,
          eMax = (1 << eLen) - 1,
          eBias = eMax >> 1,
          nBits = -7,
          i = bBE ? 0 : (nBytes - 1),
          d = bBE ? 1 : -1,
          s = this.get(i);

      i += d;

      e = s & ((1 << (-nBits)) - 1);
      s >>= (-nBits);
      nBits += eLen;
      for (; nBits > 0; e = e * 256 + this.get(i), i += d, nBits -= 8);

      m = e & ((1 << (-nBits)) - 1);
      e >>= (-nBits);
      nBits += mLen;
      for (; nBits > 0; m = m * 256 + this.get(i), i += d, nBits -= 8);

      if (e === 0) {
        e = 1 - eBias;
      } else if (e === eMax) {
        return m ? NaN : ((s ? -1 : 1) * Infinity);
      } else {
        m = m + Math.pow(2, mLen);
        e = e - eBias;
      }
      return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
    }
});

if (typeof Uint8Array == "function") {
    Binary.getBuffer = function (len) {
        return new Binary(new ArrayBuffer(len), 0, len);
    };

    Binary.extend({
        get: function (idx) {
            if (idx == undefined) {
                idx = this.offset++;
            } else {
                idx += this.offset;
            }
            return this.buffer[idx];
        },
        put: function (idx, value) {
            if (value == undefined) {
                value = idx;
                idx = this.offset++;
            } else {
                idx += this.offset;
            }
            this.buffer[idx] = value;
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
                if (idx == undefined) {
                    idx = this.offset++;
                } else {
                    idx += this.offset;
                }

                return ((this.buffer.buffer[idx>>1] >> ((idx % 2) * 8))) & 255;
            },
            put: function (idx, value) {
                if (value == undefined) {
                    value = idx;
                    idx = this.offset++;
                } else {
                    idx += this.offset;
                }
                this.buffer.buffer[idx>>1] = (this.buffer.buffer[idx>>1] & (255 << ((1 - idx % 2) * 8))) | (value << ((idx % 2) * 8));
            }
        });
    })();
}

exports.Binary = Binary;

exports.tests = function () {
    module("Blob Utils");

    test("basic Binary operation", function () {
        var bin = Binary.alloc(10);

        ok(bin, "alloc");
        ok(bin.buffer, "buffer");
        equals(bin.offset, 0, "offset");
        equals(bin.length, 10, "length");

        equals(bin.writeBytes([0, 1, 2, 3]), 4, "writeBytes");
        equals(bin.offset, 4);

        bin.reset();
        ok(bin.readBytes(4).equals([0, 1, 2, 3]), "readBytes");

        bin.reset();
        equals(bin.writeCString("test"), 5, "writeCString");
        equals(bin.offset, 5);

        bin.reset();
        equals(bin.readCString(), "test", "readCString");
        equals(bin.offset, 5);

        bin.reset();
        equals(bin.writeString("test"), 9, "writeCString");
        equals(bin.offset, 9);

        bin.reset();
        equals(bin.readString(), "test", "readCString");
        equals(bin.offset, 9);

        bin.reset();
        equals(bin.writeUtf8String("测试"), 6, "writeUtf8String");
        equals(bin.offset, 6);

        bin.reset();
        equals(bin.readUtf8String(6), "测试", "readUtf8String with length");
        equals(bin.offset, 6);

        bin.put(NULL);
        bin.reset();
        equals(bin.readUtf8String(), "测试", "readUtf8String till NULL");
        equals(bin.offset, 6);

        equals(bin.slice(3, 6).readUtf8String(), "试", "slice");

        bin.reset();
        equals(bin.writeInt(123456789, '2'), 8, "writeInt");
        equals(bin.offset, 8);

        bin.reset();
        equals(bin.readInt(), 123456789, "readInt");
        equals(bin.offset, 4);
        equals(bin.readInt(), 2, "readInt");
        equals(bin.offset, 8);

        bin.reset();
        ok(bin.readInt(2).equals([123456789, 2]), "readInt(count)");

        bin.reset();
        equals(bin.writeDouble(3.1415926), 8, "writeDouble");
        equals(bin.offset, 8);

        bin.reset();
        equals(bin.readDouble(), 3.1415926, "readDouble");
        equals(bin.offset, 8);

        bin.reset();
        equals(bin.writeLong(long.Long.MAX_VALUE), 8, "writeLong");
        equals(bin.offset, 8);

        bin.reset();
        ok(bin.readLong().equals(long.Long.MAX_VALUE), "readLong");
    });
};

});