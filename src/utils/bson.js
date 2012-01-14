define("utils/bson", ["require", "exports", "utils/blob", "api/long", "api/oid", "api/timestamp", "utils/oop", "utils/string"],
    function (require, exports, blob, long, oid, ts, oop) {

/**
 *  BSON is a binary format in which zero or more key/value pairs are stored as a single entity.
 *  We call this entity a document.
 *
 *  <http://bsonspec.org/#/specification>
 *

 document	::=	int32 e_list "\x00"	BSON Document
 e_list	    ::=	element e_list	Sequence of elements
             |	""
 element	::=	"\x01" e_name double	Floating point
             |	"\x02" e_name string	UTF-8 string
             |	"\x03" e_name document	Embedded document
             |	"\x04" e_name document	Array
             |	"\x05" e_name binary	Binary data
             |	"\x06" e_name	Undefined — Deprecated
             |	"\x07" e_name (byte*12)	ObjectId
             |	"\x08" e_name "\x00"	Boolean "false"
             |	"\x08" e_name "\x01"	Boolean "true"
             |	"\x09" e_name int64	UTC datetime
             |	"\x0A" e_name	Null value
             |	"\x0B" e_name cstring cstring	Regular expression
             |	"\x0C" e_name string (byte*12)	DBPointer — Deprecated
             |	"\x0D" e_name string	JavaScript code
             |	"\x0E" e_name string	Symbol
             |	"\x0F" e_name code_w_s	JavaScript code w/ scope
             |	"\x10" e_name int32	32-bit Integer
             |	"\x11" e_name int64	Timestamp
             |	"\x12" e_name int64	64-bit integer
             |	"\xFF" e_name	Min key
             |	"\x7F" e_name	Max key
 e_name	    ::=	cstring	Key name
 string	    ::=	int32 (byte*) "\x00"	String
 cstring	::=	(byte*) "\x00"	CString
 binary	    ::=	int32 subtype (byte*)	Binary
 subtype	::=	"\x00"	Binary / Generic
             |	"\x01"	Function
             |	"\x02"	Binary (Old)
             |	"\x03"	UUID
             |	"\x05"	MD5
             |	"\x80"	User defined
 code_w_s	::=	int32 string document	Code w/ scope

 *
 **/

var FLOAT_TYPE             = 1;
var STRING_TYPE            = 2;
var EMBEDDED_DOCUMENT_TYPE = 3;
var ARRAY_TYPE             = 4;
var BINARY_TYPE            = 5;
var UNDEFINED_TYPE         = 6; // deprecated
var OBJECT_ID_TYPE         = 7;
var BOOLEAN_TYPE           = 8;
var DATE_TIME_TYPE         = 9;
var NULL_TYPE              = 0x0A;
var REG_EXP_TYPE           = 0x0B;
var DB_REF_TYPE            = 0x0C; // deprecated
var CODE_TYPE              = 0x0D;
var SYMBOL_TYPE            = 0x0E;
var CODE_WITH_SCOPE_TYPE   = 0x0F;
var INT32_TYPE             = 0x10;
var TIMESTAMP_TYPE         = 0x11;
var INT64_TYPE             = 0x12;
var MIN_KEY                = 0xFF;
var MAX_KEY                = 0x7F;

var BINARY_GENERIC_SUBTYPE      = 0x00;
var BINARY_FUNCTION_SUBTYPE     = 0x01;
var BINARY_OLD_SUBTYPE          = 0x02;
var BINARY_UUID_SUBTYPE         = 0x03;
var BINARY_MD5_SUBTYPE          = 0x05;
var BINARY_USER_DEFINED_SUBTYPE = 0x80;

var NULL = 0;
var TRUE = 1;
var FALSE = 0;
var MAX_INT = Math.pow(2, 31) - 1;
var MIN_INT = -Math.pow(2, 31);

var FUNCTION_MATCH = /^\s*function(?:\s+\S+)?\s*\(([^\)]*)\)\s*\{([\s\S]*)\}\s*$/

var BSON = function (buf, off, len) {
    this.parent.constructor.call(this, buf, off, len);
};

BSON.alloc = function (len) {
    return new BSON(blob.Binary.getBuffer(len), 0, len);
};

BSON.inherit(blob.Binary).extend({
    serialize: function (obj) {
        var start = this.offset;
        this.writeInt(0);

        if (Array.isArray(obj)) {
            for (var i=0; i<obj.length; i++) {
                this.writeElement(i, obj[i]);
            }
        } else {
            for (var key in obj) {
                this.writeElement(key, obj[key]);
            }
        }

        this.put(NULL);

        var stop = this.offset;

        this.seek(start);
        this.writeInt(stop - start);
        this.seek(stop);

        return stop - start;
    },
    writeElement: function (name, value) {
        switch (oop.getClassName(value)) {
            case 'Undefined':
            {
                this.put(UNDEFINED_TYPE);
                this.writeCString(name);
                break;
            }
            case 'Null':
            {
                this.put(NULL_TYPE);
                this.writeCString(name);
                break;
            }
            case 'String':
            {
                this.put(STRING_TYPE);
                this.writeCString(name);
                this.writeString(value);
                break;
            }
            case 'Boolean':
            {
                this.put(BOOLEAN_TYPE);
                this.writeCString(name);
                this.put(value ? TRUE : FALSE);
                break;
            }
            case 'Number':
            {
                if (this.isInteger(value)) {
                    if ((value < MIN_INT) ||(MAX_INT < value)) {
                        this.put(INT64_TYPE);
                        this.writeCString(name);
                        this.writeLong(long.Long.fromNumber(value));
                    } else {
                        this.put(INT32_TYPE);
                        this.writeCString(name);
                        this.writeInt(value);
                    }
                } else {
                    this.put(FLOAT_TYPE);
                    this.writeCString(name);
                    this.writeDouble(value);
                }
                break;
            }
            case 'Date':
            {
                this.put(DATE_TIME_TYPE);
                this.writeCString(name);
                this.writeLong(long.Long.fromNumber(value.getTime()));
                break;
            }
            case 'RegExp':
            {
                this.put(REG_EXP_TYPE);
                this.writeCString(name);
                this.writeCString(value.source);
                this.writeCString((value.global ? 'g' : '') + (value.ignoreCase ? 'i' : '') + (value.multiline ? 'm' : ''));
                break;
            }
            case 'Function':
            {
                if (value.scope) {
                    this.put(CODE_WITH_SCOPE_TYPE);
                    this.writeCString(name);

                    var off = this.offset;
                    this.writeInt(0);
                    this.writeString(value.toString());
                    this.serialize(value.scope);
                    off = this.seek(off);
                    this.writeInt(off - this.offset);
                    this.seek(off);
                } else {
                    this.put(CODE_TYPE);
                    this.writeCString(name);
                    this.writeString(value.toString());
                }
                break;
            }
            default:
            {
                if (typeof value == 'object') {
                    if (value instanceof long.Long) {
                        this.put(value instanceof ts.Timestamp ? TIMESTAMP_TYPE : INT64_TYPE);
                        this.writeCString(name);
                        this.writeLong(value);
                    } else if (value instanceof oid.ObjectId) {
                        this.put(OBJECT_ID_TYPE);
                        this.writeCString(name);
                        this.writeBytes(value.bytes);
                    } else if (value instanceof oid.DatabaseRef) {
                        this.put(DB_REF_TYPE);
                        this.writeCString(name);
                        this.writeString(value.name);
                        this.writeBytes(value.oid.bytes);
                    } else if (value instanceof blob.Binary) {
                        this.put(BINARY_TYPE);
                        this.writeCString(name);
                        this.writeInt(value.length);
                        this.put(value.subtype || BINARY_GENERIC_SUBTYPE);
                        this.writeBytes(value.toArray());
                    } else if (Array.isArray(value)) {
                        this.put(ARRAY_TYPE);
                        this.writeCString(name);
                        this.serialize(value);
                    } else {
                        this.put(EMBEDDED_DOCUMENT_TYPE);
                        this.writeCString(name);
                        this.serialize(value);
                    }
                } else {
                    throw new Error("Unrecognized object type: " + typeof value)
                }
                break;
            }
        }
    },
    readEmbeddedObject: function (isArray) {
        var off = this.offset;
        var len = this.readInt();
        this.seek(off);
        var obj = this.deserialize(isArray);
        this.seek(off+len);
        return obj;
    },
    makeFunction: function (code, scope) {
        var func;
        try {
            var args = [], funcParts = FUNCTION_MATCH.exec(code);
            if (funcParts) {
                args = funcParts[1].split(',').map(function(name) { return name.trim() })
                code = funcParts[2]
            }
            if (scope) code = "with("+this.toSource(scope)+"){"+code+"}";
            func = new Function(args, code);
        } catch (e) {
            func = {};
        }
        func.code = code;
        if (scope) func.scope = scope;
        return func;
    },
    /**
     * Converts JavaScript objects to source
     *
     * https://github.com/marcello3d/node-tosource/blob/master/tosource.js
     *
     */
    toSource: function(object, filter, indent, startingIndent) {
        var seen = []
        return walk(object, filter, indent === undefined ? '  ' : (indent || ''), startingIndent || '')

        function legalKey(key) {
            var KEYWORD_REGEXP = /^(abstract|boolean|break|byte|case|catch|char|class|const|continue|debugger|default|delete|do|double|else|enum|export|extends|false|final|finally|float|for|function|goto|if|implements|import|in|instanceof|int|interface|long|native|new|null|package|private|protected|public|return|short|static|super|switch|synchronized|this|throw|throws|transient|true|try|typeof|undefined|var|void|volatile|while|with)$/

            return /^[a-z_$][0-9a-z_$]*$/gi.test(key) && !KEYWORD_REGEXP.test(key)
        }

        function walk(object, filter, indent, currentIndent) {
            var nextIndent = currentIndent + indent
            object = filter ? filter(object) : object
            switch (typeof object) {
                case 'string':
                    return JSON.stringify(object);
                case 'boolean':
                case 'number':
                case 'function':
                case 'undefined':
                    return ''+object
            }

            if (object === null) return 'null';
            if (object instanceof RegExp) return object.toString();
            if (object instanceof Date) return 'new Date('+object.getTime()+')';

            if (seen.indexOf(object) >= 0) return '{$circularReference:1}';
            seen.push(object);

            function join(elements) {
                return indent.slice(1) + elements.join(','+(indent&&'\n')+nextIndent) + (indent ? ' ' : '');
            }

            if (Array.isArray(object)) {
                return '[' + join(object.map(function(element){
                    return walk(element, filter, indent, nextIndent)
                })) + ']'
            }
            var keys = Object.keys(object);
            return keys.length ? '{' + join(keys.map(function (key) {
                return (legalKey(key) ? key : JSON.stringify(key)) + ':' + walk(object[key], filter, indent, nextIndent);
            })) + '}' : '{}';
        }
    },
    deserialize: function (isArray) {
        var len = this.readInt();
        var remaining = this.length - this.offset + 4;

        if (remaining < len)
            throw new Error("Incomplete BSON buffer (got %d bytes, expected %d bytes)".sprintf(remaining, len));

        var obj = isArray ? [] : {};

        while (true) {
            var type = this.get();

            if (type == NULL) break;

            var name = this.readCString();

            switch (type) {
                case FLOAT_TYPE:
                {
                    obj[name] = this.readDouble();
                    break
                }
                case INT32_TYPE:
                {
                    obj[name] = this.readInt();
                    break;
                }
                case INT64_TYPE:
                {
                    obj[name] = this.readLong();
                    break;
                }
                case TIMESTAMP_TYPE:
                {
                    obj[name] = new ts.Timestamp(this.readInt(), this.readInt());
                    break;
                }
                case BOOLEAN_TYPE:
                {
                    obj[name] = this.get() == TRUE;
                    break;
                }
                case DATE_TIME_TYPE:
                {
                    obj[name] = new Date(this.readLong().toNumber());
                    break;
                }
                case REG_EXP_TYPE:
                {
                    obj[name] = new RegExp(this.readCString(), this.readCString());
                    break;
                }
                case CODE_TYPE:
                {
                    obj[name] = this.makeFunction(this.readString());
                    break;
                }
                case CODE_WITH_SCOPE_TYPE:
                {
                    this.readInt(); // skip the length
                    obj[name] = this.makeFunction(this.readString(), this.readEmbeddedObject());
                    break;
                }
                case STRING_TYPE:
                case SYMBOL_TYPE:
                {
                    obj[name] = this.readString();
                    break;
                }
                case EMBEDDED_DOCUMENT_TYPE:
                {
                    obj[name] = this.readEmbeddedObject(false);
                    break;
                }
                case ARRAY_TYPE:
                {
                    obj[name] = this.readEmbeddedObject(true);
                    break;
                }
                case BINARY_TYPE:
                {
                    var len = this.readInt();
                    var subtype = this.get();
                    var bin = blob.Binary.fromArray(this.readBytes(len));
                    bin.subtype = subtype;
                    obj[name] = bin;
                    break;
                }
                case OBJECT_ID_TYPE:
                {
                    obj[name] = new oid.ObjectId(this.readBytes(12));
                    break;
                }
                case DB_REF_TYPE:
                {
                    obj[name] = new oid.DatabaseRef(this.readString(), new oid.ObjectId(this.readBytes(12)));
                    break;
                }
                case UNDEFINED_TYPE:
                {
                    obj[name] = undefined;
                    break;
                }
                case NULL_TYPE:
                case MIN_KEY:
                case MAX_KEY:
                {
                    obj[name] = null;
                    break;
                }
                default:
                {
                    throw new Error("Unknown BSON type: " + type);
                }
            }
        }
        return obj;
    }
});

exports.tests = function () {
    module("BSON Utils");

    test("basic BSON operation", function () {
        var bson = BSON.alloc(1024);

        var name = 'flier';
        var func = function () { return 'hello ' + name; };
        func.scope = { name: name };

        ok(bson.serialize({
            i: 123456789,
            l: long.Long.MAX_VALUE,
            f: 3.1415926,
            f1: new Number(3.1415926),
            s: 'test',
            s1: new String('test'),
            r: /test/g,
            b: true,
            b1: new Boolean(false),
            u: undefined,
            n: null,
            hello: function (name) { return 'hello ' + name; },
            hello_flier: func,
            o: {
                a: 1,
                b: 2
            },
            oid: new oid.ObjectId([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
            db: new oid.DatabaseRef('test', new oid.ObjectId()),
            ts: new ts.Timestamp(123),
            bin: blob.Binary.alloc(16)
        }) > 0, "serialize");

        bson.reset();

        var obj = bson.deserialize();

        equals(obj.i, 123456789, "int");
        ok(obj.l.equals(long.Long.MAX_VALUE), "long");
        equals(obj.f, 3.1415926, "number");
        equals(obj.f1, 3.1415926, "Number()");
        equals(obj.s, 'test', "string");
        equals(obj.s1, 'test', "String()");
        equals(obj.r.source, 'test', "regex");
        ok(obj.r.global);
        ok(!obj.r.ignoreCase);
        ok(obj.b, "boolean");
        ok(obj.b1, "Boolean()");
        equals(obj.u, undefined, "undefined");
        equals(obj.hello('flier'), 'hello flier');
        equals(obj.hello_flier(), 'hello flier');
        equals(obj.n, null, "null");
        equals(obj.o.a, 1, "object");
        ok(obj.oid instanceof oid.ObjectId);
        equals(obj.oid.toString(), '000102030405060708090a0b', "ObjectId");
        ok(obj.db instanceof oid.DatabaseRef);
        equals(obj.db.name, "test", "DatabaseRef");
        ok(obj.ts instanceof ts.Timestamp);
        equals(obj.ts.steps(), 123, "Timestamp");
        ok(obj.bin instanceof blob.Binary);
        equals(obj.bin.length, 16, "Binary");
    });
};

});

