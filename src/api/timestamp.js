define("api/timestamp", ["require", "exports", "api/long", "utils/uuid", "utils/oop", "api/list"],
    function (require, exports, long, uuid) {

var Timestamp = function (steps, ts) {
    this.parent.constructor.call(this, steps || 0, (ts === undefined) ? new Date().getTime() / 1000 : ts);
};

Timestamp.inherit(long.Long).extend({
    steps: function () {
        return this.low_;
    },
    time: function () {
        return this.high_;
    },
    next: function (steps) {
        this.low_ += steps || 1;

        if (this.high_ > 0)
            this.high_ = new Date().getTime() / 1000;

        return this;
    }
});

exports.Timestamp = Timestamp;

exports.tests = function () {
    module("Timestamp Utils");

    test("basic Timestamp operation", function () {
        var ts = new Timestamp();
        var time = ts.time();

        equals(ts.steps(), 0, "steps");
        ok(time > 0, "time");

        ts.next();

        equals(ts.steps(), 1, "next");
        ok(ts.time() > time);

        ts = new Timestamp(5, 0);

        equals(ts.steps(), 5, "steps");
        equals(ts.time(), 0, "time");

        ts.next(3);

        equals(ts.steps(), 8, "steps");
        equals(ts.time(), 0, "time");
    });
};

});
