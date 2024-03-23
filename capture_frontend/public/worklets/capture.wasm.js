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
  wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAAB5AIzYAF/AX9gAn9/AX9gAX8AYAJ/fwBgA39/fwF/YAABf2AAAGADf39/AGAEf39/fwBgAn99AGAFf39/f38AYAF9AX1gAX8BfWAGf39/f39/AGAEf39/fwF/YAV/f39/fwF/YAN/fn8BfmAEf39/fQBgA39/fQBgAXwBfGABfwF8YAJ9fQF9YAJ8fwF8YAR/fn5/AGAGf3x/f39/AX9gAn5/AX9gDX9/f39/f39/f39/f38AYAl/f39/f39/f38AYAV/f39/fQBgBX9/fX19AX1gA399fwF9YAR/f319AX1gAn98AGAFf39/fX8AYAR/fX1/AGAGf319fX1/AGADf319AGACfHwBfGACfH8Bf2ADfHx/AXxgAn99AX1gAX0Bf2ACfH8BfWACfn4BfGAHf39/f39/fwF/YAN+f38Bf2ABfAF+YAR/f35/AX5gBX9/f35+AGAHf39/f39/fwBgBH9+f38BfwK/BBMDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfY2xhc3MAGgNlbnYiX2VtYmluZF9yZWdpc3Rlcl9jbGFzc19jb25zdHJ1Y3RvcgANA2VudgtfX2N4YV90aHJvdwAHA2Vudh9fZW1iaW5kX3JlZ2lzdGVyX2NsYXNzX2Z1bmN0aW9uABsDZW52FV9lbWJpbmRfcmVnaXN0ZXJfdm9pZAADA2VudhVfZW1iaW5kX3JlZ2lzdGVyX2Jvb2wACANlbnYYX2VtYmluZF9yZWdpc3Rlcl9pbnRlZ2VyAAoDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfZmxvYXQABwNlbnYbX2VtYmluZF9yZWdpc3Rlcl9zdGRfc3RyaW5nAAMDZW52HF9lbWJpbmRfcmVnaXN0ZXJfc3RkX3dzdHJpbmcABwNlbnYWX2VtYmluZF9yZWdpc3Rlcl9lbXZhbAACA2VudhxfZW1iaW5kX3JlZ2lzdGVyX21lbW9yeV92aWV3AAcDZW52FGVtc2NyaXB0ZW5fbWVtY3B5X2pzAAcDZW52FmVtc2NyaXB0ZW5fcmVzaXplX2hlYXAAAANlbnYFYWJvcnQABhZ3YXNpX3NuYXBzaG90X3ByZXZpZXcxCGZkX2Nsb3NlAAAWd2FzaV9zbmFwc2hvdF9wcmV2aWV3MQhmZF93cml0ZQAOA2VudhdfZW1iaW5kX3JlZ2lz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NgIYIAAgBDYCDCAAIAE2AggLCwcAIAAQgQULDQAgABCmBBogABCrBAsGAEGBgQQLRQECfyMAQRBrIgIkAEEAIQMCQCAAQQNxDQAgASAAcA0AIAJBDGogACABEKQEIQBBACACKAIMIAAbIQMLIAJBEGokACADCzYBAX8gAEEBIABBAUsbIQECQANAIAEQoAQiAA0BAkAQ4wQiAEUNACAAEQYADAELCxAOAAsgAAsHACAAEKIECz8BAn8gAUEEIAFBBEsbIQIgAEEBIABBAUsbIQACQANAIAIgABCtBCIDDQEQ4wQiAUUNASABEQYADAALAAsgAwshAQF/IAAgACABakF/akEAIABrcSICIAEgAiABSxsQqQQLBwAgABCvBAsHACAAEKIECxAAIABByL0EQQhqNgIAIAALPAECfyABEJwEIgJBDWoQqgQiA0EANgIIIAMgAjYCBCADIAI2AgAgACADELIEIAEgAkEBahCaBDYCACAACwcAIABBDGoLIAAgABCwBCIAQbi+BEEIajYCACAAQQRqIAEQsQQaIAALBABBAQsEACAACwwAIAAoAjwQtQQQDwsWAAJAIAANAEEADwsQngQgADYCAEF/C+UCAQd/IwBBIGsiAyQAIAMgACgCHCIENgIQIAAoAhQhBSADIAI2AhwgAyABNgIYIAMgBSAEayIBNgIUIAEgAmohBiADQRBqIQRBAiEHAkACQAJAAkACQCAAKAI8IANBEGpBAiADQQxqEBAQtwRFDQAgBCEFDAELA0AgBiADKAIMIgFGDQICQCABQX9KDQAgBCEFDAQLIAQgASAEKAIEIghLIglBA3RqIgUgBSgCACABIAhBACAJG2siCGo2AgAgBEEMQQQgCRtqIgQgBCgCACAIazYCACAGIAFrIQYgBSEEIAAoAjwgBSAHIAlrIgcgA0EMahAQELcERQ0ACwsgBkF/Rw0BCyAAIAAoAiwiATYCHCAAIAE2AhQgACABIAAoAjBqNgIQIAIhAQwBC0EAIQEgAEEANgIcIABCADcDECAAIAAoAgBBIHI2AgAgB0ECRg0AIAIgBSgCBGshAQsgA0EgaiQAIAELOQEBfyMAQRBrIgMkACAAIAEgAkH/AXEgA0EIahChBRC3BCECIAMpAwghASADQRBqJABCfyABIAIbCw4AIAAoAjwgASACELkECwQAQQALAgALAgALDQBBoMYEELwEQaTGBAsJAEGgxgQQvQQLBABBAQsCAAtcAQF/IAAgACgCSCIBQX9qIAFyNgJIAkAgACgCACIBQQhxRQ0AIAAgAUEgcjYCAEF/DwsgAEIANwIEIAAgACgCLCIBNgIcIAAgATYCFCAAIAEgACgCMGo2AhBBAAvRAQEDfwJAAkAgAigCECIDDQBBACEEIAIQwgQNASACKAIQIQMLAkAgAyACKAIUIgRrIAFPDQAgAiAAIAEgAigCJBEEAA8LAkACQCACKAJQQQBIDQAgAUUNACABIQMCQANAIAAgA2oiBUF/ai0AAEEKRg0BIANBf2oiA0UNAgwACwALIAIgACADIAIoAiQRBAAiBCADSQ0CIAEgA2shASACKAIUIQQMAQsgACEFQQAhAwsgBCAFIAEQmgQaIAIgAigCFCABajYCFCADIAFqIQQLIAQLWwECfyACIAFsIQQCQAJAIAMoAkxBf0oNACAAIAQgAxDDBCEADAELIAMQwAQhBSAAIAQgAxDDBCEAIAVFDQAgAxDBBAsCQCAAIARHDQAgAkEAIAEbDwsgACABbgvlAQECfyACQQBHIQMCQAJAAkAgAEEDcUUNACACRQ0AIAFB/wFxIQQDQCAALQAAIARGDQIgAkF/aiICQQBHIQMgAEEBaiIAQQNxRQ0BIAINAAsLIANFDQECQCAALQAAIAFB/wFxRg0AIAJBBEkNACABQf8BcUGBgoQIbCEEA0AgACgCACAEcyIDQX9zIANB//37d2pxQYCBgoR4cQ0CIABBBGohACACQXxqIgJBA0sNAAsLIAJFDQELIAFB/wFxIQMDQAJAIAAtAAAgA0cNACAADwsgAEEBaiEAIAJBf2oiAg0ACwtBAAsXAQF/IABBACABEMUEIgIgAGsgASACGwujAgEBf0EBIQMCQAJAIABFDQAgAUH/AE0NAQJAAkAQlgQoAmAoAgANACABQYB/cUGAvwNGDQMQngRBGTYCAAwBCwJAIAFB/w9LDQAgACABQT9xQYABcjoAASAAIAFBBnZBwAFyOgAAQQIPCwJAAkAgAUGAsANJDQAgAUGAQHFBgMADRw0BCyAAIAFBP3FBgAFyOgACIAAgAUEMdkHgAXI6AAAgACABQQZ2QT9xQYABcjoAAUEDDwsCQCABQYCAfGpB//8/Sw0AIAAgAUE/cUGAAXI6AAMgACABQRJ2QfABcjoAACAAIAFBBnZBP3FBgAFyOgACIAAgAUEMdkE/cUGAAXI6AAFBBA8LEJ4EQRk2AgALQX8hAwsgAw8LIAAgAToAAEEBCxUAAkAgAA0AQQAPCyAAIAFBABDHBAuPAQIBfgF/AkAgAL0iAkI0iKdB/w9xIgNB/w9GDQACQCADDQACQAJAIABEAAAAAAAAAABiDQBBACEDDAELIABEAAAAAAAA8EOiIAEQyQQhACABKAIAQUBqIQMLIAEgAzYCACAADwsgASADQYJ4ajYCACACQv////////+HgH+DQoCAgICAgIDwP4S/IQALIAALUwEBfgJAAkAgA0HAAHFFDQAgASADQUBqrYYhAkIAIQEMAQsgA0UNACABQcAAIANrrYggAiADrSIEhoQhAiABIASGIQELIAAgATcDACAAIAI3AwgLUwEBfgJAAkAgA0HAAHFFDQAgAiADQUBqrYghAUIAIQIMAQsgA0UNACACQcAAIANrrYYgASADrSIEiIQhASACIASIIQILIAAgATcDACAAIAI3AwgL5AMCAn8CfiMAQSBrIgIkAAJAAkAgAUL///////////8AgyIEQoCAgICAgMD/Q3wgBEKAgICAgIDAgLx/fFoNACAAQjyIIAFCBIaEIQQCQCAAQv//////////D4MiAEKBgICAgICAgAhUDQAgBEKBgICAgICAgMAAfCEFDAILIARCgICAgICAgIDAAHwhBSAAQoCAgICAgICACFINASAFIARCAYN8IQUMAQsCQCAAUCAEQoCAgICAgMD//wBUIARCgICAgICAwP//AFEbDQAgAEI8iCABQgSGhEL/////////A4NCgICAgICAgPz/AIQhBQwBC0KAgICAgICA+P8AIQUgBEL///////+//8MAVg0AQgAhBSAEQjCIpyIDQZH3AEkNACACQRBqIAAgAUL///////8/g0KAgICAgIDAAIQiBCADQf+If2oQygQgAiAAIARBgfgAIANrEMsEIAIpAwAiBEI8iCACQQhqKQMAQgSGhCEFAkAgBEL//////////w+DIAIpAxAgAkEQakEIaikDAIRCAFKthCIEQoGAgICAgICACFQNACAFQgF8IQUMAQsgBEKAgICAgICAgAhSDQAgBUIBgyAFfCEFCyACQSBqJAAgBSABQoCAgICAgICAgH+DhL8L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ERDVBCAAIBggEBDPBCAAQTAgDCAPIBFBgIAEcxDVBCAAQTAgEiABQQAQ1QQgACANIAEQzwQgAEEgIAwgDyARQYDAAHMQ1QQgBygCTCEBDAELCwtBACELDAMLQT0hFgsQngQgFjYCAAtBfyELCyAHQdAAaiQAIAsLGQACQCAALQAAQSBxDQAgASACIAAQwwQaCwt7AQV/QQAhAQJAIAAoAgAiAiwAAEFQaiIDQQlNDQBBAA8LA0BBfyEEAkAgAUHMmbPmAEsNAEF/IAMgAUEKbCIBaiADIAFB/////wdzSxshBAsgACACQQFqIgM2AgAgAiwAASEFIAQhASADIQIgBUFQaiIDQQpJDQALIAQLtgQAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgAUF3ag4SAAECBQMEBgcICQoLDA0ODxAREgsgAiACKAIAIgFBBGo2AgAgACABKAIANgIADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABMgEANwMADwsgAiACKAIAIgFBBGo2AgAgACABMwEANwMADwsgAiACKAIAIgFBBGo2AgAgACABMAAANwMADwsgAiACKAIAIgFBBGo2AgAgACABMQAANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKwMAOQMADwsgACACIAMRAwALCz4BAX8CQCAAUA0AA0AgAUF/aiIBIACnQQ9xQbC3BGotAAAgAnI6AAAgAEIPViEDIABCBIghACADDQALCyAB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IHNob3J0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8ZmxvYXQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQ4X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDhfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDE2X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDE2X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQ2NF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ2NF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8Y2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgY2hhcj4Ac3RkOjpiYXNpY19zdHJpbmc8dW5zaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8c2lnbmVkIGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGxvbmc+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGxvbmc+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGRvdWJsZT4ALgAobnVsbCkAUHVyZSB2aXJ0dWFsIGZ1bmN0aW9uIGNhbGxlZCEAbGliYysrYWJpOiAAMTJTeW50aFdyYXBwZXIANVN5bnRoAAgeAQA5BAEAMB4BACoEAQBABAEAUDEyU3ludGhXcmFwcGVyAIweAQBUBAEAAAAAAEgEAQBQSzEyU3ludGhXcmFwcGVyAAAAAIweAQB0BAEAAQAAAEgEAQBpaQB2aQAAAGQEAQAAAAAAuAQBABgAAAA0U2luZQAAAAgeAQCwBAEAAAAAANgEAQAZAAAAOEdyYWluRW52AAAAMB4BAMwEAQC4BAEAAAAAAIgFAQAaAAAAGwAAABwAAAAdAAAAHgAAAB8AAAAgAAAAIQAAACIAAABOU3QzX18yMTBfX2Z1bmN0aW9uNl9fZnVuY0lOOEVudmVsb3BlN29uRW5kZWRNVWx2RV9FTlNfOWFsbG9jYXRvcklTNF9FRUZ2dkVFRQBOU3QzX18yMTBfX2Z1bmN0aW9uNl9fYmFzZUlGdnZFRUUACB4BAF4FAQAwHgEAEAUBAIAFAQAAAAAAgAUBACMAAAAkAAAAJQAAACUAAAAlAAAAJQAAACUAAAAlAAAAJQAAAE44RW52ZWxvcGU3b25FbmRlZE1VbHZFX0UAAAAIHgEAwAUBAAAAAAAAAAAAAAAAAEQdAQBkBAEAyB0BAMgdAQCkHQEAdmlpaWlpAFA1U3ludGgAAIweAQALBgEAAAAAAEAEAQBQSzVTeW50aAAAAACMHgEAJAYBAAEAAABABAEAdgAAABQGAQAAAAAAAAAAAEQdAQAUBgEApB0BAKQdAQDsHQEAdmlpaWlmAABEHQEAFAYBAHZpaQBEHQEAFAYBAHQdAQB2aWlpAAAAAEQdAQAUBgEA7B0BAHZpaWYAAAAAAAAAACAHAQAoAAAAKQAAACoAAAArAAAALAAAAC0AAAAuAAAALwAAADAAAABOU3QzX18yMTBfX2Z1bmN0aW9uNl9fZnVuY0laTjVWb2ljZTRpbml0RWlpZlA1U3ludGhFMyRfME5TXzlhbGxvY2F0b3JJUzVfRUVGdnZFRUUAAAAwHgEAzAYBAIAFAQBaTjVWb2ljZTRpbml0RWlpZlA1U3ludGhFMyRfMAAAAAgeAQAsBwEATlN0M19fMjEyYmFzaWNfc3RyaW5nSWNOU18xMWNoYXJfdHJhaXRzSWNFRU5TXzlhbGxvY2F0b3JJY0VFRUUAAAgeAQBUBwEATlN0M19fMjEyYmFzaWNfc3RyaW5nSWhOU18xMWNoYXJfdHJhaXRzSWhFRU5TXzlhbGxvY2F0b3JJaEVFRUUAAAgeAQCcBwEATlN0M19fMjEyYmFzaWNfc3RyaW5nSXdOU18xMWNoYXJfdHJhaXRzSXdFRU5TXzlhbGxvY2F0b3JJd0VFRUUAAAgeAQDkBwEATlN0M19fMjEyYmFzaWNfc3RyaW5nSURzTlNfMTFjaGFyX3RyYWl0c0lEc0VFTlNfOWFsbG9jYXRvcklEc0VFRUUAAAAIHgEALAgBAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0lEaU5TXzExY2hhcl90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';
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

