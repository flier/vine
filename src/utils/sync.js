define("utils/sync", ["require", "exports", "utils/oop"], function (require, exports) {

var Timer = function (seconds, callback, data) {
    var timer = this;

    this.id = setTimeout(function () {
        callback.call(timer, data);
    }, seconds);
    this.data = data;
};

Timer.extend({
    cancel: function () {
        clearTimeout(this.id);
    }
});

var FakeTimer = function (callback) {
    this.data = callback;
};

FakeTimer.extend({
    cancel: function () {}
});

var Event = function (autoReset) {
    this.queue = [];
    this.fired = false;
    this.autoReset = autoReset;
};

Event.TIMEOUT = 'timeout';
Event.FIRED = 'fired';

Event.extend({
    reset: function () {
        this.fired = false;
    },
    wait: function (callback /* (event, status) */, seconds) {
        if (this.fired) {
            return callback.call(this);
        } else {
            var event = this;

            var timer = seconds === undefined ? new FakeTimer(callback) :
                new Timer(seconds, function (data) {
                    for (var i=0, len=event.queue.length; i<len; i++) {
                        if (event.queue[i] === this) {
                            event.queue.splice(i, 1);
                            break;
                        }
                    }

                    callback.call(event, Event.TIMEOUT);
                }, callback);

            this.queue.push(timer);

            return timer;
        }
    },
    notify: function (all) {
        this.fired = true;

        var timer = this.queue.shift();

        if (timer) {
            timer.cancel();

            var event = this;

            setTimeout(function () {
                timer.data.call(event, Event.FIRED);

                if (all) event.notify();
            }, 0);
        }

        if (this.autoReset) this.fired = false;
    },
    notifyAll: function () {
        this.notify(true);
    }
});

exports.tests = function () {
    module("Sync API");

    asyncTest("basic Timer operation", function () {
        var timer = new Timer(1, function () {
            ok(false, "cancel");
        });

        timer.cancel();

        new Timer(1, function () {
            ok(ok, "timer");

            QUnit.start();
        });
    });

    asyncTest("basic Sync operation", function () {
        var evt = new Event();

        evt.wait(function (status) {
            ok(this.fired, "notify");
            equals(status, Event.FIRED, "notify");

            evt.reset();
            ok(!evt.fired, "reset");
        });

        equals(evt.queue.length, 1, "before wait");
        ok(!evt.fired, "wait");
        evt.notify();
        ok(evt.fired, "notify");
        equals(evt.queue.length, 0, "notified");

        new Event().wait(function (status) {
            equals(status, Event.TIMEOUT, "timeout");
            QUnit.start();
        }, 1);
    });
};

});