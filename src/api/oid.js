define("api/oid", ["require", "exports", "utils/uuid", "utils/oop", "api/list"],
    function (require, exports, uuid) {

var ObjectId = function (oid) {
    if (oid instanceof ObjectId) {
        this.bytes = oid.bytes;
    } else if (typeof oid == 'string') {
        this.bytes = uuid.parse(oid).slice(0, 12);
    } else if (Array.isArray(oid) && oid.length == 12) {
        this.bytes = oid;
    } else {
        this.bytes = uuid.v4('binary').slice(0, 12);
    }
};

ObjectId.extend({
    toString: function () {
        return uuid.hex(this.bytes);
    },
    equals: function (oid) {
        return this.bytes.equals(new ObjectId(oid).bytes);
    }
});

var DatabaseRef = function (name, oid) {
    this.name = name;
    this.oid = oid;
}

exports.ObjectId = ObjectId;
exports.DatabaseRef = DatabaseRef;

exports.tests = function () {
    module("ObjectId Utils");

    test("basic ObjectId operation", function () {
        var oid = new ObjectId();

        equals(oid.toString().length, 24, "toString()");
        equals(oid.bytes.length, 12, "buf");

        ok(new ObjectId(oid).equals(oid), "ObjectId(ObjectId)");
        ok(new ObjectId(oid.toString()).equals(oid), "ObjectId(String)");
        ok(new ObjectId(oid.bytes).equals(oid), "ObjectId(Array)");
    });
};

});
