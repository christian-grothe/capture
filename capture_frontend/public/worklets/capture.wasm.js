// include: shell.js
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Module != 'undefined' ? Module : {};

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)


// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = Object.assign({}, Module);

var arguments_ = [];
var thisProgram = './this.program';
var quit_ = (status, toThrow) => {
  throw toThrow;
};

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = true;

if (Module['ENVIRONMENT']) {
  throw new Error('Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)');
}

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var read_,
    readAsync,
    readBinary;

if (ENVIRONMENT_IS_SHELL) {

  if ((typeof process == 'object' && typeof require === 'function') || typeof window == 'object' || typeof importScripts == 'function') throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  if (typeof read != 'undefined') {
    read_ = read;
  }

  readBinary = (f) => {
    if (typeof readbuffer == 'function') {
      return new Uint8Array(readbuffer(f));
    }
    let data = read(f, 'binary');
    assert(typeof data == 'object');
    return data;
  };

  readAsync = (f, onload, onerror) => {
    setTimeout(() => onload(readBinary(f)));
  };

  if (typeof clearTimeout == 'undefined') {
    globalThis.clearTimeout = (id) => {};
  }

  if (typeof setTimeout == 'undefined') {
    // spidermonkey lacks setTimeout but we use it above in readAsync.
    globalThis.setTimeout = (f) => (typeof f == 'function') ? f() : abort();
  }

  if (typeof scriptArgs != 'undefined') {
    arguments_ = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    arguments_ = arguments;
  }

  if (typeof quit == 'function') {
    quit_ = (status, toThrow) => {
      // Unlike node which has process.exitCode, d8 has no such mechanism. So we
      // have no way to set the exit code and then let the program exit with
      // that code when it naturally stops running (say, when all setTimeouts
      // have completed). For that reason, we must call `quit` - the only way to
      // set the exit code - but quit also halts immediately.  To increase
      // consistency with node (and the web) we schedule the actual quit call
      // using a setTimeout to give the current stack and any exception handlers
      // a chance to run.  This enables features such as addOnPostRun (which
      // expected to be able to run code after main returns).
      setTimeout(() => {
        if (!(toThrow instanceof ExitStatus)) {
          let toLog = toThrow;
          if (toThrow && typeof toThrow == 'object' && toThrow.stack) {
            toLog = [toThrow, toThrow.stack];
          }
          err(`exiting due to exception: ${toLog}`);
        }
        quit(status);
      });
      throw toThrow;
    };
  }

  if (typeof print != 'undefined') {
    // Prefer to use print/printErr where they exist, as they usually work better.
    if (typeof console == 'undefined') console = /** @type{!Console} */({});
    console.log = /** @type{!function(this:Console, ...*): undefined} */ (print);
    console.warn = console.error = /** @type{!function(this:Console, ...*): undefined} */ (typeof printErr != 'undefined' ? printErr : print);
  }

} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
{
  throw new Error('environment detection error');
}

var out = Module['print'] || console.log.bind(console);
var err = Module['printErr'] || console.error.bind(console);

// Merge back in the overrides
Object.assign(Module, moduleOverrides);
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used.
moduleOverrides = null;
checkIncomingModuleAPI();

// Emit code to handle expected values on the Module object. This applies Module.x
// to the proper local x. This has two benefits: first, we only emit it if it is
// expected to arrive, and second, by using a local everywhere else that can be
// minified.

if (Module['arguments']) arguments_ = Module['arguments'];legacyModuleProp('arguments', 'arguments_');

if (Module['thisProgram']) thisProgram = Module['thisProgram'];legacyModuleProp('thisProgram', 'thisProgram');

if (Module['quit']) quit_ = Module['quit'];legacyModuleProp('quit', 'quit_');

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message
// Assertions on removed incoming Module JS APIs.
assert(typeof Module['memoryInitializerPrefixURL'] == 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['pthreadMainPrefixURL'] == 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['cdInitializerPrefixURL'] == 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['filePackagePrefixURL'] == 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['read'] == 'undefined', 'Module.read option was removed (modify read_ in JS)');
assert(typeof Module['readAsync'] == 'undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
assert(typeof Module['readBinary'] == 'undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
assert(typeof Module['setWindowTitle'] == 'undefined', 'Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)');
assert(typeof Module['TOTAL_MEMORY'] == 'undefined', 'Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY');
legacyModuleProp('asm', 'wasmExports');
legacyModuleProp('read', 'read_');
legacyModuleProp('readAsync', 'readAsync');
legacyModuleProp('readBinary', 'readBinary');
legacyModuleProp('setWindowTitle', 'setWindowTitle');
var IDBFS = 'IDBFS is no longer included by default; build with -lidbfs.js';
var PROXYFS = 'PROXYFS is no longer included by default; build with -lproxyfs.js';
var WORKERFS = 'WORKERFS is no longer included by default; build with -lworkerfs.js';
var FETCHFS = 'FETCHFS is no longer included by default; build with -lfetchfs.js';
var ICASEFS = 'ICASEFS is no longer included by default; build with -licasefs.js';
var JSFILEFS = 'JSFILEFS is no longer included by default; build with -ljsfilefs.js';
var OPFS = 'OPFS is no longer included by default; build with -lopfs.js';

var NODEFS = 'NODEFS is no longer included by default; build with -lnodefs.js';

assert(!ENVIRONMENT_IS_WEB, 'web environment detected but not enabled at build time.  Add `web` to `-sENVIRONMENT` to enable.');

assert(!ENVIRONMENT_IS_WORKER, 'worker environment detected but not enabled at build time.  Add `worker` to `-sENVIRONMENT` to enable.');

assert(!ENVIRONMENT_IS_NODE, 'node environment detected but not enabled at build time.  Add `node` to `-sENVIRONMENT` to enable.');

// end include: shell.js

// include: preamble.js
// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

var wasmBinary; 
if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];legacyModuleProp('wasmBinary', 'wasmBinary');

if (typeof WebAssembly != 'object') {
  err('no native wasm support detected');
}

// include: base64Utils.js
// include: polyfill/atob.js
// Copied from https://github.com/strophe/strophejs/blob/e06d027/src/polyfills.js#L149

// This code was written by Tyler Akins and has been placed in the
// public domain.  It would be nice if you left this header intact.
// Base64 code from Tyler Akins -- http://rumkin.com

if (typeof atob == 'undefined') {
  if (typeof global != 'undefined' && typeof globalThis == 'undefined') {
    globalThis = global;
  }

  /**
   * Decodes a base64 string.
   * @param {string} input The string to decode.
   */
  globalThis.atob = function(input) {
    var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

    var output = '';
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
    // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
    do {
      enc1 = keyStr.indexOf(input.charAt(i++));
      enc2 = keyStr.indexOf(input.charAt(i++));
      enc3 = keyStr.indexOf(input.charAt(i++));
      enc4 = keyStr.indexOf(input.charAt(i++));

      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;

      output = output + String.fromCharCode(chr1);

      if (enc3 !== 64) {
        output = output + String.fromCharCode(chr2);
      }
      if (enc4 !== 64) {
        output = output + String.fromCharCode(chr3);
      }
    } while (i < input.length);
    return output;
  };
}
// end include: polyfill/atob.js
// Converts a string of base64 into a byte array (Uint8Array).
function intArrayFromBase64(s) {

  var decoded = atob(s);
  var bytes = new Uint8Array(decoded.length);
  for (var i = 0 ; i < decoded.length ; ++i) {
    bytes[i] = decoded.charCodeAt(i);
  }
  return bytes;
}

// If filename is a base64 data URI, parses and returns data (Buffer on node,
// Uint8Array otherwise). If filename is not a base64 data URI, returns undefined.
function tryParseAsDataURI(filename) {
  if (!isDataURI(filename)) {
    return;
  }

  return intArrayFromBase64(filename.slice(dataURIPrefix.length));
}
// end include: base64Utils.js
// Wasm globals

var wasmMemory;

//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

// In STRICT mode, we only define assert() when ASSERTIONS is set.  i.e. we
// don't define it at all in release modes.  This matches the behaviour of
// MINIMAL_RUNTIME.
// TODO(sbc): Make this the default even without STRICT enabled.
/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed' + (text ? ': ' + text : ''));
  }
}

// We used to include malloc/free by default in the past. Show a helpful error in
// builds with assertions.

// Memory management

var HEAP,
/** @type {!Int8Array} */
  HEAP8,
/** @type {!Uint8Array} */
  HEAPU8,
/** @type {!Int16Array} */
  HEAP16,
/** @type {!Uint16Array} */
  HEAPU16,
/** @type {!Int32Array} */
  HEAP32,
/** @type {!Uint32Array} */
  HEAPU32,
/** @type {!Float32Array} */
  HEAPF32,
/** @type {!Float64Array} */
  HEAPF64;

// include: runtime_shared.js
function updateMemoryViews() {
  var b = wasmMemory.buffer;
  Module['HEAP8'] = HEAP8 = new Int8Array(b);
  Module['HEAP16'] = HEAP16 = new Int16Array(b);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(b);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(b);
  Module['HEAP32'] = HEAP32 = new Int32Array(b);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(b);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(b);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(b);
}
// end include: runtime_shared.js
assert(!Module['STACK_SIZE'], 'STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time')

assert(typeof Int32Array != 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray != undefined && Int32Array.prototype.set != undefined,
       'JS engine does not provide full typed array support');

// If memory is defined in wasm, the user can't provide it, or set INITIAL_MEMORY
assert(!Module['wasmMemory'], 'Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally');
assert(!Module['INITIAL_MEMORY'], 'Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically');

// include: runtime_stack_check.js
// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  var max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  // If the stack ends at address zero we write our cookies 4 bytes into the
  // stack.  This prevents interference with SAFE_HEAP and ASAN which also
  // monitor writes to address zero.
  if (max == 0) {
    max += 4;
  }
  // The stack grow downwards towards _emscripten_stack_get_end.
  // We write cookies to the final two words in the stack and detect if they are
  // ever overwritten.
  HEAPU32[((max)>>2)] = 0x02135467;
  HEAPU32[(((max)+(4))>>2)] = 0x89BACDFE;
  // Also test the global address 0 for integrity.
  HEAPU32[((0)>>2)] = 1668509029;
}

function checkStackCookie() {
  if (ABORT) return;
  var max = _emscripten_stack_get_end();
  // See writeStackCookie().
  if (max == 0) {
    max += 4;
  }
  var cookie1 = HEAPU32[((max)>>2)];
  var cookie2 = HEAPU32[(((max)+(4))>>2)];
  if (cookie1 != 0x02135467 || cookie2 != 0x89BACDFE) {
    abort(`Stack overflow! Stack cookie has been overwritten at ${ptrToString(max)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${ptrToString(cookie2)} ${ptrToString(cookie1)}`);
  }
  // Also test the global address 0 for integrity.
  if (HEAPU32[((0)>>2)] != 0x63736d65 /* 'emsc' */) {
    abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
  }
}
// end include: runtime_stack_check.js
// include: runtime_assertions.js
// Endianness check
(function() {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 0x6373;
  if (h8[0] !== 0x73 || h8[1] !== 0x63) throw 'Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)';
})();

// end include: runtime_assertions.js
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called

var runtimeInitialized = false;

function preRun() {
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
  assert(!runtimeInitialized);
  runtimeInitialized = true;

  checkStackCookie();

  
  callRuntimeCallbacks(__ATINIT__);
}

function postRun() {
  checkStackCookie();

  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnExit(cb) {
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

// include: runtime_math.js
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc

assert(Math.imul, 'This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.fround, 'This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.clz32, 'This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.trunc, 'This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
// end include: runtime_math.js
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};

function getUniqueRunDependency(id) {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
}

function addRunDependency(id) {
  runDependencies++;

  Module['monitorRunDependencies']?.(runDependencies);

  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval != 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(() => {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            err('still waiting on run dependencies:');
          }
          err(`dependency: ${dep}`);
        }
        if (shown) {
          err('(end of list)');
        }
      }, 10000);
    }
  } else {
    err('warning: run dependency added without ID');
  }
}

function removeRunDependency(id) {
  runDependencies--;

  Module['monitorRunDependencies']?.(runDependencies);

  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    err('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}

/** @param {string|number=} what */
function abort(what) {
  Module['onAbort']?.(what);

  what = 'Aborted(' + what + ')';
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);

  ABORT = true;
  EXITSTATUS = 1;

  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  // FIXME This approach does not work in Wasm EH because it currently does not assume
  // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
  // a trap or not based on a hidden field within the object. So at the moment
  // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
  // allows this in the wasm spec.

  // Suppress closure compiler warning here. Closure compiler's builtin extern
  // definition for WebAssembly.RuntimeError claims it takes no arguments even
  // though it can.
  // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure gets fixed.
  /** @suppress {checkTypes} */
  var e = new WebAssembly.RuntimeError(what);

  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}

// include: memoryprofiler.js
// end include: memoryprofiler.js
// show errors on likely calls to FS when it was not included
var FS = {
  error() {
    abort('Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with -sFORCE_FILESYSTEM');
  },
  init() { FS.error() },
  createDataFile() { FS.error() },
  createPreloadedFile() { FS.error() },
  createLazyFile() { FS.error() },
  open() { FS.error() },
  mkdev() { FS.error() },
  registerDevice() { FS.error() },
  analyzePath() { FS.error() },

  ErrnoError() { FS.error() },
};
Module['FS_createDataFile'] = FS.createDataFile;
Module['FS_createPreloadedFile'] = FS.createPreloadedFile;

// include: URIUtils.js
// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

/**
 * Indicates whether filename is a base64 data URI.
 * @noinline
 */
var isDataURI = (filename) => filename.startsWith(dataURIPrefix);

/**
 * Indicates whether filename is delivered via file protocol (as opposed to http/https)
 * @noinline
 */
var isFileURI = (filename) => filename.startsWith('file://');
// end include: URIUtils.js
function createExportWrapper(name) {
  return (...args) => {
    assert(runtimeInitialized, `native function \`${name}\` called before runtime initialization`);
    var f = wasmExports[name];
    assert(f, `exported native function \`${name}\` not found`);
    return f(...args);
  };
}

// include: runtime_exceptions.js
// end include: runtime_exceptions.js
var wasmBinaryFile;
  wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAAB6wI0YAF/AX9gAn9/AX9gAX8AYAJ/fwBgA39/fwF/YAABf2ADf39/AGAEf39/fwBgAABgBX9/f39/AGABfQF9YAJ/fQBgAX8BfWAGf39/f39/AGAEf39/fwF/YAJ9fQF9YAV/f39/fwF/YAN/fn8BfmAEf39/fQBgAXwBfGADf399AGAFf39/fX8AYAF/AXxgAX0Bf2ACfH8BfGAEf35+fwBgBn98f39/fwF/YAJ+fwF/YA1/f39/f39/f39/f39/AGAJf39/f39/f39/AGAFf39/f30AYAV/f319fQF9YAN9fX0BfWADf31/AX1gBH9/fX0BfWAEf319fwBgBn99fX19fwBgA399fQBgAn98AGACfHwBfGACfH8Bf2ADfHx/AXxgAn99AX1gAnx/AX1gAn5+AXxgB39/f39/f38Bf2ADfn9/AX9gAXwBfmAEf39+fwF+YAV/f39+fgBgB39/f39/f38AYAR/fn9/AX8CvwQTA2VudhZfZW1iaW5kX3JlZ2lzdGVyX2NsYXNzABwDZW52Il9lbWJpbmRfcmVnaXN0ZXJfY2xhc3NfY29uc3RydWN0b3IADQNlbnYLX19jeGFfdGhyb3cABgNlbnYfX2VtYmluZF9yZWdpc3Rlcl9jbGFzc19mdW5jdGlvbgAdA2VudhVfZW1iaW5kX3JlZ2lzdGVyX3ZvaWQAAwNlbnYVX2VtYmluZF9yZWdpc3Rlcl9ib29sAAcDZW52GF9lbWJpbmRfcmVnaXN0ZXJfaW50ZWdlcgAJA2VudhZfZW1iaW5kX3JlZ2lzdGVyX2Zsb2F0AAYDZW52G19lbWJpbmRfcmVnaXN0ZXJfc3RkX3N0cmluZwADA2VudhxfZW1iaW5kX3JlZ2lzdGVyX3N0ZF93c3RyaW5nAAYDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfZW12YWwAAgNlbnYcX2VtYmluZF9yZWdpc3Rlcl9tZW1vcnlfdmlldwAGA2VudhRlbXNjcmlwdGVuX21lbWNweV9qcwAGA2VudhZlbXNjcmlwdGVuX3Jlc2l6ZV9oZWFwAAADZW52BWFib3J0AAgWd2FzaV9zbmFwc2hvdF9wcmV2aWV3MQhmZF9jbG9zZQAAFndhc2lfc25hcHNob3RfcHJldmlldzEIZmRfd3JpdGUADgNlbnYXX2VtYmlu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IAIoApQBISggAiAoNgKMASACICc2AogBIAIpAogBIW8gAiBvNwMgQSAhKSACIClqISogJiAqECZB1wAhKyACICtqISwgAiAsNgK0AUGPggQhLSACIC02ArABECdBBiEuIAIgLjYCrAEQKSEvIAIgLzYCqAEQKiEwIAIgMDYCpAFBByExIAIgMTYCoAEQLCEyEC0hMxAuITQQLyE1IAIoAqwBITYgAiA2NgLQAhAhITcgAigCrAEhOCACKAKoASE5IAIgOTYC2AIQMCE6IAIoAqgBITsgAigCpAEhPCACIDw2AtQCEDAhPSACKAKkASE+IAIoArABIT8gAigCoAEhQCACIEA2AtwCECIhQSACKAKgASFCIDIgMyA0IDUgNyA4IDogOyA9ID4gPyBBIEIQACACICE2AlBBCCFDIAIgQzYCTCACKQJMIXAgAiBwNwO4ASACKAK4ASFEIAIoArwBIUVB1wAhRiACIEZqIUcgAiBHNgLUAUG5gAQhSCACIEg2AtABIAIgRTYCzAEgAiBENgLIASACKALUASFJIAIoAtABIUogAigCyAEhSyACKALMASFMIAIgTDYCxAEgAiBLNgLAASACKQLAASFxIAIgcTcDGEEYIU0gAiBNaiFOIEogThAxIAIgITYCSEEJIU8gAiBPNgJEIAIpAkQhciACIHI3A5gCIAIoApgCIVAgAigCnAIhUSACIEk2ArQCQbuBBCFSIAIgUjYCsAIgAiBRNgKsAiACIFA2AqgCIAIoArQCIVMgAigCsAIhVCACKAKoAiFVIAIoAqwCIVYgAiBWNgKkAiACIFU2AqACIAIpAqACIXMgAiBzNwMQQRAhVyACIFdqIVggVCBYEDIgAiAhNgJAQQohWSACIFk2AjwgAikCPCF0IAIgdDcD+AEgAigC+AEhWiACKAL8ASFbIAIgUzYClAJByIEEIVwgAiBcNgKQAiACIFs2AowCIAIgWjYCiAIgAigClAIhXSACKAKQAiFeIAIoAogCIV8gAigCjAIhYCACIGA2AoQCIAIgXzYCgAIgAikCgAIhdSACIHU3AwhBCCFhIAIgYWohYiBeIGIQMiACICE2AjhBCyFjIAIgYzYCNCACKQI0IXYgAiB2NwPYASACKALYASFkIAIoAtwBIWUgAiBdNgL0AUGqggQhZiACIGY2AvABIAIgZTYC7AEgAiBk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ELoEQRk2AgALQX8hAwsgAw8LIAAgAToAAEEBCxUAAkAgAA0AQQAPCyAAIAFBABDjBAuPAQIBfgF/AkAgAL0iAkI0iKdB/w9xIgNB/w9GDQACQCADDQACQAJAIABEAAAAAAAAAABiDQBBACEDDAELIABEAAAAAAAA8EOiIAEQ5QQhACABKAIAQUBqIQMLIAEgAzYCACAADwsgASADQYJ4ajYCACACQv////////+HgH+DQoCAgICAgIDwP4S/IQALIAALUwEBfgJAAkAgA0HAAHFFDQAgASADQUBqrYYhAkIAIQEMAQsgA0UNACABQcAAIANrrYggAiADrSIEhoQhAiABIASGIQELIAAgATcDACAAIAI3AwgLUwEBfgJAAkAgA0HAAHFFDQAgAiADQUBqrYghAUIAIQIMAQsgA0UNACACQcAAIANrrYYgASADrSIEiIQhASACIASIIQILIAAgATcDACAAIAI3AwgL5AMCAn8CfiMAQSBrIgIkAAJAAkAgAUL///////////8AgyIEQoCAgICAgMD/Q3wgBEKAgICAgIDAgLx/fFoNACAAQjyIIAFCBIaEIQQCQCAAQv//////////D4MiAEKBgICAgICAgAhUDQAgBEKBgICAgICAgMAAfCEFDAILIARCgICAgICAgIDAAHwhBSAAQoCAgICAgICACFINASAFIARCAYN8IQUMAQsCQCAAUCAEQoCAgICAgMD//wBUIARCgICAgICAwP//AFEbDQAgAEI8iCABQgSGhEL/////////A4NCgICAgICAgPz/AIQhBQwBC0KAgICAgICA+P8AIQUgBEL///////+//8MAVg0AQgAhBSAEQjCIpyIDQZH3AEkNACACQRBqIAAgAUL///////8/g0KAgICAgIDAAIQiBCADQf+If2oQ5gQgAiAAIARBgfgAIANrEOcEIAIpAwAiBEI8iCACQQhqKQMAQgSGhCEFAkAgBEL//////////w+DIAIpAxAgAkEQakEIaikDAIRCAFKthCIEQoGAgICAgICACFQNACAFQgF8IQUMAQsgBEKAgICAgICAgAhSDQAgBUIBgyAFfCEFCyACQSBqJAAgBSABQoCAgICAgICAgH+DhL8L8QIBBH8jAEHQAWsiBSQAIAUgAjYCzAEgBUGgAWpBAEEoEJ0EGiAFIAUoAswBNgLIAQJA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6wQgAEEgIAwgDyARQYDAAHMQ8QQgBygCTCEBDAELCwtBACELDAMLQT0hFgsQugQgFjYCAAtBfyELCyAHQdAAaiQAIAsLGQACQCAALQAAQSBxDQAgASACIAAQ3wQaCwt7AQV/QQAhAQJAIAAoAgAiAiwAAEFQaiIDQQlNDQBBAA8LA0BBfyEEAkAgAUHMmbPmAEsNAEF/IAMgAUEKbCIBaiADIAFB/////wdzSxshBAsgACACQQFqIgM2AgAgAiwAASEFIAQhASADIQIgBUFQaiIDQQpJDQALIAQLtgQAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgAUF3ag4SAAECBQMEBgcICQoLDA0ODxAREgsgAiACKAIAIgFBBGo2AgAgACABKAIANgIADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABMgEANwMADwsgAiACKAIAIgFBBGo2AgAgACABMwEANwMADwsgAiACKAIAIgFBBGo2AgAgACABMAAANwMADwsgAiACKAIAIgFBBGo2AgAgACABMQAANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKwMAOQMADwsgACACIAMRAwALCz4BAX8CQCAAUA0AA0AgAUF/aiIBIACnQQ9xQZC3BGotAAAgAnI6AAAgAEIPViEDIABCBIghACADDQALCyABCzYBAX8CQCAAUA0AA0AgAUF/aiIBIACnQQdxQTByOgAAIABCB1YhAiAAQgOIIQAgAg0A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ZXc8dW5zaWduZWQgaW50PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxmbG9hdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDhfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MTZfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50MTZfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDY0X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDY0X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQzMl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQzMl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBjaGFyPgBzdGQ6OmJhc2ljX3N0cmluZzx1bnNpZ25lZCBjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8bG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgbG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8ZG91YmxlPgAuAChudWxsKQBQdXJlIHZpcnR1YWwgZnVuY3Rpb24gY2FsbGVkIQBsaWJjKythYmk6IAAxNENhcHR1cmVXcmFwcGVyADdDYXB0dXJlAAAAAOgdAQA0BAEAEB4BACMEAQBABAEAUDE0Q2FwdHVyZVdyYXBwZXIAAABsHgEAVAQBAAAAAABIBAEAUEsxNENhcHR1cmVXcmFwcGVyAABsHgEAeAQBAAEAAABIBAEAaWkAdmkAAABoBAEAAAAAAMwEAQATAAAAOEdyYWluRW52ADRTaW5lAOgdAQC+BAEAEB4BALQEAQDEBAEAAAAAAMQEAQAUAAAAAAAAAIgFAQAVAAAAFgAAABcAAAAYAAAAGQAAABoAAAAbAAAAHAAAAB0AAABOU3QzX18yMTBfX2Z1bmN0aW9uNl9fZnVuY0lOOEVudmVsb3BlN29uRW5kZWRNVWx2RV9FTlNfOWFsbG9jYXRvcklTNF9FRUZ2dkVFRQBOU3QzX18yMTBfX2Z1bmN0aW9uNl9fYmFzZUlGdnZFRUUA6B0BAF4FAQAQHgEAEAUBAIAFAQAAAAAAgAUBAB4AAAAfAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAAE44RW52ZWxvcGU3b25FbmRlZE1VbHZFX0UAAADoHQEAwAUBAAAAAAAAAAAAAAAAACQdAQBoBAEAqB0BAKgdAQCEHQEAdmlpaWlpAFA3Q2FwdHVyZQAAAABsHgEACwYBAAAAAABABAEAUEs3Q2FwdHVyZQAAbB4BACgGAQABAAAAQAQBAHYAAAAAAAAAAAAAACQdAQAYBgEAhB0BAIQdAQDMHQEAdmlpaWlmAAAkHQEAGAYBAIQdAQB2aWlpAAAAAAAAAAAABwEAIwAAACQAAAAlAAAAJgAAACcAAAAoAAAAKQAAACoAAAArAAAATlN0M19fMjEwX19mdW5jdGlvbjZfX2Z1bmNJWk41Vm9pY2U0aW5pdEVpaWZQNVN5bnRoRTMkXzBOU185YWxsb2NhdG9ySVM1X0VFRnZ2RUVFAAAAEB4BAKwGAQCABQEAWk41Vm9pY2U0aW5pdEVpaWZQNVN5bnRoRTMkXzAAAADoHQEADAcBAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0ljTlNfMTFjaGFyX3RyYWl0c0ljRUVOU185YWxsb2NhdG9ySWNFRUVFAADoHQEANAcBAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0loTlNfMTFjaGFyX3RyYWl0c0loRUVOU185YWxsb2NhdG9ySWhFRUVFAADoHQEAfAcBAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0l3TlNfMTFjaGFyX3RyYWl0c0l3RUVOU185YWxsb2NhdG9ySXdFRUVFAADoHQEAxAcBAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0lEc05TXzExY2hhcl90cmFpdHNJRHNFRU5TXzlhbGxvY2F0b3JJRHNFRUVFAAAA6B0BAAwIAQBOU3QzX18yMTJiYXNpY19zdHJpbmdJRGlOU18xMWNoYXJfdHJhaXRzSURpRUVOU185YWxsb2NhdG9ySURpRUVFRQAAAOgdAQBYCAEATjEwZW1zY3JpcHRlbjN2YWxFAADoHQEApAgBAE4xMGVtc2NyaXB0ZW4x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';
  if (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile);
  }

function getBinarySync(file) {
  if (file == wasmBinaryFile && wasmBinary) {
    return new Uint8Array(wasmBinary);
  }
  var binary = tryParseAsDataURI(file);
  if (binary) {
    return binary;
  }
  if (readBinary) {
    return readBinary(file);
  }
  throw 'sync fetching of the wasm failed: you can preload it to Module["wasmBinary"] manually, or emcc.py will do that for you when generating HTML (but not JS)';
}

function getBinaryPromise(binaryFile) {

  // Otherwise, getBinarySync should be able to get it synchronously
  return Promise.resolve().then(() => getBinarySync(binaryFile));
}

function instantiateSync(file, info) {
  var module;
  var binary = getBinarySync(file);
  module = new WebAssembly.Module(binary);
  var instance = new WebAssembly.Instance(module, info);
  return [instance, module];
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
function createWasm() {
  // prepare imports
  var info = {
    'env': wasmImports,
    'wasi_snapshot_preview1': wasmImports,
  };
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  /** @param {WebAssembly.Module=} module*/
  function receiveInstance(instance, module) {
    wasmExports = instance.exports;

    

    wasmMemory = wasmExports['memory'];
    
    assert(wasmMemory, 'memory not found in wasm exports');
    updateMemoryViews();

    wasmTable = wasmExports['__indirect_function_table'];
    
    assert(wasmTable, 'table not found in wasm exports');

    addOnInit(wasmExports['__wasm_call_ctors']);

    removeRunDependency('wasm-instantiate');
    return wasmExports;
  }
  // wait for the pthread pool (if any)
  addRunDependency('wasm-instantiate');

  // Prefer streaming instantiation if available.

  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to
  // run the instantiation parallel to any other async startup actions they are
  // performing.
  // Also pthreads and wasm workers initialize the wasm instance through this
  // path.
  if (Module['instantiateWasm']) {

    try {
      return Module['instantiateWasm'](info, receiveInstance);
    } catch(e) {
      err(`Module.instantiateWasm callback failed with error: ${e}`);
        return false;
    }
  }

  var result = instantiateSync(wasmBinaryFile, info);
  // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193,
  // the above line no longer optimizes out down to the following line.
  // When the regression is fixed, we can remove this if/else.
  return receiveInstance(result[0]);
}

// Globals used by JS i64 conversions (see makeSetValue)
var tempDouble;
var tempI64;

// include: runtime_debug.js
function legacyModuleProp(prop, newName, incoming=true) {
  if (!Object.getOwnPropertyDescriptor(Module, prop)) {
    Object.defineProperty(Module, prop, {
      configurable: true,
      get() {
        let extra = incoming ? ' (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)' : '';
        abort(`\`Module.${prop}\` has been replaced by \`${newName}\`` + extra);

      }
    });
  }
}

function ignoredModuleProp(prop) {
  if (Object.getOwnPropertyDescriptor(Module, prop)) {
    abort(`\`Module.${prop}\` was supplied but \`${prop}\` not included in INCOMING_MODULE_JS_API`);
  }
}

// forcing the filesystem exports a few things by default
function isExportedByForceFilesystem(name) {
  return name === 'FS_createPath' ||
         name === 'FS_createDataFile' ||
         name === 'FS_createPreloadedFile' ||
         name === 'FS_unlink' ||
         name === 'addRunDependency' ||
         // The old FS has some functionality that WasmFS lacks.
         name === 'FS_createLazyFile' ||
         name === 'FS_createDevice' ||
         name === 'removeRunDependency';
}

function missingGlobal(sym, msg) {
  if (typeof globalThis !== 'undefined') {
    Object.defineProperty(globalThis, sym, {
      configurable: true,
      get() {
        warnOnce(`\`${sym}\` is not longer defined by emscripten. ${msg}`);
        return undefined;
      }
    });
  }
}

missingGlobal('buffer', 'Please use HEAP8.buffer or wasmMemory.buffer');
missingGlobal('asm', 'Please use wasmExports instead');

function missingLibrarySymbol(sym) {
  if (typeof globalThis !== 'undefined' && !Object.getOwnPropertyDescriptor(globalThis, sym)) {
    Object.defineProperty(globalThis, sym, {
      configurable: true,
      get() {
        // Can't `abort()` here because it would break code that does runtime
        // checks.  e.g. `if (typeof SDL === 'undefined')`.
        var msg = `\`${sym}\` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line`;
        // DEFAULT_LIBRARY_FUNCS_TO_INCLUDE requires the name as it appears in
        // library.js, which means $name for a JS name with no prefix, or name
        // for a JS name like _name.
        var librarySymbol = sym;
        if (!librarySymbol.startsWith('_')) {
          librarySymbol = '$' + sym;
        }
        msg += ` (e.g. -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE='${librarySymbol}')`;
        if (isExportedByForceFilesystem(sym)) {
          msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
        }
        warnOnce(msg);
        return undefined;
      }
    });
  }
  // Any symbol that is not included from the JS library is also (by definition)
  // not exported on the Module object.
  unexportedRuntimeSymbol(sym);
}

function unexportedRuntimeSymbol(sym) {
  if (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Object.defineProperty(Module, sym, {
      configurable: true,
      get() {
        var msg = `'${sym}' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)`;
        if (isExportedByForceFilesystem(sym)) {
          msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
        }
        abort(msg);
      }
    });
  }
}

// Used by XXXXX_DEBUG settings to output debug messages.
function dbg(...args) {
  // TODO(sbc): Make this configurable somehow.  Its not always convenient for
  // logging to show up as warnings.
  console.warn(...args);
}
// end include: runtime_debug.js
// === Body ===
// end include: preamble.js


  /** @constructor */
  function ExitStatus(status) {
      this.name = 'ExitStatus';
      this.message = `Program terminated with exit(${status})`;
      this.status = status;
    }

  var callRuntimeCallbacks = (callbacks) => {
      while (callbacks.length > 0) {
        // Pass the module as the first argument.
        callbacks.shift()(Module);
      }
    };

  
    /**
     * @param {number} ptr
     * @param {string} type
     */
  function getValue(ptr, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': return HEAP8[ptr];
      case 'i8': return HEAP8[ptr];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': abort('to do getValue(i64) use WASM_BIGINT');
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      case '*': return HEAPU32[((ptr)>>2)];
      default: abort(`invalid type for getValue: ${type}`);
    }
  }

  var noExitRuntime = Module['noExitRuntime'] || true;

  var ptrToString = (ptr) => {
      assert(typeof ptr === 'number');
      // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
      ptr >>>= 0;
      return '0x' + ptr.toString(16).padStart(8, '0');
    };

  
    /**
     * @param {number} ptr
     * @param {number} value
     * @param {string} type
     */
  function setValue(ptr, value, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': HEAP8[ptr] = value; break;
      case 'i8': HEAP8[ptr] = value; break;
      case 'i16': HEAP16[((ptr)>>1)] = value; break;
      case 'i32': HEAP32[((ptr)>>2)] = value; break;
      case 'i64': abort('to do setValue(i64) use WASM_BIGINT');
      case 'float': HEAPF32[((ptr)>>2)] = value; break;
      case 'double': HEAPF64[((ptr)>>3)] = value; break;
      case '*': HEAPU32[((ptr)>>2)] = value; break;
      default: abort(`invalid type for setValue: ${type}`);
    }
  }

  var warnOnce = (text) => {
      warnOnce.shown ||= {};
      if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text);
      }
    };

  class ExceptionInfo {
      // excPtr - Thrown object pointer to wrap. Metadata pointer is calculated from it.
      constructor(excPtr) {
        this.excPtr = excPtr;
        this.ptr = excPtr - 24;
      }
  
      set_type(type) {
        HEAPU32[(((this.ptr)+(4))>>2)] = type;
      }
  
      get_type() {
        return HEAPU32[(((this.ptr)+(4))>>2)];
      }
  
      set_destructor(destructor) {
        HEAPU32[(((this.ptr)+(8))>>2)] = destructor;
      }
  
      get_destructor() {
        return HEAPU32[(((this.ptr)+(8))>>2)];
      }
  
      set_caught(caught) {
        caught = caught ? 1 : 0;
        HEAP8[(this.ptr)+(12)] = caught;
      }
  
      get_caught() {
        return HEAP8[(this.ptr)+(12)] != 0;
      }
  
      set_rethrown(rethrown) {
        rethrown = rethrown ? 1 : 0;
        HEAP8[(this.ptr)+(13)] = rethrown;
      }
  
      get_rethrown() {
        return HEAP8[(this.ptr)+(13)] != 0;
      }
  
      // Initialize native structure fields. Should be called once after allocated.
      init(type, destructor) {
        this.set_adjusted_ptr(0);
        this.set_type(type);
        this.set_destructor(destructor);
      }
  
      set_adjusted_ptr(adjustedPtr) {
        HEAPU32[(((this.ptr)+(16))>>2)] = adjustedPtr;
      }
  
      get_adjusted_ptr() {
        return HEAPU32[(((this.ptr)+(16))>>2)];
      }
  
      // Get pointer which is expected to be received by catch clause in C++ code. It may be adjusted
      // when the pointer is casted to some of the exception object base classes (e.g. when virtual
      // inheritance is used). When a pointer is thrown this method should return the thrown pointer
      // itself.
      get_exception_ptr() {
        // Work around a fastcomp bug, this code is still included for some reason in a build without
        // exceptions support.
        var isPointer = ___cxa_is_pointer_type(this.get_type());
        if (isPointer) {
          return HEAPU32[((this.excPtr)>>2)];
        }
        var adjusted = this.get_adjusted_ptr();
        if (adjusted !== 0) return adjusted;
        return this.excPtr;
      }
    }
  
  var exceptionLast = 0;
  
  var uncaughtExceptionCount = 0;
  var ___cxa_throw = (ptr, type, destructor) => {
      var info = new ExceptionInfo(ptr);
      // Initialize ExceptionInfo content after it was allocated in __cxa_allocate_exception.
      info.init(type, destructor);
      exceptionLast = ptr;
      uncaughtExceptionCount++;
      assert(false, 'Exception thrown, but exception catching is not enabled. Compile with -sNO_DISABLE_EXCEPTION_CATCHING or -sEXCEPTION_CATCHING_ALLOWED=[..] to catch.');
    };

  var __embind_register_bigint = (primitiveType, name, size, minRange, maxRange) => {};

  var embind_init_charCodes = () => {
      var codes = new Array(256);
      for (var i = 0; i < 256; ++i) {
          codes[i] = String.fromCharCode(i);
      }
      embind_charCodes = codes;
    };
  var embind_charCodes;
  var readLatin1String = (ptr) => {
      var ret = "";
      var c = ptr;
      while (HEAPU8[c]) {
          ret += embind_charCodes[HEAPU8[c++]];
      }
      return ret;
    };
  
  var awaitingDependencies = {
  };
  
  var registeredTypes = {
  };
  
  var typeDependencies = {
  };
  
  var BindingError;
  var throwBindingError = (message) => { throw new BindingError(message); };
  
  
  
  
  var InternalError;
  var throwInternalError = (message) => { throw new InternalError(message); };
  var whenDependentTypesAreResolved = (myTypes, dependentTypes, getTypeConverters) => {
      myTypes.forEach(function(type) {
          typeDependencies[type] = dependentTypes;
      });
  
      function onComplete(typeConverters) {
          var myTypeConverters = getTypeConverters(typeConverters);
          if (myTypeConverters.length !== myTypes.length) {
              throwInternalError('Mismatched type converter count');
          }
          for (var i = 0; i < myTypes.length; ++i) {
              registerType(myTypes[i], myTypeConverters[i]);
          }
      }
  
      var typeConverters = new Array(dependentTypes.length);
      var unregisteredTypes = [];
      var registered = 0;
      dependentTypes.forEach((dt, i) => {
        if (registeredTypes.hasOwnProperty(dt)) {
          typeConverters[i] = registeredTypes[dt];
        } else {
          unregisteredTypes.push(dt);
          if (!awaitingDependencies.hasOwnProperty(dt)) {
            awaitingDependencies[dt] = [];
          }
          awaitingDependencies[dt].push(() => {
            typeConverters[i] = registeredTypes[dt];
            ++registered;
            if (registered === unregisteredTypes.length) {
              onComplete(typeConverters);
            }
          });
        }
      });
      if (0 === unregisteredTypes.length) {
        onComplete(typeConverters);
      }
    };
  /** @param {Object=} options */
  function sharedRegisterType(rawType, registeredInstance, options = {}) {
      var name = registeredInstance.name;
      if (!rawType) {
        throwBindingError(`type "${name}" must have a positive integer typeid pointer`);
      }
      if (registeredTypes.hasOwnProperty(rawType)) {
        if (options.ignoreDuplicateRegistrations) {
          return;
        } else {
          throwBindingError(`Cannot register type '${name}' twice`);
        }
      }
  
      registeredTypes[rawType] = registeredInstance;
      delete typeDependencies[rawType];
  
      if (awaitingDependencies.hasOwnProperty(rawType)) {
        var callbacks = awaitingDependencies[rawType];
        delete awaitingDependencies[rawType];
        callbacks.forEach((cb) => cb());
      }
    }
  /** @param {Object=} options */
  function registerType(rawType, registeredInstance, options = {}) {
      if (!('argPackAdvance' in registeredInstance)) {
        throw new TypeError('registerType registeredInstance requires argPackAdvance');
      }
      return sharedRegisterType(rawType, registeredInstance, options);
    }
  
  var GenericWireTypeSize = 8;
  /** @suppress {globalThis} */
  var __embind_register_bool = (rawType, name, trueValue, falseValue) => {
      name = readLatin1String(name);
      registerType(rawType, {
          name,
          'fromWireType': function(wt) {
              // ambiguous emscripten ABI: sometimes return values are
              // true or false, and sometimes integers (0 or 1)
              return !!wt;
          },
          'toWireType': function(destructors, o) {
              return o ? trueValue : falseValue;
          },
          'argPackAdvance': GenericWireTypeSize,
          'readValueFromPointer': function(pointer) {
              return this['fromWireType'](HEAPU8[pointer]);
          },
          destructorFunction: null, // This type does not need a destructor
      });
    };

  
  
  var shallowCopyInternalPointer = (o) => {
      return {
        count: o.count,
        deleteScheduled: o.deleteScheduled,
        preservePointerOnDelete: o.preservePointerOnDelete,
        ptr: o.ptr,
        ptrType: o.ptrType,
        smartPtr: o.smartPtr,
        smartPtrType: o.smartPtrType,
      };
    };
  
  var throwInstanceAlreadyDeleted = (obj) => {
      function getInstanceTypeName(handle) {
        return handle.$$.ptrType.registeredClass.name;
      }
      throwBindingError(getInstanceTypeName(obj) + ' instance already deleted');
    };
  
  var finalizationRegistry = false;
  
  var detachFinalizer = (handle) => {};
  
  var runDestructor = ($$) => {
      if ($$.smartPtr) {
        $$.smartPtrType.rawDestructor($$.smartPtr);
      } else {
        $$.ptrType.registeredClass.rawDestructor($$.ptr);
      }
    };
  var releaseClassHandle = ($$) => {
      $$.count.value -= 1;
      var toDelete = 0 === $$.count.value;
      if (toDelete) {
        runDestructor($$);
      }
    };
  
  var downcastPointer = (ptr, ptrClass, desiredClass) => {
      if (ptrClass === desiredClass) {
        return ptr;
      }
      if (undefined === desiredClass.baseClass) {
        return null; // no conversion
      }
  
      var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
      if (rv === null) {
        return null;
      }
      return desiredClass.downcast(rv);
    };
  
  var registeredPointers = {
  };
  
  var getInheritedInstanceCount = () => Object.keys(registeredInstances).length;
  
  var getLiveInheritedInstances = () => {
      var rv = [];
      for (var k in registeredInstances) {
        if (registeredInstances.hasOwnProperty(k)) {
          rv.push(registeredInstances[k]);
        }
      }
      return rv;
    };
  
  var deletionQueue = [];
  var flushPendingDeletes = () => {
      while (deletionQueue.length) {
        var obj = deletionQueue.pop();
        obj.$$.deleteScheduled = false;
        obj['delete']();
      }
    };
  
  var delayFunction;
  
  
  var setDelayFunction = (fn) => {
      delayFunction = fn;
      if (deletionQueue.length && delayFunction) {
        delayFunction(flushPendingDeletes);
      }
    };
  var init_embind = () => {
      Module['getInheritedInstanceCount'] = getInheritedInstanceCount;
      Module['getLiveInheritedInstances'] = getLiveInheritedInstances;
      Module['flushPendingDeletes'] = flushPendingDeletes;
      Module['setDelayFunction'] = setDelayFunction;
    };
  var registeredInstances = {
  };
  
  var getBasestPointer = (class_, ptr) => {
      if (ptr === undefined) {
          throwBindingError('ptr should not be undefined');
      }
      while (class_.baseClass) {
          ptr = class_.upcast(ptr);
          class_ = class_.baseClass;
      }
      return ptr;
    };
  var getInheritedInstance = (class_, ptr) => {
      ptr = getBasestPointer(class_, ptr);
      return registeredInstances[ptr];
    };
  
  
  var makeClassHandle = (prototype, record) => {
      if (!record.ptrType || !record.ptr) {
        throwInternalError('makeClassHandle requires ptr and ptrType');
      }
      var hasSmartPtrType = !!record.smartPtrType;
      var hasSmartPtr = !!record.smartPtr;
      if (hasSmartPtrType !== hasSmartPtr) {
        throwInternalError('Both smartPtrType and smartPtr must be specified');
      }
      record.count = { value: 1 };
      return attachFinalizer(Object.create(prototype, {
        $$: {
          value: record,
          writable: true,
        },
      }));
    };
  /** @suppress {globalThis} */
  function RegisteredPointer_fromWireType(ptr) {
      // ptr is a raw pointer (or a raw smartpointer)
  
      // rawPointer is a maybe-null raw pointer
      var rawPointer = this.getPointee(ptr);
      if (!rawPointer) {
        this.destructor(ptr);
        return null;
      }
  
      var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
      if (undefined !== registeredInstance) {
        // JS object has been neutered, time to repopulate it
        if (0 === registeredInstance.$$.count.value) {
          registeredInstance.$$.ptr = rawPointer;
          registeredInstance.$$.smartPtr = ptr;
          return registeredInstance['clone']();
        } else {
          // else, just increment reference count on existing object
          // it already has a reference to the smart pointer
          var rv = registeredInstance['clone']();
          this.destructor(ptr);
          return rv;
        }
      }
  
      function makeDefaultHandle() {
        if (this.isSmartPointer) {
          return makeClassHandle(this.registeredClass.instancePrototype, {
            ptrType: this.pointeeType,
            ptr: rawPointer,
            smartPtrType: this,
            smartPtr: ptr,
          });
        } else {
          return makeClassHandle(this.registeredClass.instancePrototype, {
            ptrType: this,
            ptr,
          });
        }
      }
  
      var actualType = this.registeredClass.getActualType(rawPointer);
      var registeredPointerRecord = registeredPointers[actualType];
      if (!registeredPointerRecord) {
        return makeDefaultHandle.call(this);
      }
  
      var toType;
      if (this.isConst) {
        toType = registeredPointerRecord.constPointerType;
      } else {
        toType = registeredPointerRecord.pointerType;
      }
      var dp = downcastPointer(
          rawPointer,
          this.registeredClass,
          toType.registeredClass);
      if (dp === null) {
        return makeDefaultHandle.call(this);
      }
      if (this.isSmartPointer) {
        return makeClassHandle(toType.registeredClass.instancePrototype, {
          ptrType: toType,
          ptr: dp,
          smartPtrType: this,
          smartPtr: ptr,
        });
      } else {
        return makeClassHandle(toType.registeredClass.instancePrototype, {
          ptrType: toType,
          ptr: dp,
        });
      }
    }
  var attachFinalizer = (handle) => {
      if ('undefined' === typeof FinalizationRegistry) {
        attachFinalizer = (handle) => handle;
        return handle;
      }
      // If the running environment has a FinalizationRegistry (see
      // https://github.com/tc39/proposal-weakrefs), then attach finalizers
      // for class handles.  We check for the presence of FinalizationRegistry
      // at run-time, not build-time.
      finalizationRegistry = new FinalizationRegistry((info) => {
        console.warn(info.leakWarning.stack.replace(/^Error: /, ''));
        releaseClassHandle(info.$$);
      });
      attachFinalizer = (handle) => {
        var $$ = handle.$$;
        var hasSmartPtr = !!$$.smartPtr;
        if (hasSmartPtr) {
          // We should not call the destructor on raw pointers in case other code expects the pointee to live
          var info = { $$: $$ };
          // Create a warning as an Error instance in advance so that we can store
          // the current stacktrace and point to it when / if a leak is detected.
          // This is more useful than the empty stacktrace of `FinalizationRegistry`
          // callback.
          var cls = $$.ptrType.registeredClass;
          info.leakWarning = new Error(`Embind found a leaked C++ instance ${cls.name} <${ptrToString($$.ptr)}>.\n` +
          "We'll free it automatically in this case, but this functionality is not reliable across various environments.\n" +
          "Make sure to invoke .delete() manually once you're done with the instance instead.\n" +
          "Originally allocated"); // `.stack` will add "at ..." after this sentence
          if ('captureStackTrace' in Error) {
            Error.captureStackTrace(info.leakWarning, RegisteredPointer_fromWireType);
          }
          finalizationRegistry.register(handle, info, handle);
        }
        return handle;
      };
      detachFinalizer = (handle) => finalizationRegistry.unregister(handle);
      return attachFinalizer(handle);
    };
  
  
  
  var init_ClassHandle = () => {
      Object.assign(ClassHandle.prototype, {
        "isAliasOf"(other) {
          if (!(this instanceof ClassHandle)) {
            return false;
          }
          if (!(other instanceof ClassHandle)) {
            return false;
          }
  
          var leftClass = this.$$.ptrType.registeredClass;
          var left = this.$$.ptr;
          other.$$ = /** @type {Object} */ (other.$$);
          var rightClass = other.$$.ptrType.registeredClass;
          var right = other.$$.ptr;
  
          while (leftClass.baseClass) {
            left = leftClass.upcast(left);
            leftClass = leftClass.baseClass;
          }
  
          while (rightClass.baseClass) {
            right = rightClass.upcast(right);
            rightClass = rightClass.baseClass;
          }
  
          return leftClass === rightClass && left === right;
        },
  
        "clone"() {
          if (!this.$$.ptr) {
            throwInstanceAlreadyDeleted(this);
          }
  
          if (this.$$.preservePointerOnDelete) {
            this.$$.count.value += 1;
            return this;
          } else {
            var clone = attachFinalizer(Object.create(Object.getPrototypeOf(this), {
              $$: {
                value: shallowCopyInternalPointer(this.$$),
              }
            }));
  
            clone.$$.count.value += 1;
            clone.$$.deleteScheduled = false;
            return clone;
          }
        },
  
        "delete"() {
          if (!this.$$.ptr) {
            throwInstanceAlreadyDeleted(this);
          }
  
          if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
            throwBindingError('Object already scheduled for deletion');
          }
  
          detachFinalizer(this);
          releaseClassHandle(this.$$);
  
          if (!this.$$.preservePointerOnDelete) {
            this.$$.smartPtr = undefined;
            this.$$.ptr = undefined;
          }
        },
  
        "isDeleted"() {
          return !this.$$.ptr;
        },
  
        "deleteLater"() {
          if (!this.$$.ptr) {
            throwInstanceAlreadyDeleted(this);
          }
          if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
            throwBindingError('Object already scheduled for deletion');
          }
          deletionQueue.push(this);
          if (deletionQueue.length === 1 && delayFunction) {
            delayFunction(flushPendingDeletes);
          }
          this.$$.deleteScheduled = true;
          return this;
        },
      });
    };
  /** @constructor */
  function ClassHandle() {
    }
  
  var createNamedFunction = (name, body) => Object.defineProperty(body, 'name', {
      value: name
    });
  
  
  var ensureOverloadTable = (proto, methodName, humanName) => {
      if (undefined === proto[methodName].overloadTable) {
        var prevFunc = proto[methodName];
        // Inject an overload resolver function that routes to the appropriate overload based on the number of arguments.
        proto[methodName] = function(...args) {
          // TODO This check can be removed in -O3 level "unsafe" optimizations.
          if (!proto[methodName].overloadTable.hasOwnProperty(args.length)) {
            throwBindingError(`Function '${humanName}' called with an invalid number of arguments (${args.length}) - expects one of (${proto[methodName].overloadTable})!`);
          }
          return proto[methodName].overloadTable[args.length].apply(this, args);
        };
        // Move the previous function into the overload table.
        proto[methodName].overloadTable = [];
        proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
      }
    };
  
  /** @param {number=} numArguments */
  var exposePublicSymbol = (name, value, numArguments) => {
      if (Module.hasOwnProperty(name)) {
        if (undefined === numArguments || (undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments])) {
          throwBindingError(`Cannot register public name '${name}' twice`);
        }
  
        // We are exposing a function with the same name as an existing function. Create an overload table and a function selector
        // that routes between the two.
        ensureOverloadTable(Module, name, name);
        if (Module.hasOwnProperty(numArguments)) {
          throwBindingError(`Cannot register multiple overloads of a function with the same number of arguments (${numArguments})!`);
        }
        // Add the new function into the overload table.
        Module[name].overloadTable[numArguments] = value;
      }
      else {
        Module[name] = value;
        if (undefined !== numArguments) {
          Module[name].numArguments = numArguments;
        }
      }
    };
  
  var char_0 = 48;
  
  var char_9 = 57;
  var makeLegalFunctionName = (name) => {
      if (undefined === name) {
        return '_unknown';
      }
      name = name.replace(/[^a-zA-Z0-9_]/g, '$');
      var f = name.charCodeAt(0);
      if (f >= char_0 && f <= char_9) {
        return `_${name}`;
      }
      return name;
    };
  
  
  /** @constructor */
  function RegisteredClass(name,
                               constructor,
                               instancePrototype,
                               rawDestructor,
                               baseClass,
                               getActualType,
                               upcast,
                               downcast) {
      this.name = name;
      this.constructor = constructor;
      this.instancePrototype = instancePrototype;
      this.rawDestructor = rawDestructor;
      this.baseClass = baseClass;
      this.getActualType = getActualType;
      this.upcast = upcast;
      this.downcast = downcast;
      this.pureVirtualFunctions = [];
    }
  
  
  var upcastPointer = (ptr, ptrClass, desiredClass) => {
      while (ptrClass !== desiredClass) {
        if (!ptrClass.upcast) {
          throwBindingError(`Expected null or instance of ${desiredClass.name}, got an instance of ${ptrClass.name}`);
        }
        ptr = ptrClass.upcast(ptr);
        ptrClass = ptrClass.baseClass;
      }
      return ptr;
    };
  /** @suppress {globalThis} */
  function constNoSmartPtrRawPointerToWireType(destructors, handle) {
      if (handle === null) {
        if (this.isReference) {
          throwBindingError(`null is not a valid ${this.name}`);
        }
        return 0;
      }
  
      if (!handle.$$) {
        throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);
      }
      if (!handle.$$.ptr) {
        throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      return ptr;
    }
  
  
  /** @suppress {globalThis} */
  function genericPointerToWireType(destructors, handle) {
      var ptr;
      if (handle === null) {
        if (this.isReference) {
          throwBindingError(`null is not a valid ${this.name}`);
        }
  
        if (this.isSmartPointer) {
          ptr = this.rawConstructor();
          if (destructors !== null) {
            destructors.push(this.rawDestructor, ptr);
          }
          return ptr;
        } else {
          return 0;
        }
      }
  
      if (!handle || !handle.$$) {
        throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);
      }
      if (!handle.$$.ptr) {
        throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`);
      }
      if (!this.isConst && handle.$$.ptrType.isConst) {
        throwBindingError(`Cannot convert argument of type ${(handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name)} to parameter type ${this.name}`);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
  
      if (this.isSmartPointer) {
        // TODO: this is not strictly true
        // We could support BY_EMVAL conversions from raw pointers to smart pointers
        // because the smart pointer can hold a reference to the handle
        if (undefined === handle.$$.smartPtr) {
          throwBindingError('Passing raw pointer to smart pointer is illegal');
        }
  
        switch (this.sharingPolicy) {
          case 0: // NONE
            // no upcasting
            if (handle.$$.smartPtrType === this) {
              ptr = handle.$$.smartPtr;
            } else {
              throwBindingError(`Cannot convert argument of type ${(handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name)} to parameter type ${this.name}`);
            }
            break;
  
          case 1: // INTRUSIVE
            ptr = handle.$$.smartPtr;
            break;
  
          case 2: // BY_EMVAL
            if (handle.$$.smartPtrType === this) {
              ptr = handle.$$.smartPtr;
            } else {
              var clonedHandle = handle['clone']();
              ptr = this.rawShare(
                ptr,
                Emval.toHandle(() => clonedHandle['delete']())
              );
              if (destructors !== null) {
                destructors.push(this.rawDestructor, ptr);
              }
            }
            break;
  
          default:
            throwBindingError('Unsupporting sharing policy');
        }
      }
      return ptr;
    }
  
  
  /** @suppress {globalThis} */
  function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
      if (handle === null) {
        if (this.isReference) {
          throwBindingError(`null is not a valid ${this.name}`);
        }
        return 0;
      }
  
      if (!handle.$$) {
        throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);
      }
      if (!handle.$$.ptr) {
        throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`);
      }
      if (handle.$$.ptrType.isConst) {
          throwBindingError(`Cannot convert argument of type ${handle.$$.ptrType.name} to parameter type ${this.name}`);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      return ptr;
    }
  
  
  /** @suppress {globalThis} */
  function readPointer(pointer) {
      return this['fromWireType'](HEAPU32[((pointer)>>2)]);
    }
  
  
  var init_RegisteredPointer = () => {
      Object.assign(RegisteredPointer.prototype, {
        getPointee(ptr) {
          if (this.rawGetPointee) {
            ptr = this.rawGetPointee(ptr);
          }
          return ptr;
        },
        destructor(ptr) {
          this.rawDestructor?.(ptr);
        },
        'argPackAdvance': GenericWireTypeSize,
        'readValueFromPointer': readPointer,
        'fromWireType': RegisteredPointer_fromWireType,
      });
    };
  /** @constructor
      @param {*=} pointeeType,
      @param {*=} sharingPolicy,
      @param {*=} rawGetPointee,
      @param {*=} rawConstructor,
      @param {*=} rawShare,
      @param {*=} rawDestructor,
       */
  function RegisteredPointer(
      name,
      registeredClass,
      isReference,
      isConst,
  
      // smart pointer properties
      isSmartPointer,
      pointeeType,
      sharingPolicy,
      rawGetPointee,
      rawConstructor,
      rawShare,
      rawDestructor
    ) {
      this.name = name;
      this.registeredClass = registeredClass;
      this.isReference = isReference;
      this.isConst = isConst;
  
      // smart pointer properties
      this.isSmartPointer = isSmartPointer;
      this.pointeeType = pointeeType;
      this.sharingPolicy = sharingPolicy;
      this.rawGetPointee = rawGetPointee;
      this.rawConstructor = rawConstructor;
      this.rawShare = rawShare;
      this.rawDestructor = rawDestructor;
  
      if (!isSmartPointer && registeredClass.baseClass === undefined) {
        if (isConst) {
          this['toWireType'] = constNoSmartPtrRawPointerToWireType;
          this.destructorFunction = null;
        } else {
          this['toWireType'] = nonConstNoSmartPtrRawPointerToWireType;
          this.destructorFunction = null;
        }
      } else {
        this['toWireType'] = genericPointerToWireType;
        // Here we must leave this.destructorFunction undefined, since whether genericPointerToWireType returns
        // a pointer that needs to be freed up is runtime-dependent, and cannot be evaluated at registration time.
        // TODO: Create an alternative mechanism that allows removing the use of var destructors = []; array in
        //       craftInvokerFunction altogether.
      }
    }
  
  /** @param {number=} numArguments */
  var replacePublicSymbol = (name, value, numArguments) => {
      if (!Module.hasOwnProperty(name)) {
        throwInternalError('Replacing nonexistent public symbol');
      }
      // If there's an overload table for this symbol, replace the symbol in the overload table instead.
      if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
        Module[name].overloadTable[numArguments] = value;
      }
      else {
        Module[name] = value;
        Module[name].argCount = numArguments;
      }
    };
  
  
  
  var dynCallLegacy = (sig, ptr, args) => {
      assert(('dynCall_' + sig) in Module, `bad function pointer type - dynCall function not found for sig '${sig}'`);
      if (args?.length) {
        // j (64-bit integer) must be passed in as two numbers [low 32, high 32].
        assert(args.length === sig.substring(1).replace(/j/g, '--').length);
      } else {
        assert(sig.length == 1);
      }
      var f = Module['dynCall_' + sig];
      return f(ptr, ...args);
    };
  
  var wasmTableMirror = [];
  
  var wasmTable;
  var getWasmTableEntry = (funcPtr) => {
      var func = wasmTableMirror[funcPtr];
      if (!func) {
        if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
        wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
      }
      assert(wasmTable.get(funcPtr) == func, 'JavaScript-side Wasm function table mirror is out of date!');
      return func;
    };
  
  var dynCall = (sig, ptr, args = []) => {
      // Without WASM_BIGINT support we cannot directly call function with i64 as
      // part of their signature, so we rely on the dynCall functions generated by
      // wasm-emscripten-finalize
      if (sig.includes('j')) {
        return dynCallLegacy(sig, ptr, args);
      }
      assert(getWasmTableEntry(ptr), `missing table entry in dynCall: ${ptr}`);
      var rtn = getWasmTableEntry(ptr)(...args);
      return rtn;
    };
  var getDynCaller = (sig, ptr) => {
      assert(sig.includes('j') || sig.includes('p'), 'getDynCaller should only be called with i64 sigs')
      return (...args) => dynCall(sig, ptr, args);
    };
  
  
  var embind__requireFunction = (signature, rawFunction) => {
      signature = readLatin1String(signature);
  
      function makeDynCaller() {
        if (signature.includes('j')) {
          return getDynCaller(signature, rawFunction);
        }
        return getWasmTableEntry(rawFunction);
      }
  
      var fp = makeDynCaller();
      if (typeof fp != "function") {
          throwBindingError(`unknown function pointer with signature ${signature}: ${rawFunction}`);
      }
      return fp;
    };
  
  
  
  var extendError = (baseErrorType, errorName) => {
      var errorClass = createNamedFunction(errorName, function(message) {
        this.name = errorName;
        this.message = message;
  
        var stack = (new Error(message)).stack;
        if (stack !== undefined) {
          this.stack = this.toString() + '\n' +
              stack.replace(/^Error(:[^\n]*)?\n/, '');
        }
      });
      errorClass.prototype = Object.create(baseErrorType.prototype);
      errorClass.prototype.constructor = errorClass;
      errorClass.prototype.toString = function() {
        if (this.message === undefined) {
          return this.name;
        } else {
          return `${this.name}: ${this.message}`;
        }
      };
  
      return errorClass;
    };
  var UnboundTypeError;
  
  
  
  var getTypeName = (type) => {
      var ptr = ___getTypeName(type);
      var rv = readLatin1String(ptr);
      _free(ptr);
      return rv;
    };
  var throwUnboundTypeError = (message, types) => {
      var unboundTypes = [];
      var seen = {};
      function visit(type) {
        if (seen[type]) {
          return;
        }
        if (registeredTypes[type]) {
          return;
        }
        if (typeDependencies[type]) {
          typeDependencies[type].forEach(visit);
          return;
        }
        unboundTypes.push(type);
        seen[type] = true;
      }
      types.forEach(visit);
  
      throw new UnboundTypeError(`${message}: ` + unboundTypes.map(getTypeName).join([', ']));
    };
  
  var __embind_register_class = (rawType,
                             rawPointerType,
                             rawConstPointerType,
                             baseClassRawType,
                             getActualTypeSignature,
                             getActualType,
                             upcastSignature,
                             upcast,
                             downcastSignature,
                             downcast,
                             name,
                             destructorSignature,
                             rawDestructor) => {
      name = readLatin1String(name);
      getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
      upcast &&= embind__requireFunction(upcastSignature, upcast);
      downcast &&= embind__requireFunction(downcastSignature, downcast);
      rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
      var legalFunctionName = makeLegalFunctionName(name);
  
      exposePublicSymbol(legalFunctionName, function() {
        // this code cannot run if baseClassRawType is zero
        throwUnboundTypeError(`Cannot construct ${name} due to unbound types`, [baseClassRawType]);
      });
  
      whenDependentTypesAreResolved(
        [rawType, rawPointerType, rawConstPointerType],
        baseClassRawType ? [baseClassRawType] : [],
        (base) => {
          base = base[0];
  
          var baseClass;
          var basePrototype;
          if (baseClassRawType) {
            baseClass = base.registeredClass;
            basePrototype = baseClass.instancePrototype;
          } else {
            basePrototype = ClassHandle.prototype;
          }
  
          var constructor = createNamedFunction(name, function(...args) {
            if (Object.getPrototypeOf(this) !== instancePrototype) {
              throw new BindingError("Use 'new' to construct " + name);
            }
            if (undefined === registeredClass.constructor_body) {
              throw new BindingError(name + " has no accessible constructor");
            }
            var body = registeredClass.constructor_body[args.length];
            if (undefined === body) {
              throw new BindingError(`Tried to invoke ctor of ${name} with invalid number of parameters (${args.length}) - expected (${Object.keys(registeredClass.constructor_body).toString()}) parameters instead!`);
            }
            return body.apply(this, args);
          });
  
          var instancePrototype = Object.create(basePrototype, {
            constructor: { value: constructor },
          });
  
          constructor.prototype = instancePrototype;
  
          var registeredClass = new RegisteredClass(name,
                                                    constructor,
                                                    instancePrototype,
                                                    rawDestructor,
                                                    baseClass,
                                                    getActualType,
                                                    upcast,
                                                    downcast);
  
          if (registeredClass.baseClass) {
            // Keep track of class hierarchy. Used to allow sub-classes to inherit class functions.
            registeredClass.baseClass.__derivedClasses ??= [];
  
            registeredClass.baseClass.__derivedClasses.push(registeredClass);
          }
  
          var referenceConverter = new RegisteredPointer(name,
                                                         registeredClass,
                                                         true,
                                                         false,
                                                         false);
  
          var pointerConverter = new RegisteredPointer(name + '*',
                                                       registeredClass,
                                                       false,
                                                       false,
                                                       false);
  
          var constPointerConverter = new RegisteredPointer(name + ' const*',
                                                            registeredClass,
                                                            false,
                                                            true,
                                                            false);
  
          registeredPointers[rawType] = {
            pointerType: pointerConverter,
            constPointerType: constPointerConverter
          };
  
          replacePublicSymbol(legalFunctionName, constructor);
  
          return [referenceConverter, pointerConverter, constPointerConverter];
        }
      );
    };

  var heap32VectorToArray = (count, firstElement) => {
      var array = [];
      for (var i = 0; i < count; i++) {
        // TODO(https://github.com/emscripten-core/emscripten/issues/17310):
        // Find a way to hoist the `>> 2` or `>> 3` out of this loop.
        array.push(HEAPU32[(((firstElement)+(i * 4))>>2)]);
      }
      return array;
    };
  
  
  var runDestructors = (destructors) => {
      while (destructors.length) {
        var ptr = destructors.pop();
        var del = destructors.pop();
        del(ptr);
      }
    };
  
  
  
  
  
  
  
  function usesDestructorStack(argTypes) {
      // Skip return value at index 0 - it's not deleted here.
      for (var i = 1; i < argTypes.length; ++i) {
        // The type does not define a destructor function - must use dynamic stack
        if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
          return true;
        }
      }
      return false;
    }
  
  function newFunc(constructor, argumentList) {
      if (!(constructor instanceof Function)) {
        throw new TypeError(`new_ called with constructor type ${typeof(constructor)} which is not a function`);
      }
      /*
       * Previously, the following line was just:
       *   function dummy() {};
       * Unfortunately, Chrome was preserving 'dummy' as the object's name, even
       * though at creation, the 'dummy' has the correct constructor name.  Thus,
       * objects created with IMVU.new would show up in the debugger as 'dummy',
       * which isn't very helpful.  Using IMVU.createNamedFunction addresses the
       * issue.  Doubly-unfortunately, there's no way to write a test for this
       * behavior.  -NRD 2013.02.22
       */
      var dummy = createNamedFunction(constructor.name || 'unknownFunctionName', function(){});
      dummy.prototype = constructor.prototype;
      var obj = new dummy;
  
      var r = constructor.apply(obj, argumentList);
      return (r instanceof Object) ? r : obj;
    }
  
  function createJsInvoker(argTypes, isClassMethodFunc, returns, isAsync) {
      var needsDestructorStack = usesDestructorStack(argTypes);
      var argCount = argTypes.length;
      var argsList = "";
      var argsListWired = "";
      for (var i = 0; i < argCount - 2; ++i) {
        argsList += (i!==0?", ":"")+"arg"+i;
        argsListWired += (i!==0?", ":"")+"arg"+i+"Wired";
      }
  
      var invokerFnBody = `
        return function (${argsList}) {
        if (arguments.length !== ${argCount - 2}) {
          throwBindingError('function ' + humanName + ' called with ' + arguments.length + ' arguments, expected ${argCount - 2}');
        }`;
  
      if (needsDestructorStack) {
        invokerFnBody += "var destructors = [];\n";
      }
  
      var dtorStack = needsDestructorStack ? "destructors" : "null";
      var args1 = ["humanName", "throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
  
      if (isClassMethodFunc) {
        invokerFnBody += "var thisWired = classParam['toWireType']("+dtorStack+", this);\n";
      }
  
      for (var i = 0; i < argCount - 2; ++i) {
        invokerFnBody += "var arg"+i+"Wired = argType"+i+"['toWireType']("+dtorStack+", arg"+i+");\n";
        args1.push("argType"+i);
      }
  
      if (isClassMethodFunc) {
        argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
      }
  
      invokerFnBody +=
          (returns || isAsync ? "var rv = ":"") + "invoker(fn"+(argsListWired.length>0?", ":"")+argsListWired+");\n";
  
      var returnVal = returns ? "rv" : "";
  
      if (needsDestructorStack) {
        invokerFnBody += "runDestructors(destructors);\n";
      } else {
        for (var i = isClassMethodFunc?1:2; i < argTypes.length; ++i) { // Skip return value at index 0 - it's not deleted here. Also skip class type if not a method.
          var paramName = (i === 1 ? "thisWired" : ("arg"+(i - 2)+"Wired"));
          if (argTypes[i].destructorFunction !== null) {
            invokerFnBody += `${paramName}_dtor(${paramName});\n`;
            args1.push(`${paramName}_dtor`);
          }
        }
      }
  
      if (returns) {
        invokerFnBody += "var ret = retType['fromWireType'](rv);\n" +
                         "return ret;\n";
      } else {
      }
  
      invokerFnBody += "}\n";
  
      invokerFnBody = `if (arguments.length !== ${args1.length}){ throw new Error(humanName + "Expected ${args1.length} closure arguments " + arguments.length + " given."); }\n${invokerFnBody}`;
      return [args1, invokerFnBody];
    }
  function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc, /** boolean= */ isAsync) {
      // humanName: a human-readable string name for the function to be generated.
      // argTypes: An array that contains the embind type objects for all types in the function signature.
      //    argTypes[0] is the type object for the function return value.
      //    argTypes[1] is the type object for function this object/class type, or null if not crafting an invoker for a class method.
      //    argTypes[2...] are the actual function parameters.
      // classType: The embind type object for the class to be bound, or null if this is not a method of a class.
      // cppInvokerFunc: JS Function object to the C++-side function that interops into C++ code.
      // cppTargetFunc: Function pointer (an integer to FUNCTION_TABLE) to the target C++ function the cppInvokerFunc will end up calling.
      // isAsync: Optional. If true, returns an async function. Async bindings are only supported with JSPI.
      var argCount = argTypes.length;
  
      if (argCount < 2) {
        throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
      }
  
      assert(!isAsync, 'Async bindings are only supported with JSPI.');
  
      var isClassMethodFunc = (argTypes[1] !== null && classType !== null);
  
      // Free functions with signature "void function()" do not need an invoker that marshalls between wire types.
  // TODO: This omits argument count check - enable only at -O3 or similar.
  //    if (ENABLE_UNSAFE_OPTS && argCount == 2 && argTypes[0].name == "void" && !isClassMethodFunc) {
  //       return FUNCTION_TABLE[fn];
  //    }
  
      // Determine if we need to use a dynamic stack to store the destructors for the function parameters.
      // TODO: Remove this completely once all function invokers are being dynamically generated.
      var needsDestructorStack = usesDestructorStack(argTypes);
  
      var returns = (argTypes[0].name !== "void");
  
    // Builld the arguments that will be passed into the closure around the invoker
    // function.
    var closureArgs = [humanName, throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
    for (var i = 0; i < argCount - 2; ++i) {
      closureArgs.push(argTypes[i+2]);
    }
    if (!needsDestructorStack) {
      for (var i = isClassMethodFunc?1:2; i < argTypes.length; ++i) { // Skip return value at index 0 - it's not deleted here. Also skip class type if not a method.
        if (argTypes[i].destructorFunction !== null) {
          closureArgs.push(argTypes[i].destructorFunction);
        }
      }
    }
  
    let [args, invokerFnBody] = createJsInvoker(argTypes, isClassMethodFunc, returns, isAsync);
    args.push(invokerFnBody);
    var invokerFn = newFunc(Function, args)(...closureArgs);
      return createNamedFunction(humanName, invokerFn);
    }
  var __embind_register_class_constructor = (
      rawClassType,
      argCount,
      rawArgTypesAddr,
      invokerSignature,
      invoker,
      rawConstructor
    ) => {
      assert(argCount > 0);
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      invoker = embind__requireFunction(invokerSignature, invoker);
      var args = [rawConstructor];
      var destructors = [];
  
      whenDependentTypesAreResolved([], [rawClassType], (classType) => {
        classType = classType[0];
        var humanName = `constructor ${classType.name}`;
  
        if (undefined === classType.registeredClass.constructor_body) {
          classType.registeredClass.constructor_body = [];
        }
        if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
          throw new BindingError(`Cannot register multiple constructors with identical number of parameters (${argCount-1}) for class '${classType.name}'! Overload resolution is currently only performed using the parameter count, not actual type info!`);
        }
        classType.registeredClass.constructor_body[argCount - 1] = () => {
          throwUnboundTypeError(`Cannot construct ${classType.name} due to unbound types`, rawArgTypes);
        };
  
        whenDependentTypesAreResolved([], rawArgTypes, (argTypes) => {
          // Insert empty slot for context type (argTypes[1]).
          argTypes.splice(1, 0, null);
          classType.registeredClass.constructor_body[argCount - 1] = craftInvokerFunction(humanName, argTypes, null, invoker, rawConstructor);
          return [];
        });
        return [];
      });
    };

  
  
  
  
  
  
  var getFunctionName = (signature) => {
      signature = signature.trim();
      const argsIndex = signature.indexOf("(");
      if (argsIndex !== -1) {
        assert(signature[signature.length - 1] == ")", "Parentheses for argument names should match.");
        return signature.substr(0, argsIndex);
      } else {
        return signature;
      }
    };
  var __embind_register_class_function = (rawClassType,
                                      methodName,
                                      argCount,
                                      rawArgTypesAddr, // [ReturnType, ThisType, Args...]
                                      invokerSignature,
                                      rawInvoker,
                                      context,
                                      isPureVirtual,
                                      isAsync) => {
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      methodName = readLatin1String(methodName);
      methodName = getFunctionName(methodName);
      rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
  
      whenDependentTypesAreResolved([], [rawClassType], (classType) => {
        classType = classType[0];
        var humanName = `${classType.name}.${methodName}`;
  
        if (methodName.startsWith("@@")) {
          methodName = Symbol[methodName.substring(2)];
        }
  
        if (isPureVirtual) {
          classType.registeredClass.pureVirtualFunctions.push(methodName);
        }
  
        function unboundTypesHandler() {
          throwUnboundTypeError(`Cannot call ${humanName} due to unbound types`, rawArgTypes);
        }
  
        var proto = classType.registeredClass.instancePrototype;
        var method = proto[methodName];
        if (undefined === method || (undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2)) {
          // This is the first overload to be registered, OR we are replacing a
          // function in the base class with a function in the derived class.
          unboundTypesHandler.argCount = argCount - 2;
          unboundTypesHandler.className = classType.name;
          proto[methodName] = unboundTypesHandler;
        } else {
          // There was an existing function with the same name registered. Set up
          // a function overload routing table.
          ensureOverloadTable(proto, methodName, humanName);
          proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
        }
  
        whenDependentTypesAreResolved([], rawArgTypes, (argTypes) => {
          var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context, isAsync);
  
          // Replace the initial unbound-handler-stub function with the
          // appropriate member function, now that all types are resolved. If
          // multiple overloads are registered for this function, the function
          // goes into an overload table.
          if (undefined === proto[methodName].overloadTable) {
            // Set argCount in case an overload is registered later
            memberFunction.argCount = argCount - 2;
            proto[methodName] = memberFunction;
          } else {
            proto[methodName].overloadTable[argCount - 2] = memberFunction;
          }
  
          return [];
        });
        return [];
      });
    };

  
  var emval_freelist = [];
  
  var emval_handles = [];
  var __emval_decref = (handle) => {
      if (handle > 9 && 0 === --emval_handles[handle + 1]) {
        assert(emval_handles[handle] !== undefined, `Decref for unallocated handle.`);
        emval_handles[handle] = undefined;
        emval_freelist.push(handle);
      }
    };
  
  
  
  
  
  var count_emval_handles = () => {
      return emval_handles.length / 2 - 5 - emval_freelist.length;
    };
  
  var init_emval = () => {
      // reserve 0 and some special values. These never get de-allocated.
      emval_handles.push(
        0, 1,
        undefined, 1,
        null, 1,
        true, 1,
        false, 1,
      );
      assert(emval_handles.length === 5 * 2);
      Module['count_emval_handles'] = count_emval_handles;
    };
  var Emval = {
  toValue:(handle) => {
        if (!handle) {
            throwBindingError('Cannot use deleted val. handle = ' + handle);
        }
        // handle 2 is supposed to be `undefined`.
        assert(handle === 2 || emval_handles[handle] !== undefined && handle % 2 === 0, `invalid handle: ${handle}`);
        return emval_handles[handle];
      },
  toHandle:(value) => {
        switch (value) {
          case undefined: return 2;
          case null: return 4;
          case true: return 6;
          case false: return 8;
          default:{
            const handle = emval_freelist.pop() || emval_handles.length;
            emval_handles[handle] = value;
            emval_handles[handle + 1] = 1;
            return handle;
          }
        }
      },
  };
  
  
  var EmValType = {
      name: 'emscripten::val',
      'fromWireType': (handle) => {
        var rv = Emval.toValue(handle);
        __emval_decref(handle);
        return rv;
      },
      'toWireType': (destructors, value) => Emval.toHandle(value),
      'argPackAdvance': GenericWireTypeSize,
      'readValueFromPointer': readPointer,
      destructorFunction: null, // This type does not need a destructor
  
      // TODO: do we need a deleteObject here?  write a test where
      // emval is passed into JS via an interface
    };
  var __embind_register_emval = (rawType) => registerType(rawType, EmValType);

  var embindRepr = (v) => {
      if (v === null) {
          return 'null';
      }
      var t = typeof v;
      if (t === 'object' || t === 'array' || t === 'function') {
          return v.toString();
      } else {
          return '' + v;
      }
    };
  
  var floatReadValueFromPointer = (name, width) => {
      switch (width) {
          case 4: return function(pointer) {
              return this['fromWireType'](HEAPF32[((pointer)>>2)]);
          };
          case 8: return function(pointer) {
              return this['fromWireType'](HEAPF64[((pointer)>>3)]);
          };
          default:
              throw new TypeError(`invalid float width (${width}): ${name}`);
      }
    };
  
  
  var __embind_register_float = (rawType, name, size) => {
      name = readLatin1String(name);
      registerType(rawType, {
        name,
        'fromWireType': (value) => value,
        'toWireType': (destructors, value) => {
          if (typeof value != "number" && typeof value != "boolean") {
            throw new TypeError(`Cannot convert ${embindRepr(value)} to ${this.name}`);
          }
          // The VM will perform JS to Wasm value conversion, according to the spec:
          // https://www.w3.org/TR/wasm-js-api-1/#towebassemblyvalue
          return value;
        },
        'argPackAdvance': GenericWireTypeSize,
        'readValueFromPointer': floatReadValueFromPointer(name, size),
        destructorFunction: null, // This type does not need a destructor
      });
    };

  
  var integerReadValueFromPointer = (name, width, signed) => {
      // integers are quite common, so generate very specialized functions
      switch (width) {
          case 1: return signed ?
              (pointer) => HEAP8[pointer] :
              (pointer) => HEAPU8[pointer];
          case 2: return signed ?
              (pointer) => HEAP16[((pointer)>>1)] :
              (pointer) => HEAPU16[((pointer)>>1)]
          case 4: return signed ?
              (pointer) => HEAP32[((pointer)>>2)] :
              (pointer) => HEAPU32[((pointer)>>2)]
          default:
              throw new TypeError(`invalid integer width (${width}): ${name}`);
      }
    };
  
  
  /** @suppress {globalThis} */
  var __embind_register_integer = (primitiveType, name, size, minRange, maxRange) => {
      name = readLatin1String(name);
      // LLVM doesn't have signed and unsigned 32-bit types, so u32 literals come
      // out as 'i32 -1'. Always treat those as max u32.
      if (maxRange === -1) {
        maxRange = 4294967295;
      }
  
      var fromWireType = (value) => value;
  
      if (minRange === 0) {
        var bitshift = 32 - 8*size;
        fromWireType = (value) => (value << bitshift) >>> bitshift;
      }
  
      var isUnsignedType = (name.includes('unsigned'));
      var checkAssertions = (value, toTypeName) => {
        if (typeof value != "number" && typeof value != "boolean") {
          throw new TypeError(`Cannot convert "${embindRepr(value)}" to ${toTypeName}`);
        }
        if (value < minRange || value > maxRange) {
          throw new TypeError(`Passing a number "${embindRepr(value)}" from JS side to C/C++ side to an argument of type "${name}", which is outside the valid range [${minRange}, ${maxRange}]!`);
        }
      }
      var toWireType;
      if (isUnsignedType) {
        toWireType = function(destructors, value) {
          checkAssertions(value, this.name);
          return value >>> 0;
        }
      } else {
        toWireType = function(destructors, value) {
          checkAssertions(value, this.name);
          // The VM will perform JS to Wasm value conversion, according to the spec:
          // https://www.w3.org/TR/wasm-js-api-1/#towebassemblyvalue
          return value;
        }
      }
      registerType(primitiveType, {
        name,
        'fromWireType': fromWireType,
        'toWireType': toWireType,
        'argPackAdvance': GenericWireTypeSize,
        'readValueFromPointer': integerReadValueFromPointer(name, size, minRange !== 0),
        destructorFunction: null, // This type does not need a destructor
      });
    };

  
  var __embind_register_memory_view = (rawType, dataTypeIndex, name) => {
      var typeMapping = [
        Int8Array,
        Uint8Array,
        Int16Array,
        Uint16Array,
        Int32Array,
        Uint32Array,
        Float32Array,
        Float64Array,
      ];
  
      var TA = typeMapping[dataTypeIndex];
  
      function decodeMemoryView(handle) {
        var size = HEAPU32[((handle)>>2)];
        var data = HEAPU32[(((handle)+(4))>>2)];
        return new TA(HEAP8.buffer, data, size);
      }
  
      name = readLatin1String(name);
      registerType(rawType, {
        name,
        'fromWireType': decodeMemoryView,
        'argPackAdvance': GenericWireTypeSize,
        'readValueFromPointer': decodeMemoryView,
      }, {
        ignoreDuplicateRegistrations: true,
      });
    };

  
  
  
  
  var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
      assert(typeof str === 'string', `stringToUTF8Array expects a string (got ${typeof str})`);
      // Parameter maxBytesToWrite is not optional. Negative values, 0, null,
      // undefined and false each don't write out any bytes.
      if (!(maxBytesToWrite > 0))
        return 0;
  
      var startIdx = outIdx;
      var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
        // unit, not a Unicode code point of the character! So decode
        // UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description
        // and https://www.ietf.org/rfc/rfc2279.txt
        // and https://tools.ietf.org/html/rfc3629
        var u = str.charCodeAt(i); // possibly a lead surrogate
        if (u >= 0xD800 && u <= 0xDFFF) {
          var u1 = str.charCodeAt(++i);
          u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
        }
        if (u <= 0x7F) {
          if (outIdx >= endIdx) break;
          heap[outIdx++] = u;
        } else if (u <= 0x7FF) {
          if (outIdx + 1 >= endIdx) break;
          heap[outIdx++] = 0xC0 | (u >> 6);
          heap[outIdx++] = 0x80 | (u & 63);
        } else if (u <= 0xFFFF) {
          if (outIdx + 2 >= endIdx) break;
          heap[outIdx++] = 0xE0 | (u >> 12);
          heap[outIdx++] = 0x80 | ((u >> 6) & 63);
          heap[outIdx++] = 0x80 | (u & 63);
        } else {
          if (outIdx + 3 >= endIdx) break;
          if (u > 0x10FFFF) warnOnce('Invalid Unicode code point ' + ptrToString(u) + ' encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).');
          heap[outIdx++] = 0xF0 | (u >> 18);
          heap[outIdx++] = 0x80 | ((u >> 12) & 63);
          heap[outIdx++] = 0x80 | ((u >> 6) & 63);
          heap[outIdx++] = 0x80 | (u & 63);
        }
      }
      // Null-terminate the pointer to the buffer.
      heap[outIdx] = 0;
      return outIdx - startIdx;
    };
  var stringToUTF8 = (str, outPtr, maxBytesToWrite) => {
      assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
      return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
    };
  
  var lengthBytesUTF8 = (str) => {
      var len = 0;
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
        // unit, not a Unicode code point of the character! So decode
        // UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        var c = str.charCodeAt(i); // possibly a lead surrogate
        if (c <= 0x7F) {
          len++;
        } else if (c <= 0x7FF) {
          len += 2;
        } else if (c >= 0xD800 && c <= 0xDFFF) {
          len += 4; ++i;
        } else {
          len += 3;
        }
      }
      return len;
    };
  
  
  
  var UTF8Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder('utf8') : undefined;
  
    /**
     * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
     * array that contains uint8 values, returns a copy of that string as a
     * Javascript String object.
     * heapOrArray is either a regular array, or a JavaScript typed array view.
     * @param {number} idx
     * @param {number=} maxBytesToRead
     * @return {string}
     */
  var UTF8ArrayToString = (heapOrArray, idx, maxBytesToRead) => {
      var endIdx = idx + maxBytesToRead;
      var endPtr = idx;
      // TextDecoder needs to know the byte length in advance, it doesn't stop on
      // null terminator by itself.  Also, use the length info to avoid running tiny
      // strings through TextDecoder, since .subarray() allocates garbage.
      // (As a tiny code save trick, compare endPtr against endIdx using a negation,
      // so that undefined means Infinity)
      while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
  
      if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
      }
      var str = '';
      // If building with TextDecoder, we have already computed the string length
      // above, so test loop end condition against that
      while (idx < endPtr) {
        // For UTF8 byte structure, see:
        // http://en.wikipedia.org/wiki/UTF-8#Description
        // https://www.ietf.org/rfc/rfc2279.txt
        // https://tools.ietf.org/html/rfc3629
        var u0 = heapOrArray[idx++];
        if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
        var u1 = heapOrArray[idx++] & 63;
        if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
        var u2 = heapOrArray[idx++] & 63;
        if ((u0 & 0xF0) == 0xE0) {
          u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
        } else {
          if ((u0 & 0xF8) != 0xF0) warnOnce('Invalid UTF-8 leading byte ' + ptrToString(u0) + ' encountered when deserializing a UTF-8 string in wasm memory to a JS string!');
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
        }
  
        if (u0 < 0x10000) {
          str += String.fromCharCode(u0);
        } else {
          var ch = u0 - 0x10000;
          str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
        }
      }
      return str;
    };
  
    /**
     * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
     * emscripten HEAP, returns a copy of that string as a Javascript String object.
     *
     * @param {number} ptr
     * @param {number=} maxBytesToRead - An optional length that specifies the
     *   maximum number of bytes to read. You can omit this parameter to scan the
     *   string until the first 0 byte. If maxBytesToRead is passed, and the string
     *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
     *   string will cut short at that byte index (i.e. maxBytesToRead will not
     *   produce a string of exact length [ptr, ptr+maxBytesToRead[) N.B. mixing
     *   frequent uses of UTF8ToString() with and without maxBytesToRead may throw
     *   JS JIT optimizations off, so it is worth to consider consistently using one
     * @return {string}
     */
  var UTF8ToString = (ptr, maxBytesToRead) => {
      assert(typeof ptr == 'number', `UTF8ToString expects a number (got ${typeof ptr})`);
      return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
    };
  var __embind_register_std_string = (rawType, name) => {
      name = readLatin1String(name);
      var stdStringIsUTF8
      //process only std::string bindings with UTF8 support, in contrast to e.g. std::basic_string<unsigned char>
      = (name === "std::string");
  
      registerType(rawType, {
        name,
        // For some method names we use string keys here since they are part of
        // the public/external API and/or used by the runtime-generated code.
        'fromWireType'(value) {
          var length = HEAPU32[((value)>>2)];
          var payload = value + 4;
  
          var str;
          if (stdStringIsUTF8) {
            var decodeStartPtr = payload;
            // Looping here to support possible embedded '0' bytes
            for (var i = 0; i <= length; ++i) {
              var currentBytePtr = payload + i;
              if (i == length || HEAPU8[currentBytePtr] == 0) {
                var maxRead = currentBytePtr - decodeStartPtr;
                var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
                if (str === undefined) {
                  str = stringSegment;
                } else {
                  str += String.fromCharCode(0);
                  str += stringSegment;
                }
                decodeStartPtr = currentBytePtr + 1;
              }
            }
          } else {
            var a = new Array(length);
            for (var i = 0; i < length; ++i) {
              a[i] = String.fromCharCode(HEAPU8[payload + i]);
            }
            str = a.join('');
          }
  
          _free(value);
  
          return str;
        },
        'toWireType'(destructors, value) {
          if (value instanceof ArrayBuffer) {
            value = new Uint8Array(value);
          }
  
          var length;
          var valueIsOfTypeString = (typeof value == 'string');
  
          if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
            throwBindingError('Cannot pass non-string to std::string');
          }
          if (stdStringIsUTF8 && valueIsOfTypeString) {
            length = lengthBytesUTF8(value);
          } else {
            length = value.length;
          }
  
          // assumes POINTER_SIZE alignment
          var base = _malloc(4 + length + 1);
          var ptr = base + 4;
          HEAPU32[((base)>>2)] = length;
          if (stdStringIsUTF8 && valueIsOfTypeString) {
            stringToUTF8(value, ptr, length + 1);
          } else {
            if (valueIsOfTypeString) {
              for (var i = 0; i < length; ++i) {
                var charCode = value.charCodeAt(i);
                if (charCode > 255) {
                  _free(ptr);
                  throwBindingError('String has UTF-16 code units that do not fit in 8 bits');
                }
                HEAPU8[ptr + i] = charCode;
              }
            } else {
              for (var i = 0; i < length; ++i) {
                HEAPU8[ptr + i] = value[i];
              }
            }
          }
  
          if (destructors !== null) {
            destructors.push(_free, base);
          }
          return base;
        },
        'argPackAdvance': GenericWireTypeSize,
        'readValueFromPointer': readPointer,
        destructorFunction(ptr) {
          _free(ptr);
        },
      });
    };

  
  
  
  var UTF16Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder('utf-16le') : undefined;;
  var UTF16ToString = (ptr, maxBytesToRead) => {
      assert(ptr % 2 == 0, 'Pointer passed to UTF16ToString must be aligned to two bytes!');
      var endPtr = ptr;
      // TextDecoder needs to know the byte length in advance, it doesn't stop on
      // null terminator by itself.
      // Also, use the length info to avoid running tiny strings through
      // TextDecoder, since .subarray() allocates garbage.
      var idx = endPtr >> 1;
      var maxIdx = idx + maxBytesToRead / 2;
      // If maxBytesToRead is not passed explicitly, it will be undefined, and this
      // will always evaluate to true. This saves on code size.
      while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
      endPtr = idx << 1;
  
      if (endPtr - ptr > 32 && UTF16Decoder)
        return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  
      // Fallback: decode without UTF16Decoder
      var str = '';
  
      // If maxBytesToRead is not passed explicitly, it will be undefined, and the
      // for-loop's condition will always evaluate to true. The loop is then
      // terminated on the first null char.
      for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
        var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
        if (codeUnit == 0) break;
        // fromCharCode constructs a character from a UTF-16 code unit, so we can
        // pass the UTF16 string right through.
        str += String.fromCharCode(codeUnit);
      }
  
      return str;
    };
  
  var stringToUTF16 = (str, outPtr, maxBytesToWrite) => {
      assert(outPtr % 2 == 0, 'Pointer passed to stringToUTF16 must be aligned to two bytes!');
      assert(typeof maxBytesToWrite == 'number', 'stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
      // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
      maxBytesToWrite ??= 0x7FFFFFFF;
      if (maxBytesToWrite < 2) return 0;
      maxBytesToWrite -= 2; // Null terminator.
      var startPtr = outPtr;
      var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
      for (var i = 0; i < numCharsToWrite; ++i) {
        // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
        var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
        HEAP16[((outPtr)>>1)] = codeUnit;
        outPtr += 2;
      }
      // Null-terminate the pointer to the HEAP.
      HEAP16[((outPtr)>>1)] = 0;
      return outPtr - startPtr;
    };
  
  var lengthBytesUTF16 = (str) => {
      return str.length*2;
    };
  
  var UTF32ToString = (ptr, maxBytesToRead) => {
      assert(ptr % 4 == 0, 'Pointer passed to UTF32ToString must be aligned to four bytes!');
      var i = 0;
  
      var str = '';
      // If maxBytesToRead is not passed explicitly, it will be undefined, and this
      // will always evaluate to true. This saves on code size.
      while (!(i >= maxBytesToRead / 4)) {
        var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
        if (utf32 == 0) break;
        ++i;
        // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        if (utf32 >= 0x10000) {
          var ch = utf32 - 0x10000;
          str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
        } else {
          str += String.fromCharCode(utf32);
        }
      }
      return str;
    };
  
  var stringToUTF32 = (str, outPtr, maxBytesToWrite) => {
      assert(outPtr % 4 == 0, 'Pointer passed to stringToUTF32 must be aligned to four bytes!');
      assert(typeof maxBytesToWrite == 'number', 'stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
      // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
      maxBytesToWrite ??= 0x7FFFFFFF;
      if (maxBytesToWrite < 4) return 0;
      var startPtr = outPtr;
      var endPtr = startPtr + maxBytesToWrite - 4;
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
        if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
          var trailSurrogate = str.charCodeAt(++i);
          codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
        }
        HEAP32[((outPtr)>>2)] = codeUnit;
        outPtr += 4;
        if (outPtr + 4 > endPtr) break;
      }
      // Null-terminate the pointer to the HEAP.
      HEAP32[((outPtr)>>2)] = 0;
      return outPtr - startPtr;
    };
  
  var lengthBytesUTF32 = (str) => {
      var len = 0;
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        var codeUnit = str.charCodeAt(i);
        if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
        len += 4;
      }
  
      return len;
    };
  var __embind_register_std_wstring = (rawType, charSize, name) => {
      name = readLatin1String(name);
      var decodeString, encodeString, readCharAt, lengthBytesUTF;
      if (charSize === 2) {
        decodeString = UTF16ToString;
        encodeString = stringToUTF16;
        lengthBytesUTF = lengthBytesUTF16;
        readCharAt = (pointer) => HEAPU16[((pointer)>>1)];
      } else if (charSize === 4) {
        decodeString = UTF32ToString;
        encodeString = stringToUTF32;
        lengthBytesUTF = lengthBytesUTF32;
        readCharAt = (pointer) => HEAPU32[((pointer)>>2)];
      }
      registerType(rawType, {
        name,
        'fromWireType': (value) => {
          // Code mostly taken from _embind_register_std_string fromWireType
          var length = HEAPU32[((value)>>2)];
          var str;
  
          var decodeStartPtr = value + 4;
          // Looping here to support possible embedded '0' bytes
          for (var i = 0; i <= length; ++i) {
            var currentBytePtr = value + 4 + i * charSize;
            if (i == length || readCharAt(currentBytePtr) == 0) {
              var maxReadBytes = currentBytePtr - decodeStartPtr;
              var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
              if (str === undefined) {
                str = stringSegment;
              } else {
                str += String.fromCharCode(0);
                str += stringSegment;
              }
              decodeStartPtr = currentBytePtr + charSize;
            }
          }
  
          _free(value);
  
          return str;
        },
        'toWireType': (destructors, value) => {
          if (!(typeof value == 'string')) {
            throwBindingError(`Cannot pass non-string to C++ string type ${name}`);
          }
  
          // assumes POINTER_SIZE alignment
          var length = lengthBytesUTF(value);
          var ptr = _malloc(4 + length + charSize);
          HEAPU32[((ptr)>>2)] = length / charSize;
  
          encodeString(value, ptr + 4, length + charSize);
  
          if (destructors !== null) {
            destructors.push(_free, ptr);
          }
          return ptr;
        },
        'argPackAdvance': GenericWireTypeSize,
        'readValueFromPointer': readPointer,
        destructorFunction(ptr) {
          _free(ptr);
        }
      });
    };

  
  var __embind_register_void = (rawType, name) => {
      name = readLatin1String(name);
      registerType(rawType, {
        isVoid: true, // void return values can be optimized out sometimes
        name,
        'argPackAdvance': 0,
        'fromWireType': () => undefined,
        // TODO: assert if anything else is given?
        'toWireType': (destructors, o) => undefined,
      });
    };

  var _abort = () => {
      abort('native code called abort()');
    };

  var _emscripten_memcpy_js = (dest, src, num) => HEAPU8.copyWithin(dest, src, src + num);

  var getHeapMax = () =>
      HEAPU8.length;
  
  var abortOnCannotGrowMemory = (requestedSize) => {
      abort(`Cannot enlarge memory arrays to size ${requestedSize} bytes (OOM). Either (1) compile with -sINITIAL_MEMORY=X with X higher than the current value ${HEAP8.length}, (2) compile with -sALLOW_MEMORY_GROWTH which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with -sABORTING_MALLOC=0`);
    };
  var _emscripten_resize_heap = (requestedSize) => {
      var oldSize = HEAPU8.length;
      // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
      requestedSize >>>= 0;
      abortOnCannotGrowMemory(requestedSize);
    };

  var SYSCALLS = {
  varargs:undefined,
  get() {
        assert(SYSCALLS.varargs != undefined);
        // the `+` prepended here is necessary to convince the JSCompiler that varargs is indeed a number.
        var ret = HEAP32[((+SYSCALLS.varargs)>>2)];
        SYSCALLS.varargs += 4;
        return ret;
      },
  getp() { return SYSCALLS.get() },
  getStr(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
      },
  };
  var _fd_close = (fd) => {
      abort('fd_close called without SYSCALLS_REQUIRE_FILESYSTEM');
    };

  var convertI32PairToI53Checked = (lo, hi) => {
      assert(lo == (lo >>> 0) || lo == (lo|0)); // lo should either be a i32 or a u32
      assert(hi === (hi|0));                    // hi should be a i32
      return ((hi + 0x200000) >>> 0 < 0x400001 - !!lo) ? (lo >>> 0) + hi * 4294967296 : NaN;
    };
  function _fd_seek(fd,offset_low, offset_high,whence,newOffset) {
    var offset = convertI32PairToI53Checked(offset_low, offset_high);
  
    
      return 70;
    ;
  }

  var printCharBuffers = [null,[],[]];
  
  var printChar = (stream, curr) => {
      var buffer = printCharBuffers[stream];
      assert(buffer);
      if (curr === 0 || curr === 10) {
        (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
        buffer.length = 0;
      } else {
        buffer.push(curr);
      }
    };
  
  var flush_NO_FILESYSTEM = () => {
      // flush anything remaining in the buffers during shutdown
      _fflush(0);
      if (printCharBuffers[1].length) printChar(1, 10);
      if (printCharBuffers[2].length) printChar(2, 10);
    };
  
  
  var _fd_write = (fd, iov, iovcnt, pnum) => {
      // hack to support printf in SYSCALLS_REQUIRE_FILESYSTEM=0
      var num = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[((iov)>>2)];
        var len = HEAPU32[(((iov)+(4))>>2)];
        iov += 8;
        for (var j = 0; j < len; j++) {
          printChar(fd, HEAPU8[ptr+j]);
        }
        num += len;
      }
      HEAPU32[((pnum)>>2)] = num;
      return 0;
    };
embind_init_charCodes();
BindingError = Module['BindingError'] = class BindingError extends Error { constructor(message) { super(message); this.name = 'BindingError'; }};
InternalError = Module['InternalError'] = class InternalError extends Error { constructor(message) { super(message); this.name = 'InternalError'; }};
init_ClassHandle();
init_embind();;
init_RegisteredPointer();
UnboundTypeError = Module['UnboundTypeError'] = extendError(Error, 'UnboundTypeError');;
init_emval();;
function checkIncomingModuleAPI() {
  ignoredModuleProp('fetchSettings');
}
var wasmImports = {
  /** @export */
  __cxa_throw: ___cxa_throw,
  /** @export */
  _embind_register_bigint: __embind_register_bigint,
  /** @export */
  _embind_register_bool: __embind_register_bool,
  /** @export */
  _embind_register_class: __embind_register_class,
  /** @export */
  _embind_register_class_constructor: __embind_register_class_constructor,
  /** @export */
  _embind_register_class_function: __embind_register_class_function,
  /** @export */
  _embind_register_emval: __embind_register_emval,
  /** @export */
  _embind_register_float: __embind_register_float,
  /** @export */
  _embind_register_integer: __embind_register_integer,
  /** @export */
  _embind_register_memory_view: __embind_register_memory_view,
  /** @export */
  _embind_register_std_string: __embind_register_std_string,
  /** @export */
  _embind_register_std_wstring: __embind_register_std_wstring,
  /** @export */
  _embind_register_void: __embind_register_void,
  /** @export */
  abort: _abort,
  /** @export */
  emscripten_memcpy_js: _emscripten_memcpy_js,
  /** @export */
  emscripten_resize_heap: _emscripten_resize_heap,
  /** @export */
  fd_close: _fd_close,
  /** @export */
  fd_seek: _fd_seek,
  /** @export */
  fd_write: _fd_write
};
var wasmExports = createWasm();
var ___wasm_call_ctors = createExportWrapper('__wasm_call_ctors');
var ___getTypeName = createExportWrapper('__getTypeName');
var _fflush = createExportWrapper('fflush');
var _malloc = Module['_malloc'] = createExportWrapper('malloc');
var _free = createExportWrapper('free');
var _emscripten_stack_init = wasmExports['emscripten_stack_init']
var _emscripten_stack_get_free = wasmExports['emscripten_stack_get_free']
var _emscripten_stack_get_base = wasmExports['emscripten_stack_get_base']
var _emscripten_stack_get_end = wasmExports['emscripten_stack_get_end']
var stackSave = createExportWrapper('stackSave');
var stackRestore = createExportWrapper('stackRestore');
var stackAlloc = createExportWrapper('stackAlloc');
var _emscripten_stack_get_current = wasmExports['emscripten_stack_get_current']
var ___cxa_is_pointer_type = createExportWrapper('__cxa_is_pointer_type');
var dynCall_jiji = Module['dynCall_jiji'] = createExportWrapper('dynCall_jiji');


// include: postamble.js
// === Auto-generated postamble setup entry stuff ===

var missingLibrarySymbols = [
  'writeI53ToI64',
  'writeI53ToI64Clamped',
  'writeI53ToI64Signaling',
  'writeI53ToU64Clamped',
  'writeI53ToU64Signaling',
  'readI53FromI64',
  'readI53FromU64',
  'convertI32PairToI53',
  'convertU32PairToI53',
  'zeroMemory',
  'exitJS',
  'growMemory',
  'isLeapYear',
  'ydayFromDate',
  'arraySum',
  'addDays',
  'inetPton4',
  'inetNtop4',
  'inetPton6',
  'inetNtop6',
  'readSockaddr',
  'writeSockaddr',
  'initRandomFill',
  'randomFill',
  'getCallstack',
  'emscriptenLog',
  'convertPCtoSourceLocation',
  'readEmAsmArgs',
  'jstoi_q',
  'getExecutableName',
  'listenOnce',
  'autoResumeAudioContext',
  'handleException',
  'keepRuntimeAlive',
  'runtimeKeepalivePush',
  'runtimeKeepalivePop',
  'callUserCallback',
  'maybeExit',
  'asmjsMangle',
  'asyncLoad',
  'alignMemory',
  'mmapAlloc',
  'HandleAllocator',
  'getNativeTypeSize',
  'STACK_SIZE',
  'STACK_ALIGN',
  'POINTER_SIZE',
  'ASSERTIONS',
  'getCFunc',
  'ccall',
  'cwrap',
  'uleb128Encode',
  'sigToWasmTypes',
  'generateFuncType',
  'convertJsFunctionToWasm',
  'getEmptyTableSlot',
  'updateTableMap',
  'getFunctionAddress',
  'addFunction',
  'removeFunction',
  'reallyNegative',
  'unSign',
  'strLen',
  'reSign',
  'formatString',
  'intArrayFromString',
  'intArrayToString',
  'AsciiToString',
  'stringToAscii',
  'stringToNewUTF8',
  'stringToUTF8OnStack',
  'writeArrayToMemory',
  'registerKeyEventCallback',
  'maybeCStringToJsString',
  'findEventTarget',
  'getBoundingClientRect',
  'fillMouseEventData',
  'registerMouseEventCallback',
  'registerWheelEventCallback',
  'registerUiEventCallback',
  'registerFocusEventCallback',
  'fillDeviceOrientationEventData',
  'registerDeviceOrientationEventCallback',
  'fillDeviceMotionEventData',
  'registerDeviceMotionEventCallback',
  'screenOrientation',
  'fillOrientationChangeEventData',
  'registerOrientationChangeEventCallback',
  'fillFullscreenChangeEventData',
  'registerFullscreenChangeEventCallback',
  'JSEvents_requestFullscreen',
  'JSEvents_resizeCanvasForFullscreen',
  'registerRestoreOldStyle',
  'hideEverythingExceptGivenElement',
  'restoreHiddenElements',
  'setLetterbox',
  'softFullscreenResizeWebGLRenderTarget',
  'doRequestFullscreen',
  'fillPointerlockChangeEventData',
  'registerPointerlockChangeEventCallback',
  'registerPointerlockErrorEventCallback',
  'requestPointerLock',
  'fillVisibilityChangeEventData',
  'registerVisibilityChangeEventCallback',
  'registerTouchEventCallback',
  'fillGamepadEventData',
  'registerGamepadEventCallback',
  'registerBeforeUnloadEventCallback',
  'fillBatteryEventData',
  'battery',
  'registerBatteryEventCallback',
  'setCanvasElementSize',
  'getCanvasElementSize',
  'jsStackTrace',
  'stackTrace',
  'getEnvStrings',
  'checkWasiClock',
  'wasiRightsToMuslOFlags',
  'wasiOFlagsToMuslOFlags',
  'createDyncallWrapper',
  'safeSetTimeout',
  'setImmediateWrapped',
  'clearImmediateWrapped',
  'polyfillSetImmediate',
  'getPromise',
  'makePromise',
  'idsToPromises',
  'makePromiseCallback',
  'findMatchingCatch',
  'Browser_asyncPrepareDataCounter',
  'setMainLoop',
  'getSocketFromFD',
  'getSocketAddress',
  'FS_createPreloadedFile',
  'FS_modeStringToFlags',
  'FS_getMode',
  'FS_stdin_getChar',
  'FS_createDataFile',
  'FS_unlink',
  'FS_mkdirTree',
  '_setNetworkCallback',
  'heapObjectForWebGLType',
  'toTypedArrayIndex',
  'webgl_enable_ANGLE_instanced_arrays',
  'webgl_enable_OES_vertex_array_object',
  'webgl_enable_WEBGL_draw_buffers',
  'webgl_enable_WEBGL_multi_draw',
  'emscriptenWebGLGet',
  'computeUnpackAlignedImageSize',
  'colorChannelsInGlTextureFormat',
  'emscriptenWebGLGetTexPixelData',
  'emscriptenWebGLGetUniform',
  'webglGetUniformLocation',
  'webglPrepareUniformLocationsBeforeFirstUse',
  'webglGetLeftBracePos',
  'emscriptenWebGLGetVertexAttrib',
  '__glGetActiveAttribOrUniform',
  'writeGLArray',
  'registerWebGlEventCallback',
  'runAndAbortIfError',
  'ALLOC_NORMAL',
  'ALLOC_STACK',
  'allocate',
  'writeStringToMemory',
  'writeAsciiToMemory',
  'setErrNo',
  'demangle',
  'getFunctionArgsName',
  'requireRegisteredType',
  'createJsInvokerSignature',
  'registerInheritedInstance',
  'unregisterInheritedInstance',
  'enumReadValueFromPointer',
  'validateThis',
  'getStringOrSymbol',
  'emval_get_global',
  'emval_returnValue',
  'emval_lookupTypes',
  'emval_addMethodCaller',
];
missingLibrarySymbols.forEach(missingLibrarySymbol)

var unexportedSymbols = [
  'run',
  'addOnPreRun',
  'addOnInit',
  'addOnPreMain',
  'addOnExit',
  'addOnPostRun',
  'addRunDependency',
  'removeRunDependency',
  'FS_createFolder',
  'FS_createPath',
  'FS_createLazyFile',
  'FS_createLink',
  'FS_createDevice',
  'FS_readFile',
  'out',
  'err',
  'callMain',
  'abort',
  'wasmMemory',
  'wasmExports',
  'stackAlloc',
  'stackSave',
  'stackRestore',
  'getTempRet0',
  'setTempRet0',
  'writeStackCookie',
  'checkStackCookie',
  'intArrayFromBase64',
  'tryParseAsDataURI',
  'convertI32PairToI53Checked',
  'ptrToString',
  'getHeapMax',
  'abortOnCannotGrowMemory',
  'ENV',
  'MONTH_DAYS_REGULAR',
  'MONTH_DAYS_LEAP',
  'MONTH_DAYS_REGULAR_CUMULATIVE',
  'MONTH_DAYS_LEAP_CUMULATIVE',
  'ERRNO_CODES',
  'ERRNO_MESSAGES',
  'DNS',
  'Protocols',
  'Sockets',
  'timers',
  'warnOnce',
  'UNWIND_CACHE',
  'readEmAsmArgsArray',
  'jstoi_s',
  'dynCallLegacy',
  'getDynCaller',
  'dynCall',
  'wasmTable',
  'noExitRuntime',
  'freeTableIndexes',
  'functionsInTableMap',
  'setValue',
  'getValue',
  'PATH',
  'PATH_FS',
  'UTF8Decoder',
  'UTF8ArrayToString',
  'UTF8ToString',
  'stringToUTF8Array',
  'stringToUTF8',
  'lengthBytesUTF8',
  'UTF16Decoder',
  'UTF16ToString',
  'stringToUTF16',
  'lengthBytesUTF16',
  'UTF32ToString',
  'stringToUTF32',
  'lengthBytesUTF32',
  'JSEvents',
  'specialHTMLTargets',
  'findCanvasEventTarget',
  'currentFullscreenStrategy',
  'restoreOldWindowedStyle',
  'ExitStatus',
  'flush_NO_FILESYSTEM',
  'promiseMap',
  'uncaughtExceptionCount',
  'exceptionLast',
  'exceptionCaught',
  'ExceptionInfo',
  'Browser',
  'getPreloadedImageData__data',
  'wget',
  'SYSCALLS',
  'preloadPlugins',
  'FS_stdin_getChar_buffer',
  'FS',
  'MEMFS',
  'TTY',
  'PIPEFS',
  'SOCKFS',
  'tempFixedLengthArray',
  'miniTempWebGLFloatBuffers',
  'miniTempWebGLIntBuffers',
  'GL',
  'AL',
  'GLUT',
  'EGL',
  'GLEW',
  'IDBStore',
  'SDL',
  'SDL_gfx',
  'allocateUTF8',
  'allocateUTF8OnStack',
  'InternalError',
  'BindingError',
  'throwInternalError',
  'throwBindingError',
  'registeredTypes',
  'awaitingDependencies',
  'typeDependencies',
  'tupleRegistrations',
  'structRegistrations',
  'sharedRegisterType',
  'whenDependentTypesAreResolved',
  'embind_charCodes',
  'embind_init_charCodes',
  'readLatin1String',
  'getTypeName',
  'getFunctionName',
  'heap32VectorToArray',
  'usesDestructorStack',
  'createJsInvoker',
  'UnboundTypeError',
  'PureVirtualError',
  'GenericWireTypeSize',
  'EmValType',
  'init_embind',
  'throwUnboundTypeError',
  'ensureOverloadTable',
  'exposePublicSymbol',
  'replacePublicSymbol',
  'extendError',
  'createNamedFunction',
  'embindRepr',
  'registeredInstances',
  'getBasestPointer',
  'getInheritedInstance',
  'getInheritedInstanceCount',
  'getLiveInheritedInstances',
  'registeredPointers',
  'registerType',
  'integerReadValueFromPointer',
  'floatReadValueFromPointer',
  'readPointer',
  'runDestructors',
  'newFunc',
  'craftInvokerFunction',
  'embind__requireFunction',
  'genericPointerToWireType',
  'constNoSmartPtrRawPointerToWireType',
  'nonConstNoSmartPtrRawPointerToWireType',
  'init_RegisteredPointer',
  'RegisteredPointer',
  'RegisteredPointer_fromWireType',
  'runDestructor',
  'releaseClassHandle',
  'finalizationRegistry',
  'detachFinalizer_deps',
  'detachFinalizer',
  'attachFinalizer',
  'makeClassHandle',
  'init_ClassHandle',
  'ClassHandle',
  'throwInstanceAlreadyDeleted',
  'deletionQueue',
  'flushPendingDeletes',
  'delayFunction',
  'setDelayFunction',
  'RegisteredClass',
  'shallowCopyInternalPointer',
  'downcastPointer',
  'upcastPointer',
  'char_0',
  'char_9',
  'makeLegalFunctionName',
  'emval_freelist',
  'emval_handles',
  'emval_symbols',
  'init_emval',
  'count_emval_handles',
  'Emval',
  'emval_methodCallers',
  'reflectConstruct',
];
unexportedSymbols.forEach(unexportedRuntimeSymbol);



var calledRun;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!calledRun) run();
  if (!calledRun) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
};

function stackCheckInit() {
  // This is normally called automatically during __wasm_call_ctors but need to
  // get these values before even running any of the ctors so we call it redundantly
  // here.
  _emscripten_stack_init();
  // TODO(sbc): Move writeStackCookie to native to to avoid this.
  writeStackCookie();
}

function run() {

  if (runDependencies > 0) {
    return;
  }

    stackCheckInit();

  preRun();

  // a preRun added a dependency, run will be called later
  if (runDependencies > 0) {
    return;
  }

  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    if (calledRun) return;
    calledRun = true;
    Module['calledRun'] = true;

    if (ABORT) return;

    initRuntime();

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

    assert(!Module['_main'], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else
  {
    doRun();
  }
  checkStackCookie();
}

function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var oldOut = out;
  var oldErr = err;
  var has = false;
  out = err = (x) => {
    has = true;
  }
  try { // it doesn't matter if it fails
    flush_NO_FILESYSTEM();
  } catch(e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the Emscripten FAQ), or make sure to emit a newline when you printf etc.');
    warnOnce('(this may also be due to not including full filesystem support - try building with -sFORCE_FILESYSTEM)');
  }
}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

run();

// end include: postamble.js

// include: /home/christiangrothe/Music/Capture/capture_core/em-es6-module.js
export default Module;// end include: /home/christiangrothe/Music/Capture/capture_core/em-es6-module.js

