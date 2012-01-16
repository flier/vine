define("utils/storage", ["require", "exports", "utils/blob", "utils/browser", "api/set",
                         "utils/oop", "js!modernizr"],
    function (require, exports, blob, browser, set) {

var StorageProvider = function () {
    this.namespace = 'vine';
};

StorageProvider.create = function (name) {
    return LocalStorageProvider.create(name) || UserDataProvider.create(name);
};

// https://developer.mozilla.org/en/DOM/Storage

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
    length: function () {
        var count = 0;

        for (var i=0, len=localStorage.length; i<len; i++) {
            var key = localStorage.key(i);

            if (key.indexOf(this.namespace) == 0)
                count++;
        }

        return count;
    },
    getKey: function (idx) {
        if (idx < 0 || localStorage.length <= idx) return undefined;

        for (var i=0, len=localStorage.length; i<len; i++) {
            var key = localStorage.key(i);

            if (key.indexOf(this.namespace) == 0 && idx--==0)
                return key.slice(this.namespace.length);
        }
        return undefined;
    },
    removeItem: function (key) {
        localStorage.removeItem(this.namespace + key);
    },
    getItem: function (key) {
        return localStorage.getItem(this.namespace + key);
    },
    setItem: function (key, data) {
        localStorage.setItem(this.namespace + key, data);
    },
    clear: function () {
        var removing = [];

        for (var i=0, len=localStorage.length; i<len; i++) {
            var key = localStorage.key(i);

            if (key.indexOf(this.namespace) == 0)
                removing.push(key);
        }

        for (var i=0, len=removing.length; i<len; i++) {
            localStorage.removeItem(removing[i]);
        }
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
    length: function () {
        return this.data.XMLDocument.documentElement.attributes.length;
    },
    getKey: function (idx) {
        return this.data.XMLDocument.documentElement.attributes[idx].name;
    },
    removeItem: function (key) {
        this.data.removeAttribute(key);
        this.data.save(this.storename);
    },
    getItem: function (key) {
        return this.data.getAttribute(key);
    },
    setItem: function (key, data) {
        this.data.setAttribute(key, data);
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