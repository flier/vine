define("utils/storage", ["require", "exports", "utils/blob", "utils/browser", "utils/oop"],
    function (require, exports, blob, browser) {

var Chunk = function (len) {
};

Chunk.inherit(blob.Binary).extend({

});

var StorageProvider = function () {

};

StorageProvider.getInstance = function () {
    var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;

    if (indexedDB) {
        return new IndexedDBProvider(indexedDB);
    } else if (window.localStorage) {
        return new LocalStorageProvider();
    } else if (browser.name == 'Explorer') {
        return new UserDataProvider();
    } else {
        throw new Error("Not support storage");
    }
}

// https://developer.mozilla.org/en/DOM/Storage

var LocalStorageProvider = function () {

};

LocalStorageProvider.inherit(StorageProvider).extend({

});

// https://developer.mozilla.org/en/IndexedDB

var IndexedDBProvider = function (db) {
    self.db = db;
};

        IndexedDBProvider.inherit(StorageProvider).extend({

});

// http://msdn.microsoft.com/en-us/library/ms531424(VS.85).aspx

var UserDataProvider = function () {

};

UserDataProvider.inherit(StorageProvider).extend({

});

exports.provider = StorageProvider.getInstance();

exports.tests = function () {
    module("Storage API");

    test("basic Storage operation", function () {
        ok(exports.provider != null, "getInstance");
        ok(exports.provider instanceof StorageProvider);
    });
};

});