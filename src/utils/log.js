define(["require", "exports", "js!sprintf", "utils/oop", "api/list"], function (require, exports) {

var Level = {
    ALL: 0,
    DEBUG: 1,
    INFO: 2,
    WARN: 3,
    ERROR: 4,
    FATAL: 5,
    NONE: 6,

    NAMES: [
        'ALL',
        'DEBUG',
        'INFO',
        'WARN',
        'ERROR',
        'FATAL',
        'NONE'
    ]
}

var BASIC_FORMAT = "%(levelname)s:%(name)s:%(message)s";

var Log = {
    format: BASIC_FORMAT,
    level: Level.WARN,
    handlers: [],

    basicConfig: function (opts) {
        for (k in opts) {
            Log[k] = opts[k];
        }

        if (Log.handlers.length == 0) {
            var h = new ConsoleHandler();

            h.formatter = new Formatter(Log.format);

            Log.handlers.push(h);
        }
    },

    getLogger: function (name, level) {
        var logger = new Logger(name, level || this.level);

        logger.handlers = Log.handlers.clone();

        return logger;
    },

    getFormatter: function (fmt) {
        return new Formatter(fmt || Log.format);
    }
}

function copyArgs(args, off) {
    var result = [];

    for (var i=off | 0; i<args.length; i++) {
        result.push(args[i]);
    }

    return result;
}

var LogRecord = function (logger, level, msg, args) {
    this.name = logger.name;
    this.levelno = level;
    this.levelname = Level.NAMES[level];
    this.message = msg;
    this.args = args;
    this.ts = new Date();
    this.created = this.ts.getTime() / 1000;
    this.asctime = this.ts.toLocaleString();
}

var Formatter = function (fmt) {
    this.fmt = fmt;
};

Formatter.extend({
    format: function (record) {
        if (record.args) {
            record.message = vsprintf(record.message, record.args);
        }

        return sprintf(this.fmt, record);
    }
});

var Handler = function () {
    this.formatter = null;
};

Handler.extend({
    handle: function (record) {
        if (this.filter(record)) {
            this.emit(record);
        }
    },
    filter: function (record) {
        return true;
    },
    emit: function (record) {

    },
    format: function (record) {
        var fmt = this.formatter || Log.getFormatter();

        return fmt.format(record);
    },
    flush: function () {
        // Ensure all logging output has been flushed.
    },
    close: function () {
        // Tidy up any resources used by the handler.
    }
})

var ConsoleHandler = function () {

};

ConsoleHandler.inherit(Handler).extend({
    emit: function (record) {
        console.log(this.format(record));
    }
});

var StringHandler = function () {
    this.str = null;
};

StringHandler.inherit(Handler).extend({
    emit: function (record) {
        this.str = this.format(record);
    }
});

var Logger = function (name, level) {
    this.name = name;
    this.level = level;
    this.handlers = [];
};

Logger.extend({
    log: function (level, msg, args) {
        if (level < this.level) return;

        var record = new LogRecord(this, level, msg, args);

        for (var i=0; i<this.handlers.length; i++) {
            this.handlers[i].handle(record);
        }
    },

    debug: function (msg) {
        this.log.apply(this, [Level.DEBUG, msg, copyArgs(arguments, 1)]);
    },
    info: function (msg) {
        this.log.apply(this, [Level.INFO, msg, copyArgs(arguments, 1)]);
    },
    warn: function (msg) {
        this.log.apply(this, [Level.WARN, msg, copyArgs(arguments, 1)]);
    },
    error: function (msg) {
        this.log.apply(this, [Level.ERROR, msg, copyArgs(arguments, 1)]);
    },
    fatal: function (msg) {
        this.log.apply(this, [Level.FATAL, msg, copyArgs(arguments, 1)]);
    }
});

exports.Level = Level;
exports.Log = Log;

exports.tests = function () {
    module("Log Utils");

    Log.basicConfig({
        format: "%(levelname)s %(message)s",
        level: Level.ALL
    });

    test("basic logging operation", function () {
        var handler = new StringHandler();
        var logger = Log.getLogger('test');

        logger.handlers = [handler];

        equals(logger.name, 'test', "Logger.name");
        equals(logger.level, Log.level, "Logger.level");

        logger.info('test');

        equals(handler.str, 'INFO test');
    });
};

});