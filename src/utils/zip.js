define("utils/zip", ["require", "exports", "utils/oop", "utils/blob", "js!zip_inflate", "js!zip_deflate"],
    function (require, exports, oop, blob) {

zip_read_buff = function (buff, offset, n) {
    for(var i = 0; i < n && zip_deflate_pos < zip_deflate_data.length; i++)
        buff[offset + i] = zip_deflate_data[zip_deflate_pos++] & 0xff;

    return i;
};

zip_GET_BYTE = function() {
    if(zip_inflate_data.length == zip_inflate_pos)
        return -1;

    return zip_inflate_data[zip_inflate_pos++] & 0xff;
};

blob.Binary.extend({
    compress: function (text, level) {
        var data;

        if (text instanceof blob.Binary) {
            data = text.toArray();
        } else if (Array.isArray(text)) {
            data = text;
        } else {
            text = String(text);

            var bin = blob.Binary.alloc(text.length*3);

            var len = bin.writeUtf8String(text);

            bin.reset();

            data = bin.toArray(0, len);
        }

        zip_deflate_data = data;
        zip_deflate_pos = 0;
        zip_deflate_start(level || zip_DEFAULT_LEVEL);

        var buf = new Array(4096);
        var size = 0;

        while((len = zip_deflate_internal(buf, 0, buf.length)) > 0) {
            size += this.writeBytes(buf, len);
        }

        zip_deflate_data = null;

        return size;
    },
    decompress: function (size) {
        zip_inflate_data = this.readBytes(size);
        zip_inflate_pos = 0;
        zip_inflate_start();

        var buf = new Array(4096);
        var len, chunks = [], size=0;

        while((len = zip_inflate_internal(buf, 0, buf.length)) > 0) {
            chunks.push(buf.slice(0, len));
            size += len;
        }

        zip_inflate_data = null;

        var bin = blob.Binary.alloc(size);

        for (var i=0; i<chunks.length; i++) {
            bin.writeBytes(chunks[i]);
        }

        bin.reset();

        return bin;
    }
});

exports.tests = function () {
    module("zip Utils");

    test("basic compress/decompress operation", function () {
        var bin = blob.Binary.alloc(1024);

        equals(bin.compress('text'), 6, "compress");

        bin.reset();
        equals(bin.decompress(6).readUtf8String(), 'text', "decompress");

        bin.reset();
        equals(bin.compress(new Array(10240).join('测试'), 9), 116, "compress large UTF-8 text");

        bin.reset();
        var bin2 = bin.decompress(116);
        equals(bin2.length, 61434);
        equals(bin2.readUtf8String(12), '测试测试');
    });
};

});
