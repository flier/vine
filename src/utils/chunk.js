define("utils/chunk", ["require", "exports", "utils/blob", "utils/storage"],
    function (require, exports, blob, storage) {

var CHUNK_SIZE = 4096; // 4K

var MIN_BLOCK_SHIFT = 3;
var MAX_BLOCK_SHIFT = 10;

var Chunk = function (len) {
    this.length = len || CHUNK_SIZE;
    this.data = new Array(this.length/2+1).join('\0');
};

Chunk.extend({

});

var ChunkManager = function (provider) {
    this.provider = provider;
    this.chunks = [];
    this.freeChunks = [];
    this.freeBlocks = [];

    for (var i=MIN_BLOCK_SHIFT; i<MAX_BLOCK_SHIFT; i++) {
        this.freeBlocks[i-MIN_BLOCK_SHIFT] = [];
    }

    this.loadMetadata();
};

ChunkManager.extend({
    loadMetadata: function () {
        var metadata = this.provider.getItem('__metadata__');

        if (metadata) {

        }
    },
    saveMetadata: function () {

    },
    getBlockIndex: function (len) {
        for (var i=MIN_BLOCK_SHIFT; i<=MAX_BLOCK_SHIFT; i++) {
            if (len <= (1<<i)) return i-MIN_BLOCK_SHIFT;
        }

        return -1;
    },
    getBlockSize: function (idx) {
        return 1 << (MIN_BLOCK_SHIFT + idx);
    },
    allocChunk: function (len) {
        var chunk = new Chunk(len);

        this.chunks.push(chunk);

        return chunk;
    },
    allocBlock: function (idx) {
        var chunk;

        if (this.freeChunks.length > 0) {
            chunk = this.freeChunks.pop();
        } else {
            chunk = this.allocChunk(CHUNK_SIZE);
        }

        var size = this.getBlockSize(idx);

        for (var i=0; i<chunk.data.length; i+=size) {
            this.freeBlocks[idx].push(new blob.Binary(chunk.data, i, size));
        }

        return this.freeBlocks[idx].pop();
    },
    alloc: function (len) {
        var idx = this.getBlockIndex(len);
        var block;

        if (idx < 0) {
            var chunk = this.allocChunk(len);
            block = new blob.Binary(chunk.data);
            block.chunk = chunk;
        } else if (this.freeBlocks[idx].length > 0) {
            block = this.freeBlocks.pop();
        } else {
            block = this.allocBlock(idx);
        }

        block.length = len;

        return block;
    },
    free: function (block) {
        var idx = this.getBlockIndex(block.length);

        if (idx < 0) {
            this.freeChunks.push(block.chunk);
        } else {
            this.freeBlocks[idx].push(block);
        }
    }
});

var chunks = new ChunkManager(storage.provider);

blob.Binary.extend({
    free: function () {
        chunks.free(this);
    }
});

exports.chunks = chunks;

exports.tests = function () {
    module("Chunk API");

    test("basic Chunk operation", function () {
        equals(chunks.chunks.length, 0)
        var buf = chunks.alloc(7);
        equals(chunks.chunks.length, 1, "allocBlock");

        ok(buf, "alloc");
        equals(buf.length, 7, "length");
        equals(chunks.freeBlocks[0].length, 255);
        chunks.free(buf);
        equals(chunks.freeBlocks[0].length, 256, "free");

        buf = chunks.alloc(CHUNK_SIZE);
        equals(buf.length, CHUNK_SIZE, "length");
        equals(chunks.chunks.length, 2, "alloc big block");

        equals(chunks.freeChunks.length, 0);
        buf.free();
        equals(chunks.freeChunks.length, 1, "free big block");
    });
};

});