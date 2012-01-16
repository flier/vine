define("utils/storage", ["require", "exports", "utils/blob", "utils/browser", "api/set",
                         "utils/oop", "js!modernizr"],
    function (require, exports, blob, browser, set) {

var StorageProvider = function () {
    this.namespace = 'vine';
};

StorageProvider.create = function (name) {
    return LocalStorageProvider.create(name) || UserDataProvider.create(name);
};

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
LocalStorageProvider.create = function () {
    return this.isAvailable() ? new LocalStorageProvider() : null;
};

LocalStorageProvider.inherit(StorageProvider).extend({
    length: function (callback) {
        var count = 0;

        for (var i=0, len=localStorage.length; i<len; i++) {
            var key = localStorage.key(i);

            if (key.indexOf(this.namespace) == 0)
                count++;
        }

        if (Function.isFunction(callback)) callback.call(this, count);

        return count;
    },
    getKey: function (idx, callback) {
        if (idx < 0 || localStorage.length <= idx) return undefined;

        for (var i=0, len=localStorage.length; i<len; i++) {
            var key = localStorage.key(i);

            if (key.indexOf(this.namespace) == 0 && idx--==0)
            {
                var key = key.slice(this.namespace.length);

                if (Function.isFunction(callback)) callback.call(this, key);

                return key;
            }
        }

        if (Function.isFunction(callback)) callback.call(this);

        return undefined;
    },
    removeItem: function (key, callback) {
        localStorage.removeItem(this.namespace + key);

        if (Function.isFunction(callback)) callback.call(this);
    },
    getItem: function (key, callback) {
        var item = localStorage.getItem(this.namespace + key);

        if (Function.isFunction(callback)) callback.call(this);

        return item;
    },
    setItem: function (key, data, callback) {
        localStorage.setItem(this.namespace + key, data);

        if (Function.isFunction(callback)) callback.call(this);
    },
    clear: function (callback) {
        var removing = [];

        for (var i=0, len=localStorage.length; i<len; i++) {
            var key = localStorage.key(i);

            if (key.indexOf(this.namespace) == 0)
                removing.push(key);
        }

        for (var i=0, len=removing.length; i<len; i++) {
            localStorage.removeItem(removing[i]);
        }

        if (Function.isFunction(callback)) callback.call(this);
    }
});

// http://msdn.microsoft.com/en-us/library/ms531424(VS.85).aspx
// https://github.com/marcuswestin/store.js/blob/master/store.js

var UserDataProvider = function (name) {
    this.parent.constructor.call(this);

    this.storename = this.namespace + (name || 'Store');

    this.data = document.createElement('div');

    document.appendChild(this.data);

    this.data.style.display = 'none';
    this.data.addBehavior('#default#userData');

    this.data.load(this.storename);
};

UserDataProvider.isAvailable = function () {
    return browser.name == 'Explorer' && browser.version < 9;
};

UserDataProvider.create = function (name) {
    return this.isAvailable() ? new UserDataProvider(name) : null;
};

UserDataProvider.inherit(StorageProvider).extend({
    length: function (callback) {
        var len =  this.data.XMLDocument.documentElement.attributes.length;

        if (Function.isFunction(callback)) callback.call(this, len);

        return len;
    },
    getKey: function (idx, callback) {
        var key = this.data.XMLDocument.documentElement.attributes[idx].name;

        if (Function.isFunction(callback)) callback.call(this, key);

        return key;
    },
    removeItem: function (key, callback) {
        this.data.removeAttribute(key);
        this.data.save(this.storename);

        if (Function.isFunction(callback)) callback.call(this);
    },
    getItem: function (key) {
        var item = this.data.getAttribute(key);

        if (Function.isFunction(callback)) callback.call(this, item);

        return item;
    },
    setItem: function (key, data, callback) {
        this.data.setAttribute(key, data);
        this.data.save(this.storename);

        if (Function.isFunction(callback)) callback.call(this);
    },
    clear: function (callback) {
        var attrs = this.data.XMLDocument.documentElement.attributes;

        for (var i=0, attr; attr = attrs[i]; i++) {
            this.data.removeAttribute(attr.name);
        }
        this.data.save(this.storename);

        if (Function.isFunction(callback)) callback.call(this);
    }
});

exports.provider = StorageProvider.create(name);

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

exports.tests = function () {
    module("Storage API");

    test("basic StorageProvider operation", function () {
        ok(exports.provider != null, "create");
        ok(exports.provider instanceof StorageProvider, "create");
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
};

});