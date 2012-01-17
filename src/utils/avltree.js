define("utils/avltree", ["require", "exports", "utils/oop"], function (require, exports) {

var AvlTree = function (comparator) {
    this.comparator_ = comparator || AvlTree.StringComparator;

    this.clear();
};

(function() {

var Node = function (value, parent /* opt */) {
    this.value = value;
    this.parent = parent || null;
    this.left = null;
    this.right = null;
    this.height = 1;
};

Node.extend({
    isRightChild : function () {
        return !!this.parent && this.parent.right == this;
    },
    isLeftChild: function () {
        return !!this.parent && this.parent.left == this;
    }
});

AvlTree.StringComparator = function (a, b) {
    if (String(a) < String(b)) {
        return -1;
    } else if (String(a) > String(b)) {
        return 1;
    }

    return 0;
};

AvlTree.NumberComparator = function (a, b) {
    if (Number(a) < Number(b)) {
        return -1;
    } else if (Number(a) > Number(b)) {
        return 1;
    }

    return 0;
};

AvlTree.extend({
    count: function () {
        return this.count_;
    },
    add: function (value) {
        // If the tree is empty, create a root node with the specified value
        if (this.root_ === null) {
            this.root_ = new Node(value);
            this.minNode_ = this.root_;
            this.maxNode_ = this.root_;
            this.count_ = 1;
            return true;
        }

        // Assume a node is not added and change status when one is
        var retStatus = false;

        // Depth traverse the tree and insert the value if we reach a null node
        this.traverse_(function (node) {
            var retNode = null;
            var ret = this.comparator_(node.value, value);
            if (ret > 0) {
                retNode = node.left;
                if (node.left === null) {
                    var newNode = new Node(value, node);
                    node.left = newNode;
                    if (node == this.minNode_) {
                        this.minNode_ = newNode;
                    }
                    retStatus = true; // Value was added to tree
                    this.balance_(node); // Maintain the AVL-tree balance
                }
            } else if (ret < 0) {
                retNode = node.right;
                if (node.right === null) {
                    var newNode = new Node(value, node);
                    node.right = newNode;
                    if (node == this.maxNode_) {
                        this.maxNode_ = newNode;
                    }
                    retStatus = true; // Value was added to tree
                    this.balance_(node); // Maintain the AVL-tree balance
                }
            }
            return retNode; // If null, we'll stop traversing the tree
        });

        // If a node was added, increment count
        if (retStatus) {
            this.count_ += 1;
        }

        // Return true if a node was added, false otherwise
        return retStatus;
    },
    remove: function (value) {
        // Assume the value is not removed and set the value when it is removed
        var retValue = null;

        // Depth traverse the tree and remove the value if we find it
        this.traverse_(function (node) {
            var retNode = null;
            var ret = this.comparator_(node.value, value);
            if (ret > 0) {
                retNode = node.left;
            } else if (ret < 0) {
                retNode = node.right;
            } else {
                retValue = node.value;
                this.removeNode_(node);
            }
            return retNode; // If null, we'll stop traversing the tree
        });

        // If a node was removed, decrement count.
        if (retValue) {
            // Had traverse_() cleared the tree, set to 0.
            this.count_ = this.root_ ? this.count_ - 1 : 0;
        }

        // Return the value that was removed, null if the value was not in the tree
        return retValue;
    },
    clear: function () {
        this.root_ = null;
        this.minNode_ = null;
        this.maxNode_ = null;
        this.count_ = 0;
    },
    contains: function (value) {
        // Assume the value is not in the tree and set this value if it is found
        var isContained = false;

        // Depth traverse the tree and set isContained if we find the node
        this.traverse_(function (node) {
            var retNode = null;
            var ret = this.comparator_(node.value, value);
            if (ret > 0) {
                retNode = node.left;
            } else if (ret < 0) {
                retNode = node.right;
            } else {
                isContained = true;
            }
            return retNode; // If null, we'll stop traversing the tree
        });

        // Return true if the value is contained in the tree, false otherwise
        return isContained;
    },
    traverse_: function (traversalFunc, opt_startNode, opt_endNode) {
        var node = opt_startNode ? opt_startNode : this.root_;
        var endNode = opt_endNode ? opt_endNode : null;
        while (node && node != endNode) {
          node = traversalFunc.call(this, node);
        }
    },
    balance_: function (node) {
        this.traverse_(function (node) {
            // Calculate the left and right node's heights
            var lh = node.left ? node.left.height : 0;
            var rh = node.right ? node.right.height : 0;

            // Rotate tree rooted at this node if it is not AVL-tree balanced
            if (lh - rh > 1) {
                if (node.left.right && (!node.left.left ||
                    node.left.left.height < node.left.right.height)) {
                    this.leftRotate_(node.left);
                }
                this.rightRotate_(node);
            } else if (rh - lh > 1) {
                if (node.right.left && (!node.right.right ||
                    node.right.right.height < node.right.left.height)) {
                    this.rightRotate_(node.right);
                }
                this.leftRotate_(node);
            }

            // Recalculate the left and right node's heights
            lh = node.left ? node.left.height : 0;
            rh = node.right ? node.right.height : 0;

            // Set this node's height
            node.height = Math.max(lh, rh) + 1;

            // Traverse up tree and balance parent
            return node.parent;
        }, node);
    },
    removeNode_: function (node) {
        // Perform normal binary tree node removal, but balance the tree, starting
        // from where we removed the node
        if (node.left != null || node.right != null) {
            var b = null; // Node to begin balance from
            var r;        // Node to replace the node being removed
            if (node.left != null) {
                r = this.getMaxNode_(node.left);
                if (r != node.left) {
                    r.parent.right = r.left;
                    if (r.left) r.left.parent = r.parent;
                    r.left = node.left;
                    r.left.parent = r;
                    b = r.parent;
                }
                r.parent = node.parent;
                r.right = node.right;
                if (r.right) r.right.parent = r;
                if (node == this.maxNode_) this.maxNode_ = r;
            } else {
                r = this.getMinNode_(node.right);
                if (r != node.right) {
                    r.parent.left = r.right;
                    if (r.right) r.right.parent = r.parent;
                    r.right = node.right;
                    r.right.parent = r;
                    b = r.parent;
                }
                r.parent = node.parent;
                r.left = node.left;
                if (r.left) r.left.parent = r;
                if (node == this.minNode_) this.minNode_ = r;
            }

            // Update the parent of the node being removed to point to its replace
            if (node.isLeftChild()) {
                node.parent.left = r;
            } else if (node.isRightChild()) {
                node.parent.right = r;
            } else {
                this.root_ = r;
            }

            // Balance the tree
            this.balance_(b ? b : r);
        } else {
            // If the node is a leaf, remove it and balance starting from its parent
            if (node.isLeftChild()) {
                this.special = 1;
                node.parent.left = null;
                if (node == this.minNode_) this.minNode_ = node.parent;
                this.balance_(node.parent);
            } else if (node.isRightChild()) {
                node.parent.right = null;
                if (node == this.maxNode_) this.maxNode_ = node.parent;
                this.balance_(node.parent);
            } else {
                this.clear();
            }
        }
    },
    leftRotate_: function (node) {
        // Re-assign parent-child references for the parent of the node being removed
        if (node.isLeftChild()) {
            node.parent.left = node.right;
            node.right.parent = node.parent;
        } else if (node.isRightChild()) {
            node.parent.right = node.right;
            node.right.parent = node.parent;
        } else {
            this.root_ = node.right;
            this.root_.parent = null;
        }

        // Re-assign parent-child references for the child of the node being removed
        var temp = node.right;
        node.right = node.right.left;
        if (node.right != null) node.right.parent = node;
        temp.left = node;
        node.parent = temp;
    },
    rightRotate_: function (node) {
        // Re-assign parent-child references for the parent of the node being removed
        if (node.isLeftChild()) {
            node.parent.left = node.left;
            node.left.parent = node.parent;
        } else if (node.isRightChild()) {
            node.parent.right = node.left;
            node.left.parent = node.parent;
        } else {
            this.root_ = node.left;
            this.root_.parent = null;
        }

        // Re-assign parent-child references for the child of the node being removed
        var temp = node.left;
        node.left = node.left.right;
        if (node.left != null) node.left.parent = node;
        temp.right = node;
        node.parent = temp;
    },
    getMinNode_: function (opt_rootNode) {
        if (!opt_rootNode) {
            return this.minNode_;
        }

        var minNode = opt_rootNode;
        this.traverse_(function (node) {
            var retNode = null;
            if (node.left) {
                minNode = node.left;
                retNode = node.left;
            }
            return retNode; // If null, we'll stop traversing the tree
        }, opt_rootNode);

        return minNode;
    },
    getMaxNode_: function (opt_rootNode) {
        if (!opt_rootNode) {
            return this.maxNode_;
        }

        var maxNode = opt_rootNode;
        this.traverse_(function (node) {
            var retNode = null;
            if (node.right) {
                maxNode = node.right;
                retNode = node.right;
            }
            return retNode; // If null, we'll stop traversing the tree
        }, opt_rootNode);

        return maxNode;
    }
});

})();

exports.AvlTree = AvlTree;

exports.tests = function () {
    module("AVL Tree API");

    test("basic AVL Tree operation", function () {
        var tree = new AvlTree(AvlTree.NumberComparator);

        for (var i=0; i<10; i++) {
            ok(tree.add(i), "add");
        }

        equals(tree.count(), 10, "count");
        ok(tree.contains(5), "contains");
        ok(tree.remove(5), "remove");
        equals(tree.count(), 9, "count");
        ok(!tree.contains(5), "contains");
        tree.clear();
        equals(tree.count(), 0, "clear");
    });
};

});