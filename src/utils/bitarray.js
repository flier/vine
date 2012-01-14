define("utils/bitarray", ["require", "exports", "utils/oop", "api/list"], function (require, exports) {

var BITS_SHIFT = 5; // or 64bit?
var BITS_MASK = (1 << BITS_SHIFT) - 1;
var ELEMENT_MASK = 0xFFFFFFFF;

var BitArray = function (size, array) {
    this.buffer = array || new Array((size + BITS_MASK) >> BITS_SHIFT).fill(0);
    this.size = size;
};

BitArray.BYTES_PER_ELEMENT  = (1 << BITS_SHIFT) / 8;
BitArray.BITS_PER_ELEMENT   = 1 << BITS_SHIFT;

BitArray.extend({
    get: function (idx) {
        var off = idx >> BITS_SHIFT;
        var bit = 1 << (idx % (1 << BITS_SHIFT));

        return !!(this.buffer[off] & bit);
    },
    set: function (idx, value) {
        var off = idx >> BITS_SHIFT;
        var bit = 1 << (idx % (1 << BITS_SHIFT));

        if (value) {
            this.buffer[off] |= bit;
        } else {
            this.buffer[off] &= ~bit;
        }

        return this;
    },
    toggle: function (idx) {
        var off = idx >> BITS_SHIFT;
        var bit = 1 << (idx % (1 << BITS_SHIFT));

        this.buffer[off] ^= bit;

        return this;
    },
    clear: function () {
        for (var i=0; i<this.buffer.length; i++) {
            this.buffer[i] = 0;
        }
    },
    equals: function (obj) {
        if (this === obj) return true;
        if (!obj || !(obj instanceof BitArray)) return false;

        return this.buffer.equals(obj.buffer);
    },
    clone: function () {
        return new BitArray(this.length, this.buffer.clone());
    },
    toByteArray: function () {
        var bytes = new Array(this.buffer.length * BitArray.BYTES_PER_ELEMENT);

        for (var i=0; i<this.buffer.length; i++) {
            for (var j=0; j<BitArray.BYTES_PER_ELEMENT; j++) {
                bytes[BitArray.BYTES_PER_ELEMENT*i+j] = (this.buffer[i] >> (8*j)) & 0xFF;
            }
        }

        return bytes;
    },
    toArray: function () {
        return this.buffer;
    },
    count: function () {
        var total = 0;

        for (var i=0; i<this.buffer.length; i++) {
            var x = this.buffer[i];

            // http://bits.stephan-brumme.com/countBits.html

            x  = x - ((x >> 1) & 0x55555555);
            x  = (x & 0x33333333) + ((x >> 2) & 0x33333333);
            x  = x + (x >> 4);
            x &= 0xF0F0F0F;

            total += (x * 0x01010101) >> 24;
        }

        return total;
    },
    not: function () {
        for (var i=0; i<this.buffer.length; i++) {
            this.buffer[i] = ~this.buffer[i] & ELEMENT_MASK;
        }

        return this;
    },
    or: function (mask) {
        if (this.buffer.length != mask.buffer.length)
            throw new Error("Arguments must be of the same length.");

        for (var i=0; i<this.buffer.length; i++) {
            this.buffer[i] |= mask.buffer[i];
        }

        return this;
    },
    and: function (mask) {
        if (this.buffer.length != mask.buffer.length)
            throw new Error("Arguments must be of the same length.");

        for (var i=0; i<this.buffer.length; i++) {
            this.buffer[i] &= mask.buffer[i];
        }

        return this;
    },
    xor: function (mask) {
        if (this.buffer.length != mask.buffer.length)
            throw new Error("Arguments must be of the same length.");

        for (var i=0; i<this.buffer.length; i++) {
            this.buffer[i] ^= mask.buffer[i];
        }

        return this;
    }
});

exports.BitArray = BitArray;

exports.tests = function () {
    module("BitArray API");

    test("basic BitArray operation", function () {
        var b = new BitArray(64);

        equals(b.buffer.length, 2, "constructor");

        b.set(5, 1).set(33, 1);

        equals(b.buffer[0], 1 << 5, "set");
        equals(b.buffer[1], 1 << 1, "set");

        ok(!b.get(12), "get");
        ok(b.get(33), "get");

        b.set(33, 0);

        ok(!b.get(33), "get");

        b.toggle(12).toggle(33);

        ok(b.get(12), "toggle");
        ok(b.get(33), "toggle");

        equals(b.count(), 3, "count");

        ok(b.toArray().equals([4128, 2]), "toArray");
        ok(b.toByteArray().equals([32, 16, 0, 0, 2, 0, 0, 0]), "toByteArray");

        var b2 = b.clone();

        ok(b.toArray().equals([4128, 2]), "toArray");

        ok(b.equals(b), "equals");
        ok(b.equals(b2), "equals");

        b.clear();

        equals(b.count(), 0, "clear");
        ok(!b.equals(b2), "equals");

        b = b2.clone();

        ok(b.get(33));
        ok(!b.not().get(33), "not");

        var mask = new BitArray(2, [1<<6, 0]);

        b = b2.clone();

        ok(!b.get(6));
        ok(b.or(mask).get(6), "or");

        mask.not();

        ok(b.get(5));

        b.and(mask);

        ok(b.get(5), "and");
        ok(!b.get(6), "and");

        mask.clear();

        mask.set(5, true);
        mask.set(6, true);

        b.xor(mask);

        ok(!b.get(5), "xor");
        ok(b.get(6), "xor");
    });
};

});