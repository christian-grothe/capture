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
  wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAAB3AIyYAF/AX9gAn9/AX9gAX8AYAJ/fwBgA39/fwF/YAABf2ADf39/AGAAAGAEf39/fwBgBX9/f39/AGABfQF9YAJ/fQBgBn9/f39/fwBgAX8BfWAEf39/fwF/YAJ9fQF9YAV/f39/fwF/YAN/fn8BfmAEf39/fQBgAXwBfGADf399AGAFf39/fX8AYAF/AXxgAX0Bf2ACfH8BfGAEf35+fwBgBn98f39/fwF/YAJ+fwF/YA1/f39/f39/f39/f39/AGAJf39/f39/f39/AGAFf39/f30AYAV/f319fQF9YAN9fX0BfWADf31/AX1gBH9/fX0BfWAEf319fwBgAn98AGACfHwBfGACfH8Bf2ADfHx/AXxgAn99AX1gAnx/AX1gAn5+AXxgB39/f39/f38Bf2ADfn9/AX9gAXwBfmAEf39+fwF+YAV/f39+fgBgB39/f39/f38AYAR/fn9/AX8CvwQTA2VudhZfZW1iaW5kX3JlZ2lzdGVyX2NsYXNzABwDZW52Il9lbWJpbmRfcmVnaXN0ZXJfY2xhc3NfY29uc3RydWN0b3IADANlbnYLX19jeGFfdGhyb3cABgNlbnYfX2VtYmluZF9yZWdpc3Rlcl9jbGFzc19mdW5jdGlvbgAdA2VudhVfZW1iaW5kX3JlZ2lzdGVyX3ZvaWQAAwNlbnYVX2VtYmluZF9yZWdpc3Rlcl9ib29sAAgDZW52GF9lbWJpbmRfcmVnaXN0ZXJfaW50ZWdlcgAJA2VudhZfZW1iaW5kX3JlZ2lzdGVyX2Zsb2F0AAYDZW52G19lbWJpbmRfcmVnaXN0ZXJfc3RkX3N0cmluZwADA2VudhxfZW1iaW5kX3JlZ2lzdGVyX3N0ZF93c3RyaW5nAAYDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfZW12YWwAAgNlbnYcX2VtYmluZF9yZWdpc3Rlcl9tZW1vcnlfdmlldwAGA2VudhRlbXNjcmlwdGVuX21lbWNweV9qcwAGA2VudhZlbXNjcmlwdGVuX3Jlc2l6ZV9oZWFwAAADZW52BWFib3J0AAcWd2FzaV9zbmFwc2hvdF9wcmV2aWV3MQhmZF9jbG9zZQAAFndhc2lfc25hcHNob3RfcHJldmlldzEIZmRfd3JpdGUADgNlbnYXX2VtYmluZF9yZWdpc3Rlcl9iaWdp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ASAARAAAAAAAAAAAQQAQ3gMhAAwBCwJAIAJBgIDA/wdJDQAgACAAoSEADAELIAAgARDdAyECIAErAwghACABKwMAIQMCQAJAAkACQCACQQNxDgMAAQIDCyADIABBARDeAyEADAMLIAMgABDbAyEADAILIAMgAEEBEN4DmiEADAELIAMgABDbA5ohAAsgAUEQaiQAIAALjgQBA38CQCACQYAESQ0AIAAgASACEAwgAA8LIAAgAmohAwJAAkAgASAAc0EDcQ0AAkACQCAAQQNxDQAgACECDAELAkAgAg0AIAAhAgwBCyAAIQIDQCACIAEtAAA6AAAgAUEBaiEBIAJBAWoiAkEDcUUNASACIANJDQALCwJAIANBfHEiBEHAAEkNACACIARBQGoiBUsNAANAIAIgASgCADYCACACIAEoAgQ2AgQgAiABKAIINgIIIAIgASgCDDYCDCACIAEoAhA2AhAgAiABKAIUNgIUIAIgASgCGDYCGCACIAEoAhw2AhwgAiABKAIgNgIgIAIgASgCJDYCJCACIAEoAig2AiggAiABKAIsNgIsIAIgASgCMDYCMCACIAEoAjQ2AjQgAiABKAI4NgI4IAIgASgCPDYCPCABQcAAaiEBIAJBwABqIgIgBU0NAAsLIAIgBE8NAQNAIAIgASgCADYCACABQQRqIQEgAkEEaiICIARJDQAMAgsACwJAIANBBE8NACAAIQIMAQsCQCADQXxqIgQgAE8NACAAIQIMAQsgACECA0AgAiABLQAAOgAAIAIgAS0AAToAASACIAEtAAI6AAIgAiABLQADOgADIAFBBGohASACQQRqIgIgBE0NAAsLAkAgAiADTw0AA0AgAiABLQAAOgAAIAFBAWohASACQQFqIgIgA0cNAAsLIAALJAECfwJAIAAQ/ANBAWoiARCABCICDQBBAA8LIAIgACABEPoDC4UBAQN/IAAhAQJAAkAgAEEDcUUNAAJAIAAtAAANACAAIABrDwsgACEBA0AgAUEBaiIBQQNxRQ0BIAEtAAANAAwCCwALA0AgASICQQRqIQEgAigCACIDQX9zIANB//37d2pxQYCBgoR4cUUNAAsDQCACIgFBAWohAiABLQAADQALCyABIABrCwcAPwBBEHQLBgBBtMEEC1MBAn9BACgCyL4EIgEgAEEHakF4cSICaiEAAkACQAJAIAJF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AgggASAANgIMIAAgAzYCDCAAIAE2AggPC0EfIQMCQCABQf///wdLDQAgAUEmIAFBCHZnIgNrdkEBcSADQQF0a0E+aiEDCyAAIAM2AhwgAEIANwIQIANBAnRB6MMEaiEEAkACQAJAQQAoArzBBCIFQQEgA3QiAnENAEEAIAUgAnI2ArzBBCAEIAA2AgAgACAENgIYDAELIAFBAEEZIANBAXZrIANBH0YbdCEDIAQoAgAhBQNAIAUiBCgCBEF4cSABRg0CIANBHXYhBSADQQF0IQMgBCAFQQRxakEQaiICKAIAIgUNAAsgAiAANgIAIAAgBDYCGAsgACAANgIMIAAgADYCCA8LIAQoAggiASAANgIMIAQgADYCCCAAQQA2AhggACAENgIMIAAgATYCCAsLRQECfyMAQRBrIgIkAEEAIQMCQCAAQQNxDQAgASAAcA0AIAJBDGogACABEIQEIQBBACACKAIMIAAbIQMLIAJBEGokACADCzYBAX8gAEEBIABBAUsbIQECQANAIAEQgAQiAA0BAkAQwAQiAEUNACAAEQcADAELCxAOAAsgAAsHACAAEIIECz8BAn8gAUEEIAFBBEsbIQIgAEEBIABBAUsbIQACQANAIAIgABCKBCIDDQEQwAQiAUUNASABEQcADAALAAsgAwshAQF/IAAgACABakF/akEAIABrcSICIAEgAiABSxsQhgQLBwAgABCMBAsHACAAEIIECxAAIABB2LwEQQhqNgIAIAALPAECfyABEPwDIgJBDWoQhwQiA0EANgIIIAMgAjYCBCADIAI2AgAgACADEI8EIAEgAkEBahD6AzYCACAACwcAIABBDGoLIAAgABCNBCIAQci9BEEIajYCACAAQQRqIAEQjgQaIAALBABBAQsEACAACwwAIAAoAjwQkgQQDwsWAAJAIAANAEEADwsQ/gMgADYCAEF/C+UCAQd/IwBBIGsiAyQAIAMgACgCHCIENgIQIAAoAhQhBSADIAI2AhwgAyABNgIYIAMgBSAEayIBNgIUIAEgAmohBiADQRBqIQRBAiEHAkACQAJAAkACQCAAKAI8IANBEGpBAiADQQxqEBAQlARFDQAgBCEFDAELA0AgBiADKAIMIgFGDQICQCABQX9KDQAgBCEFDAQLIAQgASAEKAIEIghLIglBA3RqIgUgBSgCACABIAhBACAJG2siCGo2AgAgBEEMQQQgCRtqIgQgBCgCACAIazYCACAGIAFrIQYgBSEEIAAoAjwgBSAHIAlrIgcgA0EMahAQEJQERQ0ACwsgBkF/Rw0BCyAAIAAoAiwiATYCHCAAIAE2AhQgACABIAAoAjBqNgIQIAIhAQwBC0EAIQEgAEEANgIcIABCADcDECAAIAAoAgBBIHI2AgAgB0ECRg0AIAIgBSgCBGshAQsgA0EgaiQAIAELOQEBfyMAQRBrIgMkACAAIAEgAkH/AXEgA0EIahD+BBCUBCECIAMpAwghASADQRBqJABCfyABIAIbCw4AIAAoAjwgASACEJYECwQAQQALAgALAgALDQBBsMUEEJkEQbTFBAsJAEGwxQQQmgQLBABBAQsCAAtcAQF/IAAgACgCSCIBQX9qIAFyNgJIAkAgACgCACIBQQhxRQ0AIAAgAUEgcjYCAEF/DwsgAEIANwIEIAAgACgCLCIBNgIcIAAgATYCFCAAIAEgACgCMGo2AhBBAAvRAQEDfwJAAkAgAigCECIDDQBBACEEIAIQnwQNASACKAIQIQMLAkAgAyACKAIUIgRrIAFPDQAgAiAAIAEgAigCJBEEAA8LAkACQCACKAJQQQBIDQAgAUUNACABIQMCQANAIAAgA2oiBUF/ai0AAEEKRg0BIANBf2oiA0UNAgwACwALIAIgACADIAIoAiQRBAAiBCADSQ0CIAEgA2shASACKAIUIQQMAQsgACEFQQAhAwsgBCAFIAEQ+gMaIAIgAigCFCABajYCFCADIAFqIQQLIAQLWwECfyACIAFsIQQCQAJAIAMoAkxBf0oNACAAIAQgAxCgBCEADAELIAMQnQQhBSAAIAQgAxCgBCEAIAVFDQAgAxCeBAsCQCAAIARHDQAgAkEAIAEbDwsgACABbgvlAQECfyACQQBHIQMCQAJAAkAgAEEDcUUNACACRQ0AIAFB/wFxIQQDQCAALQAAIARGDQIgAkF/aiICQQBHIQMgAEEBaiIAQQNxRQ0BIAINAAsLIANFDQECQCAALQAAIAFB/wFxRg0AIAJBBEkNACABQf8BcUGBgoQIbCEEA0AgACgCACAEcyIDQX9zIANB//37d2pxQYCBgoR4cQ0CIABBBGohACACQXxqIgJBA0sNAAsLIAJFDQELIAFB/wFxIQMDQAJAIAAtAAAgA0cNACAADwsgAEEBaiEAIAJBf2oiAg0ACwtBAAsXAQF/IABBACABEKIEIgIgAGsgASACGwujAgEBf0EBIQMCQAJAIABFDQAgAUH/AE0NAQJAAkAQ9gMoAmAoAgANACABQYB/cUGAvwNGDQMQ/gNBGTYCAAwBCwJAIAFB/w9LDQAgACABQT9xQYABcjoAASAAIAFBBnZBwAFyOgAAQQIPCwJAAkAgAUGAsANJDQAgAUGAQHFBgMADRw0BCyAAIAFBP3FBgAFyOgACIAAgAUEMdkHgAXI6AAAgACABQQZ2QT9xQYABcjoAAUEDDwsCQCABQYCAfGpB//8/Sw0AIAAgAUE/cUGAAXI6AAMgACABQRJ2QfABcjoAACAAIAFBBnZBP3FBgAFyOgACIAAgAUEMdkE/cUGAAXI6AAFBBA8LEP4DQRk2AgALQX8hAwsgAw8LIAAgAToAAEEBCxUAAkAgAA0AQQAPCyAAIAFBABCkBAuPAQIBfgF/AkAgAL0iAkI0iKdB/w9xIgNB/w9GDQACQCADDQACQAJAIABEAAAAAAAAAABiDQBBACEDDAELIABEAAAAAAAA8EOiIAEQpgQhACABKAIAQUBqIQMLIAEgAzYCACAADwsgASADQYJ4ajYCACACQv////////+HgH+DQoCAgICAgIDwP4S/IQALIAALUwEBfgJAAkAgA0HAAHFFDQAgASADQUBqrYYhAkIAIQEMAQsgA0UNACABQcAAIANrrYggAiADrSIEhoQhAiABIASGIQELIAAgATcDACAAIAI3AwgLUwEBfgJAAkAgA0HAAHFFDQAgAiADQUBqrYghAUIAIQIMAQsgA0UNACACQcAAIANrrYYgASADrSIEiIQhASACIASIIQILIAAgATcDACAAIAI3AwgL5AMCAn8CfiMAQSBrIgIkAAJAAkAgAUL///////////8AgyIEQoCAgICAgMD/Q3wgBEKAgICAgIDAgLx/fFoNACAAQjyIIAFCBIaEIQQCQCAAQv//////////D4MiAEKBgICAgICAgAhUDQAgBEKBgICAgICAgMAAfCEFDAILIARCgICAgICAgIDAAHwhBSAAQoCAgICAgICACFINASAFIARCAYN8IQUMAQsCQCAAUCAEQoCAgICAgMD//wBUIARCgICAgICAwP//AFEbDQAgAEI8iCABQgSGhEL/////////A4NCgICA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ERoAIgxBAE4NCAwLCyAHIAcpA0A8ADdBASEUIAghDSAJIRYgFyERDAULIAwtAAEhDiAMQQFqIQwMAAsACyAADQkgCkUNA0EBIQwCQANAIAQgDEECdGooAgAiDkUNASADIAxBA3RqIA4gAiAGEK4EQQEhCyAMQQFqIgxBCkcNAAwLCwALQQEhCyAMQQpPDQkDQCAEIAxBAnRqKAIADQFBASELIAxBAWoiDEEKRg0KDAALAAtBHCEWDAYLIAkhFgsgFCAWIA1rIgEgFCABShsiEiAQQf////8Hc0oNA0E9IRYgEyAQIBJqIg8gEyAPShsiDCAOSg0EIABBICAMIA8gERCyBCAAIBggEBCsBCAAQTAgDCAPIBFBgIAEcxCyBCAAQTAgEiABQQAQsgQgACANIAEQrAQgAEEgIAwgDyARQYDAAHMQsgQgBygCTCEBDAELCwtBACELDAMLQT0hFgsQ/gMgFjYCAAtBfyELCyAHQdAAaiQAIAsLGQACQCAALQAAQSBxDQAgASACIAAQoAQaCwt7AQV/QQAhAQJAIAAoAgAiAiwAAEFQaiIDQQlNDQBBAA8LA0BBfyEEAkAgAUHMmbPmAEsNAEF/IAMgAUEKbCIBaiADIAFB/////wdzSxshBAsgACACQQFqIgM2AgAgAiwAASEFIAQhASADIQIgBUFQaiIDQQpJDQALIAQLtgQAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgAUF3ag4SAAECBQMEBgcICQoLDA0ODxAREgsgAiACKAIAIgFBBGo2AgAgACABKAIANgIADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABMgEANwMADwsgAiACKAIAIgFBBGo2AgAgACABMwEANwMADwsgAiACKAIAIgFBBGo2AgAgACABMAAANwMADwsgAiACKAIAIgFBBGo2AgAgACABMQAANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKwMAOQMADwsgACACIAMRAwALCz4BAX8CQCAAUA0AA0AgAUF/aiIBIACnQQ9xQcC2BGotAAAgAnI6AAAgAEIPViEDIABCBIghACADDQALCyABCzYBAX8CQCAAUA0AA0AgAUF/aiIBIACnQQdxQTByOgAAIABCB1YhAiAAQgOIIQAgAg0ACwsgAQuIAQIBfgN/AkACQCAAQoCAgIAQWg0AIAAhAgwBCwNAIAFBf2oiASAAIABCCoAiAkIKfn2nQTByOgAAIABC/////58BViEDIAIhACADDQALCwJAIAKnIgNFDQADQCABQX9qIgEgAyADQQpuIgRBCmxrQTByOgAAIANBCUshBSAEIQMgBQ0ACwsgAQtvAQF/IwBBgAJrIgUkAAJAIAIgA0wNACAEQYDABHENACAFIAEgAiADayIDQYACIANBgAJJIgIbEOADGgJAIAINAANAIAAgBUGAAhCsBCADQYB+aiIDQf8BSw0ACwsgACAFIAMQrAQLIAVBgAJqJAALDwAgACABIAJBL0EwEKoEC6sZAxJ/An4BfCMAQbAEayIGJABBACEHIAZBADYCLAJAAkAgARC2BCIYQn9VDQBBASEIQYqABCEJIAGaIgEQtgQhGAwBCwJAIARBgBBxRQ0AQQEhCEGNgAQhCQwBC0GQgARBi4AEIARBAXEiCBshCSAIRSEHCwJAAkAgGEKAgICAgICA+P8Ag0KAgICAgICA+P8AUg0AIABBICACIAhBA2oiCiAEQf//e3EQsgQgACAJIAgQrAQgAEH4gARBroIEIAVBIHEiCxtB9IEEQbKCBCALGyABIAFiG0EDEKwEIABBICACIAogBEGAwABzELIEIAogAiAKIAJKGyEMDAELIAZBEGohDQJAAkACQAJAIAEgBkEsahCmBCIBIAGgIgFEAAAAAAAAAABhDQAgBiAGKAIsIgpBf2o2AiwgBUEgciIOQeEA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AAAAAAAAAGENAQsgCkEuOgABIApBAmohCwsgAUQAAAAAAAAAAGINAAtBfyEMQf3///8HIBUgDSAWayISaiITayADSA0AIABBICACIBMgA0ECaiALIAZBEGprIgogCkF+aiADSBsgCiADGyIDaiILIAQQsgQgACAXIBUQrAQgAEEwIAIgCyAEQYCABHMQsgQgACAGQRBqIAoQrAQgAEEwIAMgCmtBAEEAELIEIAAgFiASEKwEIABBICACIAsgBEGAwABzELIEIAsgAiALIAJKGyEMCyAGQbAEaiQAIAwLLgEBfyABIAEoAgBBB2pBeHEiAkEQajYCACAAIAIpAwAgAkEIaikDABCpBDkDAAsFACAAvQuRAQEDfyMAQRBrIgIkACACIAE6AA8CQAJAIAAoAhAiAw0AQX8hAyAAEJ8EDQEgACgCECEDCwJAIAAoAhQiBCADRg0AIAAoAlAgAUH/AXEiA0YNACAAIARBAWo2AhQgBCABOgAADAELQX8hAyAAIAJBD2pBASAAKAIkEQQAQQFHDQAgAi0ADyEDCyACQRBqJAAgAwsJACAAIAEQuQQLcgECfwJAAkAgASgCTCICQQBIDQAgAkUNASACQf////8DcRD2AygCGEcNAQsCQCAAQf8BcSICIAEoAlBGDQAgASgCFCIDIAEoAhBGDQAgASADQQFqNgIUIAMgADoAACACDwsgASACELcEDwsgACABELoEC3UBA38CQCABQcwAaiICELsERQ0AIAEQnQQaCwJAAkAgAEH/AXEiAyABKAJQRg0AIAEoAhQiBCABKAIQRg0AIAEgBEEBajYCFCAEIAA6AAAMAQsgASADELcEIQMLAkAgAhC8BEGAgICABHFFDQAgAhC9BAsgAwsbAQF/IAAgACgCACIBQf////8DIAEbNgIAIAELFAEBfyAAKAIAIQEgAEEANgIAIAELCgAgAEEBEJgEGgs+AQJ/IwBBEGsiAiQAQYCIBEELQQFBACgC4LIEIgMQoQQaIAIgATYCDCADIAAgARCzBBpBCiADELgEGhAOAAsHACAAKAIACwkAQbzFBBC/BAsPACAAQdAAahCABEHQAGoLDABB4ocEQQAQvgQAC1kBAn8gAS0AACECAkAgAC0AACIDRQ0AIAMgAkH/AXFHDQADQCABLQABIQIgAC0AASIDRQ0BIAFBAWohASAAQQFq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aAB1bnNpZ25lZCBsb25nAHN0YXJ0UGxheWluZwBzdG9wUGxheWluZwBzdGQ6OndzdHJpbmcAc3RkOjpzdHJpbmcAc3RkOjp1MTZzdHJpbmcAc3RkOjp1MzJzdHJpbmcAaW5mAENhcHR1cmVCYXNlAENhcHR1cmUAZG91YmxlAHJlY29yZAB2b2lkAHN0ZDo6YmFkX2FsbG9jAE5BTgBJTkYAZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8c2hvcnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIHNob3J0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8ZmxvYXQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQ4X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDhfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDE2X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDE2X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQ2NF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ2NF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8Y2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgY2hhcj4Ac3RkOjpiYXNpY19zdHJpbmc8dW5zaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8c2lnbmVkIGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGxvbmc+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGxvbmc+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGRvdWJsZT4ALgAobnVsbCkAUHVyZSB2aXJ0dWFsIGZ1bmN0aW9uIGNhbGxlZCEAbGliYysrYWJpOiAAMTRDYXB0dXJlV3JhcHBlcgA3Q2FwdHVyZQAAAJgdAQAdBAEAwB0BAAwEAQAoBAEAUDE0Q2FwdHVyZVdyYXBwZXIAAAAcHgEAPAQBAAAAAAAwBAEAUEsxNENhcHR1cmVXcmFwcGVyAAAcHgEAYAQBAAEAAAAwBAEAaWkAdmkAAABQBAEAAAAAALQEAQATAAAAOEdyYWluRW52ADRTaW5lAJgdAQCmBAEAwB0BAJwEAQCsBAEAAAAAAKwEAQAUAAAAAAAAAHAFAQAVAAAAFgAAABcAAAAYAAAAGQAAABoAAAAbAAAAHAAAAB0AAABOU3QzX18yMTBfX2Z1bmN0aW9uNl9fZnVuY0lOOEVudmVsb3BlN29uRW5kZWRNVWx2RV9FTlNfOWFsbG9jYXRvcklTNF9FRUZ2dkVFRQBOU3QzX18yMTBfX2Z1bmN0aW9uNl9fYmFzZUlGdnZFRUUAmB0BAEYFAQDAHQEA+AQBAGgFAQAAAAAAaAUBAB4AAAAfAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAAE44RW52ZWxvcGU3b25FbmRlZE1VbHZFX0UAAACYHQEAqAUBAAAAAADUHAEAUAQBAFgdAQBYHQEANB0BAHZpaWlpaQBQN0NhcHR1cmUAAAAAHB4BAOsFAQAAAAAAKAQBAFBLN0NhcHR1cmUAABweAQAIBgEAAQAAACgEAQB2AAAAAAAAAAAAAADUHAEA+AUBADQdAQA0HQEAfB0BAHZpaWlpZgAA1BwBAPgFAQA0HQEAdmlpaQAAAAAAAAAA4AYBACIAAAAjAAAAJAAAACUAAAAmAAAAJwAAACgAAAApAAAAKgAAAE5TdDNfXzIxMF9fZnVuY3Rpb242X19mdW5jSVpONVZvaWNlNGluaXRFaWlmUDVTeW50aEUzJF8wTlNfOWFsbG9jYXRvcklTNV9FRUZ2dkVFRQAAAMAdAQCMBgEAaAUBAFpONVZvaWNlNGluaXRFaWlmUDVTeW50aEUzJF8wAAAAmB0BAOwGAQBOU3QzX18yMTJiYXNpY19zdHJpbmdJY05TXzExY2hhcl90cmFpdHNJY0VFTlNfOWFsbG9jYXRvckljRUVFRQAAmB0BABQHAQBOU3QzX18yMTJiYXNpY19zdHJpbmdJaE5TXzExY2hhcl90cmFpdHNJaEVFTlNfOWFsbG9jYXRvckloRUVFRQAAmB0BAFwHAQBOU3QzX18yMTJiYXNpY19zdHJpbmdJd05TXzExY2hhcl90cmFpdHNJd0VFTlNfOWFsbG9jYXRvckl3RUVFRQAAmB0BAKQHAQBOU3QzX18yMTJiYXNpY19zdHJpbmdJRHNOU18xMWNoYXJfdHJhaXRzSURzRUVOU185YWxsb2NhdG9ySURzRUVFRQAAAJgdAQDsBwEATlN0M19fMjEyYmFzaWNfc3RyaW5nSURpTlNfMTFjaGFyX3RyYWl0c0lEaUVFTlNfOWFsbG9jYXRvcklEaUVFRUUAAACYHQEAOAgBAE4xMGVtc2NyaXB0ZW4zdmFsRQAAmB0BAIQIAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0ljRUUAAJgdAQCgCAEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJYUVFAACYHQEAyAgBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWhFRQAAmB0BAPAIAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lzRUUAAJgdAQAYCQEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJdEVFAACYHQEAQAkBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWlFRQAAmB0BAGgJAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lqRUUAAJgdAQCQCQEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJbEVFAACYHQEAuAkBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SW1FRQAAmB0BAOAJAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0l4RUUAAJgdAQAICgEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJeUVFAACYHQEAMAoBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWZFRQAAmB0BAFgKAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lkRUUAAJgdAQCACgEAAAAAAAAAAAADAAAABAAAAAQAAAAGAAAAg/miAERObgD8KRUA0VcnAN009QBi28AAPJmVAEGQQwBjUf4Au96rALdhxQA6biQA0k1CAEkG4AAJ6i4AHJLRAOsd/gApsRwA6D6nAPU1ggBEuy4AnOmEALQmcABBfl8A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';
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

