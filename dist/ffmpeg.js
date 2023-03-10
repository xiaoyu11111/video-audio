var Module = typeof Module !== "undefined" ? Module : {  'return2': function(text) { alert('stdout: ' + text) }};
function ffmpeg_run(opts, cb) {
    var isNode = typeof exports !== "undefined";
    if (!isNode) {
        var Module = {
            "outputDirectory": "output"
        };
        for (var i in opts) {
			console.log(  opts[i])
            Module[i] = opts[i]
        }
        var outputFilePath = Module["arguments"][Module["arguments"].length - 1];
        if (Module["arguments"].length > 2 && outputFilePath && outputFilePath.indexOf(".") > -1) {

            Module["arguments"][Module["arguments"].length - 1] = "output/" + outputFilePath
        }
        Module["preRun"] = function() {
            if (Module["files"]) {
                FS.createFolder("/", "input", true, true);
                console.log(Module["files"]);
                FS.mount(WORKERFS, {
                    files: Module["files"]
                }, "/input");
                FS.createFolder("/", Module["outputDirectory"], true, true)
            }
        }


        Module["postRun"] = function() {
            var handle = FS.analyzePath(Module["outputDirectory"]);
			console.log(handle)
            Module["return2"] = getAllBuffers(handle);

			console.log( getAllBuffers(handle))
			console.log( Module["return2"])
            cb(	Module["return2"])
        }
        ;
        function getAllBuffers(result) {
            var buffers = [];
            if (result && result.object && result.object.contents) {
                for (var i in result.object.contents) {
                    if (result.object.contents.hasOwnProperty(i)) {
                        buffers.push({
                            name: i,
                            data: new Uint8Array(result.object.contents[i].contents).buffer
                        })

                    }
                }
            }

            return buffers
        }
    }
    var moduleOverrides = {};
    var key;
    for (key in Module) {
        if (Module.hasOwnProperty(key)) {
            moduleOverrides[key] = Module[key]
        }
    }
    Module["arguments"] = [];
    Module["thisProgram"] = "./this.program";
    Module["quit"] = function(status, toThrow) {
        throw toThrow
    }
    ;
    Module["preRun"] = [];
    Module["postRun"] = [];
    var ENVIRONMENT_IS_WEB = false;
    var ENVIRONMENT_IS_WORKER = false;
    var ENVIRONMENT_IS_NODE = false;
    var ENVIRONMENT_HAS_NODE = false;
    var ENVIRONMENT_IS_SHELL = false;
    ENVIRONMENT_IS_WEB = typeof window === "object";
    ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
    ENVIRONMENT_HAS_NODE = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string";
    ENVIRONMENT_IS_NODE = ENVIRONMENT_HAS_NODE && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
    ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
    if (Module["ENVIRONMENT"]) {
        throw new Error("Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -s ENVIRONMENT=web or -s ENVIRONMENT=node)")
    }
    var scriptDirectory = "";
    function locateFile(path) {
        if (Module["locateFile"]) {
            return Module["locateFile"](path, scriptDirectory)
        } else {
            return scriptDirectory + path
        }
    }
    if (ENVIRONMENT_IS_NODE) {
        scriptDirectory = __dirname + "/";
        var nodeFS;
        var nodePath;
        Module["read"] = function shell_read(filename, binary) {
            var ret;
            if (!nodeFS)
                nodeFS = require("fs");
            if (!nodePath)
                nodePath = require("path");
            filename = nodePath["normalize"](filename);
            ret = nodeFS["readFileSync"](filename);
            return binary ? ret : ret.toString()
        }
        ;
        Module["readBinary"] = function readBinary(filename) {
            var ret = Module["read"](filename, true);
            if (!ret.buffer) {
                ret = new Uint8Array(ret)
            }
            assert(ret.buffer);
            return ret
        }
        ;
        if (process["argv"].length > 1) {
            Module["thisProgram"] = process["argv"][1].replace(/\\/g, "/")
        }
        Module["arguments"] = process["argv"].slice(2);
        if (typeof module !== "undefined") {
            module["exports"] = Module
        }
        process["on"]("uncaughtException", function(ex) {
            if (!(ex instanceof ExitStatus)) {
                throw ex
            }
        });
        process["on"]("unhandledRejection", abort);
        Module["quit"] = function(status) {
            process["exit"](status)
        }
        ;
        Module["inspect"] = function() {
            return "[Emscripten Module object]"
        }
    } else if (ENVIRONMENT_IS_SHELL) {
        if (typeof read != "undefined") {
            Module["read"] = function shell_read(f) {
                return read(f)
            }
        }
        Module["readBinary"] = function readBinary(f) {
            var data;
            if (typeof readbuffer === "function") {
                return new Uint8Array(readbuffer(f))
            }
            data = read(f, "binary");
            assert(typeof data === "object");
            return data
        }
        ;
        if (typeof scriptArgs != "undefined") {
            Module["arguments"] = scriptArgs
        } else if (typeof arguments != "undefined") {
            Module["arguments"] = arguments
        }
        if (typeof quit === "function") {
            Module["quit"] = function(status) {
                quit(status)
            }
        }
    } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
        if (ENVIRONMENT_IS_WORKER) {
            scriptDirectory = self.location.href
        } else if (document.currentScript) {
            scriptDirectory = document.currentScript.src
        }
        if (scriptDirectory.indexOf("blob:") !== 0) {
            scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1)
        } else {
            scriptDirectory = ""
        }
        Module["read"] = function shell_read(url) {
            var xhr = new XMLHttpRequest;
            xhr.open("GET", url, false);
            xhr.send(null);
            return xhr.responseText
        }
        ;
        if (ENVIRONMENT_IS_WORKER) {
            Module["readBinary"] = function readBinary(url) {
                var xhr = new XMLHttpRequest;
                xhr.open("GET", url, false);
                xhr.responseType = "arraybuffer";
                xhr.send(null);
                return new Uint8Array(xhr.response)
            }
        }
        Module["readAsync"] = function readAsync(url, onload, onerror) {
            var xhr = new XMLHttpRequest;
            xhr.open("GET", url, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = function xhr_onload() {
                if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                    onload(xhr.response);
                    return
                }
                onerror()
            }
            ;
            xhr.onerror = onerror;
            xhr.send(null)
        }
        ;
        Module["setWindowTitle"] = function(title) {
            document.title = title
        }
    } else {
        throw new Error("environment detection error")
    }
    var out = Module["print"] || (typeof console !== "undefined" ? console.log.bind(console) : typeof print !== "undefined" ? print : null);
    var err = Module["printErr"] || (typeof printErr !== "undefined" ? printErr : typeof console !== "undefined" && console.warn.bind(console) || out);
    for (key in moduleOverrides) {
        if (moduleOverrides.hasOwnProperty(key)) {
            Module[key] = moduleOverrides[key]
        }
    }
    moduleOverrides = undefined;
    assert(typeof Module["memoryInitializerPrefixURL"] === "undefined", "Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead");
    assert(typeof Module["pthreadMainPrefixURL"] === "undefined", "Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead");
    assert(typeof Module["cdInitializerPrefixURL"] === "undefined", "Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead");
    assert(typeof Module["filePackagePrefixURL"] === "undefined", "Module.filePackagePrefixURL option was removed, use Module.locateFile instead");
    var STACK_ALIGN = 16;
    stackSave = stackRestore = stackAlloc = function() {
        abort("cannot use the stack before compiled code is ready to run, and has provided stack access")
    }
    ;
    function dynamicAlloc(size) {
        assert(DYNAMICTOP_PTR);
        var ret = HEAP32[DYNAMICTOP_PTR >> 2];
        var end = ret + size + 15 & -16;
        if (end > _emscripten_get_heap_size()) {
            abort("failure to dynamicAlloc - memory growth etc. is not supported there, call malloc/sbrk directly")
        }
        HEAP32[DYNAMICTOP_PTR >> 2] = end;
        return ret
    }
    function getNativeTypeSize(type) {
        switch (type) {
        case "i1":
        case "i8":
            return 1;
        case "i16":
            return 2;
        case "i32":
            return 4;
        case "i64":
            return 8;
        case "float":
            return 4;
        case "double":
            return 8;
        default:
            {
                if (type[type.length - 1] === "*") {
                    return 4
                } else if (type[0] === "i") {
                    var bits = parseInt(type.substr(1));
                    assert(bits % 8 === 0, "getNativeTypeSize invalid bits " + bits + ", type " + type);
                    return bits / 8
                } else {
                    return 0
                }
            }
        }
    }
    function warnOnce(text) {
        if (!warnOnce.shown)
            warnOnce.shown = {};
        if (!warnOnce.shown[text]) {
            warnOnce.shown[text] = 1;
            err(text)
        }
    }
    var asm2wasmImports = {
        "f64-rem": function(x, y) {
            return x % y
        },
        "debugger": function() {
            debugger
        }
    };
    var jsCallStartIndex = 1;
    var functionPointers = new Array(0);
    function convertJsFunctionToWasm(func, sig) {
        var typeSection = [1, 0, 1, 96];
        var sigRet = sig.slice(0, 1);
        var sigParam = sig.slice(1);
        var typeCodes = {
            "i": 127,
            "j": 126,
            "f": 125,
            "d": 124
        };
        typeSection.push(sigParam.length);
        for (var i = 0; i < sigParam.length; ++i) {
            typeSection.push(typeCodes[sigParam[i]])
        }
        if (sigRet == "v") {
            typeSection.push(0)
        } else {
            typeSection = typeSection.concat([1, typeCodes[sigRet]])
        }
        typeSection[1] = typeSection.length - 2;
        var bytes = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0].concat(typeSection, [2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0]));
        var module = new WebAssembly.Module(bytes);
        var instance = new WebAssembly.Instance(module,{
            e: {
                f: func
            }
        });
        var wrappedFunc = instance.exports.f;
        return wrappedFunc
    }
    var funcWrappers = {};
    function dynCall(sig, ptr, args) {
        if (args && args.length) {
            assert(args.length == sig.length - 1);
            assert("dynCall_" + sig in Module, "bad function pointer type - no table for sig '" + sig + "'");
            return Module["dynCall_" + sig].apply(null, [ptr].concat(args))
        } else {
            assert(sig.length == 1);
            assert("dynCall_" + sig in Module, "bad function pointer type - no table for sig '" + sig + "'");
            return Module["dynCall_" + sig].call(null, ptr)
        }
    }
    var tempRet0 = 0;
    var setTempRet0 = function(value) {
        tempRet0 = value
    };
    var getTempRet0 = function() {
        return tempRet0
    };
    if (typeof WebAssembly !== "object") {
        abort("No WebAssembly support found. Build with -s WASM=0 to target JavaScript instead.")
    }
    function setValue(ptr, value, type, noSafe) {
        type = type || "i8";
        if (type.charAt(type.length - 1) === "*")
            type = "i32";
        switch (type) {
        case "i1":
            HEAP8[ptr >> 0] = value;
            break;
        case "i8":
            HEAP8[ptr >> 0] = value;
            break;
        case "i16":
            HEAP16[ptr >> 1] = value;
            break;
        case "i32":
            HEAP32[ptr >> 2] = value;
            break;
        case "i64":
            tempI64 = [value >>> 0, (tempDouble = value,
            +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
            HEAP32[ptr >> 2] = tempI64[0],
            HEAP32[ptr + 4 >> 2] = tempI64[1];
            break;
        case "float":
            HEAPF32[ptr >> 2] = value;
            break;
        case "double":
            HEAPF64[ptr >> 3] = value;
            break;
        default:
            abort("invalid type for setValue: " + type)
        }
    }
    var wasmMemory;
    var wasmTable;
    var ABORT = false;
    var EXITSTATUS = 0;
    function assert(condition, text) {
        if (!condition) {
            abort("Assertion failed: " + text)
        }
    }
    function getCFunc(ident) {
        var func = Module["_" + ident];
        assert(func, "Cannot call unknown function " + ident + ", make sure it is exported");
        return func
    }
    function ccall(ident, returnType, argTypes, args, opts) {
        var toC = {
            "string": function(str) {
                var ret = 0;
                if (str !== null && str !== undefined && str !== 0) {
                    var len = (str.length << 2) + 1;
                    ret = stackAlloc(len);
                    stringToUTF8(str, ret, len)
                }
                return ret
            },
            "array": function(arr) {
                var ret = stackAlloc(arr.length);
                writeArrayToMemory(arr, ret);
                return ret
            }
        };
        function convertReturnValue(ret) {
            if (returnType === "string")
                return UTF8ToString(ret);
            if (returnType === "boolean")
                return Boolean(ret);
            return ret
        }
        var func = getCFunc(ident);
        var cArgs = [];
        var stack = 0;
        assert(returnType !== "array", 'Return type should not be "array".');
        if (args) {
            for (var i = 0; i < args.length; i++) {
                var converter = toC[argTypes[i]];
                if (converter) {
                    if (stack === 0)
                        stack = stackSave();
                    cArgs[i] = converter(args[i])
                } else {
                    cArgs[i] = args[i]
                }
            }
        }
        var ret = func.apply(null, cArgs);
        ret = convertReturnValue(ret);
        if (stack !== 0)
            stackRestore(stack);
        return ret
    }
    var ALLOC_NORMAL = 0;
    var ALLOC_NONE = 3;
    function allocate(slab, types, allocator, ptr) {
        var zeroinit, size;
        if (typeof slab === "number") {
            zeroinit = true;
            size = slab
        } else {
            zeroinit = false;
            size = slab.length
        }
        var singleType = typeof types === "string" ? types : null;
        var ret;
        if (allocator == ALLOC_NONE) {
            ret = ptr
        } else {
            ret = [_malloc, stackAlloc, dynamicAlloc][allocator](Math.max(size, singleType ? 1 : types.length))
        }
        if (zeroinit) {
            var stop;
            ptr = ret;
            assert((ret & 3) == 0);
            stop = ret + (size & ~3);
            for (; ptr < stop; ptr += 4) {
                HEAP32[ptr >> 2] = 0
            }
            stop = ret + size;
            while (ptr < stop) {
                HEAP8[ptr++ >> 0] = 0
            }
            return ret
        }
        if (singleType === "i8") {
            if (slab.subarray || slab.slice) {
                HEAPU8.set(slab, ret)
            } else {
                HEAPU8.set(new Uint8Array(slab), ret)
            }
            return ret
        }
        var i = 0, type, typeSize, previousType;
        while (i < size) {
            var curr = slab[i];
            type = singleType || types[i];
            if (type === 0) {
                i++;
                continue
            }
            assert(type, "Must know what type to store in allocate!");
            if (type == "i64")
                type = "i32";
            setValue(ret + i, curr, type);
            if (previousType !== type) {
                typeSize = getNativeTypeSize(type);
                previousType = type
            }
            i += typeSize
        }
        return ret
    }
    function getMemory(size) {
        if (!runtimeInitialized)
            return dynamicAlloc(size);
        return _malloc(size)
    }
    var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;
    function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
        var endIdx = idx + maxBytesToRead;
        var endPtr = idx;
        while (u8Array[endPtr] && !(endPtr >= endIdx))
            ++endPtr;
        if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
            return UTF8Decoder.decode(u8Array.subarray(idx, endPtr))
        } else {
            var str = "";
            while (idx < endPtr) {
                var u0 = u8Array[idx++];
                if (!(u0 & 128)) {
                    str += String.fromCharCode(u0);
                    continue
                }
                var u1 = u8Array[idx++] & 63;
                if ((u0 & 224) == 192) {
                    str += String.fromCharCode((u0 & 31) << 6 | u1);
                    continue
                }
                var u2 = u8Array[idx++] & 63;
                if ((u0 & 240) == 224) {
                    u0 = (u0 & 15) << 12 | u1 << 6 | u2
                } else {
                    if ((u0 & 248) != 240)
                        warnOnce("Invalid UTF-8 leading byte 0x" + u0.toString(16) + " encountered when deserializing a UTF-8 string on the asm.js/wasm heap to a JS string!");
                    u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u8Array[idx++] & 63
                }
                if (u0 < 65536) {
                    str += String.fromCharCode(u0)
                } else {
                    var ch = u0 - 65536;
                    str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
                }
            }
        }
        return str
    }
    function UTF8ToString(ptr, maxBytesToRead) {
        return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""
    }
    function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
        if (!(maxBytesToWrite > 0))
            return 0;
        var startIdx = outIdx;
        var endIdx = outIdx + maxBytesToWrite - 1;
        for (var i = 0; i < str.length; ++i) {
            var u = str.charCodeAt(i);
            if (u >= 55296 && u <= 57343) {
                var u1 = str.charCodeAt(++i);
                u = 65536 + ((u & 1023) << 10) | u1 & 1023
            }
            if (u <= 127) {
                if (outIdx >= endIdx)
                    break;
                outU8Array[outIdx++] = u
            } else if (u <= 2047) {
                if (outIdx + 1 >= endIdx)
                    break;
                outU8Array[outIdx++] = 192 | u >> 6;
                outU8Array[outIdx++] = 128 | u & 63
            } else if (u <= 65535) {
                if (outIdx + 2 >= endIdx)
                    break;
                outU8Array[outIdx++] = 224 | u >> 12;
                outU8Array[outIdx++] = 128 | u >> 6 & 63;
                outU8Array[outIdx++] = 128 | u & 63
            } else {
                if (outIdx + 3 >= endIdx)
                    break;
                if (u >= 2097152)
                    warnOnce("Invalid Unicode code point 0x" + u.toString(16) + " encountered when serializing a JS string to an UTF-8 string on the asm.js/wasm heap! (Valid unicode code points should be in range 0-0x1FFFFF).");
                outU8Array[outIdx++] = 240 | u >> 18;
                outU8Array[outIdx++] = 128 | u >> 12 & 63;
                outU8Array[outIdx++] = 128 | u >> 6 & 63;
                outU8Array[outIdx++] = 128 | u & 63
            }
        }
        outU8Array[outIdx] = 0;
        return outIdx - startIdx
    }
    function stringToUTF8(str, outPtr, maxBytesToWrite) {
        assert(typeof maxBytesToWrite == "number", "stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
        return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
    }
    function lengthBytesUTF8(str) {
        var len = 0;
        for (var i = 0; i < str.length; ++i) {
            var u = str.charCodeAt(i);
            if (u >= 55296 && u <= 57343)
                u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
            if (u <= 127)
                ++len;
            else if (u <= 2047)
                len += 2;
            else if (u <= 65535)
                len += 3;
            else
                len += 4
        }
        return len
    }
    var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;
    function allocateUTF8(str) {
        var size = lengthBytesUTF8(str) + 1;
        var ret = _malloc(size);
        if (ret)
            stringToUTF8Array(str, HEAP8, ret, size);
        return ret
    }
    function allocateUTF8OnStack(str) {
        var size = lengthBytesUTF8(str) + 1;
        var ret = stackAlloc(size);
        stringToUTF8Array(str, HEAP8, ret, size);
        return ret
    }
    function writeArrayToMemory(array, buffer) {
        assert(array.length >= 0, "writeArrayToMemory array must have a length (should be an array or typed array)");
        HEAP8.set(array, buffer)
    }
    function writeAsciiToMemory(str, buffer, dontAddNull) {
        for (var i = 0; i < str.length; ++i) {
            assert(str.charCodeAt(i) === str.charCodeAt(i) & 255);
            HEAP8[buffer++ >> 0] = str.charCodeAt(i)
        }
        if (!dontAddNull)
            HEAP8[buffer >> 0] = 0
    }
    function demangle(func) {
        return func
    }
    function demangleAll(text) {
        var regex = /__Z[\w\d_]+/g;
        return text.replace(regex, function(x) {
            var y = demangle(x);
            return x === y ? x : y + " [" + x + "]"
        })
    }
    function jsStackTrace() {
        var err = new Error;
        if (!err.stack) {
            try {
                throw new Error(0)
            } catch (e) {
                err = e
            }
            if (!err.stack) {
                return "(no stack trace available)"
            }
        }
        return err.stack.toString()
    }
    function stackTrace() {
        var js = jsStackTrace();
        if (Module["extraStackTrace"])
            js += "\n" + Module["extraStackTrace"]();
        return demangleAll(js)
    }
    var PAGE_SIZE = 16384;
    var WASM_PAGE_SIZE = 65536;
    function alignUp(x, multiple) {
        if (x % multiple > 0) {
            x += multiple - x % multiple
        }
        return x
    }
    var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
    function updateGlobalBufferViews() {
        Module["HEAP8"] = HEAP8 = new Int8Array(buffer);
        Module["HEAP16"] = HEAP16 = new Int16Array(buffer);
        Module["HEAP32"] = HEAP32 = new Int32Array(buffer);
        Module["HEAPU8"] = HEAPU8 = new Uint8Array(buffer);
        Module["HEAPU16"] = HEAPU16 = new Uint16Array(buffer);
        Module["HEAPU32"] = HEAPU32 = new Uint32Array(buffer);
        Module["HEAPF32"] = HEAPF32 = new Float32Array(buffer);
        Module["HEAPF64"] = HEAPF64 = new Float64Array(buffer)
    }
    var STACK_BASE = 11753936
      , STACK_MAX = 16996816
      , DYNAMIC_BASE = 16996816
      , DYNAMICTOP_PTR = 11753904;
    assert(STACK_BASE % 16 === 0, "stack must start aligned");
    assert(DYNAMIC_BASE % 16 === 0, "heap must start aligned");
    var TOTAL_STACK = 5242880;
    if (Module["TOTAL_STACK"])
        assert(TOTAL_STACK === Module["TOTAL_STACK"], "the stack size can no longer be determined at runtime");
    var INITIAL_TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 33554432;
    if (INITIAL_TOTAL_MEMORY < TOTAL_STACK)
        err("TOTAL_MEMORY should be larger than TOTAL_STACK, was " + INITIAL_TOTAL_MEMORY + "! (TOTAL_STACK=" + TOTAL_STACK + ")");
    assert(typeof Int32Array !== "undefined" && typeof Float64Array !== "undefined" && Int32Array.prototype.subarray !== undefined && Int32Array.prototype.set !== undefined, "JS engine does not provide full typed array support");
    if (Module["wasmMemory"]) {
        wasmMemory = Module["wasmMemory"]
    } else {
        wasmMemory = new WebAssembly.Memory({
            "initial": INITIAL_TOTAL_MEMORY / WASM_PAGE_SIZE
        })
    }
    if (wasmMemory) {
        buffer = wasmMemory.buffer
    }
    INITIAL_TOTAL_MEMORY = buffer.byteLength;
    assert(INITIAL_TOTAL_MEMORY % WASM_PAGE_SIZE === 0);
    updateGlobalBufferViews();
    HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;
    function writeStackCookie() {
        assert((STACK_MAX & 3) == 0);
        HEAPU32[(STACK_MAX >> 2) - 1] = 34821223;
        HEAPU32[(STACK_MAX >> 2) - 2] = 2310721022
    }
    function checkStackCookie() {
        var cookie1 = HEAPU32[(STACK_MAX >> 2) - 1];
        var cookie2 = HEAPU32[(STACK_MAX >> 2) - 2];
        if (cookie1 != 34821223 || cookie2 != 2310721022) {
            abort("Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x02135467, but received 0x" + cookie2.toString(16) + " " + cookie1.toString(16))
        }
        if (HEAP32[0] !== 1668509029)
            abort("Runtime error: The application has corrupted its heap memory area (address zero)!")
    }
    function abortStackOverflow(allocSize) {
        abort("Stack overflow! Attempted to allocate " + allocSize + " bytes on the stack, but stack has only " + (STACK_MAX - stackSave() + allocSize) + " bytes available!")
    }
    HEAP32[0] = 1668509029;
    HEAP16[1] = 25459;
    if (HEAPU8[2] !== 115 || HEAPU8[3] !== 99)
        throw "Runtime error: expected the system to be little-endian!";
    function callRuntimeCallbacks(callbacks) {
        while (callbacks.length > 0) {
            var callback = callbacks.shift();
            if (typeof callback == "function") {
                callback();
                continue
            }
            var func = callback.func;
            if (typeof func === "number") {
                if (callback.arg === undefined) {
                    Module["dynCall_v"](func)
                } else {
                    Module["dynCall_vi"](func, callback.arg)
                }
            } else {
                func(callback.arg === undefined ? null : callback.arg)
            }
        }
    }
    var __ATPRERUN__ = [];
    var __ATINIT__ = [];
    var __ATMAIN__ = [];
    var __ATPOSTRUN__ = [];
    var runtimeInitialized = false;
    var runtimeExited = false;
    function preRun() {
        if (Module["preRun"]) {
            if (typeof Module["preRun"] == "function")
                Module["preRun"] = [Module["preRun"]];
            while (Module["preRun"].length) {
                addOnPreRun(Module["preRun"].shift())
            }
        }
        callRuntimeCallbacks(__ATPRERUN__)
    }
    function initRuntime() {
        checkStackCookie();
        assert(!runtimeInitialized);
        runtimeInitialized = true;
        if (!Module["noFSInit"] && !FS.init.initialized)
            FS.init();
        TTY.init();
        callRuntimeCallbacks(__ATINIT__)
    }
    function preMain() {
        checkStackCookie();
        FS.ignorePermissions = false;
        callRuntimeCallbacks(__ATMAIN__)
    }
    function exitRuntime() {
        checkStackCookie();
        runtimeExited = true
    }
    function postRun() {
        checkStackCookie();
        if (Module["postRun"]) {
            if (typeof Module["postRun"] == "function")
                Module["postRun"] = [Module["postRun"]];
            while (Module["postRun"].length) {
                addOnPostRun(Module["postRun"].shift())
            }
        }
        callRuntimeCallbacks(__ATPOSTRUN__)
    }
    function addOnPreRun(cb) {
        __ATPRERUN__.unshift(cb)
    }
    function addOnPostRun(cb) {
        __ATPOSTRUN__.unshift(cb)
    }
    assert(Math.imul, "This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
    assert(Math.fround, "This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
    assert(Math.clz32, "This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
    assert(Math.trunc, "This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
    var Math_abs = Math.abs;
    var Math_ceil = Math.ceil;
    var Math_floor = Math.floor;
    var Math_min = Math.min;
    var Math_trunc = Math.trunc;
    var runDependencies = 0;
    var runDependencyWatcher = null;
    var dependenciesFulfilled = null;
    var runDependencyTracking = {};
    function getUniqueRunDependency(id) {
        var orig = id;
        while (1) {
            if (!runDependencyTracking[id])
                return id;
            id = orig + Math.random()
        }
        return id
    }
    function addRunDependency(id) {
        runDependencies++;
        if (Module["monitorRunDependencies"]) {
            Module["monitorRunDependencies"](runDependencies)
        }
        if (id) {
            assert(!runDependencyTracking[id]);
            runDependencyTracking[id] = 1;
            if (runDependencyWatcher === null && typeof setInterval !== "undefined") {
                runDependencyWatcher = setInterval(function() {
                    if (ABORT) {
                        clearInterval(runDependencyWatcher);
                        runDependencyWatcher = null;
                        return
                    }
                    var shown = false;
                    for (var dep in runDependencyTracking) {
                        if (!shown) {
                            shown = true;
                            err("still waiting on run dependencies:")
                        }
                        err("dependency: " + dep)
                    }
                    if (shown) {
                        err("(end of list)")
                    }
                }, 1e4)
            }
        } else {
            err("warning: run dependency added without ID")
        }
    }
    function removeRunDependency(id) {
        runDependencies--;
        if (Module["monitorRunDependencies"]) {
            Module["monitorRunDependencies"](runDependencies)
        }
        if (id) {
            assert(runDependencyTracking[id]);
            delete runDependencyTracking[id]
        } else {
            err("warning: run dependency removed without ID")
        }
        if (runDependencies == 0) {
            if (runDependencyWatcher !== null) {
                clearInterval(runDependencyWatcher);
                runDependencyWatcher = null
            }
            if (dependenciesFulfilled) {
                var callback = dependenciesFulfilled;
                dependenciesFulfilled = null;
                callback()
            }
        }
    }
    Module["preloadedImages"] = {};
    Module["preloadedAudios"] = {};
    var dataURIPrefix = "data:application/octet-stream;base64,";
    function isDataURI(filename) {
        return String.prototype.startsWith ? filename.startsWith(dataURIPrefix) : filename.indexOf(dataURIPrefix) === 0
    }
    var wasmBinaryFile = "ffmpeg.wasm";
    if (!isDataURI(wasmBinaryFile)) {
        wasmBinaryFile = locateFile(wasmBinaryFile)
    }
    function getBinary() {
        try {
            if (Module["wasmBinary"]) {
                return new Uint8Array(Module["wasmBinary"])
            }
            if (Module["readBinary"]) {
                return Module["readBinary"](wasmBinaryFile)
            } else {
                throw "both async and sync fetching of the wasm failed"
            }
        } catch (err) {
            abort(err)
        }
    }
    function getBinaryPromise() {

        if (!Module["wasmBinary"] && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === "function") {
            if (this.customWasmArrayBuffer) {
              return new Promise(function(resolve, reject) {
                  resolve(this.customWasmArrayBuffer)
              })
            }
            return fetch(wasmBinaryFile, {
                credentials: "same-origin"
            }).then(function(response) {
                if (!response["ok"]) {
                    throw "failed to load wasm binary file at '" + wasmBinaryFile + "'"
                }
                return response["arrayBuffer"]()
            }).catch(function() {
                return getBinary()
            })
        }
        return new Promise(function(resolve, reject) {
            resolve(getBinary())
        }
        )
    }
    function createWasm(env) {
        var info = {
            "env": env,
            "global": {
                "NaN": NaN,
                Infinity: Infinity
            },
            "global.Math": Math,
            "asm2wasm": asm2wasmImports
        };
        function receiveInstance(instance, module) {
            var exports = instance.exports;
            Module["asm"] = exports;
            removeRunDependency("wasm-instantiate")
        }
        addRunDependency("wasm-instantiate");
        var trueModule = Module;
        function receiveInstantiatedSource(output) {
            assert(Module === trueModule, "the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?");
            trueModule = null;
            receiveInstance(output["instance"])
        }
        function instantiateArrayBuffer(receiver) {
            return getBinaryPromise().then(function(binary) {
                return WebAssembly.instantiate(binary, info)
            }).then(receiver, function(reason) {
                err("failed to asynchronously prepare wasm: " + reason);
                abort(reason)
            })
        }
        function instantiateAsync() {
            if (!Module["wasmBinary"] && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && typeof fetch === "function") {
                if (this.customWasmResponse) {
                  const response = this.customWasmResponse
                  return WebAssembly.instantiateStreaming(response, info).then(receiveInstantiatedSource, function(reason) {
                          err("wasm streaming compile failed: " + reason);
                          err("falling back to ArrayBuffer instantiation");
                          instantiateArrayBuffer(receiveInstantiatedSource)
                      })
                }
                fetch(wasmBinaryFile, {
                    cache: "force-cache",
                    credentials: "same-origin"
                }).then(function(response) {
                    this.customWasmResponse = response
                    this.customWasmArrayBuffer = response["arrayBuffer"]()
                    return WebAssembly.instantiateStreaming(response, info).then(receiveInstantiatedSource, function(reason) {
                        err("wasm streaming compile failed: " + reason);
                        err("falling back to ArrayBuffer instantiation");
                        instantiateArrayBuffer(receiveInstantiatedSource)
                    })
                })
            } else {
                return instantiateArrayBuffer(receiveInstantiatedSource)
            }
        }
        if (Module["instantiateWasm"]) {
            try {
                return Module["instantiateWasm"](info, receiveInstance)
            } catch (e) {
                err("Module.instantiateWasm callback failed with error: " + e);
                return false
            }
        }
        instantiateAsync();
        return {}
    }
    Module["asm"] = function(global, env, providedBuffer) {
        env["memory"] = wasmMemory;
        env["table"] = wasmTable = new WebAssembly.Table({
            "initial": 14262,
            "maximum": 14262,
            "element": "anyfunc"
        });
        env["__memory_base"] = 1024;
        env["__table_base"] = 0;
        var exports = createWasm(env);
        assert(exports, "binaryen setup failed (no wasm support?)");
        return exports
    }
    ;
    __ATINIT__.push({
        func: function() {
            ___emscripten_environ_constructor()
        }
    });
    var tempDoublePtr = 11753920;
    assert(tempDoublePtr % 8 == 0);
    function ___assert_fail(condition, filename, line, func) {
        abort("Assertion failed: " + UTF8ToString(condition) + ", at: " + [filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function"])
    }
    var ENV = {};
    function ___buildEnvironment(environ) {
        var MAX_ENV_VALUES = 64;
        var TOTAL_ENV_SIZE = 1024;
        var poolPtr;
        var envPtr;
        if (!___buildEnvironment.called) {
            ___buildEnvironment.called = true;
            ENV["USER"] = ENV["LOGNAME"] = "web_user";
            ENV["PATH"] = "/";
            ENV["PWD"] = "/";
            ENV["HOME"] = "/home/web_user";
            ENV["LANG"] = "C.UTF-8";
            ENV["LANG"] = (typeof navigator === "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8";
            ENV["_"] = Module["thisProgram"];
            poolPtr = getMemory(TOTAL_ENV_SIZE);
            envPtr = getMemory(MAX_ENV_VALUES * 4);
            HEAP32[envPtr >> 2] = poolPtr;
            HEAP32[environ >> 2] = envPtr
        } else {
            envPtr = HEAP32[environ >> 2];
            poolPtr = HEAP32[envPtr >> 2]
        }
        var strings = [];
        var totalSize = 0;
        for (var key in ENV) {
            if (typeof ENV[key] === "string") {
                var line = key + "=" + ENV[key];
                strings.push(line);
                totalSize += line.length
            }
        }
        if (totalSize > TOTAL_ENV_SIZE) {
            throw new Error("Environment size exceeded TOTAL_ENV_SIZE!")
        }
        var ptrSize = 4;
        for (var i = 0; i < strings.length; i++) {
            var line = strings[i];
            writeAsciiToMemory(line, poolPtr);
            HEAP32[envPtr + i * ptrSize >> 2] = poolPtr;
            poolPtr += line.length + 1
        }
        HEAP32[envPtr + strings.length * ptrSize >> 2] = 0
    }
    function ___lock() {}
    var PATH = {
        splitPath: function(filename) {
            var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
            return splitPathRe.exec(filename).slice(1)
        },
        normalizeArray: function(parts, allowAboveRoot) {
            var up = 0;
            for (var i = parts.length - 1; i >= 0; i--) {
                var last = parts[i];
                if (last === ".") {
                    parts.splice(i, 1)
                } else if (last === "..") {
                    parts.splice(i, 1);
                    up++
                } else if (up) {
                    parts.splice(i, 1);
                    up--
                }
            }
            if (allowAboveRoot) {
                for (; up; up--) {
                    parts.unshift("..")
                }
            }
            return parts
        },
        normalize: function(path) {
            var isAbsolute = path.charAt(0) === "/"
              , trailingSlash = path.substr(-1) === "/";
            path = PATH.normalizeArray(path.split("/").filter(function(p) {
                return !!p
            }), !isAbsolute).join("/");
            if (!path && !isAbsolute) {
                path = "."
            }
            if (path && trailingSlash) {
                path += "/"
            }
            return (isAbsolute ? "/" : "") + path
        },
        dirname: function(path) {
            var result = PATH.splitPath(path)
              , root = result[0]
              , dir = result[1];
            if (!root && !dir) {
                return "."
            }
            if (dir) {
                dir = dir.substr(0, dir.length - 1)
            }
            return root + dir
        },
        basename: function(path) {
            if (path === "/")
                return "/";
            var lastSlash = path.lastIndexOf("/");
            if (lastSlash === -1)
                return path;
            return path.substr(lastSlash + 1)
        },
        extname: function(path) {
            return PATH.splitPath(path)[3]
        },
        join: function() {
            var paths = Array.prototype.slice.call(arguments, 0);
            return PATH.normalize(paths.join("/"))
        },
        join2: function(l, r) {
            return PATH.normalize(l + "/" + r)
        }
    };
    function ___setErrNo(value) {
        if (Module["___errno_location"])
            HEAP32[Module["___errno_location"]() >> 2] = value;
        else
            err("failed to set errno from JS");
        return value
    }
    var PATH_FS = {
        resolve: function() {
            var resolvedPath = ""
              , resolvedAbsolute = false;
            for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
                var path = i >= 0 ? arguments[i] : FS.cwd();
                if (typeof path !== "string") {
                    throw new TypeError("Arguments to path.resolve must be strings")
                } else if (!path) {
                    return ""
                }
                resolvedPath = path + "/" + resolvedPath;
                resolvedAbsolute = path.charAt(0) === "/"
            }
            resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(function(p) {
                return !!p
            }), !resolvedAbsolute).join("/");
            return (resolvedAbsolute ? "/" : "") + resolvedPath || "."
        },
        relative: function(from, to) {
            from = PATH_FS.resolve(from).substr(1);
            to = PATH_FS.resolve(to).substr(1);
            function trim(arr) {
                var start = 0;
                for (; start < arr.length; start++) {
                    if (arr[start] !== "")
                        break
                }
                var end = arr.length - 1;
                for (; end >= 0; end--) {
                    if (arr[end] !== "")
                        break
                }
                if (start > end)
                    return [];
                return arr.slice(start, end - start + 1)
            }
            var fromParts = trim(from.split("/"));
            var toParts = trim(to.split("/"));
            var length = Math.min(fromParts.length, toParts.length);
            var samePartsLength = length;
            for (var i = 0; i < length; i++) {
                if (fromParts[i] !== toParts[i]) {
                    samePartsLength = i;
                    break
                }
            }
            var outputParts = [];
            for (var i = samePartsLength; i < fromParts.length; i++) {
                outputParts.push("..")
            }
            outputParts = outputParts.concat(toParts.slice(samePartsLength));
            return outputParts.join("/")
        }
    };
    var TTY = {
        ttys: [],
        init: function() {},
        shutdown: function() {},
        register: function(dev, ops) {
            TTY.ttys[dev] = {
                input: [],
                output: [],
                ops: ops
            };
            FS.registerDevice(dev, TTY.stream_ops)
        },
        stream_ops: {
            open: function(stream) {
                var tty = TTY.ttys[stream.node.rdev];
                if (!tty) {
                    throw new FS.ErrnoError(19)
                }
                stream.tty = tty;
                stream.seekable = false
            },
            close: function(stream) {
                stream.tty.ops.flush(stream.tty)
            },
            flush: function(stream) {
                stream.tty.ops.flush(stream.tty)
            },
            read: function(stream, buffer, offset, length, pos) {
                if (!stream.tty || !stream.tty.ops.get_char) {
                    throw new FS.ErrnoError(6)
                }
                var bytesRead = 0;
                for (var i = 0; i < length; i++) {
                    var result;
                    try {
                        result = stream.tty.ops.get_char(stream.tty)
                    } catch (e) {
                        throw new FS.ErrnoError(5)
                    }
                    if (result === undefined && bytesRead === 0) {
                        throw new FS.ErrnoError(11)
                    }
                    if (result === null || result === undefined)
                        break;
                    bytesRead++;
                    buffer[offset + i] = result
                }
                if (bytesRead) {
                    stream.node.timestamp = Date.now()
                }
                return bytesRead
            },
            write: function(stream, buffer, offset, length, pos) {
                if (!stream.tty || !stream.tty.ops.put_char) {
                    throw new FS.ErrnoError(6)
                }
                try {
                    for (var i = 0; i < length; i++) {
                        stream.tty.ops.put_char(stream.tty, buffer[offset + i])
                    }
                } catch (e) {
                    throw new FS.ErrnoError(5)
                }
                if (length) {
                    stream.node.timestamp = Date.now()
                }
                return i
            }
        },
        default_tty_ops: {
            get_char: function(tty) {
                if (!tty.input.length) {
                    var result = null;
                    if (ENVIRONMENT_IS_NODE) {
                        var BUFSIZE = 256;
                        var buf = new Buffer(BUFSIZE);
                        var bytesRead = 0;
                        var isPosixPlatform = process.platform != "win32";
                        var fd = process.stdin.fd;
                        if (isPosixPlatform) {
                            var usingDevice = false;
                            try {
                                fd = fs.openSync("/dev/stdin", "r");
                                usingDevice = true
                            } catch (e) {}
                        }
                        try {
                            bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null)
                        } catch (e) {
                            if (e.toString().indexOf("EOF") != -1)
                                bytesRead = 0;
                            else
                                throw e
                        }
                        if (usingDevice) {
                            fs.closeSync(fd)
                        }
                        if (bytesRead > 0) {
                            result = buf.slice(0, bytesRead).toString("utf-8")
                        } else {
                            result = null
                        }
                    } else if (typeof window != "undefined" && typeof window.prompt == "function") {
                        result = window.prompt("Input: ");
                        if (result !== null) {
                            result += "\n"
                        }
                    } else if (typeof readline == "function") {
                        result = readline();
                        if (result !== null) {
                            result += "\n"
                        }
                    }
                    if (!result) {
                        return null
                    }
                    tty.input = intArrayFromString(result, true)
                }
                return tty.input.shift()
            },
            put_char: function(tty, val) {
                if (val === null || val === 10) {
                    out(UTF8ArrayToString(tty.output, 0));
                    tty.output = []
                } else {
                    if (val != 0)
                        tty.output.push(val)
                }
            },
            flush: function(tty) {
                if (tty.output && tty.output.length > 0) {
                    out(UTF8ArrayToString(tty.output, 0));
                    tty.output = []
                }
            }
        },
        default_tty1_ops: {
            put_char: function(tty, val) {
                if (val === null || val === 10) {
                    err(UTF8ArrayToString(tty.output, 0));
                    tty.output = []
                } else {
                    if (val != 0)
                        tty.output.push(val)
                }
            },
            flush: function(tty) {
                if (tty.output && tty.output.length > 0) {
                    err(UTF8ArrayToString(tty.output, 0));
                    tty.output = []
                }
            }
        }
    };
    var MEMFS = {
        ops_table: null,
        mount: function(mount) {
            return MEMFS.createNode(null, "/", 16384 | 511, 0)
        },
        createNode: function(parent, name, mode, dev) {
            if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
                throw new FS.ErrnoError(1)
            }
            if (!MEMFS.ops_table) {
                MEMFS.ops_table = {
                    dir: {
                        node: {
                            getattr: MEMFS.node_ops.getattr,
                            setattr: MEMFS.node_ops.setattr,
                            lookup: MEMFS.node_ops.lookup,
                            mknod: MEMFS.node_ops.mknod,
                            rename: MEMFS.node_ops.rename,
                            unlink: MEMFS.node_ops.unlink,
                            rmdir: MEMFS.node_ops.rmdir,
                            readdir: MEMFS.node_ops.readdir,
                            symlink: MEMFS.node_ops.symlink
                        },
                        stream: {
                            llseek: MEMFS.stream_ops.llseek
                        }
                    },
                    file: {
                        node: {
                            getattr: MEMFS.node_ops.getattr,
                            setattr: MEMFS.node_ops.setattr
                        },
                        stream: {
                            llseek: MEMFS.stream_ops.llseek,
                            read: MEMFS.stream_ops.read,
                            write: MEMFS.stream_ops.write,
                            allocate: MEMFS.stream_ops.allocate,
                            mmap: MEMFS.stream_ops.mmap,
                            msync: MEMFS.stream_ops.msync
                        }
                    },
                    link: {
                        node: {
                            getattr: MEMFS.node_ops.getattr,
                            setattr: MEMFS.node_ops.setattr,
                            readlink: MEMFS.node_ops.readlink
                        },
                        stream: {}
                    },
                    chrdev: {
                        node: {
                            getattr: MEMFS.node_ops.getattr,
                            setattr: MEMFS.node_ops.setattr
                        },
                        stream: FS.chrdev_stream_ops
                    }
                }
            }
            var node = FS.createNode(parent, name, mode, dev);
            if (FS.isDir(node.mode)) {
                node.node_ops = MEMFS.ops_table.dir.node;
                node.stream_ops = MEMFS.ops_table.dir.stream;
                node.contents = {}
            } else if (FS.isFile(node.mode)) {
                node.node_ops = MEMFS.ops_table.file.node;
                node.stream_ops = MEMFS.ops_table.file.stream;
                node.usedBytes = 0;
                node.contents = null
            } else if (FS.isLink(node.mode)) {
                node.node_ops = MEMFS.ops_table.link.node;
                node.stream_ops = MEMFS.ops_table.link.stream
            } else if (FS.isChrdev(node.mode)) {
                node.node_ops = MEMFS.ops_table.chrdev.node;
                node.stream_ops = MEMFS.ops_table.chrdev.stream
            }
            node.timestamp = Date.now();
            if (parent) {
                parent.contents[name] = node
            }
            return node
        },
        getFileDataAsRegularArray: function(node) {
            if (node.contents && node.contents.subarray) {
                var arr = [];
                for (var i = 0; i < node.usedBytes; ++i)
                    arr.push(node.contents[i]);
                return arr
            }
            return node.contents
        },
        getFileDataAsTypedArray: function(node) {
            if (!node.contents)
                return new Uint8Array;
            if (node.contents.subarray)
                return node.contents.subarray(0, node.usedBytes);
            return new Uint8Array(node.contents)
        },
        expandFileStorage: function(node, newCapacity) {
            var prevCapacity = node.contents ? node.contents.length : 0;
            if (prevCapacity >= newCapacity)
                return;
            var CAPACITY_DOUBLING_MAX = 1024 * 1024;
            newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) | 0);
            if (prevCapacity != 0)
                newCapacity = Math.max(newCapacity, 256);
            var oldContents = node.contents;
            node.contents = new Uint8Array(newCapacity);
            if (node.usedBytes > 0)
                node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
            return
        },
        resizeFileStorage: function(node, newSize) {
            if (node.usedBytes == newSize)
                return;
            if (newSize == 0) {
                node.contents = null;
                node.usedBytes = 0;
                return
            }
            if (!node.contents || node.contents.subarray) {
                var oldContents = node.contents;
                node.contents = new Uint8Array(new ArrayBuffer(newSize));
                if (oldContents) {
                    node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)))
                }
                node.usedBytes = newSize;
                return
            }
            if (!node.contents)
                node.contents = [];
            if (node.contents.length > newSize)
                node.contents.length = newSize;
            else
                while (node.contents.length < newSize)
                    node.contents.push(0);
            node.usedBytes = newSize
        },
        node_ops: {
            getattr: function(node) {
                var attr = {};
                attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
                attr.ino = node.id;
                attr.mode = node.mode;
                attr.nlink = 1;
                attr.uid = 0;
                attr.gid = 0;
                attr.rdev = node.rdev;
                if (FS.isDir(node.mode)) {
                    attr.size = 4096
                } else if (FS.isFile(node.mode)) {
                    attr.size = node.usedBytes
                } else if (FS.isLink(node.mode)) {
                    attr.size = node.link.length
                } else {
                    attr.size = 0
                }
                attr.atime = new Date(node.timestamp);
                attr.mtime = new Date(node.timestamp);
                attr.ctime = new Date(node.timestamp);
                attr.blksize = 4096;
                attr.blocks = Math.ceil(attr.size / attr.blksize);
                return attr
            },
            setattr: function(node, attr) {
                if (attr.mode !== undefined) {
                    node.mode = attr.mode
                }
                if (attr.timestamp !== undefined) {
                    node.timestamp = attr.timestamp
                }
                if (attr.size !== undefined) {
                    MEMFS.resizeFileStorage(node, attr.size)
                }
            },
            lookup: function(parent, name) {
                throw FS.genericErrors[2]
            },
            mknod: function(parent, name, mode, dev) {
                return MEMFS.createNode(parent, name, mode, dev)
            },
            rename: function(old_node, new_dir, new_name) {
                if (FS.isDir(old_node.mode)) {
                    var new_node;
                    try {
                        new_node = FS.lookupNode(new_dir, new_name)
                    } catch (e) {}
                    if (new_node) {
                        for (var i in new_node.contents) {
                            throw new FS.ErrnoError(39)
                        }
                    }
                }
                delete old_node.parent.contents[old_node.name];
                old_node.name = new_name;
                new_dir.contents[new_name] = old_node;
                old_node.parent = new_dir
            },
            unlink: function(parent, name) {
                delete parent.contents[name]
            },
            rmdir: function(parent, name) {
                var node = FS.lookupNode(parent, name);
                for (var i in node.contents) {
                    throw new FS.ErrnoError(39)
                }
                delete parent.contents[name]
            },
            readdir: function(node) {
                var entries = [".", ".."];
                for (var key in node.contents) {
                    if (!node.contents.hasOwnProperty(key)) {
                        continue
                    }
                    entries.push(key)
                }
                return entries
            },
            symlink: function(parent, newname, oldpath) {
                var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
                node.link = oldpath;
                return node
            },
            readlink: function(node) {
                if (!FS.isLink(node.mode)) {
                    throw new FS.ErrnoError(22)
                }
                return node.link
            }
        },
        stream_ops: {
            read: function(stream, buffer, offset, length, position) {
                var contents = stream.node.contents;
                if (position >= stream.node.usedBytes)
                    return 0;
                var size = Math.min(stream.node.usedBytes - position, length);
                assert(size >= 0);
                if (size > 8 && contents.subarray) {
                    buffer.set(contents.subarray(position, position + size), offset)
                } else {
                    for (var i = 0; i < size; i++)
                        buffer[offset + i] = contents[position + i]
                }
                return size
            },
            write: function(stream, buffer, offset, length, position, canOwn) {
                if (canOwn) {
                    warnOnce("file packager has copied file data into memory, but in memory growth we are forced to copy it again (see --no-heap-copy)")
                }
                canOwn = false;
                if (!length)
                    return 0;
                var node = stream.node;
                node.timestamp = Date.now();
                if (buffer.subarray && (!node.contents || node.contents.subarray)) {
                    if (canOwn) {
                        assert(position === 0, "canOwn must imply no weird position inside the file");
                        node.contents = buffer.subarray(offset, offset + length);
                        node.usedBytes = length;
                        return length
                    } else if (node.usedBytes === 0 && position === 0) {
                        node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
                        node.usedBytes = length;
                        return length
                    } else if (position + length <= node.usedBytes) {
                        node.contents.set(buffer.subarray(offset, offset + length), position);
                        return length
                    }
                }
                MEMFS.expandFileStorage(node, position + length);
                if (node.contents.subarray && buffer.subarray)
                    node.contents.set(buffer.subarray(offset, offset + length), position);
                else {
                    for (var i = 0; i < length; i++) {
                        node.contents[position + i] = buffer[offset + i]
                    }
                }
                node.usedBytes = Math.max(node.usedBytes, position + length);
                return length
            },
            llseek: function(stream, offset, whence) {
                var position = offset;
                if (whence === 1) {
                    position += stream.position
                } else if (whence === 2) {
                    if (FS.isFile(stream.node.mode)) {
                        position += stream.node.usedBytes
                    }
                }
                if (position < 0) {
                    throw new FS.ErrnoError(22)
                }
                return position
            },
            allocate: function(stream, offset, length) {
                MEMFS.expandFileStorage(stream.node, offset + length);
                stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length)
            },
            mmap: function(stream, buffer, offset, length, position, prot, flags) {
                if (!FS.isFile(stream.node.mode)) {
                    throw new FS.ErrnoError(19)
                }
                var ptr;
                var allocated;
                var contents = stream.node.contents;
                if (!(flags & 2) && (contents.buffer === buffer || contents.buffer === buffer.buffer)) {
                    allocated = false;
                    ptr = contents.byteOffset
                } else {
                    if (position > 0 || position + length < stream.node.usedBytes) {
                        if (contents.subarray) {
                            contents = contents.subarray(position, position + length)
                        } else {
                            contents = Array.prototype.slice.call(contents, position, position + length)
                        }
                    }
                    allocated = true;
                    ptr = _malloc(length);
                    if (!ptr) {
                        throw new FS.ErrnoError(12)
                    }
                    buffer.set(contents, ptr)
                }
                return {
                    ptr: ptr,
                    allocated: allocated
                }
            },
            msync: function(stream, buffer, offset, length, mmapFlags) {
                if (!FS.isFile(stream.node.mode)) {
                    throw new FS.ErrnoError(19)
                }
                if (mmapFlags & 2) {
                    return 0
                }
                var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
                return 0
            }
        }
    };
    var IDBFS = {
        dbs: {},
        indexedDB: function() {
            if (typeof indexedDB !== "undefined")
                return indexedDB;
            var ret = null;
            if (typeof window === "object")
                ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
            assert(ret, "IDBFS used, but indexedDB not supported");
            return ret
        },
        DB_VERSION: 21,
        DB_STORE_NAME: "FILE_DATA",
        mount: function(mount) {
            return MEMFS.mount.apply(null, arguments)
        },
        syncfs: function(mount, populate, callback) {
            IDBFS.getLocalSet(mount, function(err, local) {
                if (err)
                    return callback(err);
                IDBFS.getRemoteSet(mount, function(err, remote) {
                    if (err)
                        return callback(err);
                    var src = populate ? remote : local;
                    var dst = populate ? local : remote;
                    IDBFS.reconcile(src, dst, callback)
                })
            })
        },
        getDB: function(name, callback) {
            var db = IDBFS.dbs[name];
            if (db) {
                return callback(null, db)
            }
            var req;
            try {
                req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION)
            } catch (e) {
                return callback(e)
            }
            if (!req) {
                return callback("Unable to connect to IndexedDB")
            }
            req.onupgradeneeded = function(e) {
                var db = e.target.result;
                var transaction = e.target.transaction;
                var fileStore;
                if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
                    fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME)
                } else {
                    fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME)
                }
                if (!fileStore.indexNames.contains("timestamp")) {
                    fileStore.createIndex("timestamp", "timestamp", {
                        unique: false
                    })
                }
            }
            ;
            req.onsuccess = function() {
                db = req.result;
                IDBFS.dbs[name] = db;
                callback(null, db)
            }
            ;
            req.onerror = function(e) {
                callback(this.error);
                e.preventDefault()
            }
        },
        getLocalSet: function(mount, callback) {
            var entries = {};
            function isRealDir(p) {
                return p !== "." && p !== ".."
            }
            function toAbsolute(root) {
                return function(p) {
                    return PATH.join2(root, p)
                }
            }
            var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
            while (check.length) {
                var path = check.pop();
                var stat;
                try {
                    stat = FS.stat(path)
                } catch (e) {
                    return callback(e)
                }
                if (FS.isDir(stat.mode)) {
                    check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)))
                }
                entries[path] = {
                    timestamp: stat.mtime
                }
            }
            return callback(null, {
                type: "local",
                entries: entries
            })
        },
        getRemoteSet: function(mount, callback) {
            var entries = {};
            IDBFS.getDB(mount.mountpoint, function(err, db) {
                if (err)
                    return callback(err);
                try {
                    var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readonly");
                    transaction.onerror = function(e) {
                        callback(this.error);
                        e.preventDefault()
                    }
                    ;
                    var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
                    var index = store.index("timestamp");
                    index.openKeyCursor().onsuccess = function(event) {
                        var cursor = event.target.result;
                        if (!cursor) {
                            return callback(null, {
                                type: "remote",
                                db: db,
                                entries: entries
                            })
                        }
                        entries[cursor.primaryKey] = {
                            timestamp: cursor.key
                        };
                        cursor.continue()
                    }
                } catch (e) {
                    return callback(e)
                }
            })
        },
        loadLocalEntry: function(path, callback) {
            var stat, node;
            try {
                var lookup = FS.lookupPath(path);
                node = lookup.node;
                stat = FS.stat(path)
            } catch (e) {
                return callback(e)
            }
            if (FS.isDir(stat.mode)) {
                return callback(null, {
                    timestamp: stat.mtime,
                    mode: stat.mode
                })
            } else if (FS.isFile(stat.mode)) {
                node.contents = MEMFS.getFileDataAsTypedArray(node);
                return callback(null, {
                    timestamp: stat.mtime,
                    mode: stat.mode,
                    contents: node.contents
                })
            } else {
                return callback(new Error("node type not supported"))
            }
        },
        storeLocalEntry: function(path, entry, callback) {
            try {
                if (FS.isDir(entry.mode)) {
                    FS.mkdir(path, entry.mode)
                } else if (FS.isFile(entry.mode)) {
                    FS.writeFile(path, entry.contents, {
                        canOwn: true
                    })
                } else {
                    return callback(new Error("node type not supported"))
                }
                FS.chmod(path, entry.mode);
                FS.utime(path, entry.timestamp, entry.timestamp)
            } catch (e) {
                return callback(e)
            }
            callback(null)
        },
        removeLocalEntry: function(path, callback) {
            try {
                var lookup = FS.lookupPath(path);
                var stat = FS.stat(path);
                if (FS.isDir(stat.mode)) {
                    FS.rmdir(path)
                } else if (FS.isFile(stat.mode)) {
                    FS.unlink(path)
                }
            } catch (e) {
                return callback(e)
            }
            callback(null)
        },
        loadRemoteEntry: function(store, path, callback) {
            var req = store.get(path);
            req.onsuccess = function(event) {
                callback(null, event.target.result)
            }
            ;
            req.onerror = function(e) {
                callback(this.error);
                e.preventDefault()
            }
        },
        storeRemoteEntry: function(store, path, entry, callback) {
            var req = store.put(entry, path);
            req.onsuccess = function() {
                callback(null)
            }
            ;
            req.onerror = function(e) {
                callback(this.error);
                e.preventDefault()
            }
        },
        removeRemoteEntry: function(store, path, callback) {
            var req = store.delete(path);
            req.onsuccess = function() {
                callback(null)
            }
            ;
            req.onerror = function(e) {
                callback(this.error);
                e.preventDefault()
            }
        },
        reconcile: function(src, dst, callback) {
            var total = 0;
            var create = [];
            Object.keys(src.entries).forEach(function(key) {
                var e = src.entries[key];
                var e2 = dst.entries[key];
                if (!e2 || e.timestamp > e2.timestamp) {
                    create.push(key);
                    total++
                }
            });
            var remove = [];
            Object.keys(dst.entries).forEach(function(key) {
                var e = dst.entries[key];
                var e2 = src.entries[key];
                if (!e2) {
                    remove.push(key);
                    total++
                }
            });
            if (!total) {
                return callback(null)
            }
            var errored = false;
            var db = src.type === "remote" ? src.db : dst.db;
            var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readwrite");
            var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
            function done(err) {
                if (err && !errored) {
                    errored = true;
                    return callback(err)
                }
            }
            transaction.onerror = function(e) {
                done(this.error);
                e.preventDefault()
            }
            ;
            transaction.oncomplete = function(e) {
                if (!errored) {
                    callback(null)
                }
            }
            ;
            create.sort().forEach(function(path) {
                if (dst.type === "local") {
                    IDBFS.loadRemoteEntry(store, path, function(err, entry) {
                        if (err)
                            return done(err);
                        IDBFS.storeLocalEntry(path, entry, done)
                    })
                } else {
                    IDBFS.loadLocalEntry(path, function(err, entry) {
                        if (err)
                            return done(err);
                        IDBFS.storeRemoteEntry(store, path, entry, done)
                    })
                }
            });
            remove.sort().reverse().forEach(function(path) {
                if (dst.type === "local") {
                    IDBFS.removeLocalEntry(path, done)
                } else {
                    IDBFS.removeRemoteEntry(store, path, done)
                }
            })
        }
    };
    var NODEFS = {
        isWindows: false,
        staticInit: function() {
            NODEFS.isWindows = !!process.platform.match(/^win/);
            var flags = process["binding"]("constants");
            if (flags["fs"]) {
                flags = flags["fs"]
            }
            NODEFS.flagsForNodeMap = {
                1024: flags["O_APPEND"],
                64: flags["O_CREAT"],
                128: flags["O_EXCL"],
                0: flags["O_RDONLY"],
                2: flags["O_RDWR"],
                4096: flags["O_SYNC"],
                512: flags["O_TRUNC"],
                1: flags["O_WRONLY"]
            }
        },
        bufferFrom: function(arrayBuffer) {
            return Buffer.alloc ? Buffer.from(arrayBuffer) : new Buffer(arrayBuffer)
        },
        mount: function(mount) {
            assert(ENVIRONMENT_HAS_NODE);
            return NODEFS.createNode(null, "/", NODEFS.getMode(mount.opts.root), 0)
        },
        createNode: function(parent, name, mode, dev) {
            if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
                throw new FS.ErrnoError(22)
            }
            var node = FS.createNode(parent, name, mode);
            node.node_ops = NODEFS.node_ops;
            node.stream_ops = NODEFS.stream_ops;
            return node
        },
        getMode: function(path) {
            var stat;
            try {
                stat = fs.lstatSync(path);
                if (NODEFS.isWindows) {
                    stat.mode = stat.mode | (stat.mode & 292) >> 2
                }
            } catch (e) {
                if (!e.code)
                    throw e;
                throw new FS.ErrnoError(-e.errno)
            }
            return stat.mode
        },
        realPath: function(node) {
            var parts = [];
            while (node.parent !== node) {
                parts.push(node.name);
                node = node.parent
            }
            parts.push(node.mount.opts.root);
            parts.reverse();
            return PATH.join.apply(null, parts)
        },
        flagsForNode: function(flags) {
            flags &= ~2097152;
            flags &= ~2048;
            flags &= ~32768;
            flags &= ~524288;
            var newFlags = 0;
            for (var k in NODEFS.flagsForNodeMap) {
                if (flags & k) {
                    newFlags |= NODEFS.flagsForNodeMap[k];
                    flags ^= k
                }
            }
            if (!flags) {
                return newFlags
            } else {
                throw new FS.ErrnoError(22)
            }
        },
        node_ops: {
            getattr: function(node) {
                var path = NODEFS.realPath(node);
                var stat;
                try {
                    stat = fs.lstatSync(path)
                } catch (e) {
                    if (!e.code)
                        throw e;
                    throw new FS.ErrnoError(-e.errno)
                }
                if (NODEFS.isWindows && !stat.blksize) {
                    stat.blksize = 4096
                }
                if (NODEFS.isWindows && !stat.blocks) {
                    stat.blocks = (stat.size + stat.blksize - 1) / stat.blksize | 0
                }
                return {
                    dev: stat.dev,
                    ino: stat.ino,
                    mode: stat.mode,
                    nlink: stat.nlink,
                    uid: stat.uid,
                    gid: stat.gid,
                    rdev: stat.rdev,
                    size: stat.size,
                    atime: stat.atime,
                    mtime: stat.mtime,
                    ctime: stat.ctime,
                    blksize: stat.blksize,
                    blocks: stat.blocks
                }
            },
            setattr: function(node, attr) {
                var path = NODEFS.realPath(node);
                try {
                    if (attr.mode !== undefined) {
                        fs.chmodSync(path, attr.mode);
                        node.mode = attr.mode
                    }
                    if (attr.timestamp !== undefined) {
                        var date = new Date(attr.timestamp);
                        fs.utimesSync(path, date, date)
                    }
                    if (attr.size !== undefined) {
                        fs.truncateSync(path, attr.size)
                    }
                } catch (e) {
                    if (!e.code)
                        throw e;
                    throw new FS.ErrnoError(-e.errno)
                }
            },
            lookup: function(parent, name) {
                var path = PATH.join2(NODEFS.realPath(parent), name);
                var mode = NODEFS.getMode(path);
                return NODEFS.createNode(parent, name, mode)
            },
            mknod: function(parent, name, mode, dev) {
                var node = NODEFS.createNode(parent, name, mode, dev);
                var path = NODEFS.realPath(node);
                try {
                    if (FS.isDir(node.mode)) {
                        fs.mkdirSync(path, node.mode)
                    } else {
                        fs.writeFileSync(path, "", {
                            mode: node.mode
                        })
                    }
                } catch (e) {
                    if (!e.code)
                        throw e;
                    throw new FS.ErrnoError(-e.errno)
                }
                return node
            },
            rename: function(oldNode, newDir, newName) {
                var oldPath = NODEFS.realPath(oldNode);
                var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
                try {
                    fs.renameSync(oldPath, newPath)
                } catch (e) {
                    if (!e.code)
                        throw e;
                    throw new FS.ErrnoError(-e.errno)
                }
            },
            unlink: function(parent, name) {
                var path = PATH.join2(NODEFS.realPath(parent), name);
                try {
                    fs.unlinkSync(path)
                } catch (e) {
                    if (!e.code)
                        throw e;
                    throw new FS.ErrnoError(-e.errno)
                }
            },
            rmdir: function(parent, name) {
                var path = PATH.join2(NODEFS.realPath(parent), name);
                try {
                    fs.rmdirSync(path)
                } catch (e) {
                    if (!e.code)
                        throw e;
                    throw new FS.ErrnoError(-e.errno)
                }
            },
            readdir: function(node) {
                var path = NODEFS.realPath(node);
                try {
                    return fs.readdirSync(path)
                } catch (e) {
                    if (!e.code)
                        throw e;
                    throw new FS.ErrnoError(-e.errno)
                }
            },
            symlink: function(parent, newName, oldPath) {
                var newPath = PATH.join2(NODEFS.realPath(parent), newName);
                try {
                    fs.symlinkSync(oldPath, newPath)
                } catch (e) {
                    if (!e.code)
                        throw e;
                    throw new FS.ErrnoError(-e.errno)
                }
            },
            readlink: function(node) {
                var path = NODEFS.realPath(node);
                try {
                    path = fs.readlinkSync(path);
                    path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
                    return path
                } catch (e) {
                    if (!e.code)
                        throw e;
                    throw new FS.ErrnoError(-e.errno)
                }
            }
        },
        stream_ops: {
            open: function(stream) {
                var path = NODEFS.realPath(stream.node);
                try {
                    if (FS.isFile(stream.node.mode)) {
                        stream.nfd = fs.openSync(path, NODEFS.flagsForNode(stream.flags))
                    }
                } catch (e) {
                    if (!e.code)
                        throw e;
                    throw new FS.ErrnoError(-e.errno)
                }
            },
            close: function(stream) {
                try {
                    if (FS.isFile(stream.node.mode) && stream.nfd) {
                        fs.closeSync(stream.nfd)
                    }
                } catch (e) {
                    if (!e.code)
                        throw e;
                    throw new FS.ErrnoError(-e.errno)
                }
            },
            read: function(stream, buffer, offset, length, position) {
                if (length === 0)
                    return 0;
                try {
                    return fs.readSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position)
                } catch (e) {
                    throw new FS.ErrnoError(-e.errno)
                }
            },
            write: function(stream, buffer, offset, length, position) {
                try {
                    return fs.writeSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position)
                } catch (e) {
                    throw new FS.ErrnoError(-e.errno)
                }
            },
            llseek: function(stream, offset, whence) {
                var position = offset;
                if (whence === 1) {
                    position += stream.position
                } else if (whence === 2) {
                    if (FS.isFile(stream.node.mode)) {
                        try {
                            var stat = fs.fstatSync(stream.nfd);
                            position += stat.size
                        } catch (e) {
                            throw new FS.ErrnoError(-e.errno)
                        }
                    }
                }
                if (position < 0) {
                    throw new FS.ErrnoError(22)
                }
                return position
            }
        }
    };
    var WORKERFS = {
        DIR_MODE: 16895,
        FILE_MODE: 33279,
        reader: null,
        mount: function(mount) {
            assert(ENVIRONMENT_IS_WORKER);
            if (!WORKERFS.reader)
                WORKERFS.reader = new FileReaderSync;
            var root = WORKERFS.createNode(null, "/", WORKERFS.DIR_MODE, 0);
            var createdParents = {};
            function ensureParent(path) {
                var parts = path.split("/");
                var parent = root;
                for (var i = 0; i < parts.length - 1; i++) {
                    var curr = parts.slice(0, i + 1).join("/");
                    if (!createdParents[curr]) {
                        createdParents[curr] = WORKERFS.createNode(parent, parts[i], WORKERFS.DIR_MODE, 0)
                    }
                    parent = createdParents[curr]
                }
                return parent
            }
            function base(path) {
                var parts = path.split("/");
                return parts[parts.length - 1]
            }
            Array.prototype.forEach.call(mount.opts["files"] || [], function(file) {
                WORKERFS.createNode(ensureParent(file.name), base(file.name), WORKERFS.FILE_MODE, 0, file, file.lastModifiedDate)
            });
            (mount.opts["blobs"] || []).forEach(function(obj) {
                WORKERFS.createNode(ensureParent(obj["name"]), base(obj["name"]), WORKERFS.FILE_MODE, 0, obj["data"])
            });
            (mount.opts["packages"] || []).forEach(function(pack) {
                pack["metadata"].files.forEach(function(file) {
                    var name = file.filename.substr(1);
                    WORKERFS.createNode(ensureParent(name), base(name), WORKERFS.FILE_MODE, 0, pack["blob"].slice(file.start, file.end))
                })
            });
            return root
        },
        createNode: function(parent, name, mode, dev, contents, mtime) {
            var node = FS.createNode(parent, name, mode);
            node.mode = mode;
            node.node_ops = WORKERFS.node_ops;
            node.stream_ops = WORKERFS.stream_ops;
            node.timestamp = (mtime || new Date).getTime();
            assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE);
            if (mode === WORKERFS.FILE_MODE) {
                node.size = contents.size;
                node.contents = contents
            } else {
                node.size = 4096;
                node.contents = {}
            }
            if (parent) {
                parent.contents[name] = node
            }
            return node
        },
        node_ops: {
            getattr: function(node) {
                return {
                    dev: 1,
                    ino: undefined,
                    mode: node.mode,
                    nlink: 1,
                    uid: 0,
                    gid: 0,
                    rdev: undefined,
                    size: node.size,
                    atime: new Date(node.timestamp),
                    mtime: new Date(node.timestamp),
                    ctime: new Date(node.timestamp),
                    blksize: 4096,
                    blocks: Math.ceil(node.size / 4096)
                }
            },
            setattr: function(node, attr) {
                if (attr.mode !== undefined) {
                    node.mode = attr.mode
                }
                if (attr.timestamp !== undefined) {
                    node.timestamp = attr.timestamp
                }
            },
            lookup: function(parent, name) {
                throw new FS.ErrnoError(2)
            },
            mknod: function(parent, name, mode, dev) {
                throw new FS.ErrnoError(1)
            },
            rename: function(oldNode, newDir, newName) {
                throw new FS.ErrnoError(1)
            },
            unlink: function(parent, name) {
                throw new FS.ErrnoError(1)
            },
            rmdir: function(parent, name) {
                throw new FS.ErrnoError(1)
            },
            readdir: function(node) {
                var entries = [".", ".."];
                for (var key in node.contents) {
                    if (!node.contents.hasOwnProperty(key)) {
                        continue
                    }
                    entries.push(key)
                }
                return entries
            },
            symlink: function(parent, newName, oldPath) {
                throw new FS.ErrnoError(1)
            },
            readlink: function(node) {
                throw new FS.ErrnoError(1)
            }
        },
        stream_ops: {
            read: function(stream, buffer, offset, length, position) {
                if (position >= stream.node.size)
                    return 0;
                var chunk = stream.node.contents.slice(position, position + length);
                var ab = WORKERFS.reader.readAsArrayBuffer(chunk);
                buffer.set(new Uint8Array(ab), offset);
                return chunk.size
            },
            write: function(stream, buffer, offset, length, position) {
                throw new FS.ErrnoError(5)
            },
            llseek: function(stream, offset, whence) {
                var position = offset;
                if (whence === 1) {
                    position += stream.position
                } else if (whence === 2) {
                    if (FS.isFile(stream.node.mode)) {
                        position += stream.node.size
                    }
                }
                if (position < 0) {
                    throw new FS.ErrnoError(22)
                }
                return position
            }
        }
    };
    var ERRNO_MESSAGES = {
        0: "Success",
        1: "Not super-user",
        2: "No such file or directory",
        3: "No such process",
        4: "Interrupted system call",
        5: "I/O error",
        6: "No such device or address",
        7: "Arg list too long",
        8: "Exec format error",
        9: "Bad file number",
        10: "No children",
        11: "No more processes",
        12: "Not enough core",
        13: "Permission denied",
        14: "Bad address",
        15: "Block device required",
        16: "Mount device busy",
        17: "File exists",
        18: "Cross-device link",
        19: "No such device",
        20: "Not a directory",
        21: "Is a directory",
        22: "Invalid argument",
        23: "Too many open files in system",
        24: "Too many open files",
        25: "Not a typewriter",
        26: "Text file busy",
        27: "File too large",
        28: "No space left on device",
        29: "Illegal seek",
        30: "Read only file system",
        31: "Too many links",
        32: "Broken pipe",
        33: "Math arg out of domain of func",
        34: "Math result not representable",
        35: "File locking deadlock error",
        36: "File or path name too long",
        37: "No record locks available",
        38: "Function not implemented",
        39: "Directory not empty",
        40: "Too many symbolic links",
        42: "No message of desired type",
        43: "Identifier removed",
        44: "Channel number out of range",
        45: "Level 2 not synchronized",
        46: "Level 3 halted",
        47: "Level 3 reset",
        48: "Link number out of range",
        49: "Protocol driver not attached",
        50: "No CSI structure available",
        51: "Level 2 halted",
        52: "Invalid exchange",
        53: "Invalid request descriptor",
        54: "Exchange full",
        55: "No anode",
        56: "Invalid request code",
        57: "Invalid slot",
        59: "Bad font file fmt",
        60: "Device not a stream",
        61: "No data (for no delay io)",
        62: "Timer expired",
        63: "Out of streams resources",
        64: "Machine is not on the network",
        65: "Package not installed",
        66: "The object is remote",
        67: "The link has been severed",
        68: "Advertise error",
        69: "Srmount error",
        70: "Communication error on send",
        71: "Protocol error",
        72: "Multihop attempted",
        73: "Cross mount point (not really error)",
        74: "Trying to read unreadable message",
        75: "Value too large for defined data type",
        76: "Given log. name not unique",
        77: "f.d. invalid for this operation",
        78: "Remote address changed",
        79: "Can   access a needed shared lib",
        80: "Accessing a corrupted shared lib",
        81: ".lib section in a.out corrupted",
        82: "Attempting to link in too many libs",
        83: "Attempting to exec a shared library",
        84: "Illegal byte sequence",
        86: "Streams pipe error",
        87: "Too many users",
        88: "Socket operation on non-socket",
        89: "Destination address required",
        90: "Message too long",
        91: "Protocol wrong type for socket",
        92: "Protocol not available",
        93: "Unknown protocol",
        94: "Socket type not supported",
        95: "Not supported",
        96: "Protocol family not supported",
        97: "Address family not supported by protocol family",
        98: "Address already in use",
        99: "Address not available",
        100: "Network interface is not configured",
        101: "Network is unreachable",
        102: "Connection reset by network",
        103: "Connection aborted",
        104: "Connection reset by peer",
        105: "No buffer space available",
        106: "Socket is already connected",
        107: "Socket is not connected",
        108: "Can't send after socket shutdown",
        109: "Too many references",
        110: "Connection timed out",
        111: "Connection refused",
        112: "Host is down",
        113: "Host is unreachable",
        114: "Socket already connected",
        115: "Connection already in progress",
        116: "Stale file handle",
        122: "Quota exceeded",
        123: "No medium (in tape drive)",
        125: "Operation canceled",
        130: "Previous owner died",
        131: "State not recoverable"
    };
    var ERRNO_CODES = {
        EPERM: 1,
        ENOENT: 2,
        ESRCH: 3,
        EINTR: 4,
        EIO: 5,
        ENXIO: 6,
        E2BIG: 7,
        ENOEXEC: 8,
        EBADF: 9,
        ECHILD: 10,
        EAGAIN: 11,
        EWOULDBLOCK: 11,
        ENOMEM: 12,
        EACCES: 13,
        EFAULT: 14,
        ENOTBLK: 15,
        EBUSY: 16,
        EEXIST: 17,
        EXDEV: 18,
        ENODEV: 19,
        ENOTDIR: 20,
        EISDIR: 21,
        EINVAL: 22,
        ENFILE: 23,
        EMFILE: 24,
        ENOTTY: 25,
        ETXTBSY: 26,
        EFBIG: 27,
        ENOSPC: 28,
        ESPIPE: 29,
        EROFS: 30,
        EMLINK: 31,
        EPIPE: 32,
        EDOM: 33,
        ERANGE: 34,
        ENOMSG: 42,
        EIDRM: 43,
        ECHRNG: 44,
        EL2NSYNC: 45,
        EL3HLT: 46,
        EL3RST: 47,
        ELNRNG: 48,
        EUNATCH: 49,
        ENOCSI: 50,
        EL2HLT: 51,
        EDEADLK: 35,
        ENOLCK: 37,
        EBADE: 52,
        EBADR: 53,
        EXFULL: 54,
        ENOANO: 55,
        EBADRQC: 56,
        EBADSLT: 57,
        EDEADLOCK: 35,
        EBFONT: 59,
        ENOSTR: 60,
        ENODATA: 61,
        ETIME: 62,
        ENOSR: 63,
        ENONET: 64,
        ENOPKG: 65,
        EREMOTE: 66,
        ENOLINK: 67,
        EADV: 68,
        ESRMNT: 69,
        ECOMM: 70,
        EPROTO: 71,
        EMULTIHOP: 72,
        EDOTDOT: 73,
        EBADMSG: 74,
        ENOTUNIQ: 76,
        EBADFD: 77,
        EREMCHG: 78,
        ELIBACC: 79,
        ELIBBAD: 80,
        ELIBSCN: 81,
        ELIBMAX: 82,
        ELIBEXEC: 83,
        ENOSYS: 38,
        ENOTEMPTY: 39,
        ENAMETOOLONG: 36,
        ELOOP: 40,
        EOPNOTSUPP: 95,
        EPFNOSUPPORT: 96,
        ECONNRESET: 104,
        ENOBUFS: 105,
        EAFNOSUPPORT: 97,
        EPROTOTYPE: 91,
        ENOTSOCK: 88,
        ENOPROTOOPT: 92,
        ESHUTDOWN: 108,
        ECONNREFUSED: 111,
        EADDRINUSE: 98,
        ECONNABORTED: 103,
        ENETUNREACH: 101,
        ENETDOWN: 100,
        ETIMEDOUT: 110,
        EHOSTDOWN: 112,
        EHOSTUNREACH: 113,
        EINPROGRESS: 115,
        EALREADY: 114,
        EDESTADDRREQ: 89,
        EMSGSIZE: 90,
        EPROTONOSUPPORT: 93,
        ESOCKTNOSUPPORT: 94,
        EADDRNOTAVAIL: 99,
        ENETRESET: 102,
        EISCONN: 106,
        ENOTCONN: 107,
        ETOOMANYREFS: 109,
        EUSERS: 87,
        EDQUOT: 122,
        ESTALE: 116,
        ENOTSUP: 95,
        ENOMEDIUM: 123,
        EILSEQ: 84,
        EOVERFLOW: 75,
        ECANCELED: 125,
        ENOTRECOVERABLE: 131,
        EOWNERDEAD: 130,
        ESTRPIPE: 86
    };
    var FS = {
        root: null,
        mounts: [],
        devices: {},
        streams: [],
        nextInode: 1,
        nameTable: null,
        currentPath: "/",
        initialized: false,
        ignorePermissions: true,
        trackingDelegate: {},
        tracking: {
            openFlags: {
                READ: 1,
                WRITE: 2
            }
        },
        ErrnoError: null,
        genericErrors: {},
        filesystems: null,
        syncFSRequests: 0,
        handleFSError: function(e) {
            if (!(e instanceof FS.ErrnoError))
                throw e + " : " + stackTrace();
            return ___setErrNo(e.errno)
        },
        lookupPath: function(path, opts) {
            path = PATH_FS.resolve(FS.cwd(), path);
            opts = opts || {};
            if (!path)
                return {
                    path: "",
                    node: null
                };
            var defaults = {
                follow_mount: true,
                recurse_count: 0
            };
            for (var key in defaults) {
                if (opts[key] === undefined) {
                    opts[key] = defaults[key]
                }
            }
            if (opts.recurse_count > 8) {
                throw new FS.ErrnoError(40)
            }
            var parts = PATH.normalizeArray(path.split("/").filter(function(p) {
                return !!p
            }), false);
            var current = FS.root;
            var current_path = "/";
            for (var i = 0; i < parts.length; i++) {
                var islast = i === parts.length - 1;
                if (islast && opts.parent) {
                    break
                }
                current = FS.lookupNode(current, parts[i]);
                current_path = PATH.join2(current_path, parts[i]);
                if (FS.isMountpoint(current)) {
                    if (!islast || islast && opts.follow_mount) {
                        current = current.mounted.root
                    }
                }
                if (!islast || opts.follow) {
                    var count = 0;
                    while (FS.isLink(current.mode)) {
                        var link = FS.readlink(current_path);
                        current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
                        var lookup = FS.lookupPath(current_path, {
                            recurse_count: opts.recurse_count
                        });
                        current = lookup.node;
                        if (count++ > 40) {
                            throw new FS.ErrnoError(40)
                        }
                    }
                }
            }
            return {
                path: current_path,
                node: current
            }
        },
        getPath: function(node) {
            var path;
            while (true) {
                if (FS.isRoot(node)) {
                    var mount = node.mount.mountpoint;
                    if (!path)
                        return mount;
                    return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path
                }
                path = path ? node.name + "/" + path : node.name;
                node = node.parent
            }
        },
        hashName: function(parentid, name) {
            var hash = 0;
            for (var i = 0; i < name.length; i++) {
                hash = (hash << 5) - hash + name.charCodeAt(i) | 0
            }
            return (parentid + hash >>> 0) % FS.nameTable.length
        },
        hashAddNode: function(node) {
            var hash = FS.hashName(node.parent.id, node.name);
            node.name_next = FS.nameTable[hash];
            FS.nameTable[hash] = node
        },
        hashRemoveNode: function(node) {
            var hash = FS.hashName(node.parent.id, node.name);
            if (FS.nameTable[hash] === node) {
                FS.nameTable[hash] = node.name_next
            } else {
                var current = FS.nameTable[hash];
                while (current) {
                    if (current.name_next === node) {
                        current.name_next = node.name_next;
                        break
                    }
                    current = current.name_next
                }
            }
        },
        lookupNode: function(parent, name) {
            var err = FS.mayLookup(parent);
            if (err) {
                throw new FS.ErrnoError(err,parent)
            }
            var hash = FS.hashName(parent.id, name);
            for (var node = FS.nameTable[hash]; node; node = node.name_next) {
                var nodeName = node.name;
                if (node.parent.id === parent.id && nodeName === name) {
                    return node
                }
            }
            return FS.lookup(parent, name)
        },
        createNode: function(parent, name, mode, rdev) {
            if (!FS.FSNode) {
                FS.FSNode = function(parent, name, mode, rdev) {
                    if (!parent) {
                        parent = this
                    }
                    this.parent = parent;
                    this.mount = parent.mount;
                    this.mounted = null;
                    this.id = FS.nextInode++;
                    this.name = name;
                    this.mode = mode;
                    this.node_ops = {};
                    this.stream_ops = {};
                    this.rdev = rdev
                }
                ;
                FS.FSNode.prototype = {};
                var readMode = 292 | 73;
                var writeMode = 146;
                Object.defineProperties(FS.FSNode.prototype, {
                    read: {
                        get: function() {
                            return (this.mode & readMode) === readMode
                        },
                        set: function(val) {
                            val ? this.mode |= readMode : this.mode &= ~readMode
                        }
                    },
                    write: {
                        get: function() {
                            return (this.mode & writeMode) === writeMode
                        },
                        set: function(val) {
                            val ? this.mode |= writeMode : this.mode &= ~writeMode
                        }
                    },
                    isFolder: {
                        get: function() {
                            return FS.isDir(this.mode)
                        }
                    },
                    isDevice: {
                        get: function() {
                            return FS.isChrdev(this.mode)
                        }
                    }
                })
            }
            var node = new FS.FSNode(parent,name,mode,rdev);
            FS.hashAddNode(node);
            return node
        },
        destroyNode: function(node) {
            FS.hashRemoveNode(node)
        },
        isRoot: function(node) {
            return node === node.parent
        },
        isMountpoint: function(node) {
            return !!node.mounted
        },
        isFile: function(mode) {
            return (mode & 61440) === 32768
        },
        isDir: function(mode) {
            return (mode & 61440) === 16384
        },
        isLink: function(mode) {
            return (mode & 61440) === 40960
        },
        isChrdev: function(mode) {
            return (mode & 61440) === 8192
        },
        isBlkdev: function(mode) {
            return (mode & 61440) === 24576
        },
        isFIFO: function(mode) {
            return (mode & 61440) === 4096
        },
        isSocket: function(mode) {
            return (mode & 49152) === 49152
        },
        flagModes: {
            "r": 0,
            "rs": 1052672,
            "r+": 2,
            "w": 577,
            "wx": 705,
            "xw": 705,
            "w+": 578,
            "wx+": 706,
            "xw+": 706,
            "a": 1089,
            "ax": 1217,
            "xa": 1217,
            "a+": 1090,
            "ax+": 1218,
            "xa+": 1218
        },
        modeStringToFlags: function(str) {
            var flags = FS.flagModes[str];
            if (typeof flags === "undefined") {
                throw new Error("Unknown file open mode: " + str)
            }
            return flags
        },
        flagsToPermissionString: function(flag) {
            var perms = ["r", "w", "rw"][flag & 3];
            if (flag & 512) {
                perms += "w"
            }
            return perms
        },
        nodePermissions: function(node, perms) {
            if (FS.ignorePermissions) {
                return 0
            }
            if (perms.indexOf("r") !== -1 && !(node.mode & 292)) {
                return 13
            } else if (perms.indexOf("w") !== -1 && !(node.mode & 146)) {
                return 13
            } else if (perms.indexOf("x") !== -1 && !(node.mode & 73)) {
                return 13
            }
            return 0
        },
        mayLookup: function(dir) {
            var err = FS.nodePermissions(dir, "x");
            if (err)
                return err;
            if (!dir.node_ops.lookup)
                return 13;
            return 0
        },
        mayCreate: function(dir, name) {
            try {
                var node = FS.lookupNode(dir, name);
                return 17
            } catch (e) {}
            return FS.nodePermissions(dir, "wx")
        },
        mayDelete: function(dir, name, isdir) {
            var node;
            try {
                node = FS.lookupNode(dir, name)
            } catch (e) {
                return e.errno
            }
            var err = FS.nodePermissions(dir, "wx");
            if (err) {
                return err
            }
            if (isdir) {
                if (!FS.isDir(node.mode)) {
                    return 20
                }
                if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                    return 16
                }
            } else {
                if (FS.isDir(node.mode)) {
                    return 21
                }
            }
            return 0
        },
        mayOpen: function(node, flags) {
            if (!node) {
                return 2
            }
            if (FS.isLink(node.mode)) {
                return 40
            } else if (FS.isDir(node.mode)) {
                if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
                    return 21
                }
            }
            return FS.nodePermissions(node, FS.flagsToPermissionString(flags))
        },
        MAX_OPEN_FDS: 4096,
        nextfd: function(fd_start, fd_end) {
            fd_start = fd_start || 0;
            fd_end = fd_end || FS.MAX_OPEN_FDS;
            for (var fd = fd_start; fd <= fd_end; fd++) {
                if (!FS.streams[fd]) {
                    return fd
                }
            }
            throw new FS.ErrnoError(24)
        },
        getStream: function(fd) {
            return FS.streams[fd]
        },
        createStream: function(stream, fd_start, fd_end) {
            if (!FS.FSStream) {
                FS.FSStream = function() {}
                ;
                FS.FSStream.prototype = {};
                Object.defineProperties(FS.FSStream.prototype, {
                    object: {
                        get: function() {
                            return this.node
                        },
                        set: function(val) {
                            this.node = val
                        }
                    },
                    isRead: {
                        get: function() {
                            return (this.flags & 2097155) !== 1
                        }
                    },
                    isWrite: {
                        get: function() {
                            return (this.flags & 2097155) !== 0
                        }
                    },
                    isAppend: {
                        get: function() {
                            return this.flags & 1024
                        }
                    }
                })
            }
            var newStream = new FS.FSStream;
            for (var p in stream) {
                newStream[p] = stream[p]
            }
            stream = newStream;
            var fd = FS.nextfd(fd_start, fd_end);
            stream.fd = fd;
            FS.streams[fd] = stream;
            return stream
        },
        closeStream: function(fd) {
            FS.streams[fd] = null
        },
        chrdev_stream_ops: {
            open: function(stream) {
                var device = FS.getDevice(stream.node.rdev);
                stream.stream_ops = device.stream_ops;
                if (stream.stream_ops.open) {
                    stream.stream_ops.open(stream)
                }
            },
            llseek: function() {
                throw new FS.ErrnoError(29)
            }
        },
        major: function(dev) {
            return dev >> 8
        },
        minor: function(dev) {
            return dev & 255
        },
        makedev: function(ma, mi) {
            return ma << 8 | mi
        },
        registerDevice: function(dev, ops) {
            FS.devices[dev] = {
                stream_ops: ops
            }
        },
        getDevice: function(dev) {
            return FS.devices[dev]
        },
        getMounts: function(mount) {
            var mounts = [];
            var check = [mount];
            while (check.length) {
                var m = check.pop();
                mounts.push(m);
                check.push.apply(check, m.mounts)
            }
            return mounts
        },
        syncfs: function(populate, callback) {
            if (typeof populate === "function") {
                callback = populate;
                populate = false
            }
            FS.syncFSRequests++;
            if (FS.syncFSRequests > 1) {
                console.log("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work")
            }
            var mounts = FS.getMounts(FS.root.mount);
            var completed = 0;
            function doCallback(err) {
                assert(FS.syncFSRequests > 0);
                FS.syncFSRequests--;
                return callback(err)
            }
            function done(err) {
                if (err) {
                    if (!done.errored) {
                        done.errored = true;
                        return doCallback(err)
                    }
                    return
                }
                if (++completed >= mounts.length) {
                    doCallback(null)
                }
            }
            mounts.forEach(function(mount) {
                if (!mount.type.syncfs) {
                    return done(null)
                }
                mount.type.syncfs(mount, populate, done)
            })
        },
        mount: function(type, opts, mountpoint) {
            var root = mountpoint === "/";
            var pseudo = !mountpoint;
            var node;
            if (root && FS.root) {
                throw new FS.ErrnoError(16)
            } else if (!root && !pseudo) {
                var lookup = FS.lookupPath(mountpoint, {
                    follow_mount: false
                });
                mountpoint = lookup.path;
                node = lookup.node;
                if (FS.isMountpoint(node)) {
                    throw new FS.ErrnoError(16)
                }
                if (!FS.isDir(node.mode)) {
                    throw new FS.ErrnoError(20)
                }
            }
            var mount = {
                type: type,
                opts: opts,
                mountpoint: mountpoint,
                mounts: []
            };
            var mountRoot = type.mount(mount);
            mountRoot.mount = mount;
            mount.root = mountRoot;
            if (root) {
                FS.root = mountRoot
            } else if (node) {
                node.mounted = mount;
                if (node.mount) {
                    node.mount.mounts.push(mount)
                }
            }
            return mountRoot
        },
        unmount: function(mountpoint) {
            var lookup = FS.lookupPath(mountpoint, {
                follow_mount: false
            });
            if (!FS.isMountpoint(lookup.node)) {
                throw new FS.ErrnoError(22)
            }
            var node = lookup.node;
            var mount = node.mounted;
            var mounts = FS.getMounts(mount);
            Object.keys(FS.nameTable).forEach(function(hash) {
                var current = FS.nameTable[hash];
                while (current) {
                    var next = current.name_next;
                    if (mounts.indexOf(current.mount) !== -1) {
                        FS.destroyNode(current)
                    }
                    current = next
                }
            });
            node.mounted = null;
            var idx = node.mount.mounts.indexOf(mount);
            assert(idx !== -1);
            node.mount.mounts.splice(idx, 1)
        },
        lookup: function(parent, name) {
            return parent.node_ops.lookup(parent, name)
        },
        mknod: function(path, mode, dev) {
            var lookup = FS.lookupPath(path, {
                parent: true
            });
            var parent = lookup.node;
            var name = PATH.basename(path);
            if (!name || name === "." || name === "..") {
                throw new FS.ErrnoError(22)
            }
            var err = FS.mayCreate(parent, name);
            if (err) {
                throw new FS.ErrnoError(err)
            }
            if (!parent.node_ops.mknod) {
                throw new FS.ErrnoError(1)
            }
            return parent.node_ops.mknod(parent, name, mode, dev)
        },
        create: function(path, mode) {
            mode = mode !== undefined ? mode : 438;
            mode &= 4095;
            mode |= 32768;
            return FS.mknod(path, mode, 0)
        },
        mkdir: function(path, mode) {
            mode = mode !== undefined ? mode : 511;
            mode &= 511 | 512;
            mode |= 16384;
            return FS.mknod(path, mode, 0)
        },
        mkdirTree: function(path, mode) {
            var dirs = path.split("/");
            var d = "";
            for (var i = 0; i < dirs.length; ++i) {
                if (!dirs[i])
                    continue;
                d += "/" + dirs[i];
                try {
                    FS.mkdir(d, mode)
                } catch (e) {
                    if (e.errno != 17)
                        throw e
                }
            }
        },
        mkdev: function(path, mode, dev) {
            if (typeof dev === "undefined") {
                dev = mode;
                mode = 438
            }
            mode |= 8192;
            return FS.mknod(path, mode, dev)
        },
        symlink: function(oldpath, newpath) {
            if (!PATH_FS.resolve(oldpath)) {
                throw new FS.ErrnoError(2)
            }
            var lookup = FS.lookupPath(newpath, {
                parent: true
            });
            var parent = lookup.node;
            if (!parent) {
                throw new FS.ErrnoError(2)
            }
            var newname = PATH.basename(newpath);
            var err = FS.mayCreate(parent, newname);
            if (err) {
                throw new FS.ErrnoError(err)
            }
            if (!parent.node_ops.symlink) {
                throw new FS.ErrnoError(1)
            }
            return parent.node_ops.symlink(parent, newname, oldpath)
        },
        rename: function(old_path, new_path) {
            var old_dirname = PATH.dirname(old_path);
            var new_dirname = PATH.dirname(new_path);
            var old_name = PATH.basename(old_path);
            var new_name = PATH.basename(new_path);
            var lookup, old_dir, new_dir;
            try {
                lookup = FS.lookupPath(old_path, {
                    parent: true
                });
                old_dir = lookup.node;
                lookup = FS.lookupPath(new_path, {
                    parent: true
                });
                new_dir = lookup.node
            } catch (e) {
                throw new FS.ErrnoError(16)
            }
            if (!old_dir || !new_dir)
                throw new FS.ErrnoError(2);
            if (old_dir.mount !== new_dir.mount) {
                throw new FS.ErrnoError(18)
            }
            var old_node = FS.lookupNode(old_dir, old_name);
            var relative = PATH_FS.relative(old_path, new_dirname);
            if (relative.charAt(0) !== ".") {
                throw new FS.ErrnoError(22)
            }
            relative = PATH_FS.relative(new_path, old_dirname);
            if (relative.charAt(0) !== ".") {
                throw new FS.ErrnoError(39)
            }
            var new_node;
            try {
                new_node = FS.lookupNode(new_dir, new_name)
            } catch (e) {}
            if (old_node === new_node) {
                return
            }
            var isdir = FS.isDir(old_node.mode);
            var err = FS.mayDelete(old_dir, old_name, isdir);
            if (err) {
                throw new FS.ErrnoError(err)
            }
            err = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
            if (err) {
                throw new FS.ErrnoError(err)
            }
            if (!old_dir.node_ops.rename) {
                throw new FS.ErrnoError(1)
            }
            if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
                throw new FS.ErrnoError(16)
            }
            if (new_dir !== old_dir) {
                err = FS.nodePermissions(old_dir, "w");
                if (err) {
                    throw new FS.ErrnoError(err)
                }
            }
            try {
                if (FS.trackingDelegate["willMovePath"]) {
                    FS.trackingDelegate["willMovePath"](old_path, new_path)
                }
            } catch (e) {
                console.log("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
            }
            FS.hashRemoveNode(old_node);
            try {
                old_dir.node_ops.rename(old_node, new_dir, new_name)
            } catch (e) {
                throw e
            } finally {
                FS.hashAddNode(old_node)
            }
            try {
                if (FS.trackingDelegate["onMovePath"])
                    FS.trackingDelegate["onMovePath"](old_path, new_path)
            } catch (e) {
                console.log("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
            }
        },
        rmdir: function(path) {
            var lookup = FS.lookupPath(path, {
                parent: true
            });
            var parent = lookup.node;
            var name = PATH.basename(path);
            var node = FS.lookupNode(parent, name);
            var err = FS.mayDelete(parent, name, true);
            if (err) {
                throw new FS.ErrnoError(err)
            }
            if (!parent.node_ops.rmdir) {
                throw new FS.ErrnoError(1)
            }
            if (FS.isMountpoint(node)) {
                throw new FS.ErrnoError(16)
            }
            try {
                if (FS.trackingDelegate["willDeletePath"]) {
                    FS.trackingDelegate["willDeletePath"](path)
                }
            } catch (e) {
                console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
            }
            parent.node_ops.rmdir(parent, name);
            FS.destroyNode(node);
            try {
                if (FS.trackingDelegate["onDeletePath"])
                    FS.trackingDelegate["onDeletePath"](path)
            } catch (e) {
                console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
            }
        },
        readdir: function(path) {
            var lookup = FS.lookupPath(path, {
                follow: true
            });
            var node = lookup.node;
            if (!node.node_ops.readdir) {
                throw new FS.ErrnoError(20)
            }
            return node.node_ops.readdir(node)
        },
        unlink: function(path) {
            var lookup = FS.lookupPath(path, {
                parent: true
            });
            var parent = lookup.node;
            var name = PATH.basename(path);
            var node = FS.lookupNode(parent, name);
            var err = FS.mayDelete(parent, name, false);
            if (err) {
                throw new FS.ErrnoError(err)
            }
            if (!parent.node_ops.unlink) {
                throw new FS.ErrnoError(1)
            }
            if (FS.isMountpoint(node)) {
                throw new FS.ErrnoError(16)
            }
            try {
                if (FS.trackingDelegate["willDeletePath"]) {
                    FS.trackingDelegate["willDeletePath"](path)
                }
            } catch (e) {
                console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
            }
            parent.node_ops.unlink(parent, name);
            FS.destroyNode(node);
            try {
                if (FS.trackingDelegate["onDeletePath"])
                    FS.trackingDelegate["onDeletePath"](path)
            } catch (e) {
                console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
            }
        },
        readlink: function(path) {
            var lookup = FS.lookupPath(path);
            var link = lookup.node;
            if (!link) {
                throw new FS.ErrnoError(2)
            }
            if (!link.node_ops.readlink) {
                throw new FS.ErrnoError(22)
            }
            return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link))
        },
        stat: function(path, dontFollow) {
            var lookup = FS.lookupPath(path, {
                follow: !dontFollow
            });
            var node = lookup.node;
            if (!node) {
                throw new FS.ErrnoError(2)
            }
            if (!node.node_ops.getattr) {
                throw new FS.ErrnoError(1)
            }
            return node.node_ops.getattr(node)
        },
        lstat: function(path) {
            return FS.stat(path, true)
        },
        chmod: function(path, mode, dontFollow) {
            var node;
            if (typeof path === "string") {
                var lookup = FS.lookupPath(path, {
                    follow: !dontFollow
                });
                node = lookup.node
            } else {
                node = path
            }
            if (!node.node_ops.setattr) {
                throw new FS.ErrnoError(1)
            }
            node.node_ops.setattr(node, {
                mode: mode & 4095 | node.mode & ~4095,
                timestamp: Date.now()
            })
        },
        lchmod: function(path, mode) {
            FS.chmod(path, mode, true)
        },
        fchmod: function(fd, mode) {
            var stream = FS.getStream(fd);
            if (!stream) {
                throw new FS.ErrnoError(9)
            }
            FS.chmod(stream.node, mode)
        },
        chown: function(path, uid, gid, dontFollow) {
            var node;
            if (typeof path === "string") {
                var lookup = FS.lookupPath(path, {
                    follow: !dontFollow
                });
                node = lookup.node
            } else {
                node = path
            }
            if (!node.node_ops.setattr) {
                throw new FS.ErrnoError(1)
            }
            node.node_ops.setattr(node, {
                timestamp: Date.now()
            })
        },
        lchown: function(path, uid, gid) {
            FS.chown(path, uid, gid, true)
        },
        fchown: function(fd, uid, gid) {
            var stream = FS.getStream(fd);
            if (!stream) {
                throw new FS.ErrnoError(9)
            }
            FS.chown(stream.node, uid, gid)
        },
        truncate: function(path, len) {
            if (len < 0) {
                throw new FS.ErrnoError(22)
            }
            var node;
            if (typeof path === "string") {
                var lookup = FS.lookupPath(path, {
                    follow: true
                });
                node = lookup.node
            } else {
                node = path
            }
            if (!node.node_ops.setattr) {
                throw new FS.ErrnoError(1)
            }
            if (FS.isDir(node.mode)) {
                throw new FS.ErrnoError(21)
            }
            if (!FS.isFile(node.mode)) {
                throw new FS.ErrnoError(22)
            }
            var err = FS.nodePermissions(node, "w");
            if (err) {
                throw new FS.ErrnoError(err)
            }
            node.node_ops.setattr(node, {
                size: len,
                timestamp: Date.now()
            })
        },
        ftruncate: function(fd, len) {
            var stream = FS.getStream(fd);
            if (!stream) {
                throw new FS.ErrnoError(9)
            }
            if ((stream.flags & 2097155) === 0) {
                throw new FS.ErrnoError(22)
            }
            FS.truncate(stream.node, len)
        },
        utime: function(path, atime, mtime) {
            var lookup = FS.lookupPath(path, {
                follow: true
            });
            var node = lookup.node;
            node.node_ops.setattr(node, {
                timestamp: Math.max(atime, mtime)
            })
        },
        open: function(path, flags, mode, fd_start, fd_end) {
            if (path === "") {
                throw new FS.ErrnoError(2)
            }
            flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
            mode = typeof mode === "undefined" ? 438 : mode;
            if (flags & 64) {
                mode = mode & 4095 | 32768
            } else {
                mode = 0
            }
            var node;
            if (typeof path === "object") {
                node = path
            } else {
                path = PATH.normalize(path);
                try {
                    var lookup = FS.lookupPath(path, {
                        follow: !(flags & 131072)
                    });
                    node = lookup.node
                } catch (e) {}
            }
            var created = false;
            if (flags & 64) {
                if (node) {
                    if (flags & 128) {
                        throw new FS.ErrnoError(17)
                    }
                } else {
                    node = FS.mknod(path, mode, 0);
                    created = true
                }
            }
            if (!node) {
                throw new FS.ErrnoError(2)
            }
            if (FS.isChrdev(node.mode)) {
                flags &= ~512
            }
            if (flags & 65536 && !FS.isDir(node.mode)) {
                throw new FS.ErrnoError(20)
            }
            if (!created) {
                var err = FS.mayOpen(node, flags);
                if (err) {
                    throw new FS.ErrnoError(err)
                }
            }
            if (flags & 512) {
                FS.truncate(node, 0)
            }
            flags &= ~(128 | 512);
            var stream = FS.createStream({
                node: node,
                path: FS.getPath(node),
                flags: flags,
                seekable: true,
                position: 0,
                stream_ops: node.stream_ops,
                ungotten: [],
                error: false
            }, fd_start, fd_end);
            if (stream.stream_ops.open) {
                stream.stream_ops.open(stream)
            }
            if (Module["logReadFiles"] && !(flags & 1)) {
                if (!FS.readFiles)
                    FS.readFiles = {};
                if (!(path in FS.readFiles)) {
                    FS.readFiles[path] = 1;
                    console.log("FS.trackingDelegate error on read file: " + path)
                }
            }
            try {
                if (FS.trackingDelegate["onOpenFile"]) {
                    var trackingFlags = 0;
                    if ((flags & 2097155) !== 1) {
                        trackingFlags |= FS.tracking.openFlags.READ
                    }
                    if ((flags & 2097155) !== 0) {
                        trackingFlags |= FS.tracking.openFlags.WRITE
                    }
                    FS.trackingDelegate["onOpenFile"](path, trackingFlags)
                }
            } catch (e) {
                console.log("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message)
            }
            return stream
        },
        close: function(stream) {
            if (FS.isClosed(stream)) {
                throw new FS.ErrnoError(9)
            }
            if (stream.getdents)
                stream.getdents = null;
            try {
                if (stream.stream_ops.close) {
                    stream.stream_ops.close(stream)
                }
            } catch (e) {
                throw e
            } finally {
                FS.closeStream(stream.fd)
            }
            stream.fd = null
        },
        isClosed: function(stream) {
            return stream.fd === null
        },
        llseek: function(stream, offset, whence) {
            if (FS.isClosed(stream)) {
                throw new FS.ErrnoError(9)
            }
            if (!stream.seekable || !stream.stream_ops.llseek) {
                throw new FS.ErrnoError(29)
            }
            if (whence != 0 && whence != 1 && whence != 2) {
                throw new FS.ErrnoError(22)
            }
            stream.position = stream.stream_ops.llseek(stream, offset, whence);
            stream.ungotten = [];
            return stream.position
        },
        read: function(stream, buffer, offset, length, position) {
            if (length < 0 || position < 0) {
                throw new FS.ErrnoError(22)
            }
            if (FS.isClosed(stream)) {
                throw new FS.ErrnoError(9)
            }
            if ((stream.flags & 2097155) === 1) {
                throw new FS.ErrnoError(9)
            }
            if (FS.isDir(stream.node.mode)) {
                throw new FS.ErrnoError(21)
            }
            if (!stream.stream_ops.read) {
                throw new FS.ErrnoError(22)
            }
            var seeking = typeof position !== "undefined";
            if (!seeking) {
                position = stream.position
            } else if (!stream.seekable) {
                throw new FS.ErrnoError(29)
            }
            var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
            if (!seeking)
                stream.position += bytesRead;
            return bytesRead
        },
        write: function(stream, buffer, offset, length, position, canOwn) {
            if (length < 0 || position < 0) {
                throw new FS.ErrnoError(22)
            }
            if (FS.isClosed(stream)) {
                throw new FS.ErrnoError(9)
            }
            if ((stream.flags & 2097155) === 0) {
                throw new FS.ErrnoError(9)
            }
            if (FS.isDir(stream.node.mode)) {
                throw new FS.ErrnoError(21)
            }
            if (!stream.stream_ops.write) {
                throw new FS.ErrnoError(22)
            }
            if (stream.flags & 1024) {
                FS.llseek(stream, 0, 2)
            }
            var seeking = typeof position !== "undefined";
            if (!seeking) {
                position = stream.position
            } else if (!stream.seekable) {
                throw new FS.ErrnoError(29)
            }
            var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
            if (!seeking)
                stream.position += bytesWritten;
            try {
                if (stream.path && FS.trackingDelegate["onWriteToFile"])
                    FS.trackingDelegate["onWriteToFile"](stream.path)
            } catch (e) {
                console.log("FS.trackingDelegate['onWriteToFile']('" + stream.path + "') threw an exception: " + e.message)
            }
            return bytesWritten
        },
        allocate: function(stream, offset, length) {
            if (FS.isClosed(stream)) {
                throw new FS.ErrnoError(9)
            }
            if (offset < 0 || length <= 0) {
                throw new FS.ErrnoError(22)
            }
            if ((stream.flags & 2097155) === 0) {
                throw new FS.ErrnoError(9)
            }
            if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
                throw new FS.ErrnoError(19)
            }
            if (!stream.stream_ops.allocate) {
                throw new FS.ErrnoError(95)
            }
            stream.stream_ops.allocate(stream, offset, length)
        },
        mmap: function(stream, buffer, offset, length, position, prot, flags) {
            if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
                throw new FS.ErrnoError(13)
            }
            if ((stream.flags & 2097155) === 1) {
                throw new FS.ErrnoError(13)
            }
            if (!stream.stream_ops.mmap) {
                throw new FS.ErrnoError(19)
            }
            return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags)
        },
        msync: function(stream, buffer, offset, length, mmapFlags) {
            if (!stream || !stream.stream_ops.msync) {
                return 0
            }
            return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags)
        },
        munmap: function(stream) {
            return 0
        },
        ioctl: function(stream, cmd, arg) {
            if (!stream.stream_ops.ioctl) {
                throw new FS.ErrnoError(25)
            }
            return stream.stream_ops.ioctl(stream, cmd, arg)
        },
        readFile: function(path, opts) {
            opts = opts || {};
            opts.flags = opts.flags || "r";
            opts.encoding = opts.encoding || "binary";
            if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
                throw new Error('Invalid encoding type "' + opts.encoding + '"')
            }
            var ret;
            var stream = FS.open(path, opts.flags);
            var stat = FS.stat(path);
            var length = stat.size;
            var buf = new Uint8Array(length);
            FS.read(stream, buf, 0, length, 0);
            if (opts.encoding === "utf8") {
                ret = UTF8ArrayToString(buf, 0)
            } else if (opts.encoding === "binary") {
                ret = buf
            }
            FS.close(stream);
            return ret
        },
        writeFile: function(path, data, opts) {
            opts = opts || {};
            opts.flags = opts.flags || "w";
            var stream = FS.open(path, opts.flags, opts.mode);
            if (typeof data === "string") {
                var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
                var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
                FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn)
            } else if (ArrayBuffer.isView(data)) {
                FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn)
            } else {
                throw new Error("Unsupported data type")
            }
            FS.close(stream)
        },
        cwd: function() {
            return FS.currentPath
        },
        chdir: function(path) {
            var lookup = FS.lookupPath(path, {
                follow: true
            });
            if (lookup.node === null) {
                throw new FS.ErrnoError(2)
            }
            if (!FS.isDir(lookup.node.mode)) {
                throw new FS.ErrnoError(20)
            }
            var err = FS.nodePermissions(lookup.node, "x");
            if (err) {
                throw new FS.ErrnoError(err)
            }
            FS.currentPath = lookup.path
        },
        createDefaultDirectories: function() {
            FS.mkdir("/tmp");
            FS.mkdir("/home");
            FS.mkdir("/home/web_user")
        },
        createDefaultDevices: function() {
            FS.mkdir("/dev");
            FS.registerDevice(FS.makedev(1, 3), {
                read: function() {
                    return 0
                },
                write: function(stream, buffer, offset, length, pos) {
                    return length
                }
            });
            FS.mkdev("/dev/null", FS.makedev(1, 3));
            TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
            TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
            FS.mkdev("/dev/tty", FS.makedev(5, 0));
            FS.mkdev("/dev/tty1", FS.makedev(6, 0));
            var random_device;
            if (typeof crypto === "object" && typeof crypto["getRandomValues"] === "function") {
                var randomBuffer = new Uint8Array(1);
                random_device = function() {
                    crypto.getRandomValues(randomBuffer);
                    return randomBuffer[0]
                }
            } else if (ENVIRONMENT_IS_NODE) {
                try {
                    var crypto_module = require("crypto");
                    random_device = function() {
                        return crypto_module["randomBytes"](1)[0]
                    }
                } catch (e) {}
            } else {}
            if (!random_device) {
                random_device = function() {
                    abort("no cryptographic support found for random_device. consider polyfilling it if you want to use something insecure like Math.random(), e.g. put this in a --pre-js: var crypto = { getRandomValues: function(array) { for (var i = 0; i < array.length; i++) array[i] = (Math.random()*256)|0 } };")
                }
            }
            FS.createDevice("/dev", "random", random_device);
            FS.createDevice("/dev", "urandom", random_device);
            FS.mkdir("/dev/shm");
            FS.mkdir("/dev/shm/tmp")
        },
        createSpecialDirectories: function() {
            FS.mkdir("/proc");
            FS.mkdir("/proc/self");
            FS.mkdir("/proc/self/fd");
            FS.mount({
                mount: function() {
                    var node = FS.createNode("/proc/self", "fd", 16384 | 511, 73);
                    node.node_ops = {
                        lookup: function(parent, name) {
                            var fd = +name;
                            var stream = FS.getStream(fd);
                            if (!stream)
                                throw new FS.ErrnoError(9);
                            var ret = {
                                parent: null,
                                mount: {
                                    mountpoint: "fake"
                                },
                                node_ops: {
                                    readlink: function() {
                                        return stream.path
                                    }
                                }
                            };
                            ret.parent = ret;
                            return ret
                        }
                    };
                    return node
                }
            }, {}, "/proc/self/fd")
        },
        createStandardStreams: function() {
            if (Module["stdin"]) {
                FS.createDevice("/dev", "stdin", Module["stdin"])
            } else {
                FS.symlink("/dev/tty", "/dev/stdin")
            }
            if (Module["stdout"]) {
                FS.createDevice("/dev", "stdout", null, Module["stdout"])
            } else {
                FS.symlink("/dev/tty", "/dev/stdout")
            }
            if (Module["stderr"]) {
                FS.createDevice("/dev", "stderr", null, Module["stderr"])
            } else {
                FS.symlink("/dev/tty1", "/dev/stderr")
            }
            var stdin = FS.open("/dev/stdin", "r");
            var stdout = FS.open("/dev/stdout", "w");
            var stderr = FS.open("/dev/stderr", "w");
            assert(stdin.fd === 0, "invalid handle for stdin (" + stdin.fd + ")");
            assert(stdout.fd === 1, "invalid handle for stdout (" + stdout.fd + ")");
            assert(stderr.fd === 2, "invalid handle for stderr (" + stderr.fd + ")")
        },
        ensureErrnoError: function() {
            if (FS.ErrnoError)
                return;
            FS.ErrnoError = function ErrnoError(errno, node) {
                this.node = node;
                this.setErrno = function(errno) {
                    this.errno = errno;
                    for (var key in ERRNO_CODES) {
                        if (ERRNO_CODES[key] === errno) {
                            this.code = key;
                            break
                        }
                    }
                }
                ;
                this.setErrno(errno);
                this.message = ERRNO_MESSAGES[errno];
                if (this.stack)
                    Object.defineProperty(this, "stack", {
                        value: (new Error).stack,
                        writable: true
                    });
                if (this.stack)
                    this.stack = demangleAll(this.stack)
            }
            ;
            FS.ErrnoError.prototype = new Error;
            FS.ErrnoError.prototype.constructor = FS.ErrnoError;
            [2].forEach(function(code) {
                FS.genericErrors[code] = new FS.ErrnoError(code);
                FS.genericErrors[code].stack = "<generic error, no stack>"
            })
        },
        staticInit: function() {
            FS.ensureErrnoError();
            FS.nameTable = new Array(4096);
            FS.mount(MEMFS, {}, "/");
            FS.createDefaultDirectories();
            FS.createDefaultDevices();
            FS.createSpecialDirectories();
            FS.filesystems = {
                "MEMFS": MEMFS,
                "IDBFS": IDBFS,
                "NODEFS": NODEFS,
                "WORKERFS": WORKERFS
            }
        },
        init: function(input, output, error) {
            assert(!FS.init.initialized, "FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)");
            FS.init.initialized = true;
            FS.ensureErrnoError();
            Module["stdin"] = input || Module["stdin"];
            Module["stdout"] = output || Module["stdout"];
            Module["stderr"] = error || Module["stderr"];
            FS.createStandardStreams()
        },
        quit: function() {
            FS.init.initialized = false;
            var fflush = Module["_fflush"];
            if (fflush)
                fflush(0);
            for (var i = 0; i < FS.streams.length; i++) {
                var stream = FS.streams[i];
                if (!stream) {
                    continue
                }
                FS.close(stream)
            }
        },
        getMode: function(canRead, canWrite) {
            var mode = 0;
            if (canRead)
                mode |= 292 | 73;
            if (canWrite)
                mode |= 146;
            return mode
        },
        joinPath: function(parts, forceRelative) {
            var path = PATH.join.apply(null, parts);
            if (forceRelative && path[0] == "/")
                path = path.substr(1);
            return path
        },
        absolutePath: function(relative, base) {
            return PATH_FS.resolve(base, relative)
        },
        standardizePath: function(path) {
            return PATH.normalize(path)
        },
        findObject: function(path, dontResolveLastLink) {
            var ret = FS.analyzePath(path, dontResolveLastLink);
            if (ret.exists) {
                return ret.object
            } else {
                ___setErrNo(ret.error);
                return null
            }
        },
        analyzePath: function(path, dontResolveLastLink) {
            try {
                var lookup = FS.lookupPath(path, {
                    follow: !dontResolveLastLink
                });
                path = lookup.path
            } catch (e) {}
            var ret = {
                isRoot: false,
                exists: false,
                error: 0,
                name: null,
                path: null,
                object: null,
                parentExists: false,
                parentPath: null,
                parentObject: null
            };
            try {
                var lookup = FS.lookupPath(path, {
                    parent: true
                });
                ret.parentExists = true;
                ret.parentPath = lookup.path;
                ret.parentObject = lookup.node;
                ret.name = PATH.basename(path);
                lookup = FS.lookupPath(path, {
                    follow: !dontResolveLastLink
                });
                ret.exists = true;
                ret.path = lookup.path;
                ret.object = lookup.node;
                ret.name = lookup.node.name;
                ret.isRoot = lookup.path === "/"
            } catch (e) {
                ret.error = e.errno
            }
            return ret
        },
        createFolder: function(parent, name, canRead, canWrite) {
            var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
            var mode = FS.getMode(canRead, canWrite);
            return FS.mkdir(path, mode)
        },
        createPath: function(parent, path, canRead, canWrite) {
            parent = typeof parent === "string" ? parent : FS.getPath(parent);
            var parts = path.split("/").reverse();
            while (parts.length) {
                var part = parts.pop();
                if (!part)
                    continue;
                var current = PATH.join2(parent, part);
                try {
                    FS.mkdir(current)
                } catch (e) {}
                parent = current
            }
            return current
        },
        createFile: function(parent, name, properties, canRead, canWrite) {
            var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
            var mode = FS.getMode(canRead, canWrite);
            return FS.create(path, mode)
        },
        createDataFile: function(parent, name, data, canRead, canWrite, canOwn) {
            var path = name ? PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name) : parent;
            var mode = FS.getMode(canRead, canWrite);
            var node = FS.create(path, mode);
            if (data) {
                if (typeof data === "string") {
                    var arr = new Array(data.length);
                    for (var i = 0, len = data.length; i < len; ++i)
                        arr[i] = data.charCodeAt(i);
                    data = arr
                }
                FS.chmod(node, mode | 146);
                var stream = FS.open(node, "w");
                FS.write(stream, data, 0, data.length, 0, canOwn);
                FS.close(stream);
                FS.chmod(node, mode)
            }
            return node
        },
        createDevice: function(parent, name, input, output) {
            var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
            var mode = FS.getMode(!!input, !!output);
            if (!FS.createDevice.major)
                FS.createDevice.major = 64;
            var dev = FS.makedev(FS.createDevice.major++, 0);
            FS.registerDevice(dev, {
                open: function(stream) {
                    stream.seekable = false
                },
                close: function(stream) {
                    if (output && output.buffer && output.buffer.length) {
                        output(10)
                    }
                },
                read: function(stream, buffer, offset, length, pos) {
                    var bytesRead = 0;
                    for (var i = 0; i < length; i++) {
                        var result;
                        try {
                            result = input()
                        } catch (e) {
                            throw new FS.ErrnoError(5)
                        }
                        if (result === undefined && bytesRead === 0) {
                            throw new FS.ErrnoError(11)
                        }
                        if (result === null || result === undefined)
                            break;
                        bytesRead++;
                        buffer[offset + i] = result
                    }
                    if (bytesRead) {
                        stream.node.timestamp = Date.now()
                    }
                    return bytesRead
                },
                write: function(stream, buffer, offset, length, pos) {
                    for (var i = 0; i < length; i++) {
                        try {
                            output(buffer[offset + i])
                        } catch (e) {
                            throw new FS.ErrnoError(5)
                        }
                    }
                    if (length) {
                        stream.node.timestamp = Date.now()
                    }
                    return i
                }
            });
            return FS.mkdev(path, mode, dev)
        },
        createLink: function(parent, name, target, canRead, canWrite) {
            var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
            return FS.symlink(target, path)
        },
        forceLoadFile: function(obj) {
            if (obj.isDevice || obj.isFolder || obj.link || obj.contents)
                return true;
            var success = true;
            if (typeof XMLHttpRequest !== "undefined") {
                throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")
            } else if (Module["read"]) {
                try {
                    obj.contents = intArrayFromString(Module["read"](obj.url), true);
                    obj.usedBytes = obj.contents.length
                } catch (e) {
                    success = false
                }
            } else {
                throw new Error("Cannot load without read() or XMLHttpRequest.")
            }
            if (!success)
                ___setErrNo(5);
            return success
        },
        createLazyFile: function(parent, name, url, canRead, canWrite) {
            function LazyUint8Array() {
                this.lengthKnown = false;
                this.chunks = []
            }
            LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
                if (idx > this.length - 1 || idx < 0) {
                    return undefined
                }
                var chunkOffset = idx % this.chunkSize;
                var chunkNum = idx / this.chunkSize | 0;
                return this.getter(chunkNum)[chunkOffset]
            }
            ;
            LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
                this.getter = getter
            }
            ;
            LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
                var xhr = new XMLHttpRequest;
                xhr.open("HEAD", url, false);
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304))
                    throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                var datalength = Number(xhr.getResponseHeader("Content-length"));
                var header;
                var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
                var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
                var chunkSize = 1024 * 1024;
                if (!hasByteServing)
                    chunkSize = datalength;
                var doXHR = function(from, to) {
                    if (from > to)
                        throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                    if (to > datalength - 1)
                        throw new Error("only " + datalength + " bytes available! programmer error!");
                    var xhr = new XMLHttpRequest;
                    xhr.open("GET", url, false);
                    if (datalength !== chunkSize)
                        xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                    if (typeof Uint8Array != "undefined")
                        xhr.responseType = "arraybuffer";
                    if (xhr.overrideMimeType) {
                        xhr.overrideMimeType("text/plain; charset=x-user-defined")
                    }
                    xhr.send(null);
                    if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304))
                        throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                    if (xhr.response !== undefined) {
                        return new Uint8Array(xhr.response || [])
                    } else {
                        return intArrayFromString(xhr.responseText || "", true)
                    }
                };
                var lazyArray = this;
                lazyArray.setDataGetter(function(chunkNum) {
                    var start = chunkNum * chunkSize;
                    var end = (chunkNum + 1) * chunkSize - 1;
                    end = Math.min(end, datalength - 1);
                    if (typeof lazyArray.chunks[chunkNum] === "undefined") {
                        lazyArray.chunks[chunkNum] = doXHR(start, end)
                    }
                    if (typeof lazyArray.chunks[chunkNum] === "undefined")
                        throw new Error("doXHR failed!");
                    return lazyArray.chunks[chunkNum]
                });
                if (usesGzip || !datalength) {
                    chunkSize = datalength = 1;
                    datalength = this.getter(0).length;
                    chunkSize = datalength;
                    console.log("LazyFiles on gzip forces download of the whole file when length is accessed")
                }
                this._length = datalength;
                this._chunkSize = chunkSize;
                this.lengthKnown = true
            }
            ;
            if (typeof XMLHttpRequest !== "undefined") {
                if (!ENVIRONMENT_IS_WORKER)
                    throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
                var lazyArray = new LazyUint8Array;
                Object.defineProperties(lazyArray, {
                    length: {
                        get: function() {
                            if (!this.lengthKnown) {
                                this.cacheLength()
                            }
                            return this._length
                        }
                    },
                    chunkSize: {
                        get: function() {
                            if (!this.lengthKnown) {
                                this.cacheLength()
                            }
                            return this._chunkSize
                        }
                    }
                });
                var properties = {
                    isDevice: false,
                    contents: lazyArray
                }
            } else {
                var properties = {
                    isDevice: false,
                    url: url
                }
            }
            var node = FS.createFile(parent, name, properties, canRead, canWrite);
            if (properties.contents) {
                node.contents = properties.contents
            } else if (properties.url) {
                node.contents = null;
                node.url = properties.url
            }
            Object.defineProperties(node, {
                usedBytes: {
                    get: function() {
                        return this.contents.length
                    }
                }
            });
            var stream_ops = {};
            var keys = Object.keys(node.stream_ops);
            keys.forEach(function(key) {
                var fn = node.stream_ops[key];
                stream_ops[key] = function forceLoadLazyFile() {
                    if (!FS.forceLoadFile(node)) {
                        throw new FS.ErrnoError(5)
                    }
                    return fn.apply(null, arguments)
                }
            });
            stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
                if (!FS.forceLoadFile(node)) {
                    throw new FS.ErrnoError(5)
                }
                var contents = stream.node.contents;
                if (position >= contents.length)
                    return 0;
                var size = Math.min(contents.length - position, length);
                assert(size >= 0);
                if (contents.slice) {
                    for (var i = 0; i < size; i++) {
                        buffer[offset + i] = contents[position + i]
                    }
                } else {
                    for (var i = 0; i < size; i++) {
                        buffer[offset + i] = contents.get(position + i)
                    }
                }
                return size
            }
            ;
            node.stream_ops = stream_ops;
            return node
        },
        createPreloadedFile: function(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
            Browser.init();
            var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
            var dep = getUniqueRunDependency("cp " + fullname);
            function processData(byteArray) {
                function finish(byteArray) {
                    if (preFinish)
                        preFinish();
                    if (!dontCreateFile) {
                        FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn)
                    }
                    if (onload)
                        onload();
                    removeRunDependency(dep)
                }
                var handled = false;
                Module["preloadPlugins"].forEach(function(plugin) {
                    if (handled)
                        return;
                    if (plugin["canHandle"](fullname)) {
                        plugin["handle"](byteArray, fullname, finish, function() {
                            if (onerror)
                                onerror();
                            removeRunDependency(dep)
                        });
                        handled = true
                    }
                });
                if (!handled)
                    finish(byteArray)
            }
            addRunDependency(dep);
            if (typeof url == "string") {
                Browser.asyncLoad(url, function(byteArray) {
                    processData(byteArray)
                }, onerror)
            } else {
                processData(url)
            }
        },
        indexedDB: function() {
            return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
        },
        DB_NAME: function() {
            return "EM_FS_" + window.location.pathname
        },
        DB_VERSION: 20,
        DB_STORE_NAME: "FILE_DATA",
        saveFilesToDB: function(paths, onload, onerror) {
            onload = onload || function() {}
            ;
            onerror = onerror || function() {}
            ;
            var indexedDB = FS.indexedDB();
            try {
                var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
            } catch (e) {
                return onerror(e)
            }
            openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
                console.log("creating db");
                var db = openRequest.result;
                db.createObjectStore(FS.DB_STORE_NAME)
            }
            ;
            openRequest.onsuccess = function openRequest_onsuccess() {
                var db = openRequest.result;
                var transaction = db.transaction([FS.DB_STORE_NAME], "readwrite");
                var files = transaction.objectStore(FS.DB_STORE_NAME);
                var ok = 0
                  , fail = 0
                  , total = paths.length;
                function finish() {
                    if (fail == 0)
                        onload();
                    else
                        onerror()
                }
                paths.forEach(function(path) {
                    var putRequest = files.put(FS.analyzePath(path).object.contents, path);
                    putRequest.onsuccess = function putRequest_onsuccess() {
                        ok++;
                        if (ok + fail == total)
                            finish()
                    }
                    ;
                    putRequest.onerror = function putRequest_onerror() {
                        fail++;
                        if (ok + fail == total)
                            finish()
                    }
                });
                transaction.onerror = onerror
            }
            ;
            openRequest.onerror = onerror
        },
        loadFilesFromDB: function(paths, onload, onerror) {
            onload = onload || function() {}
            ;
            onerror = onerror || function() {}
            ;
            var indexedDB = FS.indexedDB();
            try {
                var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
            } catch (e) {
                return onerror(e)
            }
            openRequest.onupgradeneeded = onerror;
            openRequest.onsuccess = function openRequest_onsuccess() {
                var db = openRequest.result;
                try {
                    var transaction = db.transaction([FS.DB_STORE_NAME], "readonly")
                } catch (e) {
                    onerror(e);
                    return
                }
                var files = transaction.objectStore(FS.DB_STORE_NAME);
                var ok = 0
                  , fail = 0
                  , total = paths.length;
                function finish() {
                    if (fail == 0)
                        onload();
                    else
                        onerror()
                }
                paths.forEach(function(path) {
                    var getRequest = files.get(path);
                    getRequest.onsuccess = function getRequest_onsuccess() {
                        if (FS.analyzePath(path).exists) {
                            FS.unlink(path)
                        }
                        FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
                        ok++;
                        if (ok + fail == total)
                            finish()
                    }
                    ;
                    getRequest.onerror = function getRequest_onerror() {
                        fail++;
                        if (ok + fail == total)
                            finish()
                    }
                });
                transaction.onerror = onerror
            }
            ;
            openRequest.onerror = onerror
        }
    };
    var SYSCALLS = {
        DEFAULT_POLLMASK: 5,
        mappings: {},
        umask: 511,
        calculateAt: function(dirfd, path) {
            if (path[0] !== "/") {
                var dir;
                if (dirfd === -100) {
                    dir = FS.cwd()
                } else {
                    var dirstream = FS.getStream(dirfd);
                    if (!dirstream)
                        throw new FS.ErrnoError(9);
                    dir = dirstream.path
                }
                path = PATH.join2(dir, path)
            }
            return path
        },
        doStat: function(func, path, buf) {
            try {
                var stat = func(path)
            } catch (e) {
                if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
                    return -20
                }
                throw e
            }
            HEAP32[buf >> 2] = stat.dev;
            HEAP32[buf + 4 >> 2] = 0;
            HEAP32[buf + 8 >> 2] = stat.ino;
            HEAP32[buf + 12 >> 2] = stat.mode;
            HEAP32[buf + 16 >> 2] = stat.nlink;
            HEAP32[buf + 20 >> 2] = stat.uid;
            HEAP32[buf + 24 >> 2] = stat.gid;
            HEAP32[buf + 28 >> 2] = stat.rdev;
            HEAP32[buf + 32 >> 2] = 0;
            tempI64 = [stat.size >>> 0, (tempDouble = stat.size,
            +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
            HEAP32[buf + 40 >> 2] = tempI64[0],
            HEAP32[buf + 44 >> 2] = tempI64[1];
            HEAP32[buf + 48 >> 2] = 4096;
            HEAP32[buf + 52 >> 2] = stat.blocks;
            HEAP32[buf + 56 >> 2] = stat.atime.getTime() / 1e3 | 0;
            HEAP32[buf + 60 >> 2] = 0;
            HEAP32[buf + 64 >> 2] = stat.mtime.getTime() / 1e3 | 0;
            HEAP32[buf + 68 >> 2] = 0;
            HEAP32[buf + 72 >> 2] = stat.ctime.getTime() / 1e3 | 0;
            HEAP32[buf + 76 >> 2] = 0;
            tempI64 = [stat.ino >>> 0, (tempDouble = stat.ino,
            +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
            HEAP32[buf + 80 >> 2] = tempI64[0],
            HEAP32[buf + 84 >> 2] = tempI64[1];
            return 0
        },
        doMsync: function(addr, stream, len, flags) {
            var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len));
            FS.msync(stream, buffer, 0, len, flags)
        },
        doMkdir: function(path, mode) {
            path = PATH.normalize(path);
            if (path[path.length - 1] === "/")
                path = path.substr(0, path.length - 1);
            FS.mkdir(path, mode, 0);
            return 0
        },
        doMknod: function(path, mode, dev) {
            switch (mode & 61440) {
            case 32768:
            case 8192:
            case 24576:
            case 4096:
            case 49152:
                break;
            default:
                return -22
            }
            FS.mknod(path, mode, dev);
            return 0
        },
        doReadlink: function(path, buf, bufsize) {
            if (bufsize <= 0)
                return -22;
            var ret = FS.readlink(path);
            var len = Math.min(bufsize, lengthBytesUTF8(ret));
            var endChar = HEAP8[buf + len];
            stringToUTF8(ret, buf, bufsize + 1);
            HEAP8[buf + len] = endChar;
            return len
        },
        doAccess: function(path, amode) {
            if (amode & ~7) {
                return -22
            }
            var node;
            var lookup = FS.lookupPath(path, {
                follow: true
            });
            node = lookup.node;
            var perms = "";
            if (amode & 4)
                perms += "r";
            if (amode & 2)
                perms += "w";
            if (amode & 1)
                perms += "x";
            if (perms && FS.nodePermissions(node, perms)) {
                return -13
            }
            return 0
        },
        doDup: function(path, flags, suggestFD) {
            var suggest = FS.getStream(suggestFD);
            if (suggest)
                FS.close(suggest);
            return FS.open(path, flags, 0, suggestFD, suggestFD).fd
        },
        doReadv: function(stream, iov, iovcnt, offset) {
            var ret = 0;
            for (var i = 0; i < iovcnt; i++) {
                var ptr = HEAP32[iov + i * 8 >> 2];
                var len = HEAP32[iov + (i * 8 + 4) >> 2];
                var curr = FS.read(stream, HEAP8, ptr, len, offset);
                if (curr < 0)
                    return -1;
                ret += curr;
                if (curr < len)
                    break
            }
            return ret
        },
        doWritev: function(stream, iov, iovcnt, offset) {
            var ret = 0;
            for (var i = 0; i < iovcnt; i++) {
                var ptr = HEAP32[iov + i * 8 >> 2];
                var len = HEAP32[iov + (i * 8 + 4) >> 2];
                var curr = FS.write(stream, HEAP8, ptr, len, offset);
                if (curr < 0)
                    return -1;
                ret += curr
            }
            return ret
        },
        varargs: 0,
        get: function(varargs) {
            SYSCALLS.varargs += 4;
            var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
            return ret
        },
        getStr: function() {
            var ret = UTF8ToString(SYSCALLS.get());
            return ret
        },
        getStreamFromFD: function() {
            var stream = FS.getStream(SYSCALLS.get());
            if (!stream)
                throw new FS.ErrnoError(9);
            return stream
        },
        get64: function() {
            var low = SYSCALLS.get()
              , high = SYSCALLS.get();
            if (low >= 0)
                assert(high === 0);
            else
                assert(high === -1);
            return low
        },
        getZero: function() {
            assert(SYSCALLS.get() === 0)
        }
    };
    function ___syscall10(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
            var path = SYSCALLS.getStr();
            FS.unlink(path);
            return 0
        } catch (e) {
            if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                abort(e);
            return -e.errno
        }
    }
    function ___syscall140(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
            var stream = SYSCALLS.getStreamFromFD()
              , offset_high = SYSCALLS.get()
              , offset_low = SYSCALLS.get()
              , result = SYSCALLS.get()
              , whence = SYSCALLS.get();
            var HIGH_OFFSET = 4294967296;
            var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
            var DOUBLE_LIMIT = 9007199254740992;
            if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
                return -75
            }
            FS.llseek(stream, offset, whence);
            tempI64 = [stream.position >>> 0, (tempDouble = stream.position,
            +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
            HEAP32[result >> 2] = tempI64[0],
            HEAP32[result + 4 >> 2] = tempI64[1];
            if (stream.getdents && offset === 0 && whence === 0)
                stream.getdents = null;
            return 0
        } catch (e) {
            if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                abort(e);
            return -e.errno
        }
    }
    function ___syscall142(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
            var nfds = SYSCALLS.get()
              , readfds = SYSCALLS.get()
              , writefds = SYSCALLS.get()
              , exceptfds = SYSCALLS.get()
              , timeout = SYSCALLS.get();
            assert(nfds <= 64, "nfds must be less than or equal to 64");
            assert(!exceptfds, "exceptfds not supported");
            var total = 0;
            var srcReadLow = readfds ? HEAP32[readfds >> 2] : 0
              , srcReadHigh = readfds ? HEAP32[readfds + 4 >> 2] : 0;
            var srcWriteLow = writefds ? HEAP32[writefds >> 2] : 0
              , srcWriteHigh = writefds ? HEAP32[writefds + 4 >> 2] : 0;
            var srcExceptLow = exceptfds ? HEAP32[exceptfds >> 2] : 0
              , srcExceptHigh = exceptfds ? HEAP32[exceptfds + 4 >> 2] : 0;
            var dstReadLow = 0
              , dstReadHigh = 0;
            var dstWriteLow = 0
              , dstWriteHigh = 0;
            var dstExceptLow = 0
              , dstExceptHigh = 0;
            var allLow = (readfds ? HEAP32[readfds >> 2] : 0) | (writefds ? HEAP32[writefds >> 2] : 0) | (exceptfds ? HEAP32[exceptfds >> 2] : 0);
            var allHigh = (readfds ? HEAP32[readfds + 4 >> 2] : 0) | (writefds ? HEAP32[writefds + 4 >> 2] : 0) | (exceptfds ? HEAP32[exceptfds + 4 >> 2] : 0);
            var check = function(fd, low, high, val) {
                return fd < 32 ? low & val : high & val
            };
            for (var fd = 0; fd < nfds; fd++) {
                var mask = 1 << fd % 32;
                if (!check(fd, allLow, allHigh, mask)) {
                    continue
                }
                var stream = FS.getStream(fd);
                if (!stream)
                    throw new FS.ErrnoError(9);
                var flags = SYSCALLS.DEFAULT_POLLMASK;
                if (stream.stream_ops.poll) {
                    flags = stream.stream_ops.poll(stream)
                }
                if (flags & 1 && check(fd, srcReadLow, srcReadHigh, mask)) {
                    fd < 32 ? dstReadLow = dstReadLow | mask : dstReadHigh = dstReadHigh | mask;
                    total++
                }
                if (flags & 4 && check(fd, srcWriteLow, srcWriteHigh, mask)) {
                    fd < 32 ? dstWriteLow = dstWriteLow | mask : dstWriteHigh = dstWriteHigh | mask;
                    total++
                }
                if (flags & 2 && check(fd, srcExceptLow, srcExceptHigh, mask)) {
                    fd < 32 ? dstExceptLow = dstExceptLow | mask : dstExceptHigh = dstExceptHigh | mask;
                    total++
                }
            }
            if (readfds) {
                HEAP32[readfds >> 2] = dstReadLow;
                HEAP32[readfds + 4 >> 2] = dstReadHigh
            }
            if (writefds) {
                HEAP32[writefds >> 2] = dstWriteLow;
                HEAP32[writefds + 4 >> 2] = dstWriteHigh
            }
            if (exceptfds) {
                HEAP32[exceptfds >> 2] = dstExceptLow;
                HEAP32[exceptfds + 4 >> 2] = dstExceptHigh
            }
            return total
        } catch (e) {
            if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                abort(e);
            return -e.errno
        }
    }
    function ___syscall145(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
            var stream = SYSCALLS.getStreamFromFD()
              , iov = SYSCALLS.get()
              , iovcnt = SYSCALLS.get();
            return SYSCALLS.doReadv(stream, iov, iovcnt)
        } catch (e) {
            if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                abort(e);
            return -e.errno
        }
    }
    function ___syscall146(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
            var stream = SYSCALLS.getStreamFromFD()
              , iov = SYSCALLS.get()
              , iovcnt = SYSCALLS.get();
            return SYSCALLS.doWritev(stream, iov, iovcnt)
        } catch (e) {
            if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                abort(e);
            return -e.errno
        }
    }
    function __emscripten_syscall_mmap2(addr, len, prot, flags, fd, off) {
        off <<= 12;
        var ptr;
        var allocated = false;
        if ((flags & 16) !== 0 && addr % PAGE_SIZE !== 0) {
            return -22
        }
        if ((flags & 32) !== 0) {
            ptr = _memalign(PAGE_SIZE, len);
            if (!ptr)
                return -12;
            _memset(ptr, 0, len);
            allocated = true
        } else {
            var info = FS.getStream(fd);
            if (!info)
                return -9;
            var res = FS.mmap(info, HEAPU8, addr, len, off, prot, flags);
            ptr = res.ptr;
            allocated = res.allocated
        }
        SYSCALLS.mappings[ptr] = {
            malloc: ptr,
            len: len,
            allocated: allocated,
            fd: fd,
            flags: flags
        };
        return ptr
    }
    function ___syscall192(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
            var addr = SYSCALLS.get()
              , len = SYSCALLS.get()
              , prot = SYSCALLS.get()
              , flags = SYSCALLS.get()
              , fd = SYSCALLS.get()
              , off = SYSCALLS.get();
            return __emscripten_syscall_mmap2(addr, len, prot, flags, fd, off)
        } catch (e) {
            if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                abort(e);
            return -e.errno
        }
    }
    function ___syscall195(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
            var path = SYSCALLS.getStr()
              , buf = SYSCALLS.get();
            return SYSCALLS.doStat(FS.stat, path, buf)
        } catch (e) {
            if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                abort(e);
            return -e.errno
        }
    }
    function ___syscall196(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
            var path = SYSCALLS.getStr()
              , buf = SYSCALLS.get();
            return SYSCALLS.doStat(FS.lstat, path, buf)
        } catch (e) {
            if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                abort(e);
            return -e.errno
        }
    }
    function ___syscall197(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
            var stream = SYSCALLS.getStreamFromFD()
              , buf = SYSCALLS.get();
            return SYSCALLS.doStat(FS.stat, stream.path, buf)
        } catch (e) {
            if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                abort(e);
            return -e.errno
        }
    }
    function ___syscall220(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
            var stream = SYSCALLS.getStreamFromFD()
              , dirp = SYSCALLS.get()
              , count = SYSCALLS.get();
            if (!stream.getdents) {
                stream.getdents = FS.readdir(stream.path)
            }
            var struct_size = 280;
            var pos = 0;
            var off = FS.llseek(stream, 0, 1);
            var idx = Math.floor(off / struct_size);
            while (idx < stream.getdents.length && pos + struct_size <= count) {
                var id;
                var type;
                var name = stream.getdents[idx];
                if (name[0] === ".") {
                    id = 1;
                    type = 4
                } else {
                    var child = FS.lookupNode(stream.node, name);
                    id = child.id;
                    type = FS.isChrdev(child.mode) ? 2 : FS.isDir(child.mode) ? 4 : FS.isLink(child.mode) ? 10 : 8
                }
                tempI64 = [id >>> 0, (tempDouble = id,
                +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
                HEAP32[dirp + pos >> 2] = tempI64[0],
                HEAP32[dirp + pos + 4 >> 2] = tempI64[1];
                tempI64 = [(idx + 1) * struct_size >>> 0, (tempDouble = (idx + 1) * struct_size,
                +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
                HEAP32[dirp + pos + 8 >> 2] = tempI64[0],
                HEAP32[dirp + pos + 12 >> 2] = tempI64[1];
                HEAP16[dirp + pos + 16 >> 1] = 280;
                HEAP8[dirp + pos + 18 >> 0] = type;
                stringToUTF8(name, dirp + pos + 19, 256);
                pos += struct_size;
                idx += 1
            }
            FS.llseek(stream, idx * struct_size, 0);
            return pos
        } catch (e) {
            if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                abort(e);
            return -e.errno
        }
    }
    function ___syscall221(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
            var stream = SYSCALLS.getStreamFromFD()
              , cmd = SYSCALLS.get();
            switch (cmd) {
            case 0:
                {
                    var arg = SYSCALLS.get();
                    if (arg < 0) {
                        return -22
                    }
                    var newStream;
                    newStream = FS.open(stream.path, stream.flags, 0, arg);
                    return newStream.fd
                }
            case 1:
            case 2:
                return 0;
            case 3:
                return stream.flags;
            case 4:
                {
                    var arg = SYSCALLS.get();
                    stream.flags |= arg;
                    return 0
                }
            case 12:
                {
                    var arg = SYSCALLS.get();
                    var offset = 0;
                    HEAP16[arg + offset >> 1] = 2;
                    return 0
                }
            case 13:
            case 14:
                return 0;
            case 16:
            case 8:
                return -22;
            case 9:
                ___setErrNo(22);
                return -1;
            default:
                {
                    return -22
                }
            }
        } catch (e) {
            if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                abort(e);
            return -e.errno
        }
    }
    function ___syscall3(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
            var stream = SYSCALLS.getStreamFromFD()
              , buf = SYSCALLS.get()
              , count = SYSCALLS.get();
            return FS.read(stream, HEAP8, buf, count)
        } catch (e) {
            if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                abort(e);
            return -e.errno
        }
    }
    function ___syscall33(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
            var path = SYSCALLS.getStr()
              , amode = SYSCALLS.get();
            return SYSCALLS.doAccess(path, amode)
        } catch (e) {
            if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                abort(e);
            return -e.errno
        }
    }
    function ___syscall340(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
            var pid = SYSCALLS.get()
              , resource = SYSCALLS.get()
              , new_limit = SYSCALLS.get()
              , old_limit = SYSCALLS.get();
            if (old_limit) {
                HEAP32[old_limit >> 2] = -1;
                HEAP32[old_limit + 4 >> 2] = -1;
                HEAP32[old_limit + 8 >> 2] = -1;
                HEAP32[old_limit + 12 >> 2] = -1
            }
            return 0
        } catch (e) {
            if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                abort(e);
            return -e.errno
        }
    }
    function ___syscall38(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
            var old_path = SYSCALLS.getStr()
              , new_path = SYSCALLS.getStr();
            FS.rename(old_path, new_path);
            return 0
        } catch (e) {
            if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                abort(e);
            return -e.errno
        }
    }
    function ___syscall39(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
            var path = SYSCALLS.getStr()
              , mode = SYSCALLS.get();
            return SYSCALLS.doMkdir(path, mode)
        } catch (e) {
            if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                abort(e);
            return -e.errno
        }
    }
    function ___syscall4(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
            var stream = SYSCALLS.getStreamFromFD()
              , buf = SYSCALLS.get()
              , count = SYSCALLS.get();
            return FS.write(stream, HEAP8, buf, count)
        } catch (e) {
            if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                abort(e);
            return -e.errno
        }
    }
    function ___syscall40(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
            var path = SYSCALLS.getStr();
            FS.rmdir(path);
            return 0
        } catch (e) {
            if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                abort(e);
            return -e.errno
        }
    }
    function ___syscall5(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
            var pathname = SYSCALLS.getStr()
              , flags = SYSCALLS.get()
              , mode = SYSCALLS.get();
            var stream = FS.open(pathname, flags, mode);
            return stream.fd
        } catch (e) {
            if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                abort(e);
            return -e.errno
        }
    }
    function ___syscall54(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
            var stream = SYSCALLS.getStreamFromFD()
              , op = SYSCALLS.get();
            switch (op) {
            case 21509:
            case 21505:
                {
                    if (!stream.tty)
                        return -25;
                    return 0
                }
            case 21510:
            case 21511:
            case 21512:
            case 21506:
            case 21507:
            case 21508:
                {
                    if (!stream.tty)
                        return -25;
                    return 0
                }
            case 21519:
                {
                    if (!stream.tty)
                        return -25;
                    var argp = SYSCALLS.get();
                    HEAP32[argp >> 2] = 0;
                    return 0
                }
            case 21520:
                {
                    if (!stream.tty)
                        return -25;
                    return -22
                }
            case 21531:
                {
                    var argp = SYSCALLS.get();
                    return FS.ioctl(stream, op, argp)
                }
            case 21523:
                {
                    if (!stream.tty)
                        return -25;
                    return 0
                }
            case 21524:
                {
                    if (!stream.tty)
                        return -25;
                    return 0
                }
            default:
                abort("bad ioctl syscall " + op)
            }
        } catch (e) {
            if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                abort(e);
            return -e.errno
        }
    }
    function ___syscall6(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
            var stream = SYSCALLS.getStreamFromFD();
            FS.close(stream);
            return 0
        } catch (e) {
            if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                abort(e);
            return -e.errno
        }
    }
    function ___syscall75(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
            return 0
        } catch (e) {
            if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                abort(e);
            return -e.errno
        }
    }
    function ___syscall77(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
            var who = SYSCALLS.get()
              , usage = SYSCALLS.get();
            _memset(usage, 0, 136);
            HEAP32[usage >> 2] = 1;
            HEAP32[usage + 4 >> 2] = 2;
            HEAP32[usage + 8 >> 2] = 3;
            HEAP32[usage + 12 >> 2] = 4;
            return 0
        } catch (e) {
            if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                abort(e);
            return -e.errno
        }
    }
    function __emscripten_syscall_munmap(addr, len) {
        if (addr == -1 || len == 0) {
            return -22
        }
        var info = SYSCALLS.mappings[addr];
        if (!info)
            return 0;
        if (len === info.len) {
            var stream = FS.getStream(info.fd);
            SYSCALLS.doMsync(addr, stream, len, info.flags);
            FS.munmap(stream);
            SYSCALLS.mappings[addr] = null;
            if (info.allocated) {
                _free(info.malloc)
            }
        }
        return 0
    }
    function ___syscall91(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
            var addr = SYSCALLS.get()
              , len = SYSCALLS.get();
            return __emscripten_syscall_munmap(addr, len)
        } catch (e) {
            if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
                abort(e);
            return -e.errno
        }
    }
    function ___unlock() {}
    function _abort() {
        Module["abort"]()
    }
    function _clock() {
        if (_clock.start === undefined)
            _clock.start = Date.now();
        return (Date.now() - _clock.start) * (1e6 / 1e3) | 0
    }
    function _emscripten_get_now() {
        abort()
    }
    function _emscripten_get_now_is_monotonic() {
        return 0 || ENVIRONMENT_IS_NODE || typeof dateNow !== "undefined" || typeof performance === "object" && performance && typeof performance["now"] === "function"
    }
    function _clock_gettime(clk_id, tp) {
        var now;
        if (clk_id === 0) {
            now = Date.now()
        } else if (clk_id === 1 && _emscripten_get_now_is_monotonic()) {
            now = _emscripten_get_now()
        } else {
            ___setErrNo(22);
            return -1
        }
        HEAP32[tp >> 2] = now / 1e3 | 0;
        HEAP32[tp + 4 >> 2] = now % 1e3 * 1e3 * 1e3 | 0;
        return 0
    }
    function _emscripten_get_heap_size() {
        return HEAP8.length
    }
    function _exit(status) {
        exit(status)
    }
    var _fabs = Math_abs;
    function _getenv(name) {
        if (name === 0)
            return 0;
        name = UTF8ToString(name);
        if (!ENV.hasOwnProperty(name))
            return 0;
        if (_getenv.ret)
            _free(_getenv.ret);
        _getenv.ret = allocateUTF8(ENV[name]);
        return _getenv.ret
    }
    function _gettimeofday(ptr) {
        var now = Date.now();
        HEAP32[ptr >> 2] = now / 1e3 | 0;
        HEAP32[ptr + 4 >> 2] = now % 1e3 * 1e3 | 0;
        return 0
    }
    var ___tm_current = 11753760;
    var ___tm_timezone = (stringToUTF8("GMT", 11753808, 4),
    11753808);
    function _gmtime_r(time, tmPtr) {
        var date = new Date(HEAP32[time >> 2] * 1e3);
        HEAP32[tmPtr >> 2] = date.getUTCSeconds();
        HEAP32[tmPtr + 4 >> 2] = date.getUTCMinutes();
        HEAP32[tmPtr + 8 >> 2] = date.getUTCHours();
        HEAP32[tmPtr + 12 >> 2] = date.getUTCDate();
        HEAP32[tmPtr + 16 >> 2] = date.getUTCMonth();
        HEAP32[tmPtr + 20 >> 2] = date.getUTCFullYear() - 1900;
        HEAP32[tmPtr + 24 >> 2] = date.getUTCDay();
        HEAP32[tmPtr + 36 >> 2] = 0;
        HEAP32[tmPtr + 32 >> 2] = 0;
        var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
        var yday = (date.getTime() - start) / (1e3 * 60 * 60 * 24) | 0;
        HEAP32[tmPtr + 28 >> 2] = yday;
        HEAP32[tmPtr + 40 >> 2] = ___tm_timezone;
        return tmPtr
    }
    function _gmtime(time) {
        return _gmtime_r(time, ___tm_current)
    }
    function _llvm_exp2_f32(x) {
        return Math.pow(2, x)
    }
    function _llvm_exp2_f64(a0) {
        return _llvm_exp2_f32(a0)
    }
    function _llvm_log10_f32(x) {
        return Math.log(x) / Math.LN10
    }
    function _llvm_log10_f64(a0) {
        return _llvm_log10_f32(a0)
    }
    function _llvm_log2_f32(x) {
        return Math.log(x) / Math.LN2
    }
    function _llvm_log2_f64(a0) {
        return _llvm_log2_f32(a0)
    }
    function _llvm_stackrestore(p) {
        var self = _llvm_stacksave;
        var ret = self.LLVM_SAVEDSTACKS[p];
        self.LLVM_SAVEDSTACKS.splice(p, 1);
        stackRestore(ret)
    }
    function _llvm_stacksave() {
        var self = _llvm_stacksave;
        if (!self.LLVM_SAVEDSTACKS) {
            self.LLVM_SAVEDSTACKS = []
        }
        self.LLVM_SAVEDSTACKS.push(stackSave());
        return self.LLVM_SAVEDSTACKS.length - 1
    }
    var _llvm_trunc_f32 = Math_trunc;
    var _llvm_trunc_f64 = Math_trunc;
    function _tzset() {
        if (_tzset.called)
            return;
        _tzset.called = true;
        HEAP32[__get_timezone() >> 2] = (new Date).getTimezoneOffset() * 60;
        var winter = new Date(2e3,0,1);
        var summer = new Date(2e3,6,1);
        HEAP32[__get_daylight() >> 2] = Number(winter.getTimezoneOffset() != summer.getTimezoneOffset());
        function extractZone(date) {
            var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
            return match ? match[1] : "GMT"
        }
        var winterName = extractZone(winter);
        var summerName = extractZone(summer);
        var winterNamePtr = allocate(intArrayFromString(winterName), "i8", ALLOC_NORMAL);
        var summerNamePtr = allocate(intArrayFromString(summerName), "i8", ALLOC_NORMAL);
        if (summer.getTimezoneOffset() < winter.getTimezoneOffset()) {
            HEAP32[__get_tzname() >> 2] = winterNamePtr;
            HEAP32[__get_tzname() + 4 >> 2] = summerNamePtr
        } else {
            HEAP32[__get_tzname() >> 2] = summerNamePtr;
            HEAP32[__get_tzname() + 4 >> 2] = winterNamePtr
        }
    }
    function _localtime_r(time, tmPtr) {
        _tzset();
        var date = new Date(HEAP32[time >> 2] * 1e3);
        HEAP32[tmPtr >> 2] = date.getSeconds();
        HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
        HEAP32[tmPtr + 8 >> 2] = date.getHours();
        HEAP32[tmPtr + 12 >> 2] = date.getDate();
        HEAP32[tmPtr + 16 >> 2] = date.getMonth();
        HEAP32[tmPtr + 20 >> 2] = date.getFullYear() - 1900;
        HEAP32[tmPtr + 24 >> 2] = date.getDay();
        var start = new Date(date.getFullYear(),0,1);
        var yday = (date.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24) | 0;
        HEAP32[tmPtr + 28 >> 2] = yday;
        HEAP32[tmPtr + 36 >> 2] = -(date.getTimezoneOffset() * 60);
        var summerOffset = new Date(2e3,6,1).getTimezoneOffset();
        var winterOffset = start.getTimezoneOffset();
        var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
        HEAP32[tmPtr + 32 >> 2] = dst;
        var zonePtr = HEAP32[__get_tzname() + (dst ? 4 : 0) >> 2];
        HEAP32[tmPtr + 40 >> 2] = zonePtr;
        return tmPtr
    }
    function _localtime(time) {
        return _localtime_r(time, ___tm_current)
    }
    function _emscripten_memcpy_big(dest, src, num) {
        HEAPU8.set(HEAPU8.subarray(src, src + num), dest)
    }
    function _mktime(tmPtr) {
        _tzset();
        var date = new Date(HEAP32[tmPtr + 20 >> 2] + 1900,HEAP32[tmPtr + 16 >> 2],HEAP32[tmPtr + 12 >> 2],HEAP32[tmPtr + 8 >> 2],HEAP32[tmPtr + 4 >> 2],HEAP32[tmPtr >> 2],0);
        var dst = HEAP32[tmPtr + 32 >> 2];
        var guessedOffset = date.getTimezoneOffset();
        var start = new Date(date.getFullYear(),0,1);
        var summerOffset = new Date(2e3,6,1).getTimezoneOffset();
        var winterOffset = start.getTimezoneOffset();
        var dstOffset = Math.min(winterOffset, summerOffset);
        if (dst < 0) {
            HEAP32[tmPtr + 32 >> 2] = Number(summerOffset != winterOffset && dstOffset == guessedOffset)
        } else if (dst > 0 != (dstOffset == guessedOffset)) {
            var nonDstOffset = Math.max(winterOffset, summerOffset);
            var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
            date.setTime(date.getTime() + (trueOffset - guessedOffset) * 6e4)
        }
        HEAP32[tmPtr + 24 >> 2] = date.getDay();
        var yday = (date.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24) | 0;
        HEAP32[tmPtr + 28 >> 2] = yday;
        return date.getTime() / 1e3 | 0
    }
    function _usleep(useconds) {
        var msec = useconds / 1e3;
        if ((ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && self["performance"] && self["performance"]["now"]) {
            var start = self["performance"]["now"]();
            while (self["performance"]["now"]() - start < msec) {}
        } else {
            var start = Date.now();
            while (Date.now() - start < msec) {}
        }
        return 0
    }
    function _nanosleep(rqtp, rmtp) {
        if (rqtp === 0) {
            ___setErrNo(22);
            return -1
        }
        var seconds = HEAP32[rqtp >> 2];
        var nanoseconds = HEAP32[rqtp + 4 >> 2];
        if (nanoseconds < 0 || nanoseconds > 999999999 || seconds < 0) {
            ___setErrNo(22);
            return -1
        }
        if (rmtp !== 0) {
            HEAP32[rmtp >> 2] = 0;
            HEAP32[rmtp + 4 >> 2] = 0
        }
        return _usleep(seconds * 1e6 + nanoseconds / 1e3)
    }
    function abortOnCannotGrowMemory(requestedSize) {
        abort("Cannot enlarge memory arrays to size " + requestedSize + " bytes (OOM). Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value " + HEAP8.length + ", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ")
    }
    function emscripten_realloc_buffer(size) {
        var PAGE_MULTIPLE = 65536;
        size = alignUp(size, PAGE_MULTIPLE);
        var oldSize = buffer.byteLength;
        try {
            var result = wasmMemory.grow((size - oldSize) / 65536);
            if (result !== (-1 | 0)) {
                buffer = wasmMemory.buffer;
                return true
            } else {
                return false
            }
        } catch (e) {
            console.error("emscripten_realloc_buffer: Attempted to grow from " + oldSize + " bytes to " + size + " bytes, but got error: " + e);
            return false
        }
    }
    function _emscripten_resize_heap(requestedSize) {
        var oldSize = _emscripten_get_heap_size();
        assert(requestedSize > oldSize);
        var PAGE_MULTIPLE = 65536;
        var LIMIT = 2147483648 - PAGE_MULTIPLE;
        if (requestedSize > LIMIT) {
            err("Cannot enlarge memory, asked to go up to " + requestedSize + " bytes, but the limit is " + LIMIT + " bytes!");
            return false
        }
        var MIN_TOTAL_MEMORY = 16777216;
        var newSize = Math.max(oldSize, MIN_TOTAL_MEMORY);
        while (newSize < requestedSize) {
            if (newSize <= 536870912) {
                newSize = alignUp(2 * newSize, PAGE_MULTIPLE)
            } else {
                newSize = Math.min(alignUp((3 * newSize + 2147483648) / 4, PAGE_MULTIPLE), LIMIT)
            }
            if (newSize === oldSize) {
                warnOnce("Cannot ask for more memory since we reached the practical limit in browsers (which is just below 2GB), so the request would have failed. Requesting only " + HEAP8.length)
            }
        }
        var start = Date.now();
        if (!emscripten_realloc_buffer(newSize)) {
            err("Failed to grow the heap from " + oldSize + " bytes to " + newSize + " bytes, not enough memory!");
            return false
        }
        updateGlobalBufferViews();
        return true
    }
    var __sigalrm_handler = 0;
    function _signal(sig, func) {
        if (sig == 14) {
            __sigalrm_handler = func
        } else {
            err("Calling stub instead of signal()")
        }
        return 0
    }
    function __isLeapYear(year) {
        return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
    }
    function __arraySum(array, index) {
        var sum = 0;
        for (var i = 0; i <= index; sum += array[i++])
            ;
        return sum
    }
    var __MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var __MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function __addDays(date, days) {
        var newDate = new Date(date.getTime());
        while (days > 0) {
            var leap = __isLeapYear(newDate.getFullYear());
            var currentMonth = newDate.getMonth();
            var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
            if (days > daysInCurrentMonth - newDate.getDate()) {
                days -= daysInCurrentMonth - newDate.getDate() + 1;
                newDate.setDate(1);
                if (currentMonth < 11) {
                    newDate.setMonth(currentMonth + 1)
                } else {
                    newDate.setMonth(0);
                    newDate.setFullYear(newDate.getFullYear() + 1)
                }
            } else {
                newDate.setDate(newDate.getDate() + days);
                return newDate
            }
        }
        return newDate
    }
    function _strftime(s, maxsize, format, tm) {
        var tm_zone = HEAP32[tm + 40 >> 2];
        var date = {
            tm_sec: HEAP32[tm >> 2],
            tm_min: HEAP32[tm + 4 >> 2],
            tm_hour: HEAP32[tm + 8 >> 2],
            tm_mday: HEAP32[tm + 12 >> 2],
            tm_mon: HEAP32[tm + 16 >> 2],
            tm_year: HEAP32[tm + 20 >> 2],
            tm_wday: HEAP32[tm + 24 >> 2],
            tm_yday: HEAP32[tm + 28 >> 2],
            tm_isdst: HEAP32[tm + 32 >> 2],
            tm_gmtoff: HEAP32[tm + 36 >> 2],
            tm_zone: tm_zone ? UTF8ToString(tm_zone) : ""
        };
        var pattern = UTF8ToString(format);
        var EXPANSION_RULES_1 = {
            "%c": "%a %b %d %H:%M:%S %Y",
            "%D": "%m/%d/%y",
            "%F": "%Y-%m-%d",
            "%h": "%b",
            "%r": "%I:%M:%S %p",
            "%R": "%H:%M",
            "%T": "%H:%M:%S",
            "%x": "%m/%d/%y",
            "%X": "%H:%M:%S",
            "%Ec": "%c",
            "%EC": "%C",
            "%Ex": "%m/%d/%y",
            "%EX": "%H:%M:%S",
            "%Ey": "%y",
            "%EY": "%Y",
            "%Od": "%d",
            "%Oe": "%e",
            "%OH": "%H",
            "%OI": "%I",
            "%Om": "%m",
            "%OM": "%M",
            "%OS": "%S",
            "%Ou": "%u",
            "%OU": "%U",
            "%OV": "%V",
            "%Ow": "%w",
            "%OW": "%W",
            "%Oy": "%y"
        };
        for (var rule in EXPANSION_RULES_1) {
            pattern = pattern.replace(new RegExp(rule,"g"), EXPANSION_RULES_1[rule])
        }
        var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        function leadingSomething(value, digits, character) {
            var str = typeof value === "number" ? value.toString() : value || "";
            while (str.length < digits) {
                str = character[0] + str
            }
            return str
        }
        function leadingNulls(value, digits) {
            return leadingSomething(value, digits, "0")
        }
        function compareByDay(date1, date2) {
            function sgn(value) {
                return value < 0 ? -1 : value > 0 ? 1 : 0
            }
            var compare;
            if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
                if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
                    compare = sgn(date1.getDate() - date2.getDate())
                }
            }
            return compare
        }
        function getFirstWeekStartDate(janFourth) {
            switch (janFourth.getDay()) {
            case 0:
                return new Date(janFourth.getFullYear() - 1,11,29);
            case 1:
                return janFourth;
            case 2:
                return new Date(janFourth.getFullYear(),0,3);
            case 3:
                return new Date(janFourth.getFullYear(),0,2);
            case 4:
                return new Date(janFourth.getFullYear(),0,1);
            case 5:
                return new Date(janFourth.getFullYear() - 1,11,31);
            case 6:
                return new Date(janFourth.getFullYear() - 1,11,30)
            }
        }
        function getWeekBasedYear(date) {
            var thisDate = __addDays(new Date(date.tm_year + 1900,0,1), date.tm_yday);
            var janFourthThisYear = new Date(thisDate.getFullYear(),0,4);
            var janFourthNextYear = new Date(thisDate.getFullYear() + 1,0,4);
            var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
            var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
            if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
                if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
                    return thisDate.getFullYear() + 1
                } else {
                    return thisDate.getFullYear()
                }
            } else {
                return thisDate.getFullYear() - 1
            }
        }
        var EXPANSION_RULES_2 = {
            "%a": function(date) {
                return WEEKDAYS[date.tm_wday].substring(0, 3)
            },
            "%A": function(date) {
                return WEEKDAYS[date.tm_wday]
            },
            "%b": function(date) {
                return MONTHS[date.tm_mon].substring(0, 3)
            },
            "%B": function(date) {
                return MONTHS[date.tm_mon]
            },
            "%C": function(date) {
                var year = date.tm_year + 1900;
                return leadingNulls(year / 100 | 0, 2)
            },
            "%d": function(date) {
                return leadingNulls(date.tm_mday, 2)
            },
            "%e": function(date) {
                return leadingSomething(date.tm_mday, 2, " ")
            },
            "%g": function(date) {
                return getWeekBasedYear(date).toString().substring(2)
            },
            "%G": function(date) {
                return getWeekBasedYear(date)
            },
            "%H": function(date) {
                return leadingNulls(date.tm_hour, 2)
            },
            "%I": function(date) {
                var twelveHour = date.tm_hour;
                if (twelveHour == 0)
                    twelveHour = 12;
                else if (twelveHour > 12)
                    twelveHour -= 12;
                return leadingNulls(twelveHour, 2)
            },
            "%j": function(date) {
                return leadingNulls(date.tm_mday + __arraySum(__isLeapYear(date.tm_year + 1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon - 1), 3)
            },
            "%m": function(date) {
                return leadingNulls(date.tm_mon + 1, 2)
            },
            "%M": function(date) {
                return leadingNulls(date.tm_min, 2)
            },
            "%n": function() {
                return "\n"
            },
            "%p": function(date) {
                if (date.tm_hour >= 0 && date.tm_hour < 12) {
                    return "AM"
                } else {
                    return "PM"
                }
            },
            "%S": function(date) {
                return leadingNulls(date.tm_sec, 2)
            },
            "%t": function() {
                return "\t"
            },
            "%u": function(date) {
                return date.tm_wday || 7
            },
            "%U": function(date) {
                var janFirst = new Date(date.tm_year + 1900,0,1);
                var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7 - janFirst.getDay());
                var endDate = new Date(date.tm_year + 1900,date.tm_mon,date.tm_mday);
                if (compareByDay(firstSunday, endDate) < 0) {
                    var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                    var firstSundayUntilEndJanuary = 31 - firstSunday.getDate();
                    var days = firstSundayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                    return leadingNulls(Math.ceil(days / 7), 2)
                }
                return compareByDay(firstSunday, janFirst) === 0 ? "01" : "00"
            },
            "%V": function(date) {
                var janFourthThisYear = new Date(date.tm_year + 1900,0,4);
                var janFourthNextYear = new Date(date.tm_year + 1901,0,4);
                var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
                var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
                var endDate = __addDays(new Date(date.tm_year + 1900,0,1), date.tm_yday);
                if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
                    return "53"
                }
                if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
                    return "01"
                }
                var daysDifference;
                if (firstWeekStartThisYear.getFullYear() < date.tm_year + 1900) {
                    daysDifference = date.tm_yday + 32 - firstWeekStartThisYear.getDate()
                } else {
                    daysDifference = date.tm_yday + 1 - firstWeekStartThisYear.getDate()
                }
                return leadingNulls(Math.ceil(daysDifference / 7), 2)
            },
            "%w": function(date) {
                return date.tm_wday
            },
            "%W": function(date) {
                var janFirst = new Date(date.tm_year,0,1);
                var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7 - janFirst.getDay() + 1);
                var endDate = new Date(date.tm_year + 1900,date.tm_mon,date.tm_mday);
                if (compareByDay(firstMonday, endDate) < 0) {
                    var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                    var firstMondayUntilEndJanuary = 31 - firstMonday.getDate();
                    var days = firstMondayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                    return leadingNulls(Math.ceil(days / 7), 2)
                }
                return compareByDay(firstMonday, janFirst) === 0 ? "01" : "00"
            },
            "%y": function(date) {
                return (date.tm_year + 1900).toString().substring(2)
            },
            "%Y": function(date) {
                return date.tm_year + 1900
            },
            "%z": function(date) {
                var off = date.tm_gmtoff;
                var ahead = off >= 0;
                off = Math.abs(off) / 60;
                off = off / 60 * 100 + off % 60;
                return (ahead ? "+" : "-") + String("0000" + off).slice(-4)
            },
            "%Z": function(date) {
                return date.tm_zone
            },
            "%%": function() {
                return "%"
            }
        };
        for (var rule in EXPANSION_RULES_2) {
            if (pattern.indexOf(rule) >= 0) {
                pattern = pattern.replace(new RegExp(rule,"g"), EXPANSION_RULES_2[rule](date))
            }
        }
        var bytes = intArrayFromString(pattern, false);
        if (bytes.length > maxsize) {
            return 0
        }
        writeArrayToMemory(bytes, s);
        return bytes.length - 1
    }
    function _time(ptr) {
        var ret = Date.now() / 1e3 | 0;
        if (ptr) {
            HEAP32[ptr >> 2] = ret
        }
        return ret
    }
    FS.staticInit();
    if (ENVIRONMENT_HAS_NODE) {
        var fs = require("fs");
        var NODEJS_PATH = require("path");
        NODEFS.staticInit()
    }
    if (ENVIRONMENT_IS_NODE) {
        _emscripten_get_now = function _emscripten_get_now_actual() {
            var t = process["hrtime"]();
            return t[0] * 1e3 + t[1] / 1e6
        }
    } else if (typeof dateNow !== "undefined") {
        _emscripten_get_now = dateNow
    } else if (typeof performance === "object" && performance && typeof performance["now"] === "function") {
        _emscripten_get_now = function() {
            return performance["now"]()
        }
    } else {
        _emscripten_get_now = Date.now
    }
    var ASSERTIONS = true;
    function intArrayFromString(stringy, dontAddNull, length) {
        var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
        var u8array = new Array(len);
        var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
        if (dontAddNull)
            u8array.length = numBytesWritten;
        return u8array
    }
    function nullFunc_dd(x) {
        err("Invalid function pointer called with signature 'dd'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_ddi(x) {
        err("Invalid function pointer called with signature 'ddi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_did(x) {
        err("Invalid function pointer called with signature 'did'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_didd(x) {
        err("Invalid function pointer called with signature 'didd'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_diii(x) {
        err("Invalid function pointer called with signature 'diii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_diiiiii(x) {
        err("Invalid function pointer called with signature 'diiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_fii(x) {
        err("Invalid function pointer called with signature 'fii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_fiifi(x) {
        err("Invalid function pointer called with signature 'fiifi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_fiii(x) {
        err("Invalid function pointer called with signature 'fiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_fiiii(x) {
        err("Invalid function pointer called with signature 'fiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_fiiiiiiiiffii(x) {
        err("Invalid function pointer called with signature 'fiiiiiiiiffii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_fiiiiiiiii(x) {
        err("Invalid function pointer called with signature 'fiiiiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_iffiiiii(x) {
        err("Invalid function pointer called with signature 'iffiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_ii(x) {
        err("Invalid function pointer called with signature 'ii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_iidiiii(x) {
        err("Invalid function pointer called with signature 'iidiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_iii(x) {
        err("Invalid function pointer called with signature 'iii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_iiidiiiiii(x) {
        err("Invalid function pointer called with signature 'iiidiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_iiii(x) {
        err("Invalid function pointer called with signature 'iiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_iiiii(x) {
        err("Invalid function pointer called with signature 'iiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_iiiiii(x) {
        err("Invalid function pointer called with signature 'iiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_iiiiiii(x) {
        err("Invalid function pointer called with signature 'iiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_iiiiiiidiiddii(x) {
        err("Invalid function pointer called with signature 'iiiiiiidiiddii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_iiiiiiii(x) {
        err("Invalid function pointer called with signature 'iiiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_iiiiiiiif(x) {
        err("Invalid function pointer called with signature 'iiiiiiiif'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_iiiiiiiii(x) {
        err("Invalid function pointer called with signature 'iiiiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_iiiiiiiiii(x) {
        err("Invalid function pointer called with signature 'iiiiiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_iiiiiiiiiiii(x) {
        err("Invalid function pointer called with signature 'iiiiiiiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_iiiiiiiiiiiiiifii(x) {
        err("Invalid function pointer called with signature 'iiiiiiiiiiiiiifii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_iiiiiij(x) {
        err("Invalid function pointer called with signature 'iiiiiij'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_iiiiij(x) {
        err("Invalid function pointer called with signature 'iiiiij'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_iiiji(x) {
        err("Invalid function pointer called with signature 'iiiji'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_iiijjji(x) {
        err("Invalid function pointer called with signature 'iiijjji'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_ijiii(x) {
        err("Invalid function pointer called with signature 'ijiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_jii(x) {
        err("Invalid function pointer called with signature 'jii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_jiii(x) {
        err("Invalid function pointer called with signature 'jiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_jiiiii(x) {
        err("Invalid function pointer called with signature 'jiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_jiiiiii(x) {
        err("Invalid function pointer called with signature 'jiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_jiiij(x) {
        err("Invalid function pointer called with signature 'jiiij'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_jiiji(x) {
        err("Invalid function pointer called with signature 'jiiji'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_jij(x) {
        err("Invalid function pointer called with signature 'jij'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_jiji(x) {
        err("Invalid function pointer called with signature 'jiji'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_v(x) {
        err("Invalid function pointer called with signature 'v'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_vi(x) {
        err("Invalid function pointer called with signature 'vi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_vid(x) {
        err("Invalid function pointer called with signature 'vid'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viffffffffffffffffi(x) {
        err("Invalid function pointer called with signature 'viffffffffffffffffi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viffffffffffffffi(x) {
        err("Invalid function pointer called with signature 'viffffffffffffffi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viffffffffi(x) {
        err("Invalid function pointer called with signature 'viffffffffi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_vifffffffi(x) {
        err("Invalid function pointer called with signature 'vifffffffi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viffffffi(x) {
        err("Invalid function pointer called with signature 'viffffffi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_vii(x) {
        err("Invalid function pointer called with signature 'vii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viidi(x) {
        err("Invalid function pointer called with signature 'viidi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiffiiiiii(x) {
        err("Invalid function pointer called with signature 'viiffiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viifi(x) {
        err("Invalid function pointer called with signature 'viifi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viii(x) {
        err("Invalid function pointer called with signature 'viii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiif(x) {
        err("Invalid function pointer called with signature 'viiif'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiff(x) {
        err("Invalid function pointer called with signature 'viiiff'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiffi(x) {
        err("Invalid function pointer called with signature 'viiiffi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiffiii(x) {
        err("Invalid function pointer called with signature 'viiiffiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiifi(x) {
        err("Invalid function pointer called with signature 'viiifi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiii(x) {
        err("Invalid function pointer called with signature 'viiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiif(x) {
        err("Invalid function pointer called with signature 'viiiif'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiiff(x) {
        err("Invalid function pointer called with signature 'viiiiff'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiifii(x) {
        err("Invalid function pointer called with signature 'viiiifii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiii(x) {
        err("Invalid function pointer called with signature 'viiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiiif(x) {
        err("Invalid function pointer called with signature 'viiiiif'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiiifi(x) {
        err("Invalid function pointer called with signature 'viiiiifi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiiii(x) {
        err("Invalid function pointer called with signature 'viiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiiiiff(x) {
        err("Invalid function pointer called with signature 'viiiiiiff'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiiiifi(x) {
        err("Invalid function pointer called with signature 'viiiiiifi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiiiii(x) {
        err("Invalid function pointer called with signature 'viiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiiiiif(x) {
        err("Invalid function pointer called with signature 'viiiiiiif'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiiiiifi(x) {
        err("Invalid function pointer called with signature 'viiiiiiifi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiiiiii(x) {
        err("Invalid function pointer called with signature 'viiiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiiiiiidddddii(x) {
        err("Invalid function pointer called with signature 'viiiiiiiidddddii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiiiiiii(x) {
        err("Invalid function pointer called with signature 'viiiiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiiiiiiii(x) {
        err("Invalid function pointer called with signature 'viiiiiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiiiiiiiif(x) {
        err("Invalid function pointer called with signature 'viiiiiiiiiif'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiiiiiiiii(x) {
        err("Invalid function pointer called with signature 'viiiiiiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiiiiiiiiii(x) {
        err("Invalid function pointer called with signature 'viiiiiiiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiiiiiiiiiiii(x) {
        err("Invalid function pointer called with signature 'viiiiiiiiiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiiiiiiiiiiiii(x) {
        err("Invalid function pointer called with signature 'viiiiiiiiiiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiiijji(x) {
        err("Invalid function pointer called with signature 'viiiiijji'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiiji(x) {
        err("Invalid function pointer called with signature 'viiiji'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    function nullFunc_viiijj(x) {
        err("Invalid function pointer called with signature 'viiijj'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
        err("Build with ASSERTIONS=2 for more info.");
        abort(x)
    }
    var asmGlobalArg = {};
    var asmLibraryArg = {
        "abort": abort,
        "setTempRet0": setTempRet0,
        "getTempRet0": getTempRet0,
        "abortStackOverflow": abortStackOverflow,
        "nullFunc_dd": nullFunc_dd,
        "nullFunc_ddi": nullFunc_ddi,
        "nullFunc_did": nullFunc_did,
        "nullFunc_didd": nullFunc_didd,
        "nullFunc_diii": nullFunc_diii,
        "nullFunc_diiiiii": nullFunc_diiiiii,
        "nullFunc_fii": nullFunc_fii,
        "nullFunc_fiifi": nullFunc_fiifi,
        "nullFunc_fiii": nullFunc_fiii,
        "nullFunc_fiiii": nullFunc_fiiii,
        "nullFunc_fiiiiiiiiffii": nullFunc_fiiiiiiiiffii,
        "nullFunc_fiiiiiiiii": nullFunc_fiiiiiiiii,
        "nullFunc_iffiiiii": nullFunc_iffiiiii,
        "nullFunc_ii": nullFunc_ii,
        "nullFunc_iidiiii": nullFunc_iidiiii,
        "nullFunc_iii": nullFunc_iii,
        "nullFunc_iiidiiiiii": nullFunc_iiidiiiiii,
        "nullFunc_iiii": nullFunc_iiii,
        "nullFunc_iiiii": nullFunc_iiiii,
        "nullFunc_iiiiii": nullFunc_iiiiii,
        "nullFunc_iiiiiii": nullFunc_iiiiiii,
        "nullFunc_iiiiiiidiiddii": nullFunc_iiiiiiidiiddii,
        "nullFunc_iiiiiiii": nullFunc_iiiiiiii,
        "nullFunc_iiiiiiiif": nullFunc_iiiiiiiif,
        "nullFunc_iiiiiiiii": nullFunc_iiiiiiiii,
        "nullFunc_iiiiiiiiii": nullFunc_iiiiiiiiii,
        "nullFunc_iiiiiiiiiiii": nullFunc_iiiiiiiiiiii,
        "nullFunc_iiiiiiiiiiiiiifii": nullFunc_iiiiiiiiiiiiiifii,
        "nullFunc_iiiiiij": nullFunc_iiiiiij,
        "nullFunc_iiiiij": nullFunc_iiiiij,
        "nullFunc_iiiji": nullFunc_iiiji,
        "nullFunc_iiijjji": nullFunc_iiijjji,
        "nullFunc_ijiii": nullFunc_ijiii,
        "nullFunc_jii": nullFunc_jii,
        "nullFunc_jiii": nullFunc_jiii,
        "nullFunc_jiiiii": nullFunc_jiiiii,
        "nullFunc_jiiiiii": nullFunc_jiiiiii,
        "nullFunc_jiiij": nullFunc_jiiij,
        "nullFunc_jiiji": nullFunc_jiiji,
        "nullFunc_jij": nullFunc_jij,
        "nullFunc_jiji": nullFunc_jiji,
        "nullFunc_v": nullFunc_v,
        "nullFunc_vi": nullFunc_vi,
        "nullFunc_vid": nullFunc_vid,
        "nullFunc_viffffffffffffffffi": nullFunc_viffffffffffffffffi,
        "nullFunc_viffffffffffffffi": nullFunc_viffffffffffffffi,
        "nullFunc_viffffffffi": nullFunc_viffffffffi,
        "nullFunc_vifffffffi": nullFunc_vifffffffi,
        "nullFunc_viffffffi": nullFunc_viffffffi,
        "nullFunc_vii": nullFunc_vii,
        "nullFunc_viidi": nullFunc_viidi,
        "nullFunc_viiffiiiiii": nullFunc_viiffiiiiii,
        "nullFunc_viifi": nullFunc_viifi,
        "nullFunc_viii": nullFunc_viii,
        "nullFunc_viiif": nullFunc_viiif,
        "nullFunc_viiiff": nullFunc_viiiff,
        "nullFunc_viiiffi": nullFunc_viiiffi,
        "nullFunc_viiiffiii": nullFunc_viiiffiii,
        "nullFunc_viiifi": nullFunc_viiifi,
        "nullFunc_viiii": nullFunc_viiii,
        "nullFunc_viiiif": nullFunc_viiiif,
        "nullFunc_viiiiff": nullFunc_viiiiff,
        "nullFunc_viiiifii": nullFunc_viiiifii,
        "nullFunc_viiiii": nullFunc_viiiii,
        "nullFunc_viiiiif": nullFunc_viiiiif,
        "nullFunc_viiiiifi": nullFunc_viiiiifi,
        "nullFunc_viiiiii": nullFunc_viiiiii,
        "nullFunc_viiiiiiff": nullFunc_viiiiiiff,
        "nullFunc_viiiiiifi": nullFunc_viiiiiifi,
        "nullFunc_viiiiiii": nullFunc_viiiiiii,
        "nullFunc_viiiiiiif": nullFunc_viiiiiiif,
        "nullFunc_viiiiiiifi": nullFunc_viiiiiiifi,
        "nullFunc_viiiiiiii": nullFunc_viiiiiiii,
        "nullFunc_viiiiiiiidddddii": nullFunc_viiiiiiiidddddii,
        "nullFunc_viiiiiiiii": nullFunc_viiiiiiiii,
        "nullFunc_viiiiiiiiii": nullFunc_viiiiiiiiii,
        "nullFunc_viiiiiiiiiif": nullFunc_viiiiiiiiiif,
        "nullFunc_viiiiiiiiiii": nullFunc_viiiiiiiiiii,
        "nullFunc_viiiiiiiiiiii": nullFunc_viiiiiiiiiiii,
        "nullFunc_viiiiiiiiiiiiii": nullFunc_viiiiiiiiiiiiii,
        "nullFunc_viiiiiiiiiiiiiii": nullFunc_viiiiiiiiiiiiiii,
        "nullFunc_viiiiijji": nullFunc_viiiiijji,
        "nullFunc_viiiji": nullFunc_viiiji,
        "nullFunc_viiijj": nullFunc_viiijj,
        "___assert_fail": ___assert_fail,
        "___buildEnvironment": ___buildEnvironment,
        "___lock": ___lock,
        "___setErrNo": ___setErrNo,
        "___syscall10": ___syscall10,
        "___syscall140": ___syscall140,
        "___syscall142": ___syscall142,
        "___syscall145": ___syscall145,
        "___syscall146": ___syscall146,
        "___syscall192": ___syscall192,
        "___syscall195": ___syscall195,
        "___syscall196": ___syscall196,
        "___syscall197": ___syscall197,
        "___syscall220": ___syscall220,
        "___syscall221": ___syscall221,
        "___syscall3": ___syscall3,
        "___syscall33": ___syscall33,
        "___syscall340": ___syscall340,
        "___syscall38": ___syscall38,
        "___syscall39": ___syscall39,
        "___syscall4": ___syscall4,
        "___syscall40": ___syscall40,
        "___syscall5": ___syscall5,
        "___syscall54": ___syscall54,
        "___syscall6": ___syscall6,
        "___syscall75": ___syscall75,
        "___syscall77": ___syscall77,
        "___syscall91": ___syscall91,
        "___unlock": ___unlock,
        "__addDays": __addDays,
        "__arraySum": __arraySum,
        "__emscripten_syscall_mmap2": __emscripten_syscall_mmap2,
        "__emscripten_syscall_munmap": __emscripten_syscall_munmap,
        "__isLeapYear": __isLeapYear,
        "_abort": _abort,
        "_clock": _clock,
        "_clock_gettime": _clock_gettime,
        "_emscripten_get_heap_size": _emscripten_get_heap_size,
        "_emscripten_get_now": _emscripten_get_now,
        "_emscripten_get_now_is_monotonic": _emscripten_get_now_is_monotonic,
        "_emscripten_memcpy_big": _emscripten_memcpy_big,
        "_emscripten_resize_heap": _emscripten_resize_heap,
        "_exit": _exit,
        "_fabs": _fabs,
        "_getenv": _getenv,
        "_gettimeofday": _gettimeofday,
        "_gmtime": _gmtime,
        "_gmtime_r": _gmtime_r,
        "_llvm_exp2_f32": _llvm_exp2_f32,
        "_llvm_exp2_f64": _llvm_exp2_f64,
        "_llvm_log10_f32": _llvm_log10_f32,
        "_llvm_log10_f64": _llvm_log10_f64,
        "_llvm_log2_f32": _llvm_log2_f32,
        "_llvm_log2_f64": _llvm_log2_f64,
        "_llvm_stackrestore": _llvm_stackrestore,
        "_llvm_stacksave": _llvm_stacksave,
        "_llvm_trunc_f32": _llvm_trunc_f32,
        "_llvm_trunc_f64": _llvm_trunc_f64,
        "_localtime": _localtime,
        "_localtime_r": _localtime_r,
        "_mktime": _mktime,
        "_nanosleep": _nanosleep,
        "_signal": _signal,
        "_strftime": _strftime,
        "_time": _time,
        "_tzset": _tzset,
        "_usleep": _usleep,
        "abortOnCannotGrowMemory": abortOnCannotGrowMemory,
        "emscripten_realloc_buffer": emscripten_realloc_buffer,
        "tempDoublePtr": tempDoublePtr,
        "DYNAMICTOP_PTR": DYNAMICTOP_PTR
    };
    var asm = Module["asm"](asmGlobalArg, asmLibraryArg, buffer);
    var real____emscripten_environ_constructor = asm["___emscripten_environ_constructor"];
    asm["___emscripten_environ_constructor"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real____emscripten_environ_constructor.apply(null, arguments)
    }
    ;
    var real____errno_location = asm["___errno_location"];
    asm["___errno_location"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real____errno_location.apply(null, arguments)
    }
    ;
    var real___get_daylight = asm["__get_daylight"];
    asm["__get_daylight"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real___get_daylight.apply(null, arguments)
    }
    ;
    var real___get_environ = asm["__get_environ"];
    asm["__get_environ"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real___get_environ.apply(null, arguments)
    }
    ;
    var real___get_timezone = asm["__get_timezone"];
    asm["__get_timezone"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real___get_timezone.apply(null, arguments)
    }
    ;
    var real___get_tzname = asm["__get_tzname"];
    asm["__get_tzname"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real___get_tzname.apply(null, arguments)
    }
    ;
    var real__fflush = asm["_fflush"];
    asm["_fflush"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real__fflush.apply(null, arguments)
    }
    ;
    var real__free = asm["_free"];
    asm["_free"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real__free.apply(null, arguments)
    }
    ;
    var real__llvm_bswap_i16 = asm["_llvm_bswap_i16"];
    asm["_llvm_bswap_i16"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real__llvm_bswap_i16.apply(null, arguments)
    }
    ;
    var real__llvm_bswap_i32 = asm["_llvm_bswap_i32"];
    asm["_llvm_bswap_i32"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real__llvm_bswap_i32.apply(null, arguments)
    }
    ;
    var real__llvm_maxnum_f32 = asm["_llvm_maxnum_f32"];
    asm["_llvm_maxnum_f32"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real__llvm_maxnum_f32.apply(null, arguments)
    }
    ;
    var real__llvm_maxnum_f64 = asm["_llvm_maxnum_f64"];
    asm["_llvm_maxnum_f64"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real__llvm_maxnum_f64.apply(null, arguments)
    }
    ;
    var real__llvm_minnum_f32 = asm["_llvm_minnum_f32"];
    asm["_llvm_minnum_f32"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real__llvm_minnum_f32.apply(null, arguments)
    }
    ;
    var real__llvm_minnum_f64 = asm["_llvm_minnum_f64"];
    asm["_llvm_minnum_f64"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real__llvm_minnum_f64.apply(null, arguments)
    }
    ;
    var real__llvm_rint_f64 = asm["_llvm_rint_f64"];
    asm["_llvm_rint_f64"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real__llvm_rint_f64.apply(null, arguments)
    }
    ;
    var real__llvm_round_f32 = asm["_llvm_round_f32"];
    asm["_llvm_round_f32"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real__llvm_round_f32.apply(null, arguments)
    }
    ;
    var real__llvm_round_f64 = asm["_llvm_round_f64"];
    asm["_llvm_round_f64"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real__llvm_round_f64.apply(null, arguments)
    }
    ;
    var real__main = asm["_main"];
    asm["_main"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real__main.apply(null, arguments)
    }
    ;
    var real__malloc = asm["_malloc"];
    asm["_malloc"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real__malloc.apply(null, arguments)
    }
    ;
    var real__memalign = asm["_memalign"];
    asm["_memalign"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real__memalign.apply(null, arguments)
    }
    ;
    var real__memmove = asm["_memmove"];
    asm["_memmove"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real__memmove.apply(null, arguments)
    }
    ;
    var real__rintf = asm["_rintf"];
    asm["_rintf"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real__rintf.apply(null, arguments)
    }
    ;
    var real__sbrk = asm["_sbrk"];
    asm["_sbrk"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real__sbrk.apply(null, arguments)
    }
    ;
    var real_establishStackSpace = asm["establishStackSpace"];
    asm["establishStackSpace"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real_establishStackSpace.apply(null, arguments)
    }
    ;
    var real_stackAlloc = asm["stackAlloc"];
    asm["stackAlloc"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real_stackAlloc.apply(null, arguments)
    }
    ;
    var real_stackRestore = asm["stackRestore"];
    asm["stackRestore"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real_stackRestore.apply(null, arguments)
    }
    ;
    var real_stackSave = asm["stackSave"];
    asm["stackSave"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return real_stackSave.apply(null, arguments)
    }
    ;
    Module["asm"] = asm;
    var ___emscripten_environ_constructor = Module["___emscripten_environ_constructor"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["___emscripten_environ_constructor"].apply(null, arguments)
    }
    ;
    var ___errno_location = Module["___errno_location"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["___errno_location"].apply(null, arguments)
    }
    ;
    var __get_daylight = Module["__get_daylight"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["__get_daylight"].apply(null, arguments)
    }
    ;
    var __get_environ = Module["__get_environ"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["__get_environ"].apply(null, arguments)
    }
    ;
    var __get_timezone = Module["__get_timezone"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["__get_timezone"].apply(null, arguments)
    }
    ;
    var __get_tzname = Module["__get_tzname"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["__get_tzname"].apply(null, arguments)
    }
    ;
    var _emscripten_replace_memory = Module["_emscripten_replace_memory"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["_emscripten_replace_memory"].apply(null, arguments)
    }
    ;
    var _fflush = Module["_fflush"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["_fflush"].apply(null, arguments)
    }
    ;
    var _free = Module["_free"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["_free"].apply(null, arguments)
    }
    ;
    var _llvm_bswap_i16 = Module["_llvm_bswap_i16"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["_llvm_bswap_i16"].apply(null, arguments)
    }
    ;
    var _llvm_bswap_i32 = Module["_llvm_bswap_i32"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["_llvm_bswap_i32"].apply(null, arguments)
    }
    ;
    var _llvm_maxnum_f32 = Module["_llvm_maxnum_f32"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["_llvm_maxnum_f32"].apply(null, arguments)
    }
    ;
    var _llvm_maxnum_f64 = Module["_llvm_maxnum_f64"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["_llvm_maxnum_f64"].apply(null, arguments)
    }
    ;
    var _llvm_minnum_f32 = Module["_llvm_minnum_f32"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["_llvm_minnum_f32"].apply(null, arguments)
    }
    ;
    var _llvm_minnum_f64 = Module["_llvm_minnum_f64"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["_llvm_minnum_f64"].apply(null, arguments)
    }
    ;
    var _llvm_rint_f64 = Module["_llvm_rint_f64"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["_llvm_rint_f64"].apply(null, arguments)
    }
    ;
    var _llvm_round_f32 = Module["_llvm_round_f32"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["_llvm_round_f32"].apply(null, arguments)
    }
    ;
    var _llvm_round_f64 = Module["_llvm_round_f64"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["_llvm_round_f64"].apply(null, arguments)
    }
    ;
    var _main = Module["_main"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["_main"].apply(null, arguments)
    }
    ;
    var _malloc = Module["_malloc"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["_malloc"].apply(null, arguments)
    }
    ;
    var _memalign = Module["_memalign"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["_memalign"].apply(null, arguments)
    }
    ;
    var _memcpy = Module["_memcpy"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["_memcpy"].apply(null, arguments)
    }
    ;
    var _memmove = Module["_memmove"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["_memmove"].apply(null, arguments)
    }
    ;
    var _memset = Module["_memset"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["_memset"].apply(null, arguments)
    }
    ;
    var _rintf = Module["_rintf"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["_rintf"].apply(null, arguments)
    }
    ;
    var _sbrk = Module["_sbrk"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["_sbrk"].apply(null, arguments)
    }
    ;
    var establishStackSpace = Module["establishStackSpace"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["establishStackSpace"].apply(null, arguments)
    }
    ;
    var stackAlloc = Module["stackAlloc"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["stackAlloc"].apply(null, arguments)
    }
    ;
    var stackRestore = Module["stackRestore"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["stackRestore"].apply(null, arguments)
    }
    ;
    var stackSave = Module["stackSave"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["stackSave"].apply(null, arguments)
    }
    ;
    var dynCall_dd = Module["dynCall_dd"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_dd"].apply(null, arguments)
    }
    ;
    var dynCall_ddi = Module["dynCall_ddi"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_ddi"].apply(null, arguments)
    }
    ;
    var dynCall_did = Module["dynCall_did"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_did"].apply(null, arguments)
    }
    ;
    var dynCall_didd = Module["dynCall_didd"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_didd"].apply(null, arguments)
    }
    ;
    var dynCall_diii = Module["dynCall_diii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_diii"].apply(null, arguments)
    }
    ;
    var dynCall_diiiiii = Module["dynCall_diiiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_diiiiii"].apply(null, arguments)
    }
    ;
    var dynCall_fii = Module["dynCall_fii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_fii"].apply(null, arguments)
    }
    ;
    var dynCall_fiifi = Module["dynCall_fiifi"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_fiifi"].apply(null, arguments)
    }
    ;
    var dynCall_fiii = Module["dynCall_fiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_fiii"].apply(null, arguments)
    }
    ;
    var dynCall_fiiii = Module["dynCall_fiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_fiiii"].apply(null, arguments)
    }
    ;
    var dynCall_fiiiiiiiiffii = Module["dynCall_fiiiiiiiiffii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_fiiiiiiiiffii"].apply(null, arguments)
    }
    ;
    var dynCall_fiiiiiiiii = Module["dynCall_fiiiiiiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_fiiiiiiiii"].apply(null, arguments)
    }
    ;
    var dynCall_iffiiiii = Module["dynCall_iffiiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_iffiiiii"].apply(null, arguments)
    }
    ;
    var dynCall_ii = Module["dynCall_ii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_ii"].apply(null, arguments)
    }
    ;
    var dynCall_iidiiii = Module["dynCall_iidiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_iidiiii"].apply(null, arguments)
    }
    ;
    var dynCall_iii = Module["dynCall_iii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_iii"].apply(null, arguments)
    }
    ;
    var dynCall_iiidiiiiii = Module["dynCall_iiidiiiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_iiidiiiiii"].apply(null, arguments)
    }
    ;
    var dynCall_iiii = Module["dynCall_iiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_iiii"].apply(null, arguments)
    }
    ;
    var dynCall_iiiii = Module["dynCall_iiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_iiiii"].apply(null, arguments)
    }
    ;
    var dynCall_iiiiii = Module["dynCall_iiiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_iiiiii"].apply(null, arguments)
    }
    ;
    var dynCall_iiiiiii = Module["dynCall_iiiiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_iiiiiii"].apply(null, arguments)
    }
    ;
    var dynCall_iiiiiiidiiddii = Module["dynCall_iiiiiiidiiddii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_iiiiiiidiiddii"].apply(null, arguments)
    }
    ;
    var dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_iiiiiiii"].apply(null, arguments)
    }
    ;
    var dynCall_iiiiiiiif = Module["dynCall_iiiiiiiif"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_iiiiiiiif"].apply(null, arguments)
    }
    ;
    var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_iiiiiiiii"].apply(null, arguments)
    }
    ;
    var dynCall_iiiiiiiiii = Module["dynCall_iiiiiiiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_iiiiiiiiii"].apply(null, arguments)
    }
    ;
    var dynCall_iiiiiiiiiiii = Module["dynCall_iiiiiiiiiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_iiiiiiiiiiii"].apply(null, arguments)
    }
    ;
    var dynCall_iiiiiiiiiiiiiifii = Module["dynCall_iiiiiiiiiiiiiifii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_iiiiiiiiiiiiiifii"].apply(null, arguments)
    }
    ;
    var dynCall_iiiiiij = Module["dynCall_iiiiiij"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_iiiiiij"].apply(null, arguments)
    }
    ;
    var dynCall_iiiiij = Module["dynCall_iiiiij"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_iiiiij"].apply(null, arguments)
    }
    ;
    var dynCall_iiiji = Module["dynCall_iiiji"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_iiiji"].apply(null, arguments)
    }
    ;
    var dynCall_iiijjji = Module["dynCall_iiijjji"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_iiijjji"].apply(null, arguments)
    }
    ;
    var dynCall_ijiii = Module["dynCall_ijiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_ijiii"].apply(null, arguments)
    }
    ;
    var dynCall_jii = Module["dynCall_jii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_jii"].apply(null, arguments)
    }
    ;
    var dynCall_jiii = Module["dynCall_jiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_jiii"].apply(null, arguments)
    }
    ;
    var dynCall_jiiiii = Module["dynCall_jiiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_jiiiii"].apply(null, arguments)
    }
    ;
    var dynCall_jiiiiii = Module["dynCall_jiiiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_jiiiiii"].apply(null, arguments)
    }
    ;
    var dynCall_jiiij = Module["dynCall_jiiij"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_jiiij"].apply(null, arguments)
    }
    ;
    var dynCall_jiiji = Module["dynCall_jiiji"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_jiiji"].apply(null, arguments)
    }
    ;
    var dynCall_jij = Module["dynCall_jij"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_jij"].apply(null, arguments)
    }
    ;
    var dynCall_jiji = Module["dynCall_jiji"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_jiji"].apply(null, arguments)
    }
    ;
    var dynCall_v = Module["dynCall_v"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_v"].apply(null, arguments)
    }
    ;
    var dynCall_vi = Module["dynCall_vi"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_vi"].apply(null, arguments)
    }
    ;
    var dynCall_vid = Module["dynCall_vid"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_vid"].apply(null, arguments)
    }
    ;
    var dynCall_viffffffffffffffffi = Module["dynCall_viffffffffffffffffi"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viffffffffffffffffi"].apply(null, arguments)
    }
    ;
    var dynCall_viffffffffffffffi = Module["dynCall_viffffffffffffffi"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viffffffffffffffi"].apply(null, arguments)
    }
    ;
    var dynCall_viffffffffi = Module["dynCall_viffffffffi"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viffffffffi"].apply(null, arguments)
    }
    ;
    var dynCall_vifffffffi = Module["dynCall_vifffffffi"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_vifffffffi"].apply(null, arguments)
    }
    ;
    var dynCall_viffffffi = Module["dynCall_viffffffi"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viffffffi"].apply(null, arguments)
    }
    ;
    var dynCall_vii = Module["dynCall_vii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_vii"].apply(null, arguments)
    }
    ;
    var dynCall_viidi = Module["dynCall_viidi"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viidi"].apply(null, arguments)
    }
    ;
    var dynCall_viiffiiiiii = Module["dynCall_viiffiiiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiffiiiiii"].apply(null, arguments)
    }
    ;
    var dynCall_viifi = Module["dynCall_viifi"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viifi"].apply(null, arguments)
    }
    ;
    var dynCall_viii = Module["dynCall_viii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viii"].apply(null, arguments)
    }
    ;
    var dynCall_viiif = Module["dynCall_viiif"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiif"].apply(null, arguments)
    }
    ;
    var dynCall_viiiff = Module["dynCall_viiiff"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiff"].apply(null, arguments)
    }
    ;
    var dynCall_viiiffi = Module["dynCall_viiiffi"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiffi"].apply(null, arguments)
    }
    ;
    var dynCall_viiiffiii = Module["dynCall_viiiffiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiffiii"].apply(null, arguments)
    }
    ;
    var dynCall_viiifi = Module["dynCall_viiifi"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiifi"].apply(null, arguments)
    }
    ;
    var dynCall_viiii = Module["dynCall_viiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiii"].apply(null, arguments)
    }
    ;
    var dynCall_viiiif = Module["dynCall_viiiif"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiif"].apply(null, arguments)
    }
    ;
    var dynCall_viiiiff = Module["dynCall_viiiiff"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiiff"].apply(null, arguments)
    }
    ;
    var dynCall_viiiifii = Module["dynCall_viiiifii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiifii"].apply(null, arguments)
    }
    ;
    var dynCall_viiiii = Module["dynCall_viiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiii"].apply(null, arguments)
    }
    ;
    var dynCall_viiiiif = Module["dynCall_viiiiif"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiiif"].apply(null, arguments)
    }
    ;
    var dynCall_viiiiifi = Module["dynCall_viiiiifi"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiiifi"].apply(null, arguments)
    }
    ;
    var dynCall_viiiiii = Module["dynCall_viiiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiiii"].apply(null, arguments)
    }
    ;
    var dynCall_viiiiiiff = Module["dynCall_viiiiiiff"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiiiiff"].apply(null, arguments)
    }
    ;
    var dynCall_viiiiiifi = Module["dynCall_viiiiiifi"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiiiifi"].apply(null, arguments)
    }
    ;
    var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiiiii"].apply(null, arguments)
    }
    ;
    var dynCall_viiiiiiif = Module["dynCall_viiiiiiif"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiiiiif"].apply(null, arguments)
    }
    ;
    var dynCall_viiiiiiifi = Module["dynCall_viiiiiiifi"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiiiiifi"].apply(null, arguments)
    }
    ;
    var dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiiiiii"].apply(null, arguments)
    }
    ;
    var dynCall_viiiiiiiidddddii = Module["dynCall_viiiiiiiidddddii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiiiiiidddddii"].apply(null, arguments)
    }
    ;
    var dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiiiiiii"].apply(null, arguments)
    }
    ;
    var dynCall_viiiiiiiiii = Module["dynCall_viiiiiiiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiiiiiiii"].apply(null, arguments)
    }
    ;
    var dynCall_viiiiiiiiiif = Module["dynCall_viiiiiiiiiif"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiiiiiiiif"].apply(null, arguments)
    }
    ;
    var dynCall_viiiiiiiiiii = Module["dynCall_viiiiiiiiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiiiiiiiii"].apply(null, arguments)
    }
    ;
    var dynCall_viiiiiiiiiiii = Module["dynCall_viiiiiiiiiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiiiiiiiiii"].apply(null, arguments)
    }
    ;
    var dynCall_viiiiiiiiiiiiii = Module["dynCall_viiiiiiiiiiiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiiiiiiiiiiii"].apply(null, arguments)
    }
    ;
    var dynCall_viiiiiiiiiiiiiii = Module["dynCall_viiiiiiiiiiiiiii"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiiiiiiiiiiiii"].apply(null, arguments)
    }
    ;
    var dynCall_viiiiijji = Module["dynCall_viiiiijji"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiiijji"].apply(null, arguments)
    }
    ;
    var dynCall_viiiji = Module["dynCall_viiiji"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiiji"].apply(null, arguments)
    }
    ;
    var dynCall_viiijj = Module["dynCall_viiijj"] = function() {
        assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
        assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
        return Module["asm"]["dynCall_viiijj"].apply(null, arguments)
    }
    ;
    Module["asm"] = asm;
    if (!Module["intArrayFromString"])
        Module["intArrayFromString"] = function() {
            abort("'intArrayFromString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["intArrayToString"])
        Module["intArrayToString"] = function() {
            abort("'intArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["ccall"])
        Module["ccall"] = function() {
            abort("'ccall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["cwrap"])
        Module["cwrap"] = function() {
            abort("'cwrap' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["setValue"])
        Module["setValue"] = function() {
            abort("'setValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["getValue"])
        Module["getValue"] = function() {
            abort("'getValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["allocate"])
        Module["allocate"] = function() {
            abort("'allocate' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["getMemory"])
        Module["getMemory"] = function() {
            abort("'getMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you")
        }
        ;
    if (!Module["AsciiToString"])
        Module["AsciiToString"] = function() {
            abort("'AsciiToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["stringToAscii"])
        Module["stringToAscii"] = function() {
            abort("'stringToAscii' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["UTF8ArrayToString"])
        Module["UTF8ArrayToString"] = function() {
            abort("'UTF8ArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["UTF8ToString"])
        Module["UTF8ToString"] = function() {
            abort("'UTF8ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["stringToUTF8Array"])
        Module["stringToUTF8Array"] = function() {
            abort("'stringToUTF8Array' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["stringToUTF8"])
        Module["stringToUTF8"] = function() {
            abort("'stringToUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["lengthBytesUTF8"])
        Module["lengthBytesUTF8"] = function() {
            abort("'lengthBytesUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["UTF16ToString"])
        Module["UTF16ToString"] = function() {
            abort("'UTF16ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["stringToUTF16"])
        Module["stringToUTF16"] = function() {
            abort("'stringToUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["lengthBytesUTF16"])
        Module["lengthBytesUTF16"] = function() {
            abort("'lengthBytesUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["UTF32ToString"])
        Module["UTF32ToString"] = function() {
            abort("'UTF32ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["stringToUTF32"])
        Module["stringToUTF32"] = function() {
            abort("'stringToUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["lengthBytesUTF32"])
        Module["lengthBytesUTF32"] = function() {
            abort("'lengthBytesUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["allocateUTF8"])
        Module["allocateUTF8"] = function() {
            abort("'allocateUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["stackTrace"])
        Module["stackTrace"] = function() {
            abort("'stackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["addOnPreRun"])
        Module["addOnPreRun"] = function() {
            abort("'addOnPreRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["addOnInit"])
        Module["addOnInit"] = function() {
            abort("'addOnInit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["addOnPreMain"])
        Module["addOnPreMain"] = function() {
            abort("'addOnPreMain' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["addOnExit"])
        Module["addOnExit"] = function() {
            abort("'addOnExit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["addOnPostRun"])
        Module["addOnPostRun"] = function() {
            abort("'addOnPostRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["writeStringToMemory"])
        Module["writeStringToMemory"] = function() {
            abort("'writeStringToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["writeArrayToMemory"])
        Module["writeArrayToMemory"] = function() {
            abort("'writeArrayToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["writeAsciiToMemory"])
        Module["writeAsciiToMemory"] = function() {
            abort("'writeAsciiToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["addRunDependency"])
        Module["addRunDependency"] = function() {
            abort("'addRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you")
        }
        ;
    if (!Module["removeRunDependency"])
        Module["removeRunDependency"] = function() {
            abort("'removeRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you")
        }
        ;
    if (!Module["ENV"])
        Module["ENV"] = function() {
            abort("'ENV' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["FS"])
        Module["FS"] = function() {
            abort("'FS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["FS_createFolder"])
        Module["FS_createFolder"] = function() {
            abort("'FS_createFolder' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you")
        }
        ;
    if (!Module["FS_createPath"])
        Module["FS_createPath"] = function() {
            abort("'FS_createPath' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you")
        }
        ;
    if (!Module["FS_createDataFile"])
        Module["FS_createDataFile"] = function() {
            abort("'FS_createDataFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you")
        }
        ;
    if (!Module["FS_createPreloadedFile"])
        Module["FS_createPreloadedFile"] = function() {
            abort("'FS_createPreloadedFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you")
        }
        ;
    if (!Module["FS_createLazyFile"])
        Module["FS_createLazyFile"] = function() {
            abort("'FS_createLazyFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you")
        }
        ;
    if (!Module["FS_createLink"])
        Module["FS_createLink"] = function() {
            abort("'FS_createLink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you")
        }
        ;
    if (!Module["FS_createDevice"])
        Module["FS_createDevice"] = function() {
            abort("'FS_createDevice' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you")
        }
        ;
    if (!Module["FS_unlink"])
        Module["FS_unlink"] = function() {
            abort("'FS_unlink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you")
        }
        ;
    if (!Module["GL"])
        Module["GL"] = function() {
            abort("'GL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["dynamicAlloc"])
        Module["dynamicAlloc"] = function() {
            abort("'dynamicAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["warnOnce"])
        Module["warnOnce"] = function() {
            abort("'warnOnce' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["loadDynamicLibrary"])
        Module["loadDynamicLibrary"] = function() {
            abort("'loadDynamicLibrary' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["loadWebAssemblyModule"])
        Module["loadWebAssemblyModule"] = function() {
            abort("'loadWebAssemblyModule' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["getLEB"])
        Module["getLEB"] = function() {
            abort("'getLEB' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["getFunctionTables"])
        Module["getFunctionTables"] = function() {
            abort("'getFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["alignFunctionTables"])
        Module["alignFunctionTables"] = function() {
            abort("'alignFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["registerFunctions"])
        Module["registerFunctions"] = function() {
            abort("'registerFunctions' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["addFunction"])
        Module["addFunction"] = function() {
            abort("'addFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["removeFunction"])
        Module["removeFunction"] = function() {
            abort("'removeFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["getFuncWrapper"])
        Module["getFuncWrapper"] = function() {
            abort("'getFuncWrapper' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["prettyPrint"])
        Module["prettyPrint"] = function() {
            abort("'prettyPrint' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["makeBigInt"])
        Module["makeBigInt"] = function() {
            abort("'makeBigInt' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["dynCall"])
        Module["dynCall"] = function() {
            abort("'dynCall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["getCompilerSetting"])
        Module["getCompilerSetting"] = function() {
            abort("'getCompilerSetting' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["stackSave"])
        Module["stackSave"] = function() {
            abort("'stackSave' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["stackRestore"])
        Module["stackRestore"] = function() {
            abort("'stackRestore' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["stackAlloc"])
        Module["stackAlloc"] = function() {
            abort("'stackAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["establishStackSpace"])
        Module["establishStackSpace"] = function() {
            abort("'establishStackSpace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["print"])
        Module["print"] = function() {
            abort("'print' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["printErr"])
        Module["printErr"] = function() {
            abort("'printErr' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["getTempRet0"])
        Module["getTempRet0"] = function() {
            abort("'getTempRet0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["setTempRet0"])
        Module["setTempRet0"] = function() {
            abort("'setTempRet0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["Pointer_stringify"])
        Module["Pointer_stringify"] = function() {
            abort("'Pointer_stringify' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
        }
        ;
    if (!Module["ALLOC_NORMAL"])
        Object.defineProperty(Module, "ALLOC_NORMAL", {
            get: function() {
                abort("'ALLOC_NORMAL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
            }
        });
    if (!Module["ALLOC_STACK"])
        Object.defineProperty(Module, "ALLOC_STACK", {
            get: function() {
                abort("'ALLOC_STACK' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
            }
        });
    if (!Module["ALLOC_DYNAMIC"])
        Object.defineProperty(Module, "ALLOC_DYNAMIC", {
            get: function() {
                abort("'ALLOC_DYNAMIC' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
            }
        });
    if (!Module["ALLOC_NONE"])
        Object.defineProperty(Module, "ALLOC_NONE", {
            get: function() {
                abort("'ALLOC_NONE' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
            }
        });
    function ExitStatus(status) {
        this.name = "ExitStatus";
        this.message = "Program terminated with exit(" + status + ")";
        this.status = status
    }
    ExitStatus.prototype = new Error;
    ExitStatus.prototype.constructor = ExitStatus;
    var calledMain = false;
    dependenciesFulfilled = function runCaller() {
        if (!Module["calledRun"])
            run();
        if (!Module["calledRun"])
            dependenciesFulfilled = runCaller
    }
    ;
    Module["callMain"] = function callMain(args) {
        assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on Module["onRuntimeInitialized"])');
        assert(__ATPRERUN__.length == 0, "cannot call main when preRun functions remain to be called");
        args = args || [];
        var argc = args.length + 1;
        var argv = stackAlloc((argc + 1) * 4);
        HEAP32[argv >> 2] = allocateUTF8OnStack(Module["thisProgram"]);
        for (var i = 1; i < argc; i++) {
            HEAP32[(argv >> 2) + i] = allocateUTF8OnStack(args[i - 1])
        }
        HEAP32[(argv >> 2) + argc] = 0;
        try {
            var ret = Module["_main"](argc, argv, 0);
            exit(ret, true)
        } catch (e) {
            if (e instanceof ExitStatus) {
                return
            } else if (e == "SimulateInfiniteLoop") {
                Module["noExitRuntime"] = true;
                return
            } else {
                var toLog = e;
                if (e && typeof e === "object" && e.stack) {
                    toLog = [e, e.stack]
                }
                err("exception thrown: " + toLog);
                Module["quit"](1, e)
            }
        } finally {
            calledMain = true
        }
    }
    ;
    function run(args) {
        args = args || Module["arguments"];
        if (runDependencies > 0) {
            return
        }
        writeStackCookie();
        preRun();
        if (runDependencies > 0)
            return;
        if (Module["calledRun"])
            return;
        function doRun() {
            if (Module["calledRun"])
                return;
            Module["calledRun"] = true;
            if (ABORT)
                return;
            initRuntime();
            preMain();
            if (Module["onRuntimeInitialized"])
                Module["onRuntimeInitialized"]();
            if (Module["_main"] && shouldRunNow)
                Module["callMain"](args);
            postRun()
        }
        if (Module["setStatus"]) {
            Module["setStatus"]("Running...");
            setTimeout(function() {
                setTimeout(function() {
                    Module["setStatus"]("")
                }, 1);
                doRun()
            }, 1)
        } else {
            doRun()
        }
        checkStackCookie()
    }
    Module["run"] = run;
    function checkUnflushedContent() {
        var print = out;
        var printErr = err;
        var has = false;
        out = err = function(x) {
            has = true
        }
        ;
        try {
            var flush = Module["_fflush"];
            if (flush)
                flush(0);
            ["stdout", "stderr"].forEach(function(name) {
                var info = FS.analyzePath("/dev/" + name);
                if (!info)
                    return;
                var stream = info.object;
                var rdev = stream.rdev;
                var tty = TTY.ttys[rdev];
                if (tty && tty.output && tty.output.length) {
                    has = true
                }
            })
        } catch (e) {}
        out = print;
        err = printErr;
        if (has) {
            warnOnce("stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.")
        }
    }
    function exit(status, implicit) {
        checkUnflushedContent();
        if (implicit && Module["noExitRuntime"] && status === 0) {
            return
        }
        if (Module["noExitRuntime"]) {
            if (!implicit) {
                err("exit(" + status + ") called, but EXIT_RUNTIME is not set, so halting execution but not exiting the runtime or preventing further async execution (build with EXIT_RUNTIME=1, if you want a true shutdown)")
            }
        } else {
            ABORT = true;
            EXITSTATUS = status;
            exitRuntime();
            if (Module["onExit"])
                Module["onExit"](status)
        }
        Module["quit"](status, new ExitStatus(status))
    }
    var abortDecorators = [];
    function abort(what) {
        if (Module["onAbort"]) {
            Module["onAbort"](what)
        }
        if (what !== undefined) {
            out(what);
            err(what);
            what = '"' + what + '"'
        } else {
            what = ""
        }
        ABORT = true;
        EXITSTATUS = 1;
        var extra = "";
        var output = "abort(" + what + ") at " + stackTrace() + extra;
        if (abortDecorators) {
            abortDecorators.forEach(function(decorator) {
                output = decorator(output, what)
            })
        }
        throw output
    }
    Module["abort"] = abort;
    if (Module["preInit"]) {
        if (typeof Module["preInit"] == "function")
            Module["preInit"] = [Module["preInit"]];
        while (Module["preInit"].length > 0) {
            Module["preInit"].pop()()
        }
    }
    var shouldRunNow = true;
    if (Module["noInitialRun"]) {
        shouldRunNow = false
    }
    Module["noExitRuntime"] = true;
    run();
    return Module["return"]
}
if (typeof exports !== "undefined") {
    ffmpeg_run.call(this)
}
