define("utils/btree", ["require", "exports", "utils/oop"], function (require, exports) {

// ref: http://en.wikipedia.org/wiki/B%2B_tree
// ref: http://blog.conquex.com/?p=84

var LeafNode = function (order) {
    this.init(order);
};

LeafNode.extend({
    init:function (opts) {
        this.opts = opts;

        this.parentNode = null;
        this.nextNode = null;
        this.prevNode = null;

        this.data = [];
    },

    split: function () {
        var tmp = new LeafNode(this.opts);
        var m = this.data.length >> 1;
        var k = this.data[m - 1].key;

        // Copy & shift data
        tmp.data = this.data.splice(0, m);
        tmp.parentNode = this.parentNode;
        tmp.nextNode = this;
        tmp.prevNode = this.prevNode;
        if (tmp.prevNode) {
            tmp.prevNode.nextNode = tmp;
        }
        this.prevNode = tmp;

        if (!this.parentNode) {
            this.parentNode = tmp.parentNode = new InternalNode(this.opts);
        }

        return this.parentNode.insert(k, tmp, this);
    },

    merge: function (prevNode) {
        this.data = prevNode.data.concat(this.data);
        this.prevNode = prevNode.prevNode;
        this.parentNode.remove(prevNode);
    },

    insert: function (key, value) {
        var pos = 0;

        for (; pos < this.data.length; pos++) {
            var item = this.data[pos];

            if (item.key == key) {
                item.value = value;

                return null;
            }
            if (item.key > key) break;
        }

        if (this.data[pos]) {
            this.data.splice(pos, 0, {"key":key, "value":value});
        } else {
            this.data.push({"key":key, "value":value});
        }

        // Split
        if (this.data.length > this.opts.order) {
            return this.split();
        }
        return null;
    },

    remove: function (key) {
        var found = false;

        for (var pos = 0; pos < this.data.length; pos++) {
            if (this.data[pos].key == key) {
                this.data.splice(pos, 1);
                found = true;
                break;
            }
        }

        if (found) {
            if (this.prevNode && (this.prevNode.data.length + this.data.length) <= (this.opts.order>>1)) {
                this.merge(this.prevNode);
            } else if (this.nextNode && (this.nextNode.data.length + this.data.length) <= (this.opts.order>>1)) {
                this.nextNode.merge(this);
            }
        }

        return found;
    }
});

var InternalNode = function (opts) {
    this.init(opts);
};

InternalNode.extend({
    init:function (opts) {
        this.opts = opts;

        this.parentNode = null;

        this.data = [];
    },

    split: function () {
        var m = (this.data.length - 1) / 2 - (this.opts.order % 2);

        var tmp = new InternalNode(this.opts);
        tmp.parentNode = this.parentNode;
        tmp.data = this.data.splice(0, m);

        for (var i = 0; i < tmp.data.length; i += 2) {
            tmp.data[i].parentNode = tmp;
        }
        var key = this.data.shift();

        if (!this.parentNode) {
            this.parentNode = tmp.parentNode = new InternalNode(this.opts);
        }

        return this.parentNode.insert(key, tmp, this);
    },

    insert: function (key, node1, node2) {
        if (this.data.length) {
            var pos = 1;
            for (; pos < this.data.length; pos += 2) {
                if (this.data[pos] > key) break;
            }

            if (this.data[pos]) {
                pos--;
                this.data.splice(pos, 0, key);
                this.data.splice(pos, 0, node1);
            } else {
                this.data[pos - 1] = node1;
                this.data.push(key);
                this.data.push(node2);
            }

            if (this.data.length > (this.opts.order * 2 + 1)) {
                return this.split();
            }
            return null;
        } else {
            this.data[0] = node1;
            this.data[1] = key;
            this.data[2] = node2;
            return this;
        }
    },

    merge: function (node) {
        if (node.data.length == 1) {
            for (var i=0; i<this.data.length; i+=2) {
                if (this.data[i] === node) {
                    this.data[i] = node.data[0];
                    break;
                }
            }
            node.data[0].parentNode = this;
        }
    },

    remove: function (node) {
        var pos = 0;

        for (; pos < this.data.length; pos += 2) {
            if (this.data[pos] === node) {
                this.data.splice(pos, 2);
                break;
            }
        }

        if (this.data.length == 1 && this.parentNode) {
            this.parentNode.merge(this);
        }
    }
});

var BPlusTree = function (opts) {
    opts = opts || {
        order:2
    };

    this.root = new LeafNode(opts);
    this.count = 0;
};

BPlusTree.extend({
    set: function (key, value) {
        var node = this._search(key);
        var ret = node.insert(key, value);
        if (ret) this.root = ret;
    },

    get: function (key) {
        var node = this._search(key);
        for (var i = 0; i < node.data.length; i++) {
            if (node.data[i].key == key) return node.data[i].value;
        }
        return null;
    },

    remove: function (key, value) {
        var node = this._search(key);
        node.remove(key, value);
    },

    _search:function (key) {
        var current = this.root;
        var found = false;

        while (current instanceof InternalNode) {
            var len = current.data.length;
            found = false;

            for (var i = 1; i < len; i += 2) {
                if (key <= current.data[i]) {
                    current = current.data[i - 1];
                    found = true;
                    break;
                }
            }

            // Follow infinity pointer
            if (!found) current = current.data[len - 1];
        }

        return current;
    },

    // B+ tree dump routines
    walk:function (node, level, arr) {
        if (!arr[level]) arr[level] = [];

        if (node instanceof LeafNode) {
            for (var i = 0; i < node.data.length; i++) {
                arr[level].push("<" + node.data[i].key + ">");
            }
            arr[level].push(" -> ");
        } else {

            for (var i = 1; i < node.data.length; i += 2) {
                arr[level].push("<" + node.data[i] + ">");
            }
            arr[level].push(" -> ");
            for (var i = 0; i < node.data.length; i += 2) {
                this.walk(node.data[i], level + 1, arr);
            }

        }
        return arr;
    }
});

exports.BPlusTree = BPlusTree;

exports.tests = function () {
    module("B+ Tree API");

    test("basic LeafNode operation", function () {
        var node = new LeafNode({
            order: 4
        });

        equals(node.insert(1, 1), null, "insert");
        equals(node.insert(5, 5), null, "insert");
        equals(node.insert(3, 3), null, "insert");
        equals(node.insert(7, 7), null, "insert");
        equals(node.data.length, 4);
        equals(node.data[0].value, 1);
        equals(node.data[1].value, 3);
        equals(node.data[2].value, 5);
        equals(node.data[3].value, 7);

        equals(node.insert(5, 15), null, "overwrite insert");
        equals(node.data[2].value, 15);

        var inode = node.insert(4, 4);
        equals(inode.data.length, 3, "split");
        ok(inode.data[0] instanceof LeafNode);
        equals(inode.data[1], 3);
        ok(inode.data[2] === node);

        ok(node.remove(5), "remove");
        ok(!node.remove(5), "remove");
        ok(node.remove(7), "remove");

        equals(node.data.length, 1);
        ok(node.remove(4), "remove");
        equals(node.data.length, 2, "merge");
    });

    test("basic InternalNode operation", function () {
        var inode = new InternalNode({
            order: 4
        });

        ok(inode.insert(3, new LeafNode(), new LeafNode()) === inode, "insert");
        equals(inode.data[1], 3);
        ok(inode.insert(5, new LeafNode(), new LeafNode()) === null, "insert");
        equals(inode.data.length, 5);

        ok(inode.insert(4, new LeafNode(), new LeafNode()) === null, "insert");
        ok(inode.insert(7, new LeafNode(), new LeafNode()) === null, "insert");

        var parent = inode.insert(6, new LeafNode(), new LeafNode());

        equals(parent.data.length, 3, "split");
        equals(parent.data[0].data.length, 5);
        equals(parent.data[0].data[1], 3);
        equals(parent.data[0].data[3], 4);
        equals(parent.data[1], 5);
        equals(parent.data[2].data.length, 5);
        equals(parent.data[2].data[1], 6);
        equals(parent.data[2].data[3], 7);

        parent.data[0].remove(parent.data[0].data[0]);
        parent.data[0].remove(parent.data[0].data[0]);

        ok(parent.data[0] instanceof LeafNode, "merge");
        ok(parent.data[0].parentNode === parent);
    });

    test("basic BPlusTree operation", function () {
        var tree = new BPlusTree({
            order: 4
        });

        for (var i=0; i<100; i++) {
            tree.set(i, i);
        }

        equals(tree.get(5), 5, "get");
        equals(tree.get(55), 55, "get");
        tree.set(77, 55);
        equals(tree.get(77), 55, "set");
        tree.remove(77);
        equals(tree.get(77), null, "remove");
    });
};

});