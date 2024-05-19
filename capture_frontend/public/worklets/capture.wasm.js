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
  wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAABiwM4YAF/AX9gAn9/AX9gAX8AYAABf2ACf38AYAN/f38Bf2ACf30AYAN/f38AYAAAYAR/f39/AGAFf39/f38AYAF9AX1gAX8BfWAGf39/f39/AGAEf39/fwF/YAR/f399AGADf399AGABfAF8YAJ/fABgAn19AX1gBX9/f39/AX9gA39+fwF+YAN/f3wAYAV/f39/fQBgAX8BfGABfQF/YAJ8fwF8YAR/fn5/AGAGf3x/f39/AX9gAn5/AX9gDX9/f39/f39/f39/f38AYAp/f39/f39/f39/AGAJf39/f39/f39/AGACf38BfWAEf39/fABgBX9/fX19AX1gA319fQF9YAN/fX8BfWAEf399fQF9YAV/f399fwBgBH99fX8AYAZ/fX19fX8AYAN/fX0AYAJ8fAF8YAJ8fwF/YAN8fH8BfGACf30BfWACfH8BfWACfn4BfGAHf39/f39/fwF/YAN+f38Bf2ABfAF+YAR/f35/AX5gBX9/f35+AGAHf39/f39/fwBgBH9+f38BfwLlBBQDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfY2xhc3MAHgNlbnYfX2VtYmluZF9yZWdpc3Rlcl9jbGFzc19wcm9wZXJ0eQAfA2VudiJfZW1iaW5kX3JlZ2lzdGVyX2NsYXNzX2NvbnN0cnVjdG9yAA0DZW52C19fY3hhX3Rocm93AAcDZW52H19lbWJpbmRfcmVnaXN0ZXJfY2xhc3NfZnVuY3Rpb24AIANlbnYVX2VtYmluZF9yZWdpc3Rlcl92b2lkAAQDZW52FV9lbWJpbmRfcmVnaXN0ZXJfYm9vbAAJA2VudhhfZW1iaW5kX3JlZ2lzdGVyX2ludGVnZXIACgNlbnYWX2VtYmluZF9yZWdpc3Rlcl9mbG9hdAAHA2VudhtfZW1iaW5kX3JlZ2lzdGVyX3N0ZF9zdHJpbmcABANlbnYcX2VtYmluZF9yZWdpc3Rlcl9zdGRfd3N0cmluZwAHA2VudhZfZW1iaW5kX3JlZ2lzdGVyX2VtdmFsAAIDZW52HF9lbWJpbmRfcmVnaXN0ZXJfbWVtb3J5X3ZpZXcABwNlbnYUZW1zY3JpcHRlbl9tZW1jcHlfanMABwNlbnYWZW1zY3JpcHRlbl9yZXNpemVfaGVhcAAAA2VudgVhYm9ydAAIFndhc2lfc25h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ASACIIsBaiGMASCIASCMARA9IAIgITYCqAJBDyGNASACII0BNgKkAiACKQKkAiHVBCACINUENwOwBSACKAKwBSGOASACKAK0BSGPASACIIcBNgLMBUHchQQhkAEgAiCQATYCyAUgAiCPATYCxAUgAiCOATYCwAUgAigCzAUhkQEgAigCyAUhkgEgAigCwAUhkwEgAigCxAUhlAEgAiCUATYCvAUgAiCTATYCuAUgAikCuAUh1gQgAiDWBDcDaEHoACGVASACIJUBaiGWASCSASCWARA+IAIgITYCoAJBECGXASACIJcBNgKcAiACKQKcAiHXBCACINcENwOQCCACKAKQCCGYASACKAKUCCGZASACIJEBNgKsCEHdggQhmgEgAiCaATYCqAggAiCZATYCpAggAiCYATYCoAggAigCrAghmwEgAigCqAghnAEgAigCoAghnQEgAigCpAghngEgAiCeATYCnAggAiCdATYCmAggAikCmAgh2AQgAiDYBDcDYEHgACGfASACIJ8BaiGgASCcASCgARA/IAIgITYCmAJBESGhASACIKEBNgKUAiACKQKUAiHZBCACINkENwPQCCACKALQCCGiASACKALUCCGjASACIJsBNgLwCEG0gQQhpAEgAiCkATYC7AggAiCjATYC6AggAiCiATYC5AggAigC8AghpQEgAigC7AghpgEgAigC5AghpwEgAigC6AghqAEgAiCoATYC4AggAiCnATYC3AggAikC3Agh2gQgAiDaBDcDWEHYACGpASACIKkBaiGqASCmASCqARBAIAIgITYCkAJBEiGrASACIKsBNgKMAiACKQKMAiHbBCACINsENwOwCCACKAKwCCGsASACKAK0CCGtASACIKUBNgLMCEGThAQhrgEgAiCuATYCyAggAiCtATYCxAggAiCsATYCwAggAigCzAghrwEgAigCyAghsAEgAigCwAghsQEgAigCxAghsgEgAiCyATYCvAggAiCxATYCuAggAikCuAgh3AQgAiDcBDcDUEHQACGzASACILMBaiG0ASCwASC0ARBAIAIgITYCiAJBEyG1ASACILUBNgKEAiACKQKEAiHdBCACIN0ENwPwByACKALwByG2ASACKAL0ByG3ASACIK8BNgKMCEGhhAQhuAEgAiC4ATYCiAggAiC3ATYChAggAiC2ATYCgAggAigCjAghuQEgAigCiAghugEgAigCgAghuwEgAigChAghvAEgAiC8ATYC/AcgAiC7ATYC+AcgAikC+Ach3gQgAiDeBDcDSEHIACG9ASACIL0BaiG+ASC6ASC+ARA/IAIgITYCgAJBFCG/ASACIL8BNgL8ASACKQL8ASHfBCACIN8ENwPQByACKALQByHAASACKALUByHBASACILkBNgLsB0GAgAQhwgEgAiDCATYC6AcgAiDBATYC5AcgAiDAATYC4AcgAigC7AchwwEgAigC6AchxAEgAigC4AchxQEgAigC5AchxgEgAiDGATYC3AcgAiDFATYC2AcgAikC2Ach4AQgAiDgBDcDQEHAACHHASACIMcBaiHIASDEASDIARA/IAIgITYC+AFBFSHJASACIMkBNgL0ASACKQL0ASHhBCACIOEENwOwByACKAKwByHKASACKAK0ByHLASACIMMBNgLMB0HohQQhzAEgAiDMATYCyAcgAiDLATYCxAcgAiDKATYCwAcgAigCzAchzQEgAigCyAchzgEgAigCwAchzwEgAigCxAch0AEgAiDQATYCvAcgAiDPATYCuAcgAikCuAch4gQgAiDiBDcDOEE4IdEBIAIg0QFqIdIBIM4BINIBED8gAiAhNgLwAUEWIdMBIAIg0wE2AuwBIAIpAuwBIeMEIAIg4wQ3A5AHIAIoApAHIdQBIAIoApQHIdUBIAIgzQE2AqwHQYuABCHWASACINYBNgKoByACINUBNgKkByACINQBNgKgByACKAKsByHXASACKAKoByHYASACKAKgByHZASACKAKkByHaASACINoBNgKcByACINkBNgKYByACKQKYByHkBCACIOQENwMwQTAh2wEgAiDbAWoh3AEg2AEg3AEQPyACICE2AugBQRch3QEgAiDdATYC5AEgAikC5AEh5QQgAiDlBDcD8AYgAigC8AYh3gEgAigC9AYh3wEgAiDXATYCjAdB9YUEIeABIAIg4AE2AogHIAIg3wE2AoQHIAIg3gE2AoAHIAIoAowHIeEBIAIoAogHIeIBIAIoAoAHIeMBIAIoAoQHIeQBIAIg5AE2AvwGIAIg4wE2AvgGIAIpAvgGIeYEIAIg5gQ3AyhBKCHlASACIOUBaiHmASDiASDmARA/IAIgITYC4AFBGCHnASACIOcBNgLcASACKQLcASHn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QCABQYCAfGpB//8/Sw0AIAAgAUE/cUGAAXI6AAMgACABQRJ2QfABcjoAACAAIAFBBnZBP3FBgAFyOgACIAAgAUEMdkE/cUGAAXI6AAFBBA8LEPEEQRk2AgALQX8hAwsgAw8LIAAgAToAAEEBCxUAAkAgAA0AQQAPCyAAIAFBABCaBQuPAQIBfgF/AkAgAL0iAkI0iKdB/w9xIgNB/w9GDQACQCADDQACQAJAIABEAAAAAAAAAABiDQBBACEDDAELIABEAAAAAAAA8EOiIAEQnAUhACABKAIAQUBqIQMLIAEgAzYCACAADwsgASADQYJ4ajYCACACQv////////+HgH+DQoCAgICAgIDwP4S/IQALIAALUwEBfgJAAkAgA0HAAHFFDQAgASADQUBqrYYhAkIAIQEMAQsgA0UNACABQcAAIANrrYggAiADrSIEhoQhAiABIASGIQELIAAgATcDACAAIAI3AwgLUwEBfgJAAkAgA0HAAHFFDQAgAiADQUBqrYghAUIAIQIMAQsgA0UNACACQcAAIANrrYYgASADrSIEiIQhASACIASIIQILIAAgATcDACAAIAI3AwgL5AMCAn8CfiMAQSBrIgIkAAJAAkAgAUL///////////8AgyIEQoCAgICAgMD/Q3wgBEKAgICAgIDAgLx/fFoNACAAQjyIIAFCBIaEIQQCQCAAQv//////////D4MiAEKBgICAgICAgAhUDQAgBEKBgICAgICAgMAAfCEFDAILIARCgICAgICAgIDAAHwhBSAAQoCAgICAgICACFINASAFIARCAYN8IQUMAQsCQCAAUCAEQoCAgICAgMD//wBUIARCgICAgICAwP//AFEbDQAgAEI8iCABQgSGhEL/////////A4NCgICAgICAgPz/AIQhBQwBC0KAgICAgICA+P8AIQUgBEL///////+//8MAVg0AQgAhBSAEQjCIpyIDQZH3AEkNACACQRBqIAAgAUL///////8/g0KAgICAgIDAAIQiBCADQf+If2oQnQUgAiAAIARBgfgAIANrEJ4FIAIpAwAiBEI8iCACQQhqKQMAQgSGhCEFAkAgBEL//////////w+DIAIpAxAgAkEQakEIaikDAIRCAFKthCIEQoGAgICAgICACFQNACAFQgF8IQUMAQsgBEKAgICAgICAgAhSDQAgBUIBgyAF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EyAQIBJqIg8gEyAPShsiDCAOSg0EIABBICAMIA8gERCoBSAAIBggEBCiBSAAQTAgDCAPIBFBgIAEcxCoBSAAQTAgEiABQQAQqAUgACANIAEQogUgAEEgIAwgDyARQYDAAHMQqAUgBygCTCEBDAELCwtBACELDAMLQT0hFgsQ8QQgFjYCAAtBfyELCyAHQdAAaiQAIAsLGQACQCAALQAAQSBxDQAgASACIAAQlgUaCwt7AQV/QQAhAQJAIAAoAgAiAiwAAEFQaiIDQQlNDQBBAA8LA0BBfyEEAkAgAUHMmbPmAEsNAEF/IAMgAUEKbCIBaiADIAFB/////wdzSxshBAsgACACQQFqIgM2AgAgAiwAASEFIAQhASADIQIgBUFQaiIDQQpJDQALIAQLtgQAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgAUF3ag4SAAECBQMEBgcICQoLDA0ODxAREgsgAiACKAIAIgFBBGo2AgAgACABKAIANgIADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABMgEANwMADwsgAiACKAIAIgFBBGo2AgAgACABMwEANwMADwsgAiACKAIAIgFBBGo2AgAgACABMAAANwMADwsgAiACKAIAIgFBBGo2AgAgACABMQAANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKwMAOQMADwsgACACIAMRBAALCz4BAX8CQCAAUA0AA0AgAUF/aiIBIACnQQ9xQeC7BGot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YmFjawBzZXRNaXhEZXB0aABkZWxheUlucHV0TW9kRGVwdGgAZGVsYXlMYXp5bmVzc01vZERlcHRoAGdyYWluTGVuZ3RoTW9kRGVwdGgAZ3JhaW5EZW5zZU1vZERlcHRoAGRlbGF5VGltZU1vZERlcHRoAHBsYXlTcGVlZE1vZERlcHRoAFN5bnRoAGJhZF9hcnJheV9uZXdfbGVuZ3RoAHNldExvb3BMZW5ndGgAc2V0R3JhaW5MZW5ndGgAdW5zaWduZWQgbG9uZwBzdGFydFBsYXlpbmcAc3RvcFBsYXlpbmcAc3RkOjp3c3RyaW5nAHN0ZDo6c3RyaW5nAHN0ZDo6dTE2c3RyaW5nAHN0ZDo6dTMyc3RyaW5nAGlzUmVjb3JkaW5nAGluZgBTeW50aEJhc2UAc2V0TW9kVHlwZQBzZXREZWxheXRpbWUAc2V0SW50ZXJwb2xhdGlvblRpbWUAZG91YmxlAHJlY29yZAB2b2lkAHNldFBsYXlTcGVlZABzZXRTcHJlYWQAc3RkOjpiYWRfYWxsb2MATkFOAElORgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaG9ydD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgc2hvcnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgaW50PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxmbG9hdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDhfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MTZfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50MTZfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDY0X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDY0X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQzMl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQzMl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBjaGFyPgBzdGQ6OmJhc2ljX3N0cmluZzx1bnNpZ25lZCBjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8bG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgbG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8ZG91YmxlPgAuAChudWxsKQBQdXJlIHZpcnR1YWwgZnVuY3Rpb24gY2FsbGVkIQBsaWJjKythYmk6IAAxMlN5bnRoV3JhcHBlcgA1U3ludGgAAAA4IAEA+wUBAGAgAQDsBQEABAYBAFAxMlN5bnRoV3JhcHBlcgC8IAEAGAYBAAAAAAAMBgEAUEsxMlN5bnRoV3JhcHBlcgAAAAC8IAEAOAYBAAEAAAAMBgEAaWkAdmkAAAAoBgEAAAAAAHwGAQAxAAAANFNpbmUAAAA4IAEAdAYBAAAAAACcBgEAMgAAADhHcmFpbkVudgAAAGAgAQCQBgEAfAYBAAAAAABMBwEAMwAAADQAAAA1AAAANgAAADcAAAA4AAAAOQAAADoAAAA7AAAATlN0M19fMjEwX19mdW5jdGlvbjZfX2Z1bmNJTjhFbnZlbG9wZTdvbkVuZGVkTVVsdkVfRU5TXzlhbGxvY2F0b3JJUzRfRUVGdnZFRUUATlN0M19fMjEwX19mdW5jdGlvbjZfX2Jhc2VJRnZ2RUVFADggAQAiBwEAYCABANQGAQBEBwEAAAAAAEQHAQA8AAAAPQAAAD4AAAA+AAAAPgAAAD4AAAA+AAAAPgAAAD4AAABOOEVudmVsb3BlN29uRW5kZWRNVWx2RV9FAAAAOCABAIQHAQAAAAAAAAAAAHQfAQAoBgEA+B8BAPgfAQDUHwEAdmlpaWlpAAB0HwEAKAYBANQfAQB2aWlpAAAAAHQfAQAoBgEA1B8BACggAQB2aWlpZAAAAAAAAAAAAAAAdB8BACgGAQDUHwEA1B8BABwgAQB2aWlpaWYAAAAAAAB0HwEAKAYBANQfAQDUHwEAdmlpaWkAUDVTeW50aAAAALwgAQA2CAEAAAAAAAQGAQBQSzVTeW50aAAAAAC8IAEAUAgBAAEAAAAEBgEAdgAAAEAIAQAAAAAAAAAAAAAAAAB0HwEAQAgBANQfAQDUHwEAHCABAHQfAQBACAEAdmlpAHQfAQBACAEAHCABAHZpaWYAAAAAdB8BAEAIAQAoIAEAdmlpZABpaWkAZmlpAAAAAAAAAABQCQEAQQAAAEIAAABDAAAARAAAAEUAAABGAAAARwAAAEgAAABJAAAATlN0M19fMjEwX19mdW5jdGlvbjZfX2Z1bmNJWk41Vm9pY2U0aW5pdEVpaWZQNVN5bnRoRTMkXzBOU185YWxsb2NhdG9ySVM1X0VFRnZ2RUVFAAAAYCABAPwIAQBEBwEAWk41Vm9pY2U0aW5pdEVpaWZQNVN5bnRoRTMkXzAAAAA4IAEAXAkBAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0ljTlNfMTFjaGFyX3RyYWl0c0ljRUVOU185YWxsb2NhdG9ySWNFRUVFAAA4IAEAhAkBAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0loTlNfMTFjaGFyX3RyYWl0c0loRUVOU185YWxsb2NhdG9ySWhFRUVFAAA4IAEAzAkBAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0l3TlNfMTFjaGFyX3RyYWl0c0l3RUVOU185YWxsb2NhdG9ySXdFRUVFAAA4IAEAFAoBAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0lEc05TXzExY2hhcl90cmFpdHNJRHNFRU5TXzlhbGxvY2F0b3JJRHNFRUVFAAAAOCABAFwKAQBOU3QzX18yMTJiYXNpY19zdHJpbmdJRGlOU18xMWNoYXJfdHJhaXRzSURpRUVOU185YWxsb2NhdG9ySURpRUVFRQAAADggAQCoCgEATjEwZW1zY3JpcHRlbjN2YWxFAAA4IAEA9AoBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWNFRQAAOCABABALAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lhRUUAADggAQA4CwEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJaEVFAAA4IAEAYAsBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SXNFRQAAOCABAIgLAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0l0RUUAADggAQCwCwEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJaUVFAAA4IAEA2AsB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';
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

