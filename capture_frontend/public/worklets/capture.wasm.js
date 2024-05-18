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
  wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAABiwM4YAF/AX9gAn9/AX9gAX8AYAJ/fwBgAAF/YAN/f38Bf2ACf30AYAN/f38AYAAAYAR/f39/AGAFf39/f38AYAF9AX1gAX8BfWAGf39/f39/AGAEf39/fwF/YAR/f399AGADf399AGABfAF8YAJ9fQF9YAV/f39/fwF/YAN/fn8BfmADf398AGAFf39/f30AYAF/AXxgAX0Bf2ACfH8BfGAEf35+fwBgBn98f39/fwF/YAJ+fwF/YA1/f39/f39/f39/f39/AGAKf39/f39/f39/fwBgCX9/f39/f39/fwBgAn9/AX1gBH9/f3wAYAJ/fABgBX9/fX19AX1gA319fQF9YAN/fX8BfWAEf399fQF9YAV/f399fwBgBH99fX8AYAZ/fX19fX8AYAN/fX0AYAJ8fAF8YAJ8fwF/YAN8fH8BfGACf30BfWACfH8BfWACfn4BfGAHf39/f39/fwF/YAN+f38Bf2ABfAF+YAR/f35/AX5gBX9/f35+AGAHf39/f39/fwBgBH9+f38BfwLlBBQDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfY2xhc3MAHQNlbnYfX2VtYmluZF9yZWdpc3Rlcl9jbGFzc19wcm9wZXJ0eQAeA2VudiJfZW1iaW5kX3JlZ2lzdGVyX2NsYXNzX2NvbnN0cnVjdG9yAA0DZW52C19fY3hhX3Rocm93AAcDZW52H19lbWJpbmRfcmVnaXN0ZXJfY2xhc3NfZnVuY3Rpb24AHwNlbnYVX2VtYmluZF9yZWdpc3Rlcl92b2lkAAMDZW52FV9lbWJpbmRfcmVnaXN0ZXJfYm9vbAAJA2VudhhfZW1iaW5kX3JlZ2lzdGVyX2ludGVnZXIACgNlbnYWX2VtYmluZF9yZWdpc3Rlcl9mbG9hdAAHA2VudhtfZW1iaW5kX3JlZ2lzdGVyX3N0ZF9zdHJpbmcAAwNlbnYcX2VtYmluZF9yZWdpc3Rlcl9zdGRfd3N0cmluZwAHA2VudhZfZW1iaW5kX3JlZ2lzdGVyX2VtdmFsAAIDZW52HF9lbWJpbmRfcmVnaXN0ZXJfbWVtb3J5X3ZpZXcABwNlbnYUZW1zY3JpcHRlbl9tZW1jcHlfanMABwNlbnYWZW1zY3JpcHRlbl9yZXNpemVfaGVhcAAAA2VudgVhYm9ydAAIFndhc2lfc25h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ASCIASCMARA9IAIgITYCqAJBDyGNASACII0BNgKkAiACKQKkAiHVBCACINUENwOwBSACKAKwBSGOASACKAK0BSGPASACIIcBNgLMBUHchQQhkAEgAiCQATYCyAUgAiCPATYCxAUgAiCOATYCwAUgAigCzAUhkQEgAigCyAUhkgEgAigCwAUhkwEgAigCxAUhlAEgAiCUATYCvAUgAiCTATYCuAUgAikCuAUh1gQgAiDWBDcDaEHoACGVASACIJUBaiGWASCSASCWARA+IAIgITYCoAJBECGXASACIJcBNgKcAiACKQKcAiHXBCACINcENwPQCCACKALQCCGYASACKALUCCGZASACIJEBNgLwCEHdggQhmgEgAiCaATYC7AggAiCZATYC6AggAiCYATYC5AggAigC8AghmwEgAigC7AghnAEgAigC5AghnQEgAigC6AghngEgAiCeATYC4AggAiCdATYC3AggAikC3Agh2AQgAiDYBDcDYEHgACGfASACIJ8BaiGgASCcASCgARA/IAIgITYCmAJBESGhASACIKEBNgKUAiACKQKUAiHZBCACINkENwOwCCACKAKwCCGiASACKAK0CCGjASACIJsBNgLMCEG0gQQhpAEgAiCkATYCyAggAiCjATYCxAggAiCiATYCwAggAigCzAghpQEgAigCyAghpgEgAigCwAghpwEgAigCxAghqAEgAiCoATYCvAggAiCnATYCuAggAikCuAgh2gQgAiDaBDcDWEHYACGpASACIKkBaiGqASCmASCqARA/IAIgITYCkAJBEiGrASACIKsBNgKMAiACKQKMAiHbBCACINsENwOQCCACKAKQCCGsASACKAKUCCGtASACIKUBNgKsCEGThAQhrgEgAiCuATYCqAggAiCtATYCpAggAiCsATYCoAggAigCrAghrwEgAigCqAghsAEgAigCoAghsQEgAigCpAghsgEgAiCyATYCnAggAiCxATYCmAggAikCmAgh3AQgAiDcBDcDUEHQACGzASACILMBaiG0ASCwASC0ARA/IAIgITYCiAJBEyG1ASACILUBNgKEAiACKQKEAiHdBCACIN0ENwPwByACKALwByG2ASACKAL0ByG3ASACIK8BNgKMCEGhhAQhuAEgAiC4ATYCiAggAiC3ATYChAggAiC2ATYCgAggAigCjAghuQEgAigCiAghugEgAigCgAghuwEgAigChAghvAEgAiC8ATYC/AcgAiC7ATYC+AcgAikC+Ach3gQgAiDeBDcDSEHIACG9ASACIL0BaiG+ASC6ASC+ARA/IAIgITYCgAJBFCG/ASACIL8BNgL8ASACKQL8ASHfBCACIN8ENwPQByACKALQByHAASACKALUByHBASACILkBNgLsB0GAgAQhwgEgAiDCATYC6AcgAiDBATYC5AcgAiDAATYC4AcgAigC7AchwwEgAigC6AchxAEgAigC4AchxQEgAigC5AchxgEgAiDGATYC3AcgAiDFATYC2AcgAikC2Ach4AQgAiDgBDcDQEHAACHHASACIMcBaiHIASDEASDIARA/IAIgITYC+AFBFSHJASACIMkBNgL0ASACKQL0ASHhBCACIOEENwOwByACKAKwByHKASACKAK0ByHLASACIMMBNgLMB0HohQQhzAEgAiDMATYCyAcgAiDLATYCxAcgAiDKATYCwAcgAigCzAchzQEgAigCyAchzgEgAigCwAchzwEgAigCxAch0AEgAiDQATYCvAcgAiDPATYCuAcgAikCuAch4gQgAiDiBDcDOEE4IdEBIAIg0QFqIdIBIM4BINIBED8gAiAhNgLwAUEWIdMBIAIg0wE2AuwBIAIpAuwBIeMEIAIg4wQ3A5AHIAIoApAHIdQBIAIoApQHIdUBIAIgzQE2AqwHQYuABCHWASACINYBNgKoByACINUBNgKkByACINQBNgKgByACKAKsByHXASACKAKoByHYASACKAKgByHZASACKAKkByHaASACINoBNgKcByACINkBNgKYByACKQKYByHkBCACIOQENwMwQTAh2wEgAiDbAWoh3AEg2AEg3AEQPyACICE2AugBQRch3QEgAiDdATYC5AEgAikC5AEh5QQgAiDlBDcD8AYgAigC8AYh3gEgAigC9AYh3wEgAiDXATYCjAdB9YUEIeABIAIg4AE2AogHIAIg3wE2AoQHIAIg3gE2AoAHIAIoAowHIeEBIAIoAogHIeIBIAIoAoAHIeMBIAIoAoQHIeQBIAIg5AE2AvwGIAIg4wE2AvgGIAIpAvgGIeYEIAIg5gQ3AyhBKCHlASACIOUBaiHmASDiASDmARA/IAIgITYC4AFBGCHnASACIOcBNgLcASACKQLcASHnBCACIOcENwPQ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/wFxIQMDQAJAIAAtAAAgA0cNACAADwsgAEEBaiEAIAJBf2oiAg0ACwtBAAsXAQF/IABBACABEJEFIgIgAGsgASACGwujAgEBf0EBIQMCQAJAIABFDQAgAUH/AE0NAQJAAkAQ4gQoAmAoAgANACABQYB/cUGAvwNGDQMQ6gRBGTYCAAwBCwJAIAFB/w9LDQAgACABQT9xQYABcjoAASAAIAFBBnZBwAFyOgAAQQIPCwJAAkAgAUGAsANJDQAgAUGAQHFBgMADRw0BCyAAIAFBP3FBgAFyOgACIAAgAUEMdkHgAXI6AAAgACABQQZ2QT9xQYABcjoAAUEDDwsCQCABQYCAfGpB//8/Sw0AIAAgAUE/cUGAAXI6AAMgACABQRJ2QfABcjoAACAAIAFBBnZBP3FBgAFyOgACIAAgAUEMdkE/cUGAAXI6AAFBBA8LEOoEQRk2AgALQX8hAwsgAw8LIAAgAToAAEEBCxUAAkAgAA0AQQAPCyAAIAFBABCTBQuPAQIBfgF/AkAgAL0iAkI0iKdB/w9xIgNB/w9GDQACQCADDQACQAJAIABEAAAAAAAAAABiDQBBACEDDAELIABEAAAAAAAA8EOiIAEQlQUhACABKAIAQUBqIQMLIAEgAzYCACAADwsgASADQYJ4ajYCACACQv////////+HgH+DQoCAgICAgIDwP4S/IQALIAALUwEBfgJAAkAgA0HAAHFFDQAgASADQUBqrYYhAkIAIQEMAQsgA0UNACABQcAAIANrrYggAiADrSIEhoQhAiABIASGIQELIAAgATcDACAAIAI3AwgLUwEBfgJAAkAgA0HAAHFFDQAgAiADQUBqrYghAUIAIQIMAQsgA0UNACACQcAAIANrrYYgASADrSIEiIQhASACIASIIQILIAAgATcDACAAIAI3AwgL5AMCAn8CfiMAQSBrIgIkAAJAAkAgAUL///////////8AgyIEQoCAgICAgMD/Q3wgBEKAgICAgIDAgLx/fFoNACAAQjyIIAFCBIaEIQQCQCAAQv//////////D4MiAEKBgICAgICAgAhUDQAgBEKBgICAgICAgMAAfCEFDAILIARCgICAgICAgIDAAHwhBSAAQoCAgICAgICACFINASAFIARCAYN8IQUMAQsCQCAAUCAEQoCAgICAgMD//wBUIARCgICAgICAwP//AFEbDQAgAEI8iCABQgSGhEL/////////A4NCgICAgICAgPz/AIQhBQwBC0KAgICAgICA+P8AIQUgBEL///////+//8MAVg0AQgAhBSAEQjCIpyIDQZH3AEkNACACQRBqIAAgAUL///////8/g0KAgICAgIDAAIQiBCADQf+If2oQlgUgAiAAIARBgfgAIANrEJcFIAIpAwAiBEI8iCACQQhqKQMAQgSGhCEFAkAgBEL//////////w+DIAIpAxAgAkEQakEIaikDAIRCAFKthCIEQoGAgICAgICACFQNACAFQgF8IQUMAQsgBEKAgICAgICAgAhSDQAgBUIBgyAFfCEFCyACQSBqJAAgBSABQoCAgICAgICAgH+DhL8L8QIBBH8jAEHQAWsiBSQAIAUgAjYCzAEgBUGgAWpBAEEoEMwEGiAFIAUoAswBNgLIAQJAAkBBACABIAVByAFqIAVB0ABqIAVBoAFqIAMgBBCaBUEATg0AQX8hBAwBCwJAAkAgACgCTEEATg0AQQEhBgwBCyAAEIwFRSEGCyAAIAAoAgAiB0FfcTYCAAJAAkACQAJAIAAoAjANACAAQdAANgIwIABBADYCHCAAQgA3AxAgACgCLCEIIAAgBTYCLAwBC0EAIQggACgCEA0BC0F/IQIgABCOBQ0BCyAAIAEgBUHIAWogBUHQAGogBUGgAWogAyAEEJoFIQILIAdBIHEhBAJAIAhFDQAgAEEAQQAgACgCJBEFABogAEEANgIwIAAgCDYCLCAAQQA2AhwgACgCFCEDIABCADcDECACQX8gAxshAgsgACAAKAIAIgMgBHI2AgBBfyACIANBIHEbIQQgBg0AIAAQjQULIAVB0AFqJAAgBAuPEwISfwF+IwBB0ABrIgckACAHIAE2AkwgB0E3aiEIIAdBOGohCUEAIQpBACELAkACQAJAAkADQEEAIQwDQCABIQ0gDCALQf////8Hc0oNAiAMIAtqIQsgDSEMAkACQAJAAkACQCANLQAAIg5FDQADQAJAAkACQCAOQf8BcSIODQAgDCEBDAELIA5BJUcNASAMIQ4DQAJAIA4tAAFBJUYNACAOIQEMAgsgDEEBaiEMIA4tAAIhDyAOQQJqIgEhDiAPQSVGDQALCyAMIA1rIgwgC0H/////B3MiDkoNCQJAIABFDQAgACANIAwQmwULIAwNByAHIAE2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bGF5U3BlZWRNb2RJbmRleAAtKyAgIDBYMHgALTBYKzBYIDBYLTB4KzB4IDB4AHVuc2lnbmVkIHNob3J0AHNldExvb3BTdGFydAB1bnNpZ25lZCBpbnQAaW5pdABmbG9hdAB1aW50NjRfdAB2ZWN0b3IAcmVuZGVyAHVuc2lnbmVkIGNoYXIAc2V0TW9kRnJlcQBzdGQ6OmV4Y2VwdGlvbgBzZXREZWxheU91dHB1dEdhaW4Ac2V0RGVsYXlJbnB1dEdhaW4AbmFuAGJvb2wAc3RkOjpiYWRfZnVuY3Rpb25fY2FsbABzZXRBdHRhY2sAc2V0RGVsYXlGZWVkYmFjawBzZXRNaXhEZXB0aABkZWxheUlucHV0TW9kRGVwdGgAZGVsYXlMYXp5bmVzc01vZERlcHRoAGdyYWluTGVuZ3RoTW9kRGVwdGgAZ3JhaW5EZW5zZU1vZERlcHRoAGRlbGF5VGltZU1vZERlcHRoAHBsYXlTcGVlZE1vZERlcHRoAFN5bnRoAGJhZF9hcnJheV9uZXdfbGVuZ3RoAHNldExvb3BMZW5ndGgAc2V0R3JhaW5MZW5ndGgAdW5zaWduZWQgbG9uZwBzdGFydFBsYXlpbmcAc3RvcFBsYXlpbmcAc3RkOjp3c3RyaW5nAHN0ZDo6c3RyaW5nAHN0ZDo6dTE2c3RyaW5nAHN0ZDo6dTMyc3RyaW5nAGlzUmVjb3JkaW5nAGluZgBTeW50aEJhc2UAc2V0TW9kVHlwZQBzZXREZWxheXRpbWUAc2V0SW50ZXJwb2xhdGlvblRpbWUAZG91YmxlAHJlY29yZAB2b2lkAHNldFBsYXlTcGVlZABzZXRTcHJlYWQAc3RkOjpiYWRfYWxsb2MATkFOAElORgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaG9ydD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgc2hvcnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgaW50PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxmbG9hdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDhfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MTZfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50MTZfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDY0X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDY0X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQzMl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQzMl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBjaGFyPgBzdGQ6OmJhc2ljX3N0cmluZzx1bnNpZ25lZCBjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8bG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgbG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8ZG91YmxlPgAuAChudWxsKQBQdXJlIHZpcnR1YWwgZnVuY3Rpb24gY2FsbGVkIQBsaWJjKythYmk6IAAxMlN5bnRoV3JhcHBlcgA1U3ludGgAAAAoIAEA+wUBAFAgAQDsBQEABAYBAFAxMlN5bnRoV3JhcHBlcgCsIAEAGAYBAAAAAAAMBgEAUEsxMlN5bnRoV3JhcHBlcgAAAACsIAEAOAYBAAEAAAAMBgEAaWkAdmkAAAAoBgEAAAAAAHwGAQAwAAAANFNpbmUAAAAoIAEAdAYBAAAAAACcBgEAMQAAADhHcmFpbkVudgAAAFAgAQCQBgEAfAYBAAAAAABMBwEAMgAAADMAAAA0AAAANQAAADYAAAA3AAAAOAAAADkAAAA6AAAATlN0M19fMjEwX19mdW5jdGlvbjZfX2Z1bmNJTjhFbnZlbG9wZTdvbkVuZGVkTVVsdkVfRU5TXzlhbGxvY2F0b3JJUzRfRUVGdnZFRUUATlN0M19fMjEwX19mdW5jdGlvbjZfX2Jhc2VJRnZ2RUVFACggAQAiBwEAUCABANQGAQBEBwEAAAAAAEQHAQA7AAAAPAAAAD0AAAA9AAAAPQAAAD0AAAA9AAAAPQAAAD0AAABOOEVudmVsb3BlN29uRW5kZWRNVWx2RV9FAAAAKCABAIQHAQAAAAAAAAAAAGQfAQAoBgEA6B8BAOgfAQDEHwEAdmlpaWlpAABkHwEAKAYBAMQfAQB2aWlpAAAAAGQfAQAoBgEAxB8BABggAQB2aWlpZAAAAAAAAAAAAAAAZB8BACgGAQDEHwEAxB8BAAwgAQB2aWlpaWYAAAAAAABkHwEAKAYBAMQfAQDEHwEAdmlpaWkAUDVTeW50aAAAAKwgAQA2CAEAAAAAAAQGAQBQSzVTeW50aAAAAACsIAEAUAgBAAEAAAAEBgEAdgAAAEAIAQAAAAAAAAAAAAAAAABkHwEAQAgBAMQfAQDEHwEADCABAGQfAQBACAEAdmlpAGQfAQBACAEADCABAHZpaWYAaWlpAGZpaQAAAAAAAAAAPAkBAEAAAABBAAAAQgAAAEMAAABEAAAARQAAAEYAAABHAAAASAAAAE5TdDNfXzIxMF9fZnVuY3Rpb242X19mdW5jSVpONVZvaWNlNGluaXRFaWlmUDVTeW50aEUzJF8wTlNfOWFsbG9jYXRvcklTNV9FRUZ2dkVFRQAAAFAgAQDoCAEARAcBAFpONVZvaWNlNGluaXRFaWlmUDVTeW50aEUzJF8wAAAAKCABAEgJAQBOU3QzX18yMTJiYXNpY19zdHJpbmdJY05TXzExY2hhcl90cmFpdHNJY0VFTlNfOWFsbG9jYXRvckljRUVFRQAAKCABAHAJAQBOU3QzX18yMTJiYXNpY19zdHJpbmdJaE5TXzExY2hhcl90cmFpdHNJaEVFTlNfOWFsbG9jYXRvckloRUVFRQAAKCABALgJAQBOU3QzX18yMTJiYXNpY19zdHJpbmdJd05TXzExY2hhcl90cmFpdHNJd0VFTlNfOWFsbG9jYXRvckl3RUVFRQAAKCABAAAKAQBOU3QzX18yMTJiYXNpY19zdHJpbmdJRHNOU18xMWNoYXJfdHJhaXRzSURzRUVOU185YWxsb2NhdG9ySURzRUVFRQAAACggAQBICgEATlN0M19fMjEyYmFzaWNfc3RyaW5nSURpTlNfMTFjaGFyX3RyYWl0c0lEaUVFTlNfOWFsbG9jYXRvcklEaUVFRUUAAAAoIAEAlAoBAE4xMGVtc2NyaXB0ZW4zdmFsRQAAKCABAOAKAQBOMTBlbXNj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';
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

  
  
  
  
  
  
  
  var validateThis = (this_, classType, humanName) => {
      if (!(this_ instanceof Object)) {
        throwBindingError(`${humanName} with invalid "this": ${this_}`);
      }
      if (!(this_ instanceof classType.registeredClass.constructor)) {
        throwBindingError(`${humanName} incompatible with "this" of type ${this_.constructor.name}`);
      }
      if (!this_.$$.ptr) {
        throwBindingError(`cannot call emscripten binding method ${humanName} on deleted object`);
      }
  
      // todo: kill this
      return upcastPointer(this_.$$.ptr,
                           this_.$$.ptrType.registeredClass,
                           classType.registeredClass);
    };
  var __embind_register_class_property = (classType,
                                      fieldName,
                                      getterReturnType,
                                      getterSignature,
                                      getter,
                                      getterContext,
                                      setterArgumentType,
                                      setterSignature,
                                      setter,
                                      setterContext) => {
      fieldName = readLatin1String(fieldName);
      getter = embind__requireFunction(getterSignature, getter);
  
      whenDependentTypesAreResolved([], [classType], (classType) => {
        classType = classType[0];
        var humanName = `${classType.name}.${fieldName}`;
        var desc = {
          get() {
            throwUnboundTypeError(`Cannot access ${humanName} due to unbound types`, [getterReturnType, setterArgumentType]);
          },
          enumerable: true,
          configurable: true
        };
        if (setter) {
          desc.set = () => throwUnboundTypeError(`Cannot access ${humanName} due to unbound types`, [getterReturnType, setterArgumentType]);
        } else {
          desc.set = (v) => throwBindingError(humanName + ' is a read-only property');
        }
  
        Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
  
        whenDependentTypesAreResolved(
          [],
          (setter ? [getterReturnType, setterArgumentType] : [getterReturnType]),
        (types) => {
          var getterReturnType = types[0];
          var desc = {
            get() {
              var ptr = validateThis(this, classType, humanName + ' getter');
              return getterReturnType['fromWireType'](getter(getterContext, ptr));
            },
            enumerable: true
          };
  
          if (setter) {
            setter = embind__requireFunction(setterSignature, setter);
            var setterArgumentType = types[1];
            desc.set = function(v) {
              var ptr = validateThis(this, classType, humanName + ' setter');
              var destructors = [];
              setter(setterContext, ptr, setterArgumentType['toWireType'](destructors, v));
              runDestructors(destructors);
            };
          }
  
          Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
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
  _embind_register_class_property: __embind_register_class_property,
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
  'validateThis',
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

