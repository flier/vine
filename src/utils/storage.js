define("utils/storage", ["require", "exports", "utils/browser", "utils/log", "utils/string", "utils/oop", "js!modernizr"], function (require, exports, browser, log) {

var StorageProvider = function () {
    this.namespace = 'vine';
};

StorageProvider.create = function (name, opts) {
    return WebSqlProvider.create(name, opts) ||
           LocalStorageProvider.create(name, opts) ||
           UserDataProvider.create(name, opts);
};

var WebSqlProvider = function (name, opts) {
    this.parent.constructor.call(this);

    if (name) this.init(name, opts);

};

WebSqlProvider.isAvailable = function () {
    return Modernizr.websqldatabase;
};

WebSqlProvider.create = function (name, opts) {
    return !WebSqlProvider.isAvailable() ? null : new WebSqlProvider(name, opts);
};

if (WebSqlProvider.isAvailable()) { (function() {

WebSqlProvider.DEFAULT_SIZE = 5*1024*1024;
WebSqlProvider.db = null;

WebSqlProvider.inherit(StorageProvider).extend({
    init: function (name, opts) {
        this.logger = log.getLogger('websql');
        this.tblname = name;
        this.opts = opts || {};

        this.prepareDatabase();
    },
    fireReadyEvent: function () {
        if (Function.isFunction(this.opts['ready'])) {
            this.opts['ready'].call(this);
        }
    },
    getVersion: function () {
        return this.opts['version'] || '1.0';
    },
    getName: function () {
        return this.opts['name'] || "Vine WebSql storage";
    },
    getSize: function () {
        return this.opts['size'] || WebSqlProvider.DEFAULT_SIZE;
    },
    prepareDatabase: function () {
        var provider = this;

        if (!WebSqlProvider.db) {
            try {
                WebSqlProvider.db = openDatabase(provider.namespace, provider.getVersion(), provider.getName(), provider.getSize(), function (db) {
                    provider.createDatabase(db);
                });
            } catch (e) {
                this.logger.error("open database [%s] failed, err=%d, %s", this.namespace, e.code, e.message);
            }
        }

        if (WebSqlProvider.db) {
            this.createDatabase(WebSqlProvider.db);
        }
    },
    createDatabase: function (db) {
        var provider = this;

        db.changeVersion(db.version, this.getVersion(), function (trans) {
            provider.createTables(trans);
        }, function (err) {
            provider.logger.error("create database [%s] v%s failed, err=%d, %s", provider.namespace, provider.getVersion(), err.code, err.message);
        }, function () {
            provider.logger.info("create database [%s] v%s succeeded", provider.namespace, provider.getVersion());
        });

        this.prepareTables();
    },
    prepareTables: function () {
        var provider = this;

        if (WebSqlProvider.db) {
            this.logger.info("open database [%s] v%s succeeded", this.namespace, WebSqlProvider.db.version);

            WebSqlProvider.db.transaction(function (trans) {
                provider.createTables(trans);
            }, function (err) {
                provider.logger.error("create database [%s] v%s failed, err=%d, %s", provider.namespace, provider.getVersion(), err.code, err.message);
            }, function () {
                provider.fireReadyEvent();
            });
        }
    },
    createTables: function (trans) {
        this.logger.info("constructing the database...");

        var provider = this;
        var sql = 'CREATE TABLE IF NOT EXISTS %s (key PRIMARY KEY, value)'.sprintf(provider.tblname);

        this.logger.debug("executing SQL: " + sql);

        trans.executeSql(sql, [], function (trans, results) {
            provider.logger.debug("create table [%s] succeeded", provider.tblname);
        }, function (trans, err) {
            provider.logger.error("create table [%s] failed, err=%d, %s", provider.tblname, err.code, err.message);
        });
    },
    startTransaction: function (readonly, callback) {
        var provider = this;
        var start = new Date().getTime();

        if (readonly) {
            WebSqlProvider.db.readTransaction(function (trans) {
                callback.call(provider, trans);
            }, function (err) {
                provider.logger.warn("commit readonly transaction failed, err=%d, %s", err.code, err.message);
            }, function () {
                provider.logger.debug("commit readonly transaction succeeded in %.2fms", (new Date().getTime() - start));
            });
        } else {
            WebSqlProvider.db.transaction(function (trans) {
                callback.call(provider, trans);
            }, function (err) {
                provider.logger.warn("commit readwrite transaction failed, err=%d, %s", err.code, err.message);
            }, function () {
                provider.logger.debug("commit readwrite transaction succeeded in %.2fms", (new Date().getTime() - start));
            });
        }
    },
    select: function (opts, callback) {
        var provider = this;

        this.startTransaction(true, function (trans) {
            var sql;
            var args = [];

            if (opts['fields']) {
                sql = "SELECT %s".sprintf(opts.fields.join(','));
            } else {
                sql = "SELECT *";
            }

            sql += " FROM " + provider.tblname;

            if (opts['where']) {
                var criterias = [];
                var names = Object.getOwnPropertyNames(opts.where);

                for (var i=0, len=names.length; i<len; i++) {
                    criterias.push(names[i] + '=?');
                    args.push(opts.where[names[i]]);
                }

                sql += " WHERE " + criterias.join(',');
            }

            if (opts['orderby']) {
                sql += " ORDER BY " + opts.orderby.join(',');
            }

            provider.logger.debug("executing SQL: " + sql);

            trans.executeSql(sql, args, function (trans, results) {
                provider.logger.debug("execute query succeeded, %d rows", results.rows.length);

                callback.call(provider, results);
            }, function (trans, err) {
                provider.logger.warn("execute query failed, err=%d, %s", err.code, err.message);

                callback.call(provider, null, err);
            });
        });
    },
    length: function (callback) {
        this.select({
            fields: ["count(*) AS count"]
        }, function (results, err) {
            if (Function.isFunction(callback)) {
                if (results) {
                    callback.call(this, results.rows.item(0).count);
                } else {
                    callback.call(this, undefined, err);
                }
            }
        });
    },
    getItem: function (key, callback) {
        this.select({
            fields: ['value'],
            where: { key: key }
        }, function (results, err) {
            if (Function.isFunction(callback)) {
                if (results) {
                    callback.call(this, results.rows.length === 0 ? undefined : results.rows.item(0).value);
                } else {
                    callback.call(this, undefined, err);
                }
            }
        });
    },
    setItem: function (key, data) {
        var provider = this;

        this.startTransaction(false, function (trans) {
            var sql = 'REPLACE INTO %s (key, value) VALUES (?, ?)'.sprintf(provider.tblname);

            trans.executeSql(sql, [key, data], function (trans, results) {
                provider.logger.debug("update %d item succeeded, %s=%s", results.rowsAffected, key, data);
            }, function (trans, err) {
                provider.logger.warn("update item failed, err=%d, %s", err.code, err.message);
            });
        });
    },
    removeItem: function (key) {
        var provider = this;

        this.startTransaction(false, function (trans) {
            var sql = 'DELETE FROM %s WHERE key=?'.sprintf(provider.tblname);

            trans.executeSql(sql, [key], function (trans, results) {
                provider.logger.debug("delete %d item succeeded, key=%s", results.rowsAffected, key);
            }, function (trans, err) {
                provider.logger.warn("delete item failed, err=%d, %s", err.code, err.message);
            });
        });
    },
    clear: function () {
        var provider = this;

        this.startTransaction(false, function (trans) {
            var sql = 'DELETE FROM ' + provider.tblname;

            trans.executeSql(sql, [], function (trans, results) {
                provider.logger.debug("clear items succeeded", results.rowsAffected);
            }, function (trans, err) {
                provider.logger.warn("clear items failed, err=%d, %s", err.code, err.message);
            });
        });
    }
});

})(); }

/**
 *
 * https://developer.mozilla.org/en/DOM/Storage
 *
 * Note: window.opera.scriptStorage is disabled by default in Opera,
 *       to enable it go on opera:config#PersistentStorage|UserJSStorageQuota
 *       and set a quota different from 0 like for example 5120
 *
 *       http://www.opera.com/docs/userjs/specs/#scriptstorage
 */

var LocalStorageProvider = function (name) {
    this.parent.constructor.call(this);

    this.namespace += ':' + name + ':';
};

LocalStorageProvider.isAvailable = function () {
    return Modernizr.localstorage;
};
LocalStorageProvider.create = function (name) {
    return !LocalStorageProvider.isAvailable() ? null : new LocalStorageProvider(name);
};

if (LocalStorageProvider.isAvailable()) { (function() {

LocalStorageProvider.inherit(StorageProvider).extend({
    length: function () {
        var count = 0;

        for (var i=0, len=localStorage.length; i<len; i++) {
            var key = localStorage.key(i);

            if (key.indexOf(this.namespace) === 0)
                count++;
        }

        return count;
    },
    getKey: function (idx, callback) {
        var key;

        if (idx < 0 || localStorage.length <= idx) return undefined;

        for (var i=0, len=localStorage.length; i<len; i++) {
            key = localStorage.key(i);

            if (key.indexOf(this.namespace) === 0 && idx-- === 0)
            {
                key = key.slice(this.namespace.length);

                if (Function.isFunction(callback)) callback.call(this, key);

                return key;
            }
        }

        if (Function.isFunction(callback)) callback.call(this);

        return undefined;
    },
    getItem: function (key, callback) {
        var item = localStorage.getItem(this.namespace + key);

        if (Function.isFunction(callback)) callback.call(this);

        return item;
    },
    removeItem: function (key) {
        localStorage.removeItem(this.namespace + key);
    },
    setItem: function (key, data) {
        localStorage.setItem(this.namespace + key, data);
    },
    clear: function () {
        var i, len, removing = [];

        for (i=0, len=localStorage.length; i<len; i++) {
            var key = localStorage.key(i);

            if (key.indexOf(this.namespace) === 0)
                removing.push(key);
        }

        for (i=0, len=removing.length; i<len; i++) {
            localStorage.removeItem(removing[i]);
        }
    }
});

})(); }

// http://msdn.microsoft.com/en-us/library/ms531424(VS.85).aspx
// https://github.com/marcuswestin/store.js/blob/master/store.js

var UserDataProvider = function (name) {
    this.parent.constructor.call(this);

    if (name) this.init(name);
};

UserDataProvider.isAvailable = function () {
    return browser.name == 'Explorer' && browser.version < 9;
};

UserDataProvider.create = function (name) {
    return !UserDataProvider.isAvailable() ? null : new UserDataProvider(name);
};

if (UserDataProvider.isAvailable()) { (function() {

var ENCODE_MAP = {'.': '.2E', '!': '.21', '~': '.7E', '*': '.2A', '\'': '.27', '(': '.28', ')': '.29', '%': '.'};

UserDataProvider.inherit(StorageProvider).extend({
    init: function (name) {
        this.storename = this.namespace + (name || 'Store');

        this.data = document.createElement('div');

        document.appendChild(this.data);

        this.data.style.display = 'none';
        this.data.addBehavior('#default#userData');

        this.data.load(this.storename);
    },
    encodeKey: function (key) {
        // encodeURIComponent leaves - _ . ! ~ * ' ( ) unencoded.
        return '_' + encodeURIComponent(key).replace(/[.!~*'()%]/g, function(c) { return ENCODE_MAP[c]; });
    },
    decodeKey: function (key) {
        return decodeURIComponent(key.replace(/\./g, '%')).substr(1);
    },
    length: function () {
        return this.data.XMLDocument.documentElement.attributes.length;
    },
    getKey: function (idx, callback) {
        var key = this.decodeKey(this.data.XMLDocument.documentElement.attributes[idx].name);

        if (Function.isFunction(callback)) callback.call(this, key);

        return key;
    },
    getItem: function (key, callback) {
        var item = this.data.getAttribute(this.encodeKey(key));

        if (Function.isFunction(callback)) callback.call(this, item);

        return item;
    },
    removeItem: function (key) {
        this.data.removeAttribute(this.encodeKey(key));
        this.data.save(this.storename);
    },
    setItem: function (key, data) {
        this.data.setAttribute(this.encodeKey(key), data);
        this.data.save(this.storename);
    },
    clear: function () {
        var attrs = this.data.XMLDocument.documentElement.attributes;

        for (var i=0, attr; attr = attrs[i]; i++) {
            this.data.removeAttribute(attr.name);
        }
        this.data.save(this.storename);
    }
});

})(); }

exports.StorageProvider = StorageProvider;

function testStorageProvider(providerClass) {
    var provider = providerClass.create('test');

    provider.clear();
    equals(provider.length(), 0, "length()");
    equals(provider.getItem('key'), null, "getItem()");
    provider.setItem('key', 'value', "setItem()");
    equals(provider.length(), 1, "length()");
    equals(provider.getItem('key'), 'value', "getItem()");
    equals(provider.getKey(0), 'key', 'getKey()');
    provider.removeItem('key');
    equals(provider.length(), 0, "length()");
    equals(provider.getItem('key'), null, "getItem()");

    provider.setItem('key', 'value', "setItem()");
    equals(provider.length(), 1, "length()");

    provider = providerClass.create('test');
    equals(provider.length(), 1, "length()");
    provider.setItem('key', 'value', "setItem()");
}

function testAsyncStorageProvider(providerClass) {
    providerClass.create('test', {
        ready: function () {
            this.clear();
            this.length(function (len) { equals(len, 0, "length()"); });
            this.getItem('key', function (value) { equals(value, undefined, "getItem()"); });
            this.setItem('key', 'value');
            this.length(function (len) { equals(len, 1, "length()"); });
            this.getItem('key', function (value) { equals(value, 'value', "getItem()"); });

            this.removeItem('key');
            this.length(function (len) { equals(len, 0, "length()"); });
            this.setItem('key', 'value');
            this.length(function (len) { equals(len, 1, "length()"); });
            this.clear();
            this.length(function (len) { equals(len, 0, "length()"); });
            this.setItem('key', 'value', "setItem()");

            providerClass.create('test', {
                ready: function () {
                    this.length(function (len) { equals(len, 1, "length()"); });
                    this.getItem('key', function (value) { equals(value, 'value', "getItem()"); });
                }
            });
        }
    });
}

exports.tests = function () {
    module("Storage API");

    test("basic StorageProvider operation", function () {
        var provider = StorageProvider.create('test');

        ok(provider !== null, "create");
        ok(provider instanceof StorageProvider, "create");
    });

    if (LocalStorageProvider.isAvailable()) {
        test("basic LocalStorageProvider operation", function () {
            testStorageProvider(LocalStorageProvider);
        });
    }

    if (UserDataProvider.isAvailable()) {
        test("basic UserDataProvider operation", function () {
            testStorageProvider(UserDataProvider);
        });
    }

    if (WebSqlProvider.isAvailable()) {
        asyncTest("async WebSqlProvider operation", function () {
            testAsyncStorageProvider(WebSqlProvider);

            setTimeout(function() {
                QUnit.start();
            }, 2000);
        });
    }
};

});