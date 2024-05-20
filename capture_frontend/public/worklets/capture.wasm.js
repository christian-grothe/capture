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
  wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAAB6wI0YAF/AX9gAn9/AX9gAX8AYAJ/fwBgA39/fwF/YAABf2ADf39/AGAEf39/fwBgAABgBX9/f39/AGABfQF9YAJ/fQBgAX8BfWAGf39/f39/AGAEf39/fwF/YAJ9fQF9YAV/f39/fwF/YAN/fn8BfmAEf39/fQBgAXwBfGADf399AGABfwF8YAV/f399fwBgAX0Bf2ACfH8BfGAEf35+fwBgBn98f39/fwF/YAJ+fwF/YA1/f39/f39/f39/f39/AGAJf39/f39/f39/AGAFf39/f30AYAV/f319fQF9YAN9fX0BfWADf31/AX1gBH9/fX0BfWACf3wAYAR/fX1/AGAGf319fX1/AGADf319AGACfHwBfGACfH8Bf2ADfHx/AXxgAn99AX1gAnx/AX1gAn5+AXxgB39/f39/f38Bf2ADfn9/AX9gAXwBfmAEf39+fwF+YAV/f39+fgBgB39/f39/f38AYAR/fn9/AX8CvwQTA2VudhZfZW1iaW5kX3JlZ2lzdGVyX2NsYXNzABwDZW52Il9lbWJpbmRfcmVnaXN0ZXJfY2xhc3NfY29uc3RydWN0b3IADQNlbnYLX19jeGFfdGhyb3cABgNlbnYfX2VtYmluZF9yZWdpc3Rlcl9jbGFzc19mdW5jdGlvbgAdA2VudhVfZW1iaW5kX3JlZ2lzdGVyX3ZvaWQAAwNlbnYVX2VtYmluZF9yZWdpc3Rlcl9ib29sAAcDZW52GF9lbWJpbmRfcmVnaXN0ZXJfaW50ZWdlcgAJA2VudhZfZW1iaW5kX3JlZ2lzdGVyX2Zsb2F0AAYDZW52G19lbWJpbmRfcmVnaXN0ZXJfc3RkX3N0cmluZwADA2VudhxfZW1iaW5kX3JlZ2lzdGVyX3N0ZF93c3RyaW5nAAYDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfZW12YWwAAgNlbnYcX2VtYmluZF9yZWdpc3Rlcl9tZW1vcnlfdmlldwAGA2VudhRlbXNjcmlwdGVuX21lbWNweV9qcwAGA2VudhZlbXNjcmlwdGVuX3Jlc2l6ZV9oZWFwAAADZW52BWFib3J0AAgWd2FzaV9zbmFwc2hvdF9wcmV2aWV3MQhmZF9jbG9zZQAAFndhc2lfc25hcHNob3RfcHJldmlldzEIZmRfd3JpdGUADgNlbnYXX2VtYmlu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CyACIARPDQEDQCACIAEoAgA2AgAgAUEEaiEBIAJBBGoiAiAESQ0ADAILAAsCQCADQQRPDQAgACECDAELAkAgA0F8aiIEIABPDQAgACECDAELIAAhAgNAIAIgAS0AADoAACACIAEtAAE6AAEgAiABLQACOgACIAIgAS0AAzoAAyABQQRqIQEgAkEEaiICIARNDQALCwJAIAIgA08NAANAIAIgAS0AADoAACABQQFqIQEgAkEBaiICIANHDQALCyAAC/cCAQJ/AkAgACABRg0AAkAgASAAIAJqIgNrQQAgAkEBdGtLDQAgACABIAIQnAQPCyABIABzQQNxIQQCQAJAAkAgACABTw0AAkAgBEUNACAAIQMMAwsCQCAAQQNxDQAgACEDDAILIAAhAwNAIAJFDQQgAyABLQAAOgAAIAFBAWohASACQX9qIQIgA0EBaiIDQQNxRQ0CDAALAAsCQCAEDQACQCADQQNxRQ0AA0AgAkUNBSAAIAJBf2oiAmoiAyABIAJqLQAAOgAAIANBA3ENAAsLIAJBA00NAANAIAAgAkF8aiICaiABIAJqKAIANgIAIAJBA0sNAAsLIAJFDQIDQCAAIAJBf2oiAmogASACai0AADoAACACDQAMAwsACyACQQNNDQADQCADIAEoAgA2AgAgAUEEaiEBIANBBGohAyACQXxqIgJBA0sNAAsLIAJFDQADQCADIAEtAAA6AAAgA0EBaiEDIAFBAWohASACQX9qIgINAAsLIAAL8gICA38BfgJAIAJFDQAgACABOgAAIAAgAmoiA0F/aiABOgAAIAJBA0kNACAAIAE6AAIgACABOgABIANBfWogAToAACADQX5qIAE6AAAgAkEHSQ0AIAAgAToAAyADQXxqIAE6AAAgAkEJSQ0AIABBACAAa0EDcSIEaiIDIAFB/wFxQYGChAhsIgE2AgAgAyACIARrQXxxIgRqIgJBfGogATYCACAEQQlJDQAgAyABNgIIIAMgATYCBCACQXhqIAE2AgAgAkF0aiABNgIAIARBGUkNACADIAE2AhggAyABNgIUIAMgATYCECADIAE2AgwgAkFwaiABNgIAIAJBbGogATYCACACQWhqIAE2AgAgAkFkaiABNgIAIAQgA0EEcUEYciIFayICQSBJDQAgAa1CgYCAgBB+IQYgAyAFaiEBA0AgASAGNwMYIAEg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IAKiQQArA/CyBKAgA6JBACsD+LIEIAKiIABB4LAEaisDACABQRd1t6CgoKALaAICfAF+QQArA/itBCAAQQArA/CtBCICIACgIgMgAqGhIgCiQQArA4CuBKAgACAAoqJBACsDiK4EIACiRAAAAAAAAPA/oKAgA70iBCABrXxCL4YgBKdBH3FBA3RB8KsEaikDAHy/orYLBABBKgsFABCyBAsGAEGAwQQLFwBBAEHowAQ2AuDBBEEAELMENgKYwQQLrgEAAkACQCABQYAISA0AIABEAAAAAAAA4H+iIQACQCABQf8PTw0AIAFBgXhqIQEMAgsgAEQAAAAAAADgf6IhACABQf0XIAFB/RdJG0GCcGohAQwBCyABQYF4Sg0AIABEAAAAAAAAYAOiIQACQCABQbhwTQ0AIAFByQdqIQEMAQsgAEQAAAAAAABgA6IhACABQfBoIAFB8GhLG0GSD2ohAQsgACABQf8Haq1CNIa/ogvLAQICfwF8IwBBEGsiASQAAkACQCAAvUIgiKdB/////wdxIgJB+8Ok/wNLDQAgAkGAgMDyA0kNASAARAAAAAAAAAAAQQAQmgQhAAwBCwJAIAJBgIDA/wdJDQAgACAAoSEADAELIAAgARCZBCECIAErAwghACABKwMAIQMCQAJAAkACQCACQQNxDgMAAQIDCyADIABBARCaBCEADAMLIAMgABCXBCEADAILIAMgAEEBEJoEmiEADAELIAMgABCXBJohAAsgAUEQaiQAIAALJAECfwJAIAAQuQRBAWoiARC9BCICDQBBAA8LIAIgACABEJwEC4UBAQN/IAAhAQJAAkAgAEEDcUUNAAJAIAAtAAANACAAIABrDwsgACEBA0AgAUEBaiIBQQNxRQ0BIAEtAAANAAwCCwALA0AgASICQQRqIQEgAigCACIDQX9zIANB//37d2pxQYCBgoR4cUUNAAsDQCACIgFBAWohAiABLQAADQALCyABIABrCwcAPwBBEHQLBgBBhMIEC1MBAn9BACgCmL8EIgEgAEEHakF4cSICaiEAAkACQAJAIAJFDQAgACABTQ0BCyAAELoETQ0BIAAQDQ0BCxC7BEEwNgIAQX8PC0EAIAA2Api/BCABC/EiAQt/IwBBEGsiASQAAkACQAJAAkACQAJAAkACQAJAAkACQCAAQfQBSw0AAkBBACgCiMIEIgJB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YCgCAA0AIAFBgH9xQYC/A0YNAxC7BEEZNgIADAELAkAgAUH/D0sNACAAIAFBP3FBgAFyOgABIAAgAUEGdkHAAXI6AABBAg8LAkACQCABQYCwA0kNACABQYBAcUGAwANHDQELIAAgAUE/cUGAAXI6AAIgACABQQx2QeABcjoAACAAIAFBBnZBP3FBgAFyOgABQQMPCwJAIAFBgIB8akH//z9LDQAgACABQT9xQYABcjoAAyAAIAFBEnZB8AFyOgAAIAAgAUEGdkE/cUGAAXI6AAIgACABQQx2QT9xQYABcjoAAUEEDwsQuwRBGTYCAAtBfyEDCyADDwsgACABOgAAQQELFQACQCAADQBBAA8LIAAgAUEAEOQEC48BAgF+AX8CQCAAvSICQjSIp0H/D3EiA0H/D0YNAAJAIAMNAAJAAkAgAEQAAAAAAAAAAGINAEEAIQMMAQsgAEQAAAAAAADwQ6IgARDmBCEAIAEoAgBBQGohAwsgASADNgIAIAAPCyABIANBgnhqNgIAIAJC/////////4eAf4NCgICAgICAgPA/hL8hAAsgAAtTAQF+AkACQCADQcAAcUUNACABIANBQGqthiECQgAhAQwBCyADRQ0AIAFBwAAgA2utiCACIAOtIgSGhCECIAEgBIYhAQsgACABNwMAIAAgAjcDCAtTAQF+AkACQCADQcAAcUUNACACIANBQGqtiCEBQgAhAgwBCyADRQ0AIAJBwAAgA2uthiABIAOtIgSIhCEBIAIgBIghAgsgACABNwMAIAAgAjcDCAvkAwICfwJ+IwBBIGsiAiQAAkACQCABQv///////////wCDIgRCgICAgICAwP9DfCAEQoCAgICAgMCAvH98Wg0AIABCPIggAUIEhoQhBAJAIABC//////////8PgyIAQoGAgICAgICACFQNACAEQoGAgICAgICAwAB8IQUMAgsgBEKAgICAgICAgMAAfCEFIABCgICAgICAgIAIUg0BIAUgBEIBg3whBQwBCwJAIABQIARCgICAgICAwP//AFQgBEKAgICAgIDA//8AURsNACAAQjyIIAFCBIaEQv////////8Dg0KAgICAgICA/P8AhCEFDAELQoCAgICAgID4/wAhBSAEQv///////7//wwBWDQBCACEFIARCMIinIgNBkfcASQ0AIAJBEGogACABQv//////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AHN0ZDo6c3RyaW5nAHN0ZDo6dTE2c3RyaW5nAHN0ZDo6dTMyc3RyaW5nAGluZgBDYXB0dXJlQmFzZQBDYXB0dXJlAGRvdWJsZQByZWNvcmQAdm9pZABzdGQ6OmJhZF9hbGxvYwBOQU4ASU5GAGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHNob3J0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBzaG9ydD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBpbnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGZsb2F0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ4X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQxNl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQxNl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50NjRfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50NjRfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDMyX3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDMyX3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGNoYXI+AHN0ZDo6YmFzaWNfc3RyaW5nPHVuc2lnbmVkIGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHNpZ25lZCBjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxsb25nPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBsb25nPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxkb3VibGU+AC4AKG51bGwpAFB1cmUgdmlydHVhbCBmdW5jdGlvbiBjYWxsZWQhAGxpYmMrK2FiaTogADE0Q2FwdHVyZVdyYXBwZXIAN0NhcHR1cmUAAAAA6B0BADQEAQAQHgEAIwQBAEAEAQBQMTRDYXB0dXJlV3JhcHBlcgAAAGweAQBUBAEAAAAAAEgEAQBQSzE0Q2FwdHVyZVdyYXBwZXIAAGweAQB4BAEAAQAAAEgEAQBpaQB2aQAAAGgEAQAAAAAAzAQBABMAAAA4R3JhaW5FbnYANFNpbmUA6B0BAL4EAQAQHgEAtAQBAMQEAQAAAAAAxAQBABQAAAAAAAAAiAUBABUAAAAWAAAAFwAAABgAAAAZAAAAGgAAABsAAAAcAAAAHQAAAE5TdDNfXzIxMF9fZnVuY3Rpb242X19mdW5jSU44RW52ZWxvcGU3b25FbmRlZE1VbHZFX0VOU185YWxsb2NhdG9ySVM0X0VFRnZ2RUVFAE5TdDNfXzIxMF9fZnVuY3Rpb242X19iYXNlSUZ2dkVFRQDoHQEAXgUBABAeAQAQBQEAgAUBAAAAAACABQEAHgAAAB8AAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAATjhFbnZlbG9wZTdvbkVuZGVkTVVsdkVfRQAAAOgdAQDABQEAAAAAAAAAAAAAAAAAJB0BAGgEAQCoHQEAqB0BAIQdAQB2aWlpaWkAUDdDYXB0dXJlAAAAAGweAQALBgEAAAAAAEAEAQBQSzdDYXB0dXJlAABsHgEAKAYBAAEAAABABAEAdgAAAAAAAAAAAAAAJB0BABgGAQCEHQEAhB0BAMwdAQB2aWlpaWYAACQdAQAYBgEAVB0BAHZpaWkAAAAAAAAAAAAHAQAjAAAAJAAAACUAAAAmAAAAJwAAACgAAAApAAAAKgAAACsAAABOU3QzX18yMTBfX2Z1bmN0aW9uNl9fZnVuY0laTjVWb2ljZTRpbml0RWlpZlA1U3ludGhFMyRfME5TXzlhbGxvY2F0b3JJUzVfRUVGdnZFRUUAAAAQHgEArAYBAIAFAQBaTjVWb2ljZTRpbml0RWlpZlA1U3ludGhFMyRfMAAAAOgdAQAMBwEATlN0M19fMjEyYmFzaWNfc3RyaW5nSWNOU18xMWNoYXJfdHJhaXRzSWNFRU5TXzlhbGxvY2F0b3JJY0VFRUUAAOgdAQA0BwEATlN0M19fMjEyYmFzaWNfc3RyaW5nSWhOU18xMWNoYXJfdHJhaXRzSWhFRU5TXzlhbGxvY2F0b3JJaEVFRUUAAOgdAQB8BwEATlN0M19fMjEyYmFzaWNfc3RyaW5nSXdOU18xMWNoYXJfdHJhaXRzSXdFRU5TXzlhbGxvY2F0b3JJd0VFRUUAAOgdAQDEBwEATlN0M19fMjEyYmFzaWNfc3RyaW5nSURzTlNfMTFjaGFyX3RyYWl0c0lEc0VFTlNfOWFsbG9jYXRvcklEc0VFRUUAAADoHQEADAgBAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0lEaU5TXzExY2hhcl90cmFpdHNJRGlFRU5TXzlhbGxvY2F0b3JJRGlFRUVFAAAA6B0BAFgIAQBOMTBlbXNjcmlwdGVuM3ZhbEUAAOgdAQCkCAEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJY0VFAADoHQEAwAgBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWFFRQAA6B0BAOgIAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0loRUUAAOgdAQAQCQEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJc0VFAADoHQEAOAkBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SXRFRQAA6B0BAGAJAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lpRUUAAOgdAQCICQEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJakVFAADoHQEAsAkBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWxFRQAA6B0BANgJAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0ltRUUAAOgdAQAACgEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJeEVFAADoHQEAKAoBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SXlFRQAA6B0BAFAKAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lmRUUAAOgdAQB4CgEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJZEVFAADoHQEAoAoBAAAAAAAAAAAAAwAAAAQAAAAEAAAABgAAAIP5ogBETm4A/CkVANFXJwDdNPUAYtvAADyZlQBBkEMAY1H+ALveqwC3YcUAOm4kANJNQgBJBuAACeouAByS0QDrHf4AKbEcAOg+pwD1NYIARLsuAJzphAC0JnAAQX5fANaROQBTgzkAnPQ5AItfhAAo+b0A+B87AN7/lwAPmAUAES/vAApaiwBtH20A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';
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

