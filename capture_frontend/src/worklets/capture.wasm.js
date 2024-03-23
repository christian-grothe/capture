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

  
if (!Module['noFSInit'] && !FS.init.initialized)
  FS.init();
FS.ignorePermissions = false;

TTY.init();
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
  wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAABwAVZYAF/AX9gAn9/AX9gAn9/AGADf39/AX9gAX8AYAABf2ADf39/AGAAAGAGf39/f39/AX9gBH9/f38AYAV/f39/fwF/YAZ/f39/f38AYAR/f39/AX9gCH9/f39/f39/AX9gBX9/f39/AGACf30AYAd/f39/f39/AGABfQF9YAd/f39/f39/AX9gAX8BfWAFf35+fn4AYAABfmADf35/AX5gBX9/f39+AX9gAn19AX1gBH9/f38BfmAGf39/f35/AX9gCn9/f39/f39/f38AYAd/f39/f35+AX9gBH9/f30AYAN/f30AYAF8AXxgBX9/fn9/AGAEf35+fwBgCn9/f39/f39/f38Bf2AGf39/f35+AX9gAX8BfGACf3wAYAF9AX9gAnx/AXxgBH5+fn4Bf2AEf39/fgF+YAZ/fH9/f38Bf2ACfn8Bf2ADf39/AX5gAn9/AX1gAn9/AXxgA39/fwF9YAN/f38BfGAMf39/f39/f39/f39/AX9gBX9/f398AX9gBn9/f398fwF/YAd/f39/fn5/AX9gC39/f39/f39/f39/AX9gD39/f39/f39/f39/f39/fwBgCH9/f39/f39/AGANf39/f39/f39/f39/fwBgCX9/f39/f39/fwBgBX9/f399AGAFf399fX0BfWADfX19AX1gA399fwF9YAR/f319AX1gBX9/f31/AGAEf319fwBgBn99fX19fwBgA399fQBgAnx8AXxgAnx/AX9gA3x8fwF8YAJ/fQF9YAJ8fwF9YAJ/fgF/YAJ/fgBgAn5+AX9gA39+fgBgAn9/AX5gAn5+AX1gAn5+AXxgA39/fgBgA35/fwF/YAF8AX5gBn9/f35/fwBgBH9/fn8BfmAGf39/f39+AX9gCH9/f39/f35+AX9gCX9/f39/f39/fwF/YAV/f39+fgBgBH9+f38BfwLBBRcDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfY2xhc3MAOANlbnYiX2VtYmluZF9yZWdpc3Rlcl9jbGFzc19jb25zdHJ1Y3RvcgALA2VudgtfX2N4YV90aHJvdwAGA2Vudh9fZW1iaW5kX3JlZ2lzdGVyX2NsYXNzX2Z1bmN0aW9uADkDZW52FV9lbWJpbmRfcmVnaXN0ZXJfdm9pZAACA2VudhVfZW1iaW5kX3JlZ2lzdGVyX2Jvb2wA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AgICAg0DAAgICAsICwgLCg0LCwsLCwsOCwsLCw4NAwAICAAAAAAACAsICwgLCg0LCwsLCwsOCwsLCw4SCwMCAQkSCwMBCgQJAAUFAAICAgIAAgIAAAICAgIAAgIABQUAAgIABAICAAICAAACAgICAAICAQQDAQAEAwAAABIENQAAAwMAGwYAAwEAAAEBAwYGAAAAABIEAwEQAgMAAAICAgAAAgIAAAICAgAAAgIAAwABAAMBAAABAAABAgISNQAAAxsGAAEDAQAAAQEDBgASBAMAAgIAAgABARACAAwAAgIBAgAAAgIAAAICAgAAAgIAAwABAAMBAAABAhwBGzYAAgIAAQADBQgcARs2AAAAAgIAAQADCAkBBQEJAQEDCwIDCwIAAQEBBAcCBwIHAgcCBwIHAgcCBwIHAgcCBwIHAgcCBwIHAgcCBwIHAgcCBwIHAgcCBwIHAgcCBwIHAgcCBwIHAgEDAQICAgQABAIABgEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBBQEEBQABAQABAgAABAAAAAQEAgIAAQEHBQUAAQAEAwIEBAABAQQFBAMMDAwBBQMBBQMBDAMKDAAABAEDAQMBDAMKBA0NCgAACgABAAQNCAwNCAoKAAwAAAoMAAQNDQ0NCgAACgoABA0NCgAACgAEDQ0NDQoAAAoKAAQNDQoAAAoAAQEABAAEAAAAAAICAgIBAAICAQECAAcEAAcEAQAHBAAHBAAHBAAHBAAEAAQABAAEAAQABAAEAAQAAQQEBAQAAAQAAAQEAAQABAQEBAQEBAQEBAEJAQAAAQkAAAEAAAAGAgICBAAAAQAAAAAAAAIDEAYGAAADAwMDAQECAgICAgICAAAJCQYADgEBBgYAAwEBAwkJBgAOAQEGBgADAQEDAQEDAwAMAwAAAAABEAEDAwYDAQkADAMAAAAAAQICCQkGAQYGAwEAAAAAAAEBAQkJBgEGBgMBAAAAAAABAQEBAAEABAAGAAIDAAACAAAAAwAAAAAOAAAAAAEAAAAAAAAAAAICBAQBBAYGBgwCAgADAAADAAEMAAIEAAEAAAADCQkJBgAOAQEGBgEAAAAAAwEBBwIAAgAAAgICAwAAAAAAAAAAAAEEAAEEAQQABAQAAwAAAQABGQUFFRUVFRkFBRUVLS4GAQEAAAEAAAAAAQAAAAQAAAYBBAQAAQAE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EABB8wAhGyACIBtqIRwgAiAcNgKMASACKAKMASEdIAIgHTYChANBBCEeIAIgHjYCgAMgAigChAMhHyACKAKAAyEgICAQKEEAISEgAiAhNgJsQQUhIiACICI2AmggAikCaCF8IAIgfDcDkAEgAigCkAEhIyACKAKUASEkIAIgHzYCsAFB+oEEISUgAiAlNgKsASACICQ2AqgBIAIgIzYCpAEgAigCrAEhJiACKAKkASEnIAIoAqgBISggAiAoNgKgASACICc2ApwBIAIpApwBIX0gAiB9NwMoQSghKSACIClqISogJiAqECpB5wAhKyACICtqISwgAiAsNgLIAUHchAQhLSACIC02AsQBECtBBiEuIAIgLjYCwAEQLSEvIAIgLzYCvAEQLiEwIAIgMDYCuAFBByExIAIgMTYCtAEQMCEyEDEhMxAyITQQMyE1IAIoAsABITYgAiA2NgKIAxAlITcgAigCwAEhOCACKAK8ASE5IAIgOTYCkAMQNCE6IAIoArwBITsgAigCuAEhPCACIDw2AowDEDQhPSACKAK4ASE+IAIoAsQBIT8gAigCtAEhQCACIEA2ApQDECYhQSACKAK0ASFCIDIgMyA0IDUgNyA4IDogOyA9ID4gPyBBIEIQAEHnACFDIAIgQ2ohRCACIEQ2AswBIAIoAswBIUUgAiBFNgKcA0EIIUYgAiBGNgKYAyACKAKcAyFHIAIoApgDIUggSBA2IAIgITYCYEEJIUkgAiBJNgJcIAIpAlwhfiACIH43A9ABIAIoAtABIUogAigC1AEhSyACIEc2AuwBQdOBBCFMIAIgTDYC6AEgAiBLNgLkASACIEo2AuABIAIoAuwBIU0gAigC6AEhTiACKALgASFPIAIoAuQBIVAgAiBQNgLcASACIE82AtgBIAIpAtgBIX8gAiB/NwMgQSAhUSACIFFqIVIgTiBSEDcgAiAhNgJYQQohUyACIFM2AlQgAikCVCGAASACIIABNwPwASACKALwASFUIAIoAvQBIVUgAiBNNgKMAkHyhAQhViACIFY2AogCIAIgVTYChAIgAiBUNgKAAiACKAKMAiFXIAIoAogCIVggAigCgAIhWSACKAKEAiFaIAIgWjYC/AEgAiBZNgL4ASACKQL4ASGBASACIIEBNwMYQRghWyACIFtqIVwgWCBcEDggAiAhNgJQQQshXSAC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CwkAIAAgARCwBgsJACAAIAEQsQYLDAAgACABIAIQrwYaCzgBAX8jAEEQayIDJAAgAyABELIGNgIMIAMgAhCyBjYCCCAAIANBDGogA0EIahCzBhogA0EQaiQAC0MBAX8jAEEQayIEJAAgBCACNgIMIAMgASACIAFrIgIQtgYaIAQgAyACajYCCCAAIARBDGogBEEIahC3BiAEQRBqJAALBwAgABCEBgsYACAAIAEoAgA2AgAgACACKAIANgIEIAALCQAgACABELkGCw0AIAAgASAAEIQGa2oLBwAgABC0BgsYACAAIAEoAgA2AgAgACACKAIANgIEIAALBwAgABC1BgsEACAACxYAAkAgAkUNACAAIAEgAhD3BBoLIAALDAAgACABIAIQuAYaCxgAIAAgASgCADYCACAAIAIoAgA2AgQgAAsJACAAIAEQugYLDQAgACABIAAQtQZragsrAQF/IwBBEGsiAyQAIANBCGogACABIAIQvAYgAygCDCECIANBEGokACACCw0AIAAgASACIAMQvQYLDQAgACABIAIgAxC+BgtpAQF/IwBBIGsiBCQAIARBGGogASACEL8GIARBEGogBEEMaiAEKAIYIAQoAhwgAxDABhDBBiAEIAEgBCgCEBDCBjYCDCAEIAMgBCgCFBDDBjYCCCAAIARBDGogBEEIahDEBiAEQSBqJAALCwAgACABIAIQxQYLBwAgABDHBgsNACAAIAIgAyAEEMYGCwkAIAAgARDJBgsJACAAIAEQygYLDAAgACABIAIQyAYaCzgBAX8jAEEQayIDJAAgAyABEMsGNgIMIAMgAhDLBjYCCCAAIANBDGogA0EIahDMBhogA0EQaiQAC0YBAX8jAEEQayIEJAAgBCACNgIMIAMgASACIAFrIgJBAnUQzwYaIAQgAyACajYCCCAAIARBDGogBEEIahDQBiAEQRBqJAALBwAgABDSBgsYACAAIAEoAgA2AgAgACACKAIANgIEIAALCQAgACABENMGCw0AIAAgASAAENIGa2oLBwAgABDNBgsYACAAIAEoAgA2AgAgACACKAIANgIEIAALBwAgABDOBgsEACAACxkAAkAgAkUNACAAIAEgAkECdBD3BBoLIAALDAAgACABIAIQ0QYaCxgAIAAgASgCADYCACAAIAIoAgA2AgQgAAsEACAACwkAIAAgARDU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BUHAwQUQwAcaQfjBBSADQajCBRC/BxpB0L0FQfjBBRDABxpB+L4FQdC9BUEAKALQvQVBdGooAgBqEOoFEMAHGkH8ugVBACgC/LoFQXRqKAIAakGovAUQwQcaQdC9BUEAKALQvQVBdGooAgBqELwHGkHQvQVBACgC0L0FQXRqKAIAakGovAUQwQcaIAALbQEBfyMAQRBrIgMkACAAEIAFIgAgAjYCKCAAIAE2AiAgAEHswARBCGo2AgAQkAUhAiAAQQA6ADQgACACNgIwIANBDGogABCCBiAAIANBDGogACgCACgCCBECACADQQxqELQNGiADQRBqJAAgAAs2AQF/IABBCGoQwgchAiAAQcy3BEEMajYCACACQcy3BEEgajYCACAAQQA2AgQgAiABEMMHIAALYwEBfyMAQRBrIgMkACAAEIAFIgAgATYCICAAQdDBBEEIajYCACADQQxqIAAQggYgA0EMahCYBiEBIANBDGoQtA0aIAAgAjYCKCAAIAE2AiQgACABEJkGOgAsIANBEGokACAACy8BAX8gAEEEahDCByECIABB/LcEQQxqNgIAIAJB/LcEQSBqNgIAIAIgARDDByAACxQBAX8gACgCSCECIAAgATYCSCACCw4AIABBgMAAEMQHGiAAC20BAX8jAEEQayIDJAAgABDJBSIAIAI2AiggACABNgIgIABBuMIEQQhqNgIAENYFIQIgAEEAOgA0IAAgAjYCMCADQQxqIAAQxQcgACADQQxqIAAoAgAoAggRAgAgA0EMahC0DRogA0EQaiQAIAALNgEBfyAAQQhqEMYHIQIgAEHsuARBDGo2AgAgAkHsuARBIGo2AgAgAEEANgIEIAIgARDHByAAC2MBAX8jAEEQayIDJAAgABDJBSIAIAE2AiAgAEGcwwRBCGo2AgAgA0EMaiAAEMUHIANBDGoQyAchASADQQxqELQNGiAAIAI2AiggACABNgIkIAAgARDJBzoALCADQRBqJAAgAAsvAQF/IABBBGoQxgchAiAAQZy5BEEMajYCACACQZy5BEEgajYCACACIAEQxwcgAAsUAQF/IAAoAkghAiAAIAE2AkggAgsVACAAENkHIgBBzLkEQQhqNgIAIAALGAAgACABEJkHIABBADYCSCAAEJAFNgJMCxUBAX8gACAAKAIEIgIgAXI2AgQgAgsNACAAIAFBBGoQsw0aCxUAIAAQ2QciAEHguwRBCGo2AgAgAAsYACAAIAEQmQcgAEEANgJIIAAQ1gU2AkwLCwAgAEHUxAUQ6QgLDwAgACAAKAIAKAIcEQAACyQAQdS7BRCdBRpBpL4FEJ0FGkGovAUQ4wUaQfi+BRDjBRogAAsuAAJAQQAtALHCBQ0AQbDCBRC2BxpB7gBBAEGAgAQQjgcaQQBBAToAscIFCyAACwoAQbDCBRDKBxoLBAAgAAsKACAAEP4EEJIRCzoAIAAgARCYBiIBNgIkIAAgARCfBjYCLCAAIAAoAiQQmQY6ADUCQCAAKAIsQQlIDQBBioEEENUKAAsLCQAgAEEAENEHC9kDAgV/AX4jAEEgayICJAACQAJAIAAtADRFDQAgACgCMCEDIAFFDQEQkAUhBCAAQQA6ADQgACAENgIwDAELAkACQCAALQA1RQ0AIAAoAiAgAkEYahDVB0UNASACLAAYIgQQkgUhAwJAAkAgAQ0AIAMgACgCIBDUB0UNAwwBCyAAIAM2AjALIAQQkgUhAwwCCyACQQE2AhhBACEDIAJBGGogAEEsahDWBygCACIFQQAgBUEAShshBgJAA0AgAyAGRg0BIAAoAiAQoQciBEF/Rg0CIAJBGGogA2ogBDoAACADQQFqIQMMAAsACyACQRdqQQFqIQYCQAJAA0AgACgCKCIDKQIAIQcCQCAAKAIkIAMgAkEYaiACQRhqIAVqIgQgAkEQaiACQRdqIAYgAkEMahCbBkF/ag4DAAQCAwsgACgCKCAHNwIAIAVBCEYNAyAAKAIgEKEHIgNBf0YNAyAEIAM6AAAgBUEBaiEFDAALAAsgAiACLQAYOgAXCwJAAkAgAQ0AA0AgBUEBSA0CIAJBGGogBUF/aiIFaiwAABCSBSAAKAIgEJ8HQX9GDQMMAAsACyAAIAIsABcQkgU2AjALIAIsABcQkgUhAwwBCxCQBSEDCyACQSBqJAAgAwsJACAAQQEQ0QcLuQIBA38jAEEgayICJAACQAJAIAEQkAUQrQVFDQAgAC0ANA0BIAAgACgCMCIBEJAFEK0FQQFzOgA0DAELIAAtADQhAwJAAkACQCAALQA1RQ0AIANB/wFxRQ0AIAAoAiAhAyAAKAIwIgQQjAUaIAQgAxDUBw0BDAILIANB/wFxRQ0AIAIgACgCMBCMBToAEwJAAkAgACgCJCAAKAIoIAJBE2ogAkETakEBaiACQQxqIAJBGGogAkEgaiACQRRqEJ4GQX9qDgMDAwABCyAAKAIwIQMgAiACQRhqQQFqNgIUIAIgAzoAGAsDQCACKAIUIgMgAkEYak0NASACIANBf2oiAzYCFCADLAAAIAAoAiAQnwdBf0YNAgwACwALIABBAToANCAAIAE2AjAMAQsQkAUhAQsgAkEgaiQAIAELDAAgACABEJ8HQX9HCx0AAkAgABChByIAQX9GDQAgASAAOgAACyAAQX9HCwkAIAAgARDXBwspAQJ/IwBBEGsiAiQAIAJBD2ogACABENgHIQMgAkEQaiQAIAEgACADGwsNACABKAIAIAIoAgBICxAAIABB9L0EQQhqNgIAIAALCgAgABD+BBCSEQsmACAAIAAoAgAoAhgRAAAaIAAgARCYBiIBNgIkIAAgARCZBjoALAt/AQV/IwBBEGsiASQAIAFBEGohAgJAA0AgACgCJCAAKAIoIAFBCGogAiABQQRqEKAGIQNBfyEEIAFBCGpBASABKAIEIAFBCGprIgUgACgCIBD7BCAFRw0BAkAgA0F/ag4CAQIACwtBf0EAIAAoAiAQ9gQbIQQLIAFBEGokACAEC28BAX8CQAJAIAAtACwNAEEAIQMgAkEAIAJBAEobIQIDQCADIAJGDQICQCAAIAEsAAAQkgUgACgCACgCNBEBABCQBUcNACADDwsgAUEBaiEBIANBAWohAwwACwALIAFBASACIAAoAiAQ+wQhAgsgAguFAgEFfyMAQSBrIgIkAAJAAkACQCABEJAFEK0FDQAgAiABEIwFIgM6ABcCQCAALQAsRQ0AIAMgACgCIBDfB0UNAgwBCyACIAJBGGo2AhAgAkEgaiEEIAJBF2pBAWohBSACQRdqIQYDQCAAKAIkIAAoAiggBiAFIAJBDGogAkEYaiAEIAJBEGoQngYhAyACKAIMIAZGDQICQCADQQNHDQAgBkEBQQEgACgCIBD7BEEBRg0CDAMLIANBAUsNAiACQRhqQQEgAigCECACQRhqayIGIAAoAiAQ+wQgBkcNAiACKAIMIQYgA0EBRg0ACwsgARCTBiEADAELEJAFIQALIAJBIGokACAACzABAX8jAEEQayICJAAgAiAAOgAPIAJBD2pBAUEBIAEQ+wQhACACQRBqJAAgAEEBRgsKACAAEMcFEJIRCzoAIAAgARDIByIBNgIkIAAgARDiBzYCLCAAIAAoAiQQyQc6ADUCQCAAKAIsQQlIDQBBioEEENUKAAsLDwAgACAAKAIAKAIYEQAACwkAIABBABDkBwvWAwIFfwF+IwBBIGsiAiQAAkACQCAALQA0RQ0AIAAoAjAhAyABRQ0BENYFIQQgAEEAOgA0IAAgBDYCMAwBCwJAAkAgAC0ANUUNACAAKAIgIAJBGGoQ6QdFDQEgAigCGCIEENgFIQMCQAJAIAENACADIAAoAiAQ5wdFDQMMAQsgACADNgIwCyAEENgFIQMMAgsgAkEBNgIYQQAhAyACQRhqIABBLGoQ1gcoAgAiBUEAIAVBAEobIQYCQANAIAMgBkYNASAAKAIgEKEHIgRBf0YNAiACQRhqIANqIAQ6AAAgA0EBaiEDDAALAAsgAkEYaiEGAkACQANAIAAoAigiAykCACEHAkAgACgCJCADIAJBGGogAkEYaiAFaiIEIAJBEGogAkEUaiAGIAJBDGoQ6gdBf2oOAwAEAgMLIAAoAiggBzcCACAFQQhGDQMgACgCIBChByIDQX9GDQMgBCADOgAAIAVBAWohBQwACwALIAIgAiwAGDYCFAsCQAJAIAENAANAIAVBAUgNAiACQRhqIAVBf2oiBWosAAAQ2AUgACgCIBCfB0F/Rg0DDAALAAsgACACKAIUENgFNgIwCyACKAIUENgFIQMMAQsQ1gUhAwsgAkEgaiQAIAMLCQAgAEEBEOQHC7MCAQN/IwBBIGsiAiQAAkACQCABENYFEPAFRQ0AIAAtADQNASAAIAAoAjAiARDWBRDwBUEBczoANAwBCyAALQA0IQMCQAJAAkAgAC0ANUUNACADQf8BcUUNACAAKAIgIQMgACgCMCIEENMFGiAEIAMQ5wcNAQwCCyADQf8BcUUNACACIAAoAjAQ0wU2AhACQAJAIAAoAiQgACgCKCACQRBqIAJBFGogAkEMaiACQRhqIAJBIGogAkEUahDoB0F/ag4DAwMAAQsgACgCMCEDIAIgAkEZajYCFCACIAM6ABgLA0AgAigCFCIDIAJBGGpNDQEgAiADQX9qIgM2AhQgAywAACAAKAIgEJ8HQX9GDQIMAAsACyAAQQE6ADQgACABNgIwDAELENYFIQELIAJBIGokACABCwwAIAAgARCvB0F/RwsdACAAIAEgAiADIAQgBSAGIAcgACgCACgCDBENAAsdAAJAIAAQrQciAEF/Rg0AIAEgADYCAAsgAEF/RwsdACAAIAEgAiADIAQgBSAGIAcgACgCACgCEBENAAsKACAAEMcFEJIRCyYAIAAgACgCACgCGBEAABogACABEMgHIgE2AiQgACABEMkHOgAsC38BBX8jAEEQayIBJAAgAUEQaiECAkADQCAAKAIkIAAoAiggAUEIaiACIAFBBGoQ7gchA0F/IQQgAUEIakEBIAEoAgQgAUEIamsiBSAAKAIgEPsEIAVHDQECQCADQX9qDgIBAgALC0F/QQAgACgCIBD2BBshBAsgAUEQaiQAIAQLFwAgACABIAIgAyAEIAAoAgAoAhQRCgALbwEBfwJAAkAgAC0ALA0AQQAhAyACQQAgAkEAShshAgNAIAMgAkYNAgJAIAAgASgCABDYBSAAKAIAKAI0EQEAENYFRw0AIAMPCyABQQRqIQEgA0EBaiEDDAALAAsgAUEEIAIgACgCIBD7BCECCyACC4ICAQV/IwBBIGsiAiQAAkACQAJAIAEQ1gUQ8AUNACACIAEQ0wUiAzYCFAJAIAAtACxFDQAgAyAAKAIgEPEHRQ0CDAELIAIgAkEYajYCECACQSBqIQQgAkEYaiEFIAJBFGohBgNAIAAoAiQgACgCKCAGIAUgAkEMaiACQRhqIAQgAkEQahDoByEDIAIoAgwgBkYNAgJAIANBA0cNACAGQQFBASAAKAIgEPsEQQFGDQIMAwsgA0EBSw0CIAJBGGpBASACKAIQIAJBGGprIgYgACgCIBD7BCAGRw0CIAIoAgwhBiADQQFGDQALCyABEPIHIQAMAQsQ1gUhAAsgAkEgaiQAIAALDAAgACABELMHQX9HCxoAAkAgABDWBRDwBUUNABDWBUF/cyEACyAACwUAELQHC0cBAn8gACABNwNwIAAgACgCLCAAKAIEIgJrrDcDeCAAKAIIIQMCQCABUA0AIAMgAmusIAFXDQAgAiABp2ohAwsgACADNgJoC90BAgN/An4gACkDeCAAKAIEIgEgACgCLCICa6x8IQQCQAJAAkAgACkDcCIFUA0AIAQgBVkNAQsgABCgByICQX9KDQEgACgCBCEBIAAoAiwhAgsgAEJ/NwNwIAAgATYCaCAAIAQgAiABa6x8NwN4QX8PCyAEQgF8IQQgACgCBCEBIAAoAgghAwJAIAApA3AiBUIAUQ0AIAUgBH0iBSADIAFrrFkNACABIAWnaiEDCyAAIAM2AmggACAEIAAoAiwiAyABa6x8NwN4AkAgASADSw0AIAFBf2ogAjoAAAsgAgtTAQF+AkACQCADQcAAcUUNACABIANBQGqthiECQgAhAQwBCyADRQ0AIAFBwAAgA2utiCACIAOtIgSGhCECIAEgBIYhAQsgACABNwMAIAAgAjcDCAvhAQIDfwJ+IwBBEGsiAiQAAkACQCABvCIDQf////8HcSIEQYCAgHxqQf////cHSw0AIAStQhmGQoCAgICAgIDAP3whBUIAIQYMAQsCQCAEQYCAgPwHSQ0AIAOtQhmGQoCAgICAgMD//wCEIQVCACEGDAELAkAgBA0AQgAhBkIAIQUMAQsgAiAErUIAIARnIgRB0QBqEPYHIAJBCGopAwBCgICAgICAwACFQYn/ACAEa61CMIaEIQUgAikDACEGCyAAIAY3AwAgACAFIANBgICAgHhxrUIghoQ3AwggAkEQaiQAC40BAgJ/An4jAEEQayICJAACQAJAIAENAEIAIQRCACEFDAELIAIgASABQR91IgNzIANrIgOtQgAgA2ciA0HRAGoQ9gcgAkEIaikDAEKAgICAgIDAAIVBnoABIANrrUIwhnwgAUGAgICAeHGtQiCGhCEFIAIpAwAhBAsgACAENwMAIAAgBTcDCCACQRBqJAALUwEBfgJAAkAgA0HAAHFFDQAgAiADQUBqrYghAUIAIQIMAQsgA0UNACACQcAAIANrrYYgASADrSIEiIQhASACIASIIQILIAAgATcDACAAIAI3AwgLmgsCBX8PfiMAQeAAayIFJAAgBEL///////8/gyEKIAQgAoVCgICAgICAgICAf4MhCyACQv///////z+DIgxCIIghDSAEQjCIp0H//wFxIQYCQAJAAkAgAkIwiKdB//8BcSIHQYGAfmpBgoB+SQ0AQQAhCCAGQYGAfmpBgYB+Sw0BCwJAIAFQIAJC////////////AIMiDkKAgICAgIDA//8AVCAOQoCAgICAgMD//wBRGw0AIAJCgICAgICAIIQhCwwCCwJAIANQIARC////////////AIMiAkKAgICAgIDA//8AVCACQoCAgICAgMD//wBRGw0AIARCgICAgICAIIQhCyADIQEMAgsCQCABIA5CgICAgICAwP//AIWEQgBSDQACQCADIAKEUEUNAEKAgICAgIDg//8AIQtCACEBDAMLIAtCgICAgICAwP//AIQhC0IAIQEMAgsCQCADIAJCgICAgICAwP//AIWEQgBSDQAgASAOhCECQgAhAQJAIAJQRQ0AQoCAgICAgOD//wAhCwwDCyALQoCAgICAgMD//wCEIQsMAgsCQCABIA6EQgBSDQBCACEBDAILAkAgAyAChEIAUg0AQgAhAQwCC0EAIQgCQCAOQv///////z9WDQAgBUHQAGogASAMIAEgDCAMUCIIG3kgCEEGdK18pyIIQXFqEPYHQRAgCGshCCAFQdgAaikDACIMQiCIIQ0gBSkDUCEBCyACQv///////z9WDQAgBUHAAGogAyAKIAMgCiAKUCIJG3kgCUEGdK18pyIJQXFqEPYHIAggCWtBEGohCCAFQcgAaikDACEKIAUpA0AhAwsgA0IPhiIOQoCA/v8PgyICIAFCIIgiBH4iDyAOQiCIIg4gAUL/////D4MiAX58IhBCIIYiESACIAF+fCISIBFUrSACIAxC/////w+DIgx+IhMgDiAEfnwiESADQjGIIApCD4YiFIRC/////w+DIgMgAX58IhUgEEIgiCAQIA9UrUIghoR8IhAgAiANQoCABIQiCn4iFiAOIAx+fCINIBRCIIhCgICAgAiEIgIgAX58Ig8gAyAEfnwiFEIghnwiF3whASAHIAZqIAhqQYGAf2ohBgJAAkAgAiAEfiIYIA4gCn58IgQgGFStIAQgAyAMfnwiDiAEVK18IAIgCn58IA4gESATVK0gFSARVK18fCIEIA5UrXwgAyAKfiIDIAIgDH58IgIgA1StQiCGIAJCIIiEfCAEIAJCIIZ8IgIgBFStfCACIBRCIIggDSAWVK0gDyANVK18IBQgD1StfEIghoR8IgQgAlStfCAEIBAgFVStIBcgEFStfHwiAiAEVK18IgRCgICAgICAwACDUA0AIAZBAWohBgwBCyASQj+IIQMgBEIBhiACQj+IhCEEIAJCAYYgAUI/iIQhAiASQgGGIRIgAyABQgGGhCEBCwJAIAZB//8BSA0AIAtCgICAgICAwP//AIQhC0IAIQEMAQsCQAJAIAZBAEoNAAJAQQEgBmsiB0H/AEsNACAFQTBqIBIgASAGQf8AaiIGEPYHIAVBIGogAiAEIAYQ9gcgBUEQaiASIAEgBxD5ByAFIAIgBCAHEPkHIAUpAyAgBSkDEIQgBSkDMCAFQTBqQQhqKQMAhEIAUq2EIRIgBUEgakEIaikDACAFQRBqQQhqKQMAhCEBIAVBCGopAwAhBCAFKQMAIQIMAgtCACEBDAILIAatQjCGIARC////////P4OEIQQLIAQgC4QhCwJAIBJQIAFCf1UgAUKAgICAgICAgIB/URsNACALIAJCAXwiAVCtfCELDAELAkAgEiABQoCAgICAgICAgH+FhEIAUQ0AIAIhAQwBCyALIAIgAkIBg3wiASACVK18IQsLIAAgATcDACAAIAs3AwggBUHgAGokAAsEAEEACwQAQQAL6goCBH8EfiMAQfAAayIFJAAgBEL///////////8AgyEJAkACQAJAIAFQIgYgAkL///////////8AgyIKQoCAgICAgMCAgH98QoCAgICAgMCAgH9UIApQGw0AIANCAFIgCUKAgICAgIDAgIB/fCILQoCAgICAgMCAgH9WIAtCgICAgICAwICAf1EbDQELAkAgBiAKQoCAgICAgMD//wBUIApCgICAgICAwP//AFEbDQAgAkKAgICAgIAghCEEIAEhAwwCCwJAIANQIAlCgICAgICAwP//AFQgCUKAgICAgIDA//8AURsNACAEQoCAgICAgCCEIQQMAgsCQCABIApCgICAgICAwP//AIWEQgBSDQBCgICAgICA4P//ACACIAMgAYUgBCAChUKAgICAgICAgIB/hYRQIgYbIQRCACABIAYbIQMMAgsgAyAJQoCAgICAgMD//wCFhFANAQJAIAEgCoRCAFINACADIAmEQgBSDQIgAyABgyEDIAQgAoMhBAwCCyADIAmEUEUNACABIQMgAiEEDAELIAMgASADIAFWIAkgClYgCSAKURsiBxshCSAEIAIgBxsiC0L///////8/gyEKIAIgBCAHGyIMQjCIp0H//wFxIQgCQCALQjCIp0H//wFxIgYNACAFQeAAaiAJIAogCSAKIApQIgYbeSAGQQZ0rXynIgZBcWoQ9gdBECAGayEGIAVB6ABqKQMAIQogBSkDYCEJCyABIAMgBxshAyAMQv///////z+DIQECQCAIDQAgBUHQAGogAyABIAMgASABUCIHG3kgB0EGdK18pyIHQXFqEPYHQRAgB2shCCAFQdgAaikDACEBIAUpA1AhAwsgAUIDhiADQj2IhEKAgICAgICABIQhASAKQgOGIAlCPYiEIQwgA0IDhiEKIAQgAoUhAwJAIAYgCEYNAAJAIAYgCGsiB0H/AE0NAEIAIQFCASEKDAELIAVBwABqIAogAUGAASAHaxD2ByAFQTBqIAogASAHEPkHIAUpAzAgBSkDQCAFQcAAakEIaikDAIRCAFKthCEKIAVBMGpBCGopAwAhAQsgDEKAgICAgICABIQhDCAJQgOGIQkCQAJAIANCf1UNAEIAIQNCACEEIAkgCoUgDCABhYRQDQIgCSAKfSECIAwgAX0gCSAKVK19IgRC/////////wNWDQEgBUEgaiACIAQgAiAEIARQIgcbeSAHQQZ0rXynQXRqIgcQ9gcgBiAHayEGIAVBKGopAwAhBCAFKQMgIQIMAQsgASAMfCAKIAl8IgIgClStfCIEQoCAgICAgIAIg1ANACACQgGIIARCP4aEIApCAYOEIQIgBkEBaiEGIARCAYghBAsgC0KAgICAgICAgIB/gyEKAkAgBkH//wFIDQAgCkKAgICAgIDA//8AhCEEQgAhAwwBC0EAIQcCQAJAIAZBAEwNACAGIQcMAQsgBUEQaiACIAQgBkH/AGoQ9gcgBSACIARBASAGaxD5ByAFKQMAIAUpAxAgBUEQakEIaikDAIRCAFKthCECIAVBCGopAwAhBAsgAkIDiCAEQj2GhCEDIAetQjCGIARCA4hC////////P4OEIAqEIQQgAqdBB3EhBgJAAkACQAJAAkAQ+wcOAwABAgMLAkAgBkEERg0AIAQgAyAGQQRLrXwiCiADVK18IQQgCiEDDAMLIAQgAyADQgGDfCIKIANUrXwhBCAKIQMMAwsgBCADIApCAFIgBkEAR3GtfCIKIANUrXwhBCAKIQMMAQsgBCADIApQIAZBAEdxrXwiCiADVK18IQQgCiEDCyAGRQ0BCxD8BxoLIAAgAzcDACAAIAQ3AwggBUHwAGokAAuOAgICfwN+IwBBEGsiAiQAAkACQCABvSIEQv///////////wCDIgVCgICAgICAgHh8Qv/////////v/wBWDQAgBUI8hiEGIAVCBIhCgICAgICAgIA8fCEFDAELAkAgBUKAgICAgICA+P8AVA0AIARCPIYhBiAEQgSIQoCAgICAgMD//wCEIQUMAQsCQCAFUEUNAEIAIQZCACEFDAELIAIgBUIAIAWnZ0EgaiAFQiCIp2cgBUKAgICAEFQbIgNBMWoQ9gcgAkEIaikDAEKAgICAgIDAAIVBjPgAIANrrUIwhoQhBSACKQMAIQYLIAAgBjcDACAAIAUgBEKAgICAgICAgIB/g4Q3AwggAkEQaiQAC+ABAgF/An5BASEEAkAgAEIAUiABQv///////////wCDIgVCgICAgICAwP//AFYgBUKAgICAgIDA//8AURsNACACQgBSIANC////////////AIMiBkKAgICAgIDA//8AViAGQoCAgICAgMD//wBRGw0AAkAgAiAAhCAGIAWEhFBFDQBBAA8LAkAgAyABg0IAUw0AQX8hBCAAIAJUIAEgA1MgASADURsNASAAIAKFIAEgA4WEQgBSDwtBfyEEIAAgAlYgASADVSABIANRGw0AIAAgAoUgASADhYRCAFIhBAsgBAvYAQIBfwJ+QX8hBAJAIABCAFIgAUL///////////8AgyIFQoCAgICAgMD//wBWIAVCgICAgICAwP//AFEbDQAgAkIAUiADQv///////////wCDIgZCgICAgICAwP//AFYgBkKAgICAgIDA//8AURsNAAJAIAIgAIQgBiAFhIRQRQ0AQQAPCwJAIAMgAYNCAFMNACAAIAJUIAEgA1MgASADURsNASAAIAKFIAEgA4WEQgBSDwsgACACViABIANVIAEgA1EbDQAgACAChSABIAOFhEIAUiEECyAECzwAIAAgATcDACAAIARCMIinQYCAAnEgAkKAgICAgIDA//8Ag0IwiKdyrUIwhiACQv///////z+DhDcDCAt1AgF/An4jAEEQayICJAACQAJAIAENAEIAIQNCACEEDAELIAIgAa1CAEHwACABZyIBQR9zaxD2ByACQQhqKQMAQoCAgICAgMAAhUGegAEgAWutQjCGfCEEIAIpAwAhAwsgACADNwMAIAAgBDcDCCACQRBqJAALSAEBfyMAQRBrIgUkACAFIAEgAiADIARCgICAgICAgICAf4UQ/QcgBSkDACEEIAAgBUEIaikDADcDCCAAIAQ3AwAgBUEQaiQAC+cCAQF/IwBB0ABrIgQkAAJAAkAgA0GAgAFIDQAgBEEgaiABIAJCAEKAgICAgICA//8AEPoHIARBIGpBCGopAwAhAiAEKQMgIQECQCADQf//AU8NACADQYGAf2ohAwwCCyAEQRBqIAEgAkIAQoCAgICAgID//wAQ+gcgA0H9/wIgA0H9/wJJG0GCgH5qIQMgBEEQakEIaikDACECIAQpAxAhAQwBCyADQYGAf0oNACAEQcAAaiABIAJCAEKAgICAgICAORD6ByAEQcAAakEIaikDACECIAQpA0AhAQJAIANB9IB+TQ0AIANBjf8AaiEDDAELIARBMGogASACQgBCgICAgICAgDkQ+gcgA0HogX0gA0HogX1LG0Ga/gFqIQMgBEEwakEIaikDACECIAQpAzAhAQsgBCABIAJCACADQf//AGqtQjCGEPoHIAAgBEEIaikDADcDCCAAIAQpAwA3AwAgBEHQAGokAAt1AQF+IAAgBCABfiACIAN+fCADQiCIIgIgAUIgiCIEfnwgA0L/////D4MiAyABQv////8PgyIBfiIFQiCIIAMgBH58IgNCIIh8IANC/////w+DIAIgAX58IgFCIIh8NwMIIAAgAUIghiAFQv////8Pg4Q3AwAL5xACBX8PfiMAQdACayIFJAAgBEL///////8/gyEKIAJC////////P4MhCyAEIAKFQoCAgICAgICAgH+DIQwgBEIwiKdB//8BcSEGAkACQAJAIAJCMIinQf//AXEiB0GBgH5qQYKAfkkNAEEAIQggBkGBgH5qQYGAfksNAQsCQCABUCACQv///////////wCDIg1CgICAgICAwP//AFQgDUKAgICAgIDA//8AURsNACACQoCAgICAgCCEIQwMAgsCQCADUCAEQv///////////wCDIgJCgICAgICAwP//AFQgAkKAgICAgIDA//8AURsNACAEQoCAgICAgCCEIQwgAyEBDAILAkAgASANQoCAgICAgMD//wCFhEIAUg0AAkAgAyACQoCAgICAgMD//wCFhFBFDQBCACEBQoCAgICAgOD//wAhDAwDCyAMQoCAgICAgMD//wCEIQxCACEBDAILAkAgAyACQoCAgICAgMD//wCFhEIAUg0AQgAhAQwCCwJAIAEgDYRCAFINAEKAgICAgIDg//8AIAwgAyAChFAbIQxCACEBDAILAkAgAyAChEIAUg0AIAxCgICAgICAwP//AIQhDEIAIQEMAgtBACEIAkAgDUL///////8/Vg0AIAVBwAJqIAEgCyABIAsgC1AiCBt5IAhBBnStfKciCEFxahD2B0EQIAhrIQggBUHIAmopAwAhCyAFKQPAAiEBCyACQv///////z9WDQAgBUGwAmogAyAKIAMgCiAKUCIJG3kgCUEGdK18pyIJQXFqEPYHIAkgCGpBcGohCCAFQbgCaikDACEKIAUpA7ACIQMLIAVBoAJqIANCMYggCkKAgICAgIDAAIQiDkIPhoQiAkIAQoCAgICw5ryC9QAgAn0iBEIAEIUIIAVBkAJqQgAgBUGgAmpBCGopAwB9QgAgBEIAEIUIIAVBgAJqIAUpA5ACQj+IIAVBkAJqQQhqKQMAQgGGhCIEQgAgAkIAEIUIIAVB8AFqIARCAEIAIAVBgAJqQQhqKQMAfUIAEIUIIAVB4AFqIAUpA/ABQj+IIAVB8AFqQQhqKQMAQgGGhCIEQgAgAkIAEIUIIAVB0AFqIARCAEIAIAVB4AFqQQhqKQMAfUIAEIUIIAVBwAFqIAUpA9ABQj+IIAVB0AFqQQhqKQMAQgGGhCIEQgAgAkIAEIUIIAVBsAFqIARCAEIAIAVBwAFqQQhqKQMAfUIAEIUIIAVBoAFqIAJCACAFKQOwAUI/iCAFQbABakEIaikDAEIBhoRCf3wiBEIAEIUIIAVBkAFqIANCD4ZCACAEQgAQhQggBUHwAGogBEIAQgAgBUGgAWpBCGopAwAgBSkDoAEiCiAFQZABakEIaikDAHwiAiAKVK18IAJCAVatfH1CABCFCCAFQYABakIBIAJ9QgAgBEIAEIUIIAggByAGa2ohBgJAAkAgBSkDcCIPQgGGIhAgBSkDgAFCP4ggBUGAAWpBCGopAwAiEUIBhoR8Ig1CmZN/fCISQiCIIgIgC0KAgICAgIDAAIQiE0IBhiIUQiCIIgR+IhUgAUIBhiIWQiCIIgogBUHwAGpBCGopAwBCAYYgD0I/iIQgEUI/iHwgDSAQVK18IBIgDVStfEJ/fCIPQiCIIg1+fCIQIBVUrSAQIA9C/////w+DIg8gAUI/iCIXIAtCAYaEQv////8PgyILfnwiESAQVK18IA0gBH58IA8gBH4iFSALIA1+fCIQIBVUrUIghiAQQiCIhHwgESAQQiCGfCIQIBFUrXwgECASQv////8PgyISIAt+IhUgAiAKfnwiESAVVK0gESAPIBZC/v///w+DIhV+fCIYIBFUrXx8IhEgEFStfCARIBIgBH4iECAVIA1+fCIEIAIgC358IgsgDyAKfnwiDUIgiCAEIBBUrSALIARUrXwgDSALVK18QiCGhHwiBCARVK18IAQgGCACIBV+IgIgEiAKfnwiC0IgiCALIAJUrUIghoR8IgIgGFStIAIgDUIghnwgAlStfHwiAiAEVK18IgRC/////////wBWDQAgFCAXhCETIAVB0ABqIAIgBCADIA4QhQggAUIxhiAFQdAAakEIaikDAH0gBSkDUCIBQgBSrX0hCiAGQf7/AGohBkIAIAF9IQsMAQsgBUHgAGogAkIBiCAEQj+GhCICIARCAYgiBCADIA4QhQggAUIwhiAFQeAAakEIaikDAH0gBSkDYCILQgBSrX0hCiAGQf//AGohBkIAIAt9IQsgASEWCwJAIAZB//8BSA0AIAxCgICAgICAwP//AIQhDEIAIQEMAQsCQAJAIAZBAUgNACAKQgGGIAtCP4iEIQEgBq1CMIYgBEL///////8/g4QhCiALQgGGIQQMAQsCQCAGQY9/Sg0AQgAhAQwCCyAFQcAAaiACIARBASAGaxD5ByAFQTBqIBYgEyAGQfAAahD2ByAFQSBqIAMgDiAFKQNAIgIgBUHAAGpBCGopAwAiChCFCCAFQTBqQQhqKQMAIAVBIGpBCGopAwBCAYYgBSkDICIBQj+IhH0gBSkDMCIEIAFCAYYiC1StfSEBIAQgC30hBAsgBUEQaiADIA5CA0IAEIUIIAUgAyAOQgVCABCFCCAKIAIgAkIBgyILIAR8IgQgA1YgASAEIAtUrXwiASAOViABIA5RG618IgMgAlStfCICIAMgAkKAgICAgIDA//8AVCAEIAUpAxBWIAEgBUEQakEIaikDACICViABIAJRG3GtfCICIANUrXwiAyACIANCgICAgICAwP//AFQgBCAFKQMAViABIAVBCGopAwAiBFYgASAEURtxrXwiASACVK18IAyEIQwLIAAgATcDACAAIAw3AwggBUHQAmokAAtLAgF+An8gAUL///////8/gyECAkACQCABQjCIp0H//wFxIgNB//8BRg0AQQQhBCADDQFBAkEDIAIgAIRQGw8LIAIgAIRQIQQLIAQL1QYCBH8DfiMAQYABayIFJAACQAJAAkAgAyAEQgBCABD/B0UNACADIAQQhwghBiACQjCIpyIHQf//AXEiCEH//wFGDQAgBg0BCyAFQRBqIAEgAiADIAQQ+gcgBSAFKQMQIgQgBUEQakEIaikDACIDIAQgAxCGCCAFQQhqKQMAIQIgBSkDACEEDAELAkAgASACQv///////////wCDIgkgAyAEQv///////////wCDIgoQ/wdBAEoNAAJAIAEgCSADIAoQ/wdFDQAgASEEDAILIAVB8ABqIAEgAkIAQgAQ+gcgBUH4AGopAwAhAiAFKQNwIQQMAQsgBEIwiKdB//8BcSEGAkACQCAIRQ0AIAEhBAwBCyAFQeAAaiABIAlCAEKAgICAgIDAu8AAEPoHIAVB6ABqKQMAIglCMIinQYh/aiEIIAUpA2AhBAsCQCAGDQAgBUHQAGogAyAKQgBCgICAgICAwLvAABD6ByAFQdgAaikDACIKQjCIp0GIf2ohBiAFKQNQIQMLIApC////////P4NCgICAgICAwACEIQsgCUL///////8/g0KAgICAgIDAAIQhCQJAIAggBkwNAANAAkACQCAJIAt9IAQgA1StfSIKQgBTDQACQCAKIAQgA30iBIRCAFINACAFQSBqIAEgAkIAQgAQ+gcgBUEoaikDACECIAUpAyAhBAwFCyAKQgGGIARCP4iEIQkMAQsgCUIBhiAEQj+IhCEJCyAEQgGGIQQgCEF/aiIIIAZKDQALIAYhCAsCQAJAIAkgC30gBCADVK19IgpCAFkNACAJIQoMAQsgCiAEIAN9IgSEQgBSDQAgBUEwaiABIAJCAEIAEPoHIAVBOGopAwAhAiAFKQMwIQQMAQsCQCAKQv///////z9WDQADQCAEQj+IIQMgCEF/aiEIIARCAYYhBCADIApCAYaEIgpCgICAgICAwABUDQALCyAHQYCAAnEhBgJAIAhBAEoNACAFQcAAaiAEIApC////////P4MgCEH4AGogBnKtQjCGhEIAQoCAgICAgMDDPxD6ByAFQcgAaikDACECIAUpA0AhBAwBCyAKQv///////z+DIAggBnKtQjCGhCECCyAAIAQ3AwAgACACNwMIIAVBgAFqJAALHAAgACACQv///////////wCDNwMIIAAgATcDAAuVCQIGfwN+IwBBMGsiBCQAQgAhCgJAAkAgAkECSw0AIAJBAnQiAkHMxARqKAIAIQUgAkHAxARqKAIAIQYDQAJAAkAgASgCBCIC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AkAgACgCBCIFIAAoAmhGDQAgACAFQQFqNgIEIAUtAAAhBQwBCyAAEPUHIQULIAkgC4YgCoQhCSABIAVB4cQEai0AACICTQ0BIAkgDFgNAAsLIAEgBUHhxARqLQAATQ0AA0ACQAJAIAAoAgQiBSAAKAJoRg0AIAAgBUEBajYCBCAFLQAAIQUMAQsgABD1ByEFCyABIAVB4cQEai0AAEsNAAsQ1ARBxAA2AgAgBkEAIANCAYNQGyEGIAMhCQsCQCAAKQNwQgBTDQAgACAAKAIEQX9qNgIECwJAIAkgA1QNAAJAIAOnQQFxDQAgBg0AENQEQcQANgIAIANCf3whAwwCCyAJIANYDQAQ1ARBxAA2AgAMAQsgCSAGrCIDhSADfSEDCyAEQRBqJAAgAwsQACAAQSBGIABBd2pBBUlyC8QDAgN/AX4jAEEgayICJAACQAJAIAFC////////////AIMiBUKAgICAgIDAv0B8IAVCgICAgICAwMC/f3xaDQAgAUIZiKchAwJAIABQIAFC////D4MiBUKAgIAIVCAFQoCAgAhRGw0AIANBgYCAgARqIQQMAgsgA0GAgICABGohBCAAIAVCgICACIWEQgBSDQEgBCADQQFxaiEEDAELAkAgAFAgBUKAgICAgIDA//8AVCAFQoCAgICAgMD//wBRGw0AIAFCGYinQf///wFxQYCAgP4HciEEDAELQYCAgPwHIQQgBUL///////+/v8AAVg0AQQAhBCAFQjCIpyIDQZH+AEkNACACQRBqIAAgAUL///////8/g0KAgICAgIDAAIQiBSADQf+Bf2oQ9gcgAiAAIAVBgf8AIANrEPkHIAJBCGopAwAiBUIZiKchBAJAIAIpAwAgAikDECACQRBqQQhqKQMAhEIAUq2EIgBQIAVC////D4MiBUKAgIAIVCAFQoCAgAhRGw0AIARBAWohBAwBCyAAIAVCgICACIWEQgBSDQAgBEEBcSAEaiEECyACQSBqJAAgBCABQiCIp0GAgICAeHFyvgvkAwICfwJ+IwBBIGsiAiQAAkACQCABQv///////////wCDIgRCgICAgICAwP9DfCAEQoCAgICAgMCAvH98Wg0AIABCPIggAUIEhoQhBAJAIABC//////////8PgyIAQoGAgICAgICACFQNACAEQoGAgICAgICAwAB8IQUMAgsgBEKAgICAgICAgMAAfCEFIABCgICAgICAgIAIUg0BIAUgBEIBg3whBQwBCwJAIABQIARCgICAgICAwP//AFQgBEKAgICAgIDA//8AURsNACAAQjyIIAFCBIaEQv////////8Dg0KAgICAgICA/P8AhCEFDAELQoCAgICAgID4/wAhBSAEQv///////7//wwBWDQBCACEFIARCMIinIgNBkfcASQ0AIAJBEGogACABQv///////z+DQoCAgICAgMAAhCIEIANB/4h/ahD2ByACIAAgBEGB+AAgA2sQ+QcgAikDACIEQjyIIAJBCGopAwBCBIaEIQUCQCAEQv//////////D4MgAikDECACQRBqQQhqKQMAhEIAUq2EIgRCgYCAgICAgIAIVA0AIAVCAXwhBQwBCyAEQoCAgICAgICACFINACAFQgGDIAV8IQULIAJBIGokACAFIAFCgICAgICAgICAf4OEvwsSAAJAIAANAEEBDwsgACgCAEUL7BUCEH8DfiMAQbACayIDJAACQAJAIAAoAkxBAE4NAEEBIQQMAQsgABD0BEUhBAsCQAJAAkAgACgCBA0AIAAQ+AQaIAAoAgRFDQELAkAgAS0AACIFDQBBACEGDAILIANBEGohB0IAIRNBACEGAkACQAJAAkACQAJAA0ACQAJAIAVB/wFxIgUQlQhFDQADQCABIgVBAWohASAFLQABEJUIDQALIABCABD0BwNAAkACQCAAKAIEIgEgACgCaEYNACAAIAFBAWo2AgQgAS0AACEBDAELIAAQ9QchAQsgARCVCA0ACyAAKAIEIQECQCAAKQNwQgBTDQAgACABQX9qIgE2AgQLIAApA3ggE3wgASAAKAIsa6x8IRMMAQsCQAJAAkACQCAFQSVHDQAgAS0AASIFQSpGDQEgBUElRw0CCyAAQgAQ9AcCQAJAIAEtAABBJUcNAANAAkACQCAAKAIEIgUgACgCaEYNACAAIAVBAWo2AgQgBS0AACEFDAELIAAQ9QchBQsgBRCVCA0ACyABQQFqIQEMAQsCQCAAKAIEIgUgACgCaEYNACAAIAVBAWo2AgQgBS0AACEFDAELIAAQ9QchBQsCQCAFIAEtAABGDQACQCAAKQNwQgBTDQAgACAAKAIEQX9qNgIECyAFQX9KDQ0gBg0NDAwLIAApA3ggE3wgACgCBCAAKAIsa6x8IRMg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IAsoAogERw0AIAggCSALQYgEahCdCwsgABChBSEKIAkgCSgCACIBQQFqNgIAIAEgCjoAACALIAsoAhhBf2o2AhgMAAsACyACIQEgCSgCACAIEI4LRw0DIAUgBSgCAEEEcjYCAEEAIQAMAQsCQCACRQ0AQQEhCgNAIAogAhCQBk8NAQJAAkAgACALQYwEahCgBQ0AIAAQoQVB/wFxIAIgChDuCC0AAEYNAQsgBSAFKAIAQQRyNgIAQQAhAAwDCyAAEKMFGiAKQQFqIQoMAAsAC0EBIQAgDBCSCyALKAJkRg0AQQAhACALQQA2AhAgDSAMEJILIAsoAmQgC0EQahD5CAJAIAsoAhBFDQAgBSAFKAIAQQRyNgIADAELQQEhAAsgERCgERogEBCgERogDxCgERogDhCgERogDRCgERogDBCfCxoMAwsgAiEBCyADQQFqIQMMAAsACyALQZAEaiQAIAALCgAgABCgCygCAAsHACAAQQpqCxYAIAAgARD8ECIBQQRqIAIQmwcaIAELKwEBfyMAQRBrIgMkACADIAE2AgwgACADQQxqIAIQqQshASADQRBqJAAgAQsKACAAEKoLKAIAC4ADAQF/IwBBEGsiCiQAAkACQCAARQ0AIApBBGogARCrCyIBEKwLIAIgCigCBDYAACAKQQRqIAEQrQsgCCAKQQRqEIEGGiAKQQRqEKARGiAKQQRqIAEQrgsgByAKQQRqEIEGGiAKQQRqEKARGiADIAEQrws6AAAgBCABELALOgAAIApBBGogARCxCyAFIApBBGoQgQYaIApBBGoQoBEaIApBBGogARCyCyAGIApBBGoQgQYaIApBBGoQoBEaIAEQswshAQwBCyAKQQRqIAEQtAsiARC1CyACIAooAgQ2AAAgCkEEaiABELYLIAggCkEEahCBBhogCkEEahCgERogCkEEaiABELcLIAcgCkEEahCBBhogCkEEahCgERogAyABELgLOgAAIAQgARC5CzoAACAKQQRqIAEQugsgBSAKQQRqEIEGGiAKQQRqEKARGiAKQQRqIAEQuwsgBiAKQQRqEIEGGiAKQQRqEKARGiABELwLIQELIAkgATYCACAKQRBqJAALFgAgACABKAIAEKsFwCABKAIAEL0LGgsHACAALAAACw4AIAAgARC+CzYCACAACwwAIAAgARC/C0EBcwsHACAAKAIACxEAIAAgACgCAEEBajYCACAACw0AIAAQwAsgARC+C2sLDAAgAEEAIAFrEMILCwsAIAAgASACEMELC+QBAQZ/IwBBEGsiAyQAIAAQwwsoAgAhBAJAAkAgAigCACAAEI4LayIFEPwGQQF2Tw0AIAVBAXQhBQwBCxD8BiEFCyAFQQEgBUEBSxshBSABKAIAIQYgABCOCyEHAkACQCAEQYgBRw0AQQAhCAwBCyAAEI4LIQgLAkAgCCAFENkEIghFDQACQCAEQYgBRg0AIAAQxAsaCyADQYcBNgIEIAAgA0EIaiAIIANBBGoQ5gkiBBDFCxogBBDqCRogASAAEI4LIAYgB2tqNgIAIAIgABCOCyAFajYCACADQRBqJAAPCxCYEQAL5AEBBn8jAEEQayIDJAAgABDGCygCACEEAkACQCACKAIAIAAQkgtrIgUQ/AZBAXZPDQAgBUEBdCEFDAELEPwGIQULIAVBBCAFGyEFIAEoAgAhBiAAEJILIQcCQAJAIARBiAFHDQBBACEIDAELIAAQkgshCAsCQCAIIAUQ2QQiCEUNAAJAIARBiAFGDQAgABDHCxoLIANBhwE2AgQgACADQQhqIAggA0EEahCRCyIEEMgLGiAEEJ8LGiABIAAQkgsgBiAHa2o2AgAgAiAAEJILIAVBfHFqNgIAIANBEGokAA8LEJgRAAsLACAAQQAQygsgAAsHACAAEP0QCwcAIAAQ/hALCgAgAEEEahCcBwu2AgECfyMAQZABayIHJAAgByACNgKIASAHIAE2AowBIAdBiAE2AhQgB0EYaiAHQSBqIAdBFGoQ5gkhCCAHQRBqIAQQkgcgB0EQahCfBSEBIAdBADoADwJAIAdBjAFqIAIgAyAHQRBqIAQQngUgBSAHQQ9qIAEgCCAHQRRqIAdBhAFqEI0LRQ0AIAYQpAsCQCAHLQAPRQ0AIAYgAUEtEIsHEKkRCyABQTAQiwchASAIEI4LIQIgBygCFCIDQX9qIQQgAUH/AXEhAQJAA0AgAiAETw0BIAItAAAgAUcNASACQQFqIQIMAAsACyAGIAIgAxClCxoLAkAgB0GMAWogB0GIAWoQoAVFDQAgBSAFKAIAQQJyNgIACyAHKAKMASECIAdBEGoQtA0aIAgQ6gkaIAdBkAFqJAAgAgtiAQJ/IwBBEGsiASQAAkACQCAAEI0GRQ0AIAAQ2gYhAiABQQA6AA8gAiABQQ9qEOEGIABBABD5BgwBCyAAENsGIQIgAUEAOgAOIAIgAUEOahDhBiAAQQAQ4AYLIAFBEGokAAvTAQEEfyMAQRBrIgMkACAAEJAGIQQgABCRBiEFAkAgASACEO8GIgZFDQACQCAAIAEQpgsNAAJAIAUgBGsgBk8NACAAIAUgBCAFayAGaiAEIARBAEEAEKcLCyAAEIMGIARqIQUCQANAIAEgAkYNASAFIAEQ4QYgAUEBaiEBIAVBAWohBQwACwALIANBADoADyAFIANBD2oQ4QYgACAGIARqEKgLDAELIAAgAyABIAIgABCIBhCJBiIBEI8GIAEQkAYQpxEaIAEQoBEaCyADQRBqJAAgAAsaACAAEI8GIAAQjwYgABCQBmpBAWogARC6DwsgACAAIAEgAiADIAQgBSAGEIgPIAAgAyAFayAGahD5BgscAAJAIAAQjQZFDQAgACABEPkGDwsgACABEOAGCxYAIAAgARD/ECIBQQRqIAIQmwcaIAELBwAgABCDEQsLACAAQdDDBRDpCAsRACAAIAEgASgCACgCLBECAAsRACAAIAEgASgCACgCIBECAAsRACAAIAEgASgCACgCHBECAAsPACAAIAAoAgAoAgwRAAALDwAgACAAKAIAKAIQEQAACxEAIAAgASABKAIAKAIUEQIACxEAIAAgASABKAIAKAIYEQIACw8AIAAgACgCACgCJBEAAAsLACAAQcjDBRDpCAsRACAAIAEgASgCACgCLBECAAsRACAAIAEgASgCACgCIBECAAsRACAAIAEgASgCACgCHBECAAsPACAAIAAoAgAoAgwRAAALDwAgACAAKAIAKAIQEQAACxEAIAAgASABKAIAKAIUEQIACxEAIAAgASABKAIAKAIYEQIACw8AIAAgACgCACgCJBEAAAsSACAAIAI2AgQgACABOgAAIAALBwAgACgCAAsNACAAEMALIAEQvgtGCwcAIAAoAgALLwEBfyMAQRBrIgMkACAAELwPIAEQvA8gAhC8DyADQQ9qEL0PIQIgA0EQaiQAIAILMgEBfyMAQRBrIgIkACACIAAoAgA2AgwgAkEMaiABEMMPGiACKAIMIQAgAkEQaiQAIAALBwAgABCiCwsaAQF/IAAQoQsoAgAhASAAEKELQQA2AgAgAQsiACAAIAEQxAsQ6Akg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fyMAQRBrIgEkAAJAAkAgABCzCkUNACAAEOALIQIgAUEANgIMIAIgAUEMahDhCyAAQQAQ4gsMAQsgABDjCyECIAFBADYCCCACIAFBCGoQ4QsgAEEAEOQLCyABQRBqJAAL2QEBBH8jAEEQayIDJAAgABCiCSEEIAAQ5QshBQJAIAEgAhDmCyIGRQ0AAkAgACABEOcLDQACQCAFIARrIAZPDQAgACAFIAQgBWsgBmogBCAEQQBBABDoCwsgABD3CSAEQQJ0aiEFAkADQCABIAJGDQEgBSABEOELIAFBBGohASAFQQRqIQUMAAsACyADQQA2AgQgBSADQQRqEOELIAAgBiAEahDpCwwBCyAAIANBBGogASACIAAQ6gsQ6wsiARCxCiABEKIJELURGiABEK4RGgsgA0EQaiQAIAALCgAgABCJCygCAAsMACAAIAEoAgA2AgALDAAgABCJCyABNgIECwoAIAAQiQsQ/g4LMQEBfyAAEIkLIgIgAi0AC0GAAXEgAUH/AHFyOgALIAAQiQsiACAALQALQf8AcToACwsfAQF/QQEhAQJAIAAQswpFDQAgABCLD0F/aiEBCyABCwkAIAAgARDFDwsdACAAELEKIAAQsQogABCiCUECdGpBBGogARDGDwsgACAAIAEgAiADIAQgBSAGEMQPIAAgAyAFayAGahDiCwscAAJAIAAQswpFDQAgACABEOILDwsgACABEOQLCwcAIAAQgA8LKwEBfyMAQRBrIgQkACAAIARBD2ogAxDHDyIDIAEgAhDIDyAEQRBqJAAgAwsLACAAQeDDBRDpCAsRACAAIAEgASgCACgCLBECAAsRACAAIAEgASgCACgCIBECAAsLACAAIAEQiAwgAAsRACAAIAEgASgCACgCHBECAAsPACAAIAAoAgAoAgwRAAALDwAgACAAKAIAKAIQEQAACxEAIAAgASABKAIAKAIUEQIACxEAIAAgASABKAIAKAIYEQIACw8AIAAgACgCACgCJBEAAAsLACAAQdjDBRDpCAsRACAAIAEgASgCACgCLBECAAsRACAAIAEgASgCACgCIBECAAsRACAAIAEgASgCACgCHBECAAsPACAAIAAoAgAoAgwRAAALDwAgACAAKAIAKAIQEQAACxEAIAAgASABKAIAKAIUEQIACxEAIAAgASABKAIAKAIYEQIACw8AIAAgACgCACgCJBEAAAsSACAAIAI2AgQgACABNgIAIAALBwAgACgCAAsNACAAEIIMIAEQgAxGCwcAIAAoAgALLwEBfyMAQRBrIgMkACAAEMwPIAEQzA8gAhDMDyADQQ9qEM0PIQIgA0EQaiQAIAILMgEBfyMAQRBrIgIkACACIAAoAgA2AgwgAkEMaiABENMPGiACKAIMIQAgAkEQaiQAIAALBwAgABCbDAsaAQF/IAAQmgwoAgAhASAAEJoMQQA2AgAgAQsiACAAIAEQhgwQhwogARCFDCgCACEBIAAQmwwgATYCACAAC30BAn8jAEEQayICJAACQCAAELMKRQ0AIAAQ6gsgABDgCyAAEIsPEIkPCyAAIAEQ1A8gARCJCyEDIAAQiQsiAEEIaiADQQhqKAIANgIAIAAgAykCADcCACABQQAQ5AsgARDjCyEAIAJBADYCDCAAIAJBDGoQ4QsgAkEQaiQAC4QFAQx/IwBBwANrIgckACAHIAU3AxAgByAGNwMYIAcgB0HQAmo2AswCIAdB0AJqQeQAQcOEBCAHQRBqELwIIQggB0GHATYC4AFBACEJIAdB2AFqQQAgB0HgAWoQ5gkhCiAHQYcBNgLgASAHQdABakEAIAdB4AFqEOYJIQsgB0HgAWohDAJAAkAgCEHkAEkNABCWCSEIIAcgBTcDACAHIAY3AwggB0HMAmogCEHDhAQgBxDnCSIIQX9GDQEgCiAHKALMAhDoCSALIAgQ1gQQ6AkgC0EAEIoMDQEgCxCOCyEMCyAHQcwBaiADEJIHIAdBzAFqEJ8FIg0gBygCzAIiDiAOIAhqIAwQlQkaAkAgCEEBSA0AIAcoAswCLQAAQS1GIQkLIAIgCSAHQcwBaiAHQcgBaiAHQccBaiAHQcYBaiAHQbgBahD9BSIPIAdBrAFqEP0FIg4gB0GgAWoQ/QUiECAHQZwBahCLDCAHQYcBNgIwIAdBKGpBACAHQTBqEOYJIRECQAJAIAggBygCnAEiAkwNACAQEJAGIAggAmtBAXRqIA4QkAZqIAcoApwBakEBaiESDAELIBAQkAYgDhCQBmogBygCnAFqQQJqIRILIAdBMGohAgJAIBJB5QBJDQAgESASENYEEOgJIBEQjgsiAkUNAQsgAiAHQSRqIAdBIGogAxCeBSAMIAwgCGogDSAJIAdByAFqIAcsAMcBIAcsAMYBIA8gDiAQIAcoApwBEIwMIAEgAiAHKAIkIAcoAiAgAyAEENsJIQggERDqCRogEBCgERogDhCgERogDxCgERogB0HMAWoQtA0aIAsQ6gkaIAoQ6gkaIAdBwANqJAAgCA8LEJgRAAsKACAAEI0MQQFzC8YDAQF/IwBBEGsiCiQAAkACQCAARQ0AIAIQqwshAgJAAkAgAUUNACAKQQRqIAIQrAsgAyAKKAIENgAAIApBBGogAhCtCyAIIApBBGoQgQYaIApBBGoQoBEaDAELIApBBGogAhCODCADIAooAgQ2AAAgCkEEaiACEK4LIAggCkEEahCBBhogCkEEahCgERoLIAQgAhCvCzoAACAFIAIQsAs6AAAgCkEEaiACELELIAYgCkEEahCBBhogCkEEahCgERogCkEEaiACELILIAcgCkEEahCBBhogCkEEahCgERogAhCzCyECDAELIAIQtAshAgJAAkAgAUUNACAKQQRqIAIQtQsgAyAKKAIENgAAIApBBGogAhC2CyAIIApBBGoQgQYaIApBBGoQoBEaDAELIApBBGogAhCPDCADIAooAgQ2AAAgCkEEaiACELcLIAggCkEEahCBBhogCkEEahCgERoLIAQgAhC4CzoAACAFIAIQuQs6AAAgCkEEaiACELoLIAYgCkEEahCBBhogCkEEahCgERogCkEEaiACELsLIAcgCkEEahCBBhogCkEEahCgERogAhC8CyECCyAJIAI2AgAgCkEQaiQAC58GAQp/IwBBEGsiDyQAIAIgADYCACADQYAEcSEQQQAhEQNAAkAgEUEERw0AAkAgDRCQBkEBTQ0AIA8gDRCQDDYCDCACIA9BDGpBARCRDCANEJIMIAIoAgAQkww2AgALAkAgA0GwAXEiEkEQRg0AAkAgEkEgRw0AIAIoAgAhAAsgASAANgIACyAPQRBqJAAPCwJAAkACQAJAAkACQCAIIBFqLQAADgUAAQMCBAULIAEgAigCADYCAAwECyABIAIoAgA2AgAgBkEgEIsHIRIgAiACKAIAIhNBAWo2AgAgEyASOgAADAMLIA0Q7wgNAiANQQAQ7ggtAAAhEiACIAIoAgAiE0EBajYCACATIBI6AAAMAgsgDBDvCCESIBBFDQEgEg0BIAIgDBCQDCAMEJIMIAIoAgAQkww2AgAMAQsgAigCACEUIAQgB2oiBCES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IABB0JcFQQhqNgIAIAALFAAgACABEPYPIgFBCGoQ9w8aIAELCwAgACABNgIAIAALCgAgACABEPgPGgtnAQJ/IwBBEGsiAiQAAkAgABD5DyABTw0AIAAQ+g8ACyACQQhqIAAQ+w8gARD8DyAAIAIoAggiATYCBCAAIAE2AgAgAigCDCEDIAAQ/Q8gASADQQJ0ajYCACAAQQAQ/g8gAkEQaiQAC14BA38jAEEQayICJAAgAkEEaiAAIAEQ/w8iAygCBCEBIAMoAgghBANAAkAgASAERw0AIAMQgBAaIAJBEGokAA8LIAAQ+w8gARCBEBCCECADIAFBBGoiATYCBAwACwALCQAgAEEBOgAACxAAIAAoAgQgACgCAGtBAnULDAAgACAAKAIAEJkQCzMAIAAgABCJECAAEIkQIAAQihBBAnRqIAAQiRAgAUECdGogABCJECAAEPkMQQJ0ahCLEAtKAQF/IwBBIGsiASQAIAFBADYCECABQYkBNgIMIAEgASkCDDcDACAAIAFBFGogASAAELYNELcNIAAoAgQhACABQSBqJAAgAEF/agt4AQJ/IwBBEGsiAyQAIAEQmg0gA0EMaiABEJ4NIQQCQCAAQQhqIgEQ+QwgAksNACABIAJBAWoQoQ0LAkAgASACEJkNKAIARQ0AIAEgAhCZDSgCABCiDRoLIAQQow0hACABIAIQmQ0gADYCACAEEJ8NGiADQRBqJAALFwAgACABELMMIgFB/PcEQQhqNgIAIAELFwAgACABELMMIgFBnPgEQQhqNgIAIAELGgAgACABELMMEM8NIgFB4O8EQQhqNgIAIAELGgAgACABELMMEOMNIgFB9PAEQQhqNgIAIAELGgAgACABELMMEOMNIgFBiPIEQQhqNgIAIAELGgAgACABELMMEOMNIgFB8PMEQQhqNgIAIAELGgAgACABELMMEOMNIgFB/PIEQQhqNgIAIAELGgAgACABELMMEOMNIgFB5PQEQQhqNgIAIAELFwAgACABELMMIgFBvPgEQQhqNgIAIAELFwAgACABELMMIgFBsPoEQQhqNgIAIAELFwAgACABELMMIgFBhPwEQQhqNgIAIAELFwAgACABELMMIgFB7P0EQQhqNgIAIAELGgAgACABELMMENIQIgFBxIUFQQhqNgIAIAELGgAgACABELMMENIQIgFB2IYFQQhq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CyADCx0AAkAgAUH/AEsNABDFDSABQQJ0aigCACEBCyABCwgAEMAIKAIAC0UBAX8CQANAIAEgAkYNAQJAIAEoAgAiA0H/AEsNABDFDSABKAIAQQJ0aigCACEDCyABIAM2AgAgAUEEaiEBDAALAAsgAgsdAAJAIAFB/wBLDQAQyA0gAUECdGooAgAhAQsgAQsIABDBCCgCAAtFAQF/AkADQCABIAJGDQECQCABKAIAIgNB/wBLDQAQyA0gASgCAEECdGooAgAhAwsgASADNgIAIAFBBGohAQwACwALIAILBAAgAQssAAJAA0AgASACRg0BIAMgASwAADYCACADQQRqIQMgAUEBaiEBDAALAAsgAgsOACABIAIgAUGAAUkbwAs5AQF/AkADQCABIAJGDQEgBCABKAIAIgUgAyAFQYABSRs6AAAgBEEBaiEEIAFBBGohAQwACwALIAILOAAgACADELMMEM8NIgMgAjoADCADIAE2AgggA0H44wRBCGo2AgACQCABDQAgA0Gw5AQ2AggLIAMLBAAgAAszAQF/IABB+OMEQQhqNgIAAkAgACgCCCIBRQ0AIAAtAAxB/wFxRQ0AIAEQkxELIAAQ1QgLDQAgABDQDRogABCSEQsdAAJAIAFBAEgNABDFDSABQQJ0aigCACEBCyABwAtEAQF/AkADQCABIAJGDQECQCABLAAAIgNBAEgNABDFDSABLAAAQQJ0aigCACEDCyABIAM6AAAgAUEBaiEBDAALAAsgAgsdAAJAIAFBAEgNABDIDSABQQJ0aigCACEBCyABwAtEAQF/AkADQCABIAJGDQECQCABLAAAIgNBAEgNABDIDSABLAAAQQJ0aigCACEDCyABIAM6AAAgAUEBaiEBDAALAAsgAgsEACABCywAAkADQCABIAJGDQEgAyABLQAAOgAAIANBAWohAyABQQFqIQEMAAsACyACCwwAIAIgASABQQBIGws4AQF/AkADQCABIAJGDQEgBCADIAEsAAAiBSAFQQBIGzoAACAEQQFqIQQgAUEBaiEBDAALAAsgAgsNACAAENUIGiAAEJIRCxIAIAQgAjYCACAHIAU2AgBBAwsSACAEIAI2AgAgByAFNgIAQQMLCwAgBCACNgIAQQMLBABBAQsEAEEBCzkBAX8jAEEQayIFJAAgBSAENgIMIAUgAyACazYCCCAFQQxq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AgwCQCAAIAFGDQADQCACIAFBfGoiATYCCCAAIAFPDQEgAkEMaiACQQhqEJcPIAIgAigCDEEEaiIANgIMIAIoAgghAQwACwALIAJBEGokAAsPACAAKAIAIAEoAgAQmA8LCQAgACABEJkPCxwBAX8gACgCACECIAAgASgCADYCACABIAI2AgALCgAgABCICxCbDwsEACAACw0AIAAgASACIAMQnQ8LaQEBfyMAQSBrIgQkACAEQRhqIAEgAhCeDyAEQRBqIARBDGogBCgCGCAEKAIcIAMQnw8QoA8gBCABIAQoAhAQoQ82AgwgBCADIAQoAhQQog82AgggACAEQQxqIARBCGoQow8gBEEgaiQACwsAIAAgASACEKQPCwcAIAAQpQ8LawEBfyMAQRBrIgUkACAFIAI2AgggBSAENgIMAkADQCACIANGDQEgAiwAACEEIAVBDGoQwAUgBBDBBRogBSACQQFqIgI2AgggBUEMahDCBRoMAAsACyAAIAVBCGogBUEMahCjDyAFQRBqJAALCQAgACABEKcPCwkAIAAgARCoDwsMACAAIAEgAhCmDxoLOAEBfyMAQRBrIgMkACADIAEQpwY2AgwgAyACEKcGNgIIIAAgA0EMaiADQQhqEKkPGiADQRBqJAALBAAgAAsYACAAIAEoAgA2AgAgACACKAIANgIEIAALCQAgACABEKoGCwQAIAELGAAgACABKAIANgIAIAAgAigCADYCBCAACw0AIAAgASACIAMQqw8LaQEBfyMAQSBrIgQkACAEQRhqIAEgAhCsDyAEQRBqIARBDGogBCgCGCAEKAIcIAMQrQ8Qrg8gBCABIAQoAhAQrw82AgwgBCADIAQoAhQQsA82AgggACAEQQxqIARBCGoQsQ8gBEEgaiQACwsAIAAgASACELIPCwcAIAAQsw8LawEBfyMAQRBrIgUkACAFIAI2AgggBSAENgIMAkADQCACIANGDQEgAigCACEEIAVBDGoQ+QUgBBD6BRogBSACQQRqIgI2AgggBUEMahD7BRoMAAsACyAAIAVBCGogBUEMahCxDyAFQRBqJAALCQAgACABELUPCwkAIAAgARC2DwsMACAAIAEgAhC0DxoLOAEBfyMAQRBrIgMkACADIAEQwAY2AgwgAyACEMAGNgIIIAAgA0EMaiADQQhqELcPGiADQRBqJAALBAAgAAsYACAAIAEoAgA2AgAgACACKAIANgIEIAALCQAgACABEMMGCwQAIAELGAAgACABKAIANgIAIAAgAigCADYCBCAACwQAIAALBAAgAAtaAQF/IwBBEGsiAyQAIAMgATYCCCADIAA2AgwgAyACNgIEQQAhAQJAIANBA2ogA0EEaiADQQxqELsPDQAgA0ECaiADQQRqIANBCGoQuw8hAQsgA0EQaiQAIAELDQAgASgCACACKAIASQsHACAAEL8PCw4AIAAgAiABIABrEL4PCwwAIAAgASACEKAIRQsnAQF/IwBBEGsiASQAIAEgADYCDCABQQxqEMAPIQAgAUEQaiQAIAALBwAgABDBDwsKACAAKAIAEMIPCyoBAX8jAEEQayIBJAAgASAANgIMIAFBDGoQvgsQhAYhACABQRBqJAAgAAsRACAAIAAoAgAgAWo2AgAgAAuLAgEDfyMAQRBrIgckAAJAIAAQ9Q4iCCABayACSQ0AIAAQ9wkhCQJAIAhBAXZBcGogAU0NACAHIAFBAXQ2AgwgByACIAFqNgIEIAdBBGogB0EMahCTBygCABD3DkEBaiEICyAHQQRqIAAQ6gsgCBD4DiAHKAIEIgggBygCCBD5DgJAIARFDQAgCBDSBiAJENIGIAQQ0QUaCwJAIAMgBSAEaiICRg0AIAgQ0gYgBEECdCIEaiAGQQJ0aiAJENIGIARqIAVBAnRqIAMgAmsQ0QUaCwJAIAFBAWoiAUECRg0AIAAQ6gsgCSABEIkPCyAAIAgQ+g4gACAHKAIIEPsOIAdBEGokAA8LIAAQ/A4ACwoAIAEgAGtBAnULWgEBfyMAQRBrIgMkACADIAE2AgggAyAANgIMIAMgAjYCBEEAIQECQCADQQNqIANBBGogA0EMahDJDw0AIANBAmogA0EEaiADQQhqEMkPIQELIANBEGokACABCwwAIAAQ7g4gAhDKDwsSACAAIAEgAiABIAIQ5gsQyw8LDQAgASgCACACKAIASQsEACAAC7gBAQJ/IwBBEGsiBCQAAkAgABD1DiADSQ0AAkACQCADEPYORQ0AIAAgAxDkCyAAEOMLIQUMAQsgBEEIaiAAEOoLIAMQ9w5BAWoQ+A4gBCgCCCIFIAQoAgwQ+Q4gACAFEPoOIAAgBCgCDBD7DiAAIAMQ4gsLAkADQCABIAJGDQEgBSABEOELIAVBBGohBSABQQRqIQEMAAsACyAEQQA2AgQgBSAEQQRqEOELIARBEGokAA8LIAAQ/A4ACwcAIAAQzw8LEQAgACACIAEgAGtBAnUQzg8LDwAgACABIAJBAnQQoAhFCycBAX8jAEEQayIBJAAgASAANgIMIAFBDGoQ0A8hACABQRBqJAAgAAsHACAAENEPCwoAIAAoAgAQ0g8LKgEBfyMAQRBrIgEkACABIAA2AgwgAUEMahCADBDSBiEAIAFBEGokACAACxQAIAAgACgCACABQQJ0ajYCACAACwkAIAAgARDVDwsOACABEOoLGiAAEOoLGgsNACAAIAEgAiADENcPC2kBAX8jAEEgayIEJAAgBEEYaiABIAIQ2A8gBEEQaiAEQQxqIAQoAhggBCgCHCADEKcGEKgGIAQgASAEKAIQENkPNgIMIAQgAyAEKAIUEKoGNgIIIAAgBEEMaiAEQQhqENoPIARBIGokAAsLACAAIAEgAhDbDwsJACAAIAEQ3Q8LDAAgACABIAIQ3A8aCzgBAX8jAEEQayIDJAAgAyABEN4PNgIMIAMgAhDeDzYCCCAAIANBDGogA0EIahCzBhogA0EQaiQACxgAIAAgASgCADYCACAAIAIoAgA2AgQgAAsJACAAIAEQ4w8LBwAgABDfDwsnAQF/IwBBEGsiASQAIAEgADYCDCABQQxqEOAPIQAgAUEQaiQAIAALBwAgABDhDwsKACAAKAIAEOIPCyoBAX8jAEEQayIBJAAgASAANgIMIAFBDGoQwAsQtQYhACABQRBqJAAgAAsJACAAIAEQ5A8LMgEBfyMAQRBrIgIkACACIAA2AgwgAkEMaiABIAJBDGoQ4A9rEJEMIQAgAkEQaiQAIAALCwAgACABNgIAIAALDQAgACABIAIgAxDnDwtpAQF/IwBBIGsiBCQAIARBGGogASACEOgPIARBEGogBEEMaiAEKAIYIAQoAhwgAxDABhDBBiAEIAEgBCgCEBDpDzYCDCAEIAMgBCgCFBDDBjYCCCAAIARBDGogBEEIahDqDyAEQSBqJAALCwAgACABIAIQ6w8LCQAgACABEO0PCwwAIAAgASACEOwPGgs4AQF/IwBBEGsiAyQAIAMgARDuDzYCDCADIAIQ7g82AgggACADQQxqIANBCGoQzAYaIANBEGokAAsYACAAIAEoAgA2AgAgACACKAIANgIEIAALCQAgACABEPMPCwcAIAAQ7w8LJwEBfyMAQRBrIgEkACABIAA2AgwgAUEMahDwDyEAIAFBEGokACAACwcAIAAQ8Q8LCgAgACgCABDyDwsqAQF/IwBBEGsiASQAIAEgADYCDCABQQxqEIIMEM4GIQAgAUEQaiQAIAALCQAgACABEPQPCzUBAX8jAEEQayICJAAgAiAANgIMIAJBDGogASACQQxqEPAPa0ECdRCgDCEAIAJBEGokACAACwsAIAAgATYCACAACwsAIABBADYCACAACwcAIAAQgxALCwAgAEEAOgAAIAALPQEBfyMAQRBrIgEkACABIAAQhBAQhRA2AgwgARCwBTYCCCABQQxqIAFBCGoQmgYoAgAhACABQRBqJAAgAAsKAEHzgQQQ/QYACwoAIABBCGoQhxALGwAgASACQQAQhhAhASAAIAI2AgQgACABNgIACwoAIABBCGoQiBALMwAgACAAEIkQIAAQiRAgABCKEEECdGogABCJECAAEIoQQQJ0aiAAEIkQIAFBAnRqEIsQCyQAIAAgATYCACAAIAEoAgQiATYCBCAAIAEgAkECdGo2AgggAAsRACAAKAIAIAAoAgQ2AgQgAAsEACAACwgAIAEQmBAaCwsAIABBADoAeCAACwoAIABBCGoQjRALBwAgABCMEAtGAQF/IwBBEGsiAyQAAkACQCABQR5LDQAgAC0AeEH/AXENACAAQQE6AHgMAQsgA0EPahCPECABEJAQIQALIANBEGokACAACwoAIABBCGoQkxALBwAgABCUEAsKACAAKAIAEIEQCxMAIAAQlRAoAgAgACgCAGtBAnULAgALCABB/////wMLCgAgAEEIahCOEAsEACAACwcAIAAQkRALHQACQCAAEJIQIAFPDQAQgQcACyABQQJ0QQQQggcLBAAgAAsIABD8BkECdgsEACAACwQAIAALCgAgAEEIahCWEAsHACAAEJcQCwQAIAALCwAgAEEANgIAIAALNAEBfyAAKAIEIQICQANAIAIgAUYNASAAEPsPIAJBfGoiAhCBEBCaEAwACwALIAAgATYCBAsHACABEJsQCwcAIAAQnBALAgALYQECfyMAQRBrIgIkACACIAE2AgwCQCAAEPkPIgMgAUkNAAJAIAAQihAiASADQQF2Tw0AIAIgAUEBdDYCCCACQQhqIAJBDGoQkwcoAgAhAwsgAkEQaiQAIAMPCyAAEPoPAAs2ACAAIAAQiRAgABCJECAAEIoQQQJ0aiAAEIkQIAAQ+QxBAnRqIAAQiRAgABCKEEECdGoQixALCwAgACABIAIQoBALOQEBfyMAQRBrIgMkAAJAAkAgASAARw0AIAFBADoAeAwBCyADQQ9qEI8QIAEgAhChEAsgA0EQaiQACw4AIAEgAkECdEEEEOUGC4sBAQJ/IwBBEGsiBCQAQQAhBSAEQQA2AgwgAEEMaiAEQQxqIAMQphAaAkACQCABDQBBACEBDAELIARBBGogABCnECABEPwPIAQoAgghASAEKAIEIQULIAAgBTYCACAAIAUgAkECdGoiAzYCCCAAIAM2AgQgABCoECAFIAFBAnRqNgIAIARBEGokACAAC2IBAn8jAEEQayICJAAgAkEEaiAAQQhqIAEQqRAiASgCACEDAkADQCADIAEoAgRGDQEgABCnECABKAIAEIEQEIIQIAEgASgCAEEEaiIDNgIADAALAAsgARCqEBogAkEQaiQAC6gBAQV/IwBBEGsiAiQAIAAQnhAgABD7DyEDIAJBCGogACgCBBCrECEEIAJBBGogACgCABCrECEFIAIgASgCBBCrECEGIAIgAyAEKAIAIAUoAgAgBigCABCsEDYCDCABIAJBDGoQrRA2AgQgACABQQRqEK4QIABBBGogAUEIahCuECAAEP0PIAEQqBAQrhAgASABKAIENgIAIAAgABD5DBD+DyACQRBqJAALJgAgABCvEAJAIAAoAgBFDQAgABCnECAAKAIAIAAQsBAQnxALIAALFgAgACABEPYPIgFBBGogAhCxEBogAQsKACAAQQxqELIQCwoAIABBDGoQsxALKAEBfyABKAIAIQMgACABNgIIIAAgAzYCACAAIAMgAkECdGo2AgQgAAsRACAAKAIIIAAoAgA2AgAgAAsLACAAIAE2AgAgAAsLACABIAIgAxC1EAsHACAAKAIACxwBAX8gACgCACECIAAgASgCADYCACABIAI2AgALDAAgACAAKAIEEMkQCxMAIAAQyhAoAgAgACgCAGtBAnULCwAgACABNgIAIAALCgAgAEEEahC0EAsHACAAEJQQCwcAIAAoAgALKwEBfyMAQRBrIgMkACADQQhqIAAgASACELYQIAMoAgwhAiADQRBqJAAgAgsNACAAIAEgAiADELcQCw0AIAAgASACIAMQuBALaQEBfyMAQSBrIgQkACAEQRhqIAEgAhC5ECAEQRBqIARBDGogBCgCGCAEKAIcIAMQuhAQuxAgBCABIAQoAhAQvBA2AgwgBCADIAQoAhQQvRA2AgggACAEQQxqIARBCGoQvhAgBEEgaiQACwsAIAAgASACEL8QCwcAIAAQxBALfQEBfyMAQRBrIgUkACAFIAM2AgggBSACNgIMIAUgBDYCBAJAA0AgBUEMaiAFQQhqEMAQRQ0BIAVBDGoQwRAoAgAhAyAFQQRqEMIQIAM2AgAgBUEMahDDEBogBUEEahDDEBoMAAsACyAAIAVBDGogBUEEahC+ECAFQRBqJAALCQAgACABEMYQCwkAIAAgARDHEAsMACAAIAEgAhDFEBoLOAEBfyMAQRBrIgMkACADIAEQuhA2AgwgAyACELoQNgIIIAAgA0EMaiADQQhqEMUQGiADQRBqJAALDQAgABCtECABEK0QRwsKABDIECAAEMIQCwoAIAAoAgBBfGoLEQAgACAAKAIAQXxqNgIAIAALBAAgAAsYACAAIAEoAgA2AgAgACACKAIANgIEIAALCQAgACABEL0QCwQAIAELAgALCQAgACABEMsQCwoAIABBDGoQzBALNwECfwJAA0AgACgCCCABRg0BIAAQpxAhAiAAIAAoAghBfGoiAzYCCCACIAMQgRAQmhAMAAsACwsHACAAEJcQCwcAIAAQvwgLYQEBfyMAQRBrIgIkACACIAA2AgwCQCAAIAFGDQADQCACIAFBfGoiATYCCCAAIAFPDQEgAkEMaiACQQhqEM8QIAIgAigCDEEEaiIANgIMIAIoAgghAQwACwALIAJBEGokAAsPACAAKAIAIAEoAgAQ0BALCQAgACABEIYGCzQBAX8jAEEQayIDJAAgACACEOkLIANBADYCDCABIAJBAnRqIANBDGoQ4QsgA0EQaiQAIAALBAAgAAsEACAACwQAIAALBAAgAAsEACAACxAAIABBiJcFQQhqNgIAIAALEAAgAEGslwVBCGo2AgAgAAsMACAAEJYJNgIAIAALBAAgAAsOACAAIAEoAgA2AgAgAAsIACAAEKINGgsEACAACwkAIAAgARDgEAsHACAAEOEQCwsAIAAgATYCACAACw0AIAAoAgAQ4hAQ4xALBwAgABDlEAsHACAAEOQQCzwBAn8gACgCACAAKAIIIgFBAXVqIQIgACgCBCEAAkAgAUEBcUUNACACKAIAIABqKAIAIQALIAIgABEEAAsHACAAKAIACxYAIAAgARDpECIBQQRqIAIQmwcaIAELBwAgABDqEAsKACAAQQRqEJwHCw4AIAAgASgCADYCACAACwQAIAALCgAgASAAa0EMbQsLACAAIAEgAhDMCAsFABDuEAsIAEGAgICAeAsFABDxEAsFABDyEAsNAEKAgICAgICAgIB/Cw0AQv///////////wALCwAgACABIAIQyQgLBQAQ9RALBgBB//8DCwUAEPcQCwQAQn8LDAAgACABEJYJENEICwwAIAAgARCWCRDSCAs9AgF/AX4jAEEQayIDJAAgAyABIAIQlgkQ0wggAykDACEEIAAgA0EIaikDADcDCCAAIAQ3AwAgA0EQaiQACwoAIAEgAGtBDG0LDgAgACABKAIANgIAIAALBAAgAAsEACAACw4AIAAgASgCADYCACAACwcAIAAQghELCgAgAEEEahCcBwsEACAACwQAIAALDgAgACABKAIANgIAIAALBAAgAAsEACAACwQAIAALAwAACwcAIAAQ7AQLBwAgABDtBAttAEGw0gUQiREaAkADQCAAKAIAQQFHDQFByNIFQbDSBRCMERoMAAsACwJAIAAoAgANACAAEI0RQbDSBRCKERogASACEQQAQbDSBRCJERogABCOEUGw0gUQihEaQcjSBRCPERoPC0Gw0gUQihEaCwkAIAAgARDuBAsJACAAQQE2AgALCQAgAEF/NgIACwcAIAAQ7wQLRQECfyMAQRBrIgIkAEEAIQMCQCAAQQNxDQAgASAAcA0AIAJBDGogACABENwEIQBBACACKAIMIAAbIQMLIAJBEGokACADCzYBAX8gAEEBIABBAUsbIQECQANAIAEQ1gQiAA0BAkAQwxEiAEUNACAAEQcADAELCxARAAsgAAsHACAAENgECwcAIAAQkhELPwECfyABQQQgAUEESxshAiAAQQEgAEEBSxshAAJAA0AgAiAAEJURIgMNARDDESIBRQ0BIAERBwAMAAsACyADCyEBAX8gACAAIAFqQX9qQQAgAGtxIgIgASACIAFLGxCQEQsHACAAEJcRCwcAIAAQ2AQLBQAQEQALEAAgAEHsngVBCGo2AgAgAAs8AQJ/IAEQ0gQi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IAAgARDiCwsgBBDSBiABIAIQrxEaIANBADYCBCAEIAFBAnRqIANBBGoQ4QsgA0EQaiQADwsgABD8DgALxQEBA38jAEEQayICJAAgAiABNgIMAkACQCAAELMKIgMNAEEBIQQgABC1CiEBDAELIAAQiw9Bf2ohBCAAELQKIQELAkACQAJAIAEgBEcNACAAIARBASAEIARBAEEAEOgLIAAQ9wkaDAELIAAQ9wkaIAMNACAAEOMLIQQgACABQQFqEOQLDAELIAAQ4AshBCAAIAFBAWoQ4gsLIAQgAUECdGoiACACQQxqEOELIAJBADYCCCAAQQRqIAJBCGoQ4QsgAkEQaiQACwQAIAALKgACQANAIAFFDQEgACACLQAAOgAAIAFBf2ohASAAQQFqIQAMAAsACyAACyoAAkADQCABRQ0BIAAgAigCADYCACABQX9qIQEgAEEEaiEADAALAAsgAAsJACAAIAEQvBELcgECfwJAAkAgASgCTCICQQBIDQAgAkUNASACQf////8DcRDMBCgCGEcNAQsCQCAAQf8BcSICIAEoAlBGDQAgASgCFCIDIAEoAhBGDQAgASADQQFqNgIUIAMgADoAACACDwsgASACELAHDwsgACABEL0RC3UBA38CQCABQcwAaiICEL4RRQ0AIAEQ9AQaCwJAAkAgAEH/AXEiAyABKAJQRg0AIAEoAhQiBCABKAIQRg0AIAEgBEEBajYCFCAEIAA6AAAMAQsgASADELAHIQMLAkAgAhC/EUGAgICABHFFDQAgAhDAEQsgAwsbAQF/IAAgACgCACIBQf////8DIAEbNgIAIAELFAEBfyAAKAIAIQEgAEEANgIAIAELCgAgAEEBEOsEGgs+AQJ/IwBBEGsiAiQAQciLBEELQQFBACgCqL4EIgMQ+wQaIAIgATYCDCADIAAgARCxCBpBCiADELsRGhARAAsHACAAKAIACwkAQfjSBRDCEQsEAEEACw8AIABB0ABqENYEQdAAagsMAEGqiwRBABDBEQALBwAgABD6EQsCAAsCAAsKACAAEMcREJIRCwoAIAAQxxEQkhELCgAgABDHERCSEQsKACAAEMcREJIRCwoAIAAQxxEQkhELCwAgACABQQAQ0BELMAACQCACDQAgACgCBCABKAIERg8LAkAgACABRw0AQQEPCyAAENERIAEQ0REQmwhFCwcA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c2RheQBXZWRuZXNkYXkAU2F0dXJkYXkAU3VuZGF5AE1vbmRheQBGcmlkYXkATWF5ACVtLyVkLyV5AC0rICAgMFgweAAtMFgrMFggMFgtMHgrMHggMHgATm92AFRodQB1bnN1cHBvcnRlZCBsb2NhbGUgZm9yIHN0YW5kYXJkIGlucHV0AEF1Z3VzdAB1bnNpZ25lZCBzaG9ydAB1bnNpZ25lZCBpbnQAaW5pdABPY3QAZmxvYXQAU2F0AHVpbnQ2NF90AEFwcgB2ZWN0b3IAcmVuZGVyAE9jdG9iZXIATm92ZW1iZXIAU2VwdGVtYmVyAERlY2VtYmVyAHVuc2lnbmVkIGNoYXIAaW9zX2Jhc2U6OmNsZWFyAE1hcgBTZXAAJUk6JU06JVMgJXAAU3VuAEp1bgBzdGQ6OmV4Y2VwdGlvbgBNb24AbmFuAEphbgBKdWwAYm9vbABzdGQ6OmJhZF9mdW5jdGlvbl9jYWxsAEFwcmlsAHNldHRBdHRhY2sARnJpAFN5bnRoAGJhZF9hcnJheV9uZXdfbGVuZ3RoAE1hcmNoAEF1ZwB1bnNpZ25lZCBsb25nAHN0YXJ0UGxheWluZwBzdG9wUGxheWluZwBzdGQ6OndzdHJpbmcAYmFzaWNfc3RyaW5nAHN0ZDo6c3RyaW5nAHN0ZDo6dTE2c3RyaW5nAHN0ZDo6dTMyc3RyaW5nAGluZgAlLjBMZgAlTGYAdHJ1ZQBUdWUAZmFsc2UAU3ludGhCYXNlAEp1bmUAZG91YmxlAHJlY29yZAB2b2lkAFdlZABzdGQ6OmJhZF9hbGxvYwBEZWMARmViAFBMQVkAJWEgJWIgJWQgJUg6JU06JVMgJVkAUE9TSVgASU5JVAAlSDolTTolUwBTVE9QAE5BTgBQTQBBTQBMQ19BTEwARU5EIFJFQ09SRElORwBMQU5HAElORgBDAGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHNob3J0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBzaG9ydD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBpbnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGZsb2F0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ4X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQxNl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQxNl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50NjRfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50NjRfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDMyX3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDMyX3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGNoYXI+AHN0ZDo6YmFzaWNfc3RyaW5nPHVuc2lnbmVkIGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHNpZ25lZCBjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxsb25nPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBsb25nPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxkb3VibGU+AEMuVVRGLTgALgAobnVsbCkAUHVyZSB2aXJ0dWFsIGZ1bmN0aW9uIGNhbGxlZCEAbGliYysrYWJpOiAAYnVmZmVyU2l6ZTogADEyU3ludGhXcmFwcGVyADVTeW50aAAAUE4BAPAFAQB4TgEA4QUBAPgFAQBQMTJTeW50aFdyYXBwZXIAME8BAAwGAQAAAAAAAAYBAFBLMTJTeW50aFdyYXBwZXIAAAAAME8BACwGAQABAAAAAAYBAGlpAHZpAAAAHAYBAAAAAABwBgEAGAAAADRTaW5lAAAAUE4BAGgGAQAAAAAAkAYBABkAAAA4R3JhaW5FbnYAAAB4TgEAhAYBAHAGAQAAAAAAQAcBABoAAAAbAAAAHAAAAB0AAAAeAAAAHwAAACAAAAAhAAAAIgAAAE5TdDNfXzIxMF9fZnVuY3Rpb242X19mdW5jSU44RW52ZWxvcGU3b25FbmRlZE1VbHZFX0VOU185YWxsb2NhdG9ySVM0X0VFRnZ2RUVFAE5TdDNfXzIxMF9fZnVuY3Rpb242X19iYXNlSUZ2dkVFRQBQTgEAFgcBAHhOAQDIBgEAOAcBAAAAAAA4BwEAIwAAACQAAAAlAAAAJQAAACUAAAAlAAAAJQAAACUAAAAlAAAATjhFbnZlbG9wZTdvbkVuZGVkTVVsdkVfRQAAAFBOAQB4BwEAAAAAAIxNAQAcBgEAEE4BABBOAQDsTQEAdmlpaWlpAFA1U3ludGgAADBPAQC7BwEAAAAAAPgFAQBQSzVTeW50aAAAAAAwTwEA1AcBAAEAAAD4BQEAdgAAAMQHAQAAAAAAAAAAAIxNAQDEBwEA7E0BAOxNAQA0TgEAdmlpaWlmAACMTQEAxAcBAHZpaQCMTQEAxAcBALxNAQB2aWlpAAAAAIxNAQDEBwEANE4BAHZpaWYAAAAAAAAAANAIAQApAAAAKgAAACsAAAAsAAAALQAAAC4AAAAvAAAAMAAAADEAAABOU3QzX18yMTBfX2Z1bmN0aW9uNl9fZnVuY0laTjVWb2ljZTRpbml0RWlpZlA1U3ludGhFMyRfME5TXzlhbGxvY2F0b3JJUzVfRUVGdnZFRUUAAAB4TgEAfAgBADgHAQBaTjVWb2ljZTRpbml0RWlpZlA1U3ludGhFMyRfMAAAAFBOAQDcCAEATlN0M19fMjEyYmFzaWNfc3RyaW5nSWNOU18xMWNoYXJfdHJhaXRzSWNFRU5TXzlhbGxvY2F0b3JJY0VFRUUAAFBOAQAECQEATlN0M19fMjEyYmFzaWNfc3RyaW5nSWhOU18xMWNoYXJfdHJhaXRzSWhFRU5TXzlhbGxvY2F0b3JJaEVFRUUAAFBOAQBMCQEATlN0M19fMjEyYmFzaWNfc3RyaW5nSXdOU18xMWNoYXJfdHJhaXRzSXdFRU5TXzlhbGxvY2F0b3JJd0VFRUUAAFBOAQCUCQEATlN0M19fMjEyYmFzaWNfc3RyaW5nSURzTlNfMTFjaGFyX3RyYWl0c0lEc0VFTlNfOWFsbG9jYXRvcklEc0VFRUUAAABQTgEA3AkBAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0lEaU5TXzExY2hhcl90cmFpdHNJRGlFRU5TXzlhbGxvY2F0b3JJRGlFRUVFAAAAUE4BACgKAQBOMTBlbXNjcmlwdGVuM3ZhbEUAAFBOAQB0CgEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJY0VFAABQTgEAkAoB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wA4AAMAPAADAEAAAwBEAAMASAADAEwAAwBQAAMAVAADAFgAAwBcAAMAYAADAGQAAwBoAAMAbAADAHAAAwB0AAMAeAADAHwAAwAAAALMBAADDAgAAwwMAAMMEAADDBQAAwwYAAMMHAADDCAAAwwkAAMMKAADDCwAAwwwAAMMNAADTDgAAww8AAMMAAAy7AQAMwwIADMMDAAzDBAAM2wAAAADEIAEANQAAAG8AAABwAAAAOAAAADkAAAA6AAAAOwAAADwAAAA9AAAAcQAAAHIAAABzAAAAQQAAAEIAAABOU3QzX18yMTBfX3N0ZGluYnVmSWNFRQB4TgEArCABAEgdAQAAAAAALCEBADUAAAB0AAAAdQAAADgAAAA5AAAAOgAAAHYAAAA8AAAAPQAAAD4AAAA/AAAAQAAAAHcAAAB4AAAATlN0M19fMjExX19zdGRvdXRidWZJY0VFAAAAAHhOAQAQIQEASB0BAAAAAACQIQEASwAAAHkAAAB6AAAATgAAAE8AAABQAAAAUQAAAFIAAABTAAAAewAAAHwAAAB9AAAAVwAAAFgAAABOU3QzX18yMTBfX3N0ZGluYnVmSXdFRQB4TgEAeCEBAFweAQAAAAAA+CEBAEsAAAB+AAAAfwAAAE4AAABPAAAAUAAAAIAAAABSAAAAUwAAAFQAAABVAAAAVgAAAIEAAACCAAAATlN0M19fMjExX19zdGRvdXRidWZJd0VFAAAAAHhOAQDcIQEAXB4BAAAAAAAAAAAAAAAAANF0ngBXnb0qgHBSD///PicKAAAAZAAAAOgDAAAQJwAAoIYBAEBCDwCAlpgAAOH1BRgAAAA1AAAAcQAAAGv////O+///kr///wAAAAAAAAAA/////////////////////////////////////////////////////////////////wABAgMEBQYHCAn/////////CgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiP///////8KCwwNDg8QERITFBUWFxgZGhscHR4fICEiI///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADALQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAIAAAADAAAABAAAAAUAAAAGAAAABwAA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';
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

  var ENV = {
  };
  
  var getExecutableName = () => {
      return thisProgram || './this.program';
    };
  var getEnvStrings = () => {
      if (!getEnvStrings.strings) {
        // Default values.
        // Browser language detection #8751
        var lang = ((typeof navigator == 'object' && navigator.languages && navigator.languages[0]) || 'C').replace('-', '_') + '.UTF-8';
        var env = {
          'USER': 'web_user',
          'LOGNAME': 'web_user',
          'PATH': '/',
          'PWD': '/',
          'HOME': '/home/web_user',
          'LANG': lang,
          '_': getExecutableName()
        };
        // Apply the user-provided values, if any.
        for (var x in ENV) {
          // x is a key in ENV; if ENV[x] is undefined, that means it was
          // explicitly set to be so. We allow user code to do that to
          // force variables with default values to remain unset.
          if (ENV[x] === undefined) delete env[x];
          else env[x] = ENV[x];
        }
        var strings = [];
        for (var x in env) {
          strings.push(`${x}=${env[x]}`);
        }
        getEnvStrings.strings = strings;
      }
      return getEnvStrings.strings;
    };
  
  var stringToAscii = (str, buffer) => {
      for (var i = 0; i < str.length; ++i) {
        assert(str.charCodeAt(i) === (str.charCodeAt(i) & 0xff));
        HEAP8[buffer++] = str.charCodeAt(i);
      }
      // Null-terminate the string
      HEAP8[buffer] = 0;
    };
  var _environ_get = (__environ, environ_buf) => {
      var bufSize = 0;
      getEnvStrings().forEach((string, i) => {
        var ptr = environ_buf + bufSize;
        HEAPU32[(((__environ)+(i*4))>>2)] = ptr;
        stringToAscii(string, ptr);
        bufSize += string.length + 1;
      });
      return 0;
    };

  var _environ_sizes_get = (penviron_count, penviron_buf_size) => {
      var strings = getEnvStrings();
      HEAPU32[((penviron_count)>>2)] = strings.length;
      var bufSize = 0;
      strings.forEach((string) => bufSize += string.length + 1);
      HEAPU32[((penviron_buf_size)>>2)] = bufSize;
      return 0;
    };

  var PATH = {
  isAbs:(path) => path.charAt(0) === '/',
  splitPath:(filename) => {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },
  normalizeArray:(parts, allowAboveRoot) => {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up; up--) {
            parts.unshift('..');
          }
        }
        return parts;
      },
  normalize:(path) => {
        var isAbsolute = PATH.isAbs(path),
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter((p) => !!p), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },
  dirname:(path) => {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },
  basename:(path) => {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        path = PATH.normalize(path);
        path = path.replace(/\/$/, "");
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },
  join:(...paths) => PATH.normalize(paths.join('/')),
  join2:(l, r) => PATH.normalize(l + '/' + r),
  };
  
  var initRandomFill = () => {
      if (typeof crypto == 'object' && typeof crypto['getRandomValues'] == 'function') {
        // for modern web browsers
        return (view) => crypto.getRandomValues(view);
      } else
      // we couldn't find a proper implementation, as Math.random() is not suitable for /dev/random, see emscripten-core/emscripten/pull/7096
      abort('no cryptographic support found for randomDevice. consider polyfilling it if you want to use something insecure like Math.random(), e.g. put this in a --pre-js: var crypto = { getRandomValues: (array) => { for (var i = 0; i < array.length; i++) array[i] = (Math.random()*256)|0 } };');
    };
  var randomFill = (view) => {
      // Lazily init on the first invocation.
      return (randomFill = initRandomFill())(view);
    };
  
  
  
  var PATH_FS = {
  resolve:(...args) => {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? args[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path != 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            return ''; // an invalid portion invalidates the whole thing
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = PATH.isAbs(path);
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter((p) => !!p), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },
  relative:(from, to) => {
        from = PATH_FS.resolve(from).substr(1);
        to = PATH_FS.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      },
  };
  
  
  
  var FS_stdin_getChar_buffer = [];
  
  
  /** @type {function(string, boolean=, number=)} */
  function intArrayFromString(stringy, dontAddNull, length) {
    var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull) u8array.length = numBytesWritten;
    return u8array;
  }
  var FS_stdin_getChar = () => {
      if (!FS_stdin_getChar_buffer.length) {
        var result = null;
        if (typeof window != 'undefined' &&
          typeof window.prompt == 'function') {
          // Browser.
          result = window.prompt('Input: ');  // returns null on cancel
          if (result !== null) {
            result += '\n';
          }
        } else if (typeof readline == 'function') {
          // Command line.
          result = readline();
          if (result !== null) {
            result += '\n';
          }
        }
        if (!result) {
          return null;
        }
        FS_stdin_getChar_buffer = intArrayFromString(result, true);
      }
      return FS_stdin_getChar_buffer.shift();
    };
  var TTY = {
  ttys:[],
  init() {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process.stdin.setEncoding('utf8');
        // }
      },
  shutdown() {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process.stdin.pause();
        // }
      },
  register(dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },
  stream_ops:{
  open(stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(43);
          }
          stream.tty = tty;
          stream.seekable = false;
        },
  close(stream) {
          // flush any pending line data
          stream.tty.ops.fsync(stream.tty);
        },
  fsync(stream) {
          stream.tty.ops.fsync(stream.tty);
        },
  read(stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(60);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(29);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(6);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },
  write(stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(60);
          }
          try {
            for (var i = 0; i < length; i++) {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            }
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        },
  },
  default_tty_ops:{
  get_char(tty) {
          return FS_stdin_getChar();
        },
  put_char(tty, val) {
          if (val === null || val === 10) {
            out(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
          }
        },
  fsync(tty) {
          if (tty.output && tty.output.length > 0) {
            out(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        },
  ioctl_tcgets(tty) {
          // typical setting
          return {
            c_iflag: 25856,
            c_oflag: 5,
            c_cflag: 191,
            c_lflag: 35387,
            c_cc: [
              0x03, 0x1c, 0x7f, 0x15, 0x04, 0x00, 0x01, 0x00, 0x11, 0x13, 0x1a, 0x00,
              0x12, 0x0f, 0x17, 0x16, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
              0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            ]
          };
        },
  ioctl_tcsets(tty, optional_actions, data) {
          // currently just ignore
          return 0;
        },
  ioctl_tiocgwinsz(tty) {
          return [24, 80];
        },
  },
  default_tty1_ops:{
  put_char(tty, val) {
          if (val === null || val === 10) {
            err(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },
  fsync(tty) {
          if (tty.output && tty.output.length > 0) {
            err(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        },
  },
  };
  
  
  var zeroMemory = (address, size) => {
      HEAPU8.fill(0, address, address + size);
      return address;
    };
  
  var alignMemory = (size, alignment) => {
      assert(alignment, "alignment argument is required");
      return Math.ceil(size / alignment) * alignment;
    };
  var mmapAlloc = (size) => {
      abort('internal error: mmapAlloc called but `emscripten_builtin_memalign` native symbol not exported');
    };
  var MEMFS = {
  ops_table:null,
  mount(mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },
  createNode(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(63);
        }
        MEMFS.ops_table ||= {
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
        };
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.usedBytes = 0; // The actual number of bytes used in the typed array, as opposed to contents.length which gives the whole capacity.
          // When the byte data of the file is populated, this will point to either a typed array, or a normal JS array. Typed arrays are preferred
          // for performance, and used by default. However, typed arrays are not resizable like normal JS arrays are, so there is a small disk size
          // penalty involved for appending file writes that continuously grow a file similar to std::vector capacity vs used -scheme.
          node.contents = null; 
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
          parent.timestamp = node.timestamp;
        }
        return node;
      },
  getFileDataAsTypedArray(node) {
        if (!node.contents) return new Uint8Array(0);
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
        return new Uint8Array(node.contents);
      },
  expandFileStorage(node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
        // Don't expand strictly to the given requested limit if it's only a very small increase, but instead geometrically grow capacity.
        // For small filesizes (<1MB), perform size*2 geometric increase, but for large sizes, do a much more conservative size*1.125 increase to
        // avoid overshooting the allocation cap by a very large margin.
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) >>> 0);
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity); // Allocate new storage.
        if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copy old data over to the new storage.
      },
  resizeFileStorage(node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
          node.contents = null; // Fully decommit when requesting a resize to zero.
          node.usedBytes = 0;
        } else {
          var oldContents = node.contents;
          node.contents = new Uint8Array(newSize); // Allocate new storage.
          if (oldContents) {
            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
          }
          node.usedBytes = newSize;
        }
      },
  node_ops:{
  getattr(node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },
  setattr(node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },
  lookup(parent, name) {
          throw FS.genericErrors[44];
        },
  mknod(parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },
  rename(old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(55);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.parent.timestamp = Date.now()
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          new_dir.timestamp = old_node.parent.timestamp;
          old_node.parent = new_dir;
        },
  unlink(parent, name) {
          delete parent.contents[name];
          parent.timestamp = Date.now();
        },
  rmdir(parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(55);
          }
          delete parent.contents[name];
          parent.timestamp = Date.now();
        },
  readdir(node) {
          var entries = ['.', '..'];
          for (var key of Object.keys(node.contents)) {
            entries.push(key);
          }
          return entries;
        },
  symlink(parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },
  readlink(node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(28);
          }
          return node.link;
        },
  },
  stream_ops:{
  read(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else {
            for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
          }
          return size;
        },
  write(stream, buffer, offset, length, position, canOwn) {
          // The data buffer should be a typed array view
          assert(!(buffer instanceof ArrayBuffer));
  
          if (!length) return 0;
          var node = stream.node;
          node.timestamp = Date.now();
  
          if (buffer.subarray && (!node.contents || node.contents.subarray)) { // This write is from a typed array to a typed array?
            if (canOwn) {
              assert(position === 0, 'canOwn must imply no weird position inside the file');
              node.contents = buffer.subarray(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
              node.contents = buffer.slice(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (position + length <= node.usedBytes) { // Writing to an already allocated and used subrange of the file?
              node.contents.set(buffer.subarray(offset, offset + length), position);
              return length;
            }
          }
  
          // Appending to an existing file and we need to reallocate, or source data did not come as a typed array.
          MEMFS.expandFileStorage(node, position+length);
          if (node.contents.subarray && buffer.subarray) {
            // Use typed array write which is available.
            node.contents.set(buffer.subarray(offset, offset + length), position);
          } else {
            for (var i = 0; i < length; i++) {
             node.contents[position + i] = buffer[offset + i]; // Or fall back to manual write if not.
            }
          }
          node.usedBytes = Math.max(node.usedBytes, position + length);
          return length;
        },
  llseek(stream, offset, whence) {
          var position = offset;
          if (whence === 1) {
            position += stream.position;
          } else if (whence === 2) {
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(28);
          }
          return position;
        },
  allocate(stream, offset, length) {
          MEMFS.expandFileStorage(stream.node, offset + length);
          stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        },
  mmap(stream, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if (!(flags & 2) && contents.buffer === HEAP8.buffer) {
            // We can't emulate MAP_SHARED when the file is not backed by the
            // buffer we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = mmapAlloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(48);
            }
            HEAP8.set(contents, ptr);
          }
          return { ptr, allocated };
        },
  msync(stream, buffer, offset, length, mmapFlags) {
          MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
          // should we check if bytesWritten and length are the same?
          return 0;
        },
  },
  };
  
  /** @param {boolean=} noRunDep */
  var asyncLoad = (url, onload, onerror, noRunDep) => {
      var dep = !noRunDep ? getUniqueRunDependency(`al ${url}`) : '';
      readAsync(url, (arrayBuffer) => {
        assert(arrayBuffer, `Loading data file "${url}" failed (no arrayBuffer).`);
        onload(new Uint8Array(arrayBuffer));
        if (dep) removeRunDependency(dep);
      }, (event) => {
        if (onerror) {
          onerror();
        } else {
          throw `Loading data file "${url}" failed.`;
        }
      });
      if (dep) addRunDependency(dep);
    };
  
  
  var FS_createDataFile = (parent, name, fileData, canRead, canWrite, canOwn) => {
      FS.createDataFile(parent, name, fileData, canRead, canWrite, canOwn);
    };
  
  var preloadPlugins = Module['preloadPlugins'] || [];
  var FS_handledByPreloadPlugin = (byteArray, fullname, finish, onerror) => {
      // Ensure plugins are ready.
      if (typeof Browser != 'undefined') Browser.init();
  
      var handled = false;
      preloadPlugins.forEach((plugin) => {
        if (handled) return;
        if (plugin['canHandle'](fullname)) {
          plugin['handle'](byteArray, fullname, finish, onerror);
          handled = true;
        }
      });
      return handled;
    };
  var FS_createPreloadedFile = (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
      // TODO we should allow people to just pass in a complete filename instead
      // of parent and name being that we just join them anyways
      var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
      var dep = getUniqueRunDependency(`cp ${fullname}`); // might have several active requests for the same fullname
      function processData(byteArray) {
        function finish(byteArray) {
          preFinish?.();
          if (!dontCreateFile) {
            FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
          }
          onload?.();
          removeRunDependency(dep);
        }
        if (FS_handledByPreloadPlugin(byteArray, fullname, finish, () => {
          onerror?.();
          removeRunDependency(dep);
        })) {
          return;
        }
        finish(byteArray);
      }
      addRunDependency(dep);
      if (typeof url == 'string') {
        asyncLoad(url, processData, onerror);
      } else {
        processData(url);
      }
    };
  
  var FS_modeStringToFlags = (str) => {
      var flagModes = {
        'r': 0,
        'r+': 2,
        'w': 512 | 64 | 1,
        'w+': 512 | 64 | 2,
        'a': 1024 | 64 | 1,
        'a+': 1024 | 64 | 2,
      };
      var flags = flagModes[str];
      if (typeof flags == 'undefined') {
        throw new Error(`Unknown file open mode: ${str}`);
      }
      return flags;
    };
  
  var FS_getMode = (canRead, canWrite) => {
      var mode = 0;
      if (canRead) mode |= 292 | 73;
      if (canWrite) mode |= 146;
      return mode;
    };
  
  
  
  
  var ERRNO_MESSAGES = {
  0:"Success",
  1:"Arg list too long",
  2:"Permission denied",
  3:"Address already in use",
  4:"Address not available",
  5:"Address family not supported by protocol family",
  6:"No more processes",
  7:"Socket already connected",
  8:"Bad file number",
  9:"Trying to read unreadable message",
  10:"Mount device busy",
  11:"Operation canceled",
  12:"No children",
  13:"Connection aborted",
  14:"Connection refused",
  15:"Connection reset by peer",
  16:"File locking deadlock error",
  17:"Destination address required",
  18:"Math arg out of domain of func",
  19:"Quota exceeded",
  20:"File exists",
  21:"Bad address",
  22:"File too large",
  23:"Host is unreachable",
  24:"Identifier removed",
  25:"Illegal byte sequence",
  26:"Connection already in progress",
  27:"Interrupted system call",
  28:"Invalid argument",
  29:"I/O error",
  30:"Socket is already connected",
  31:"Is a directory",
  32:"Too many symbolic links",
  33:"Too many open files",
  34:"Too many links",
  35:"Message too long",
  36:"Multihop attempted",
  37:"File or path name too long",
  38:"Network interface is not configured",
  39:"Connection reset by network",
  40:"Network is unreachable",
  41:"Too many open files in system",
  42:"No buffer space available",
  43:"No such device",
  44:"No such file or directory",
  45:"Exec format error",
  46:"No record locks available",
  47:"The link has been severed",
  48:"Not enough core",
  49:"No message of desired type",
  50:"Protocol not available",
  51:"No space left on device",
  52:"Function not implemented",
  53:"Socket is not connected",
  54:"Not a directory",
  55:"Directory not empty",
  56:"State not recoverable",
  57:"Socket operation on non-socket",
  59:"Not a typewriter",
  60:"No such device or address",
  61:"Value too large for defined data type",
  62:"Previous owner died",
  63:"Not super-user",
  64:"Broken pipe",
  65:"Protocol error",
  66:"Unknown protocol",
  67:"Protocol wrong type for socket",
  68:"Math result not representable",
  69:"Read only file system",
  70:"Illegal seek",
  71:"No such process",
  72:"Stale file handle",
  73:"Connection timed out",
  74:"Text file busy",
  75:"Cross-device link",
  100:"Device not a stream",
  101:"Bad font file fmt",
  102:"Invalid slot",
  103:"Invalid request code",
  104:"No anode",
  105:"Block device required",
  106:"Channel number out of range",
  107:"Level 3 halted",
  108:"Level 3 reset",
  109:"Link number out of range",
  110:"Protocol driver not attached",
  111:"No CSI structure available",
  112:"Level 2 halted",
  113:"Invalid exchange",
  114:"Invalid request descriptor",
  115:"Exchange full",
  116:"No data (for no delay io)",
  117:"Timer expired",
  118:"Out of streams resources",
  119:"Machine is not on the network",
  120:"Package not installed",
  121:"The object is remote",
  122:"Advertise error",
  123:"Srmount error",
  124:"Communication error on send",
  125:"Cross mount point (not really error)",
  126:"Given log. name not unique",
  127:"f.d. invalid for this operation",
  128:"Remote address changed",
  129:"Can   access a needed shared lib",
  130:"Accessing a corrupted shared lib",
  131:".lib section in a.out corrupted",
  132:"Attempting to link in too many libs",
  133:"Attempting to exec a shared library",
  135:"Streams pipe error",
  136:"Too many users",
  137:"Socket type not supported",
  138:"Not supported",
  139:"Protocol family not supported",
  140:"Can't send after socket shutdown",
  141:"Too many references",
  142:"Host is down",
  148:"No medium (in tape drive)",
  156:"Level 2 not synchronized",
  };
  
  var ERRNO_CODES = {
      'EPERM': 63,
      'ENOENT': 44,
      'ESRCH': 71,
      'EINTR': 27,
      'EIO': 29,
      'ENXIO': 60,
      'E2BIG': 1,
      'ENOEXEC': 45,
      'EBADF': 8,
      'ECHILD': 12,
      'EAGAIN': 6,
      'EWOULDBLOCK': 6,
      'ENOMEM': 48,
      'EACCES': 2,
      'EFAULT': 21,
      'ENOTBLK': 105,
      'EBUSY': 10,
      'EEXIST': 20,
      'EXDEV': 75,
      'ENODEV': 43,
      'ENOTDIR': 54,
      'EISDIR': 31,
      'EINVAL': 28,
      'ENFILE': 41,
      'EMFILE': 33,
      'ENOTTY': 59,
      'ETXTBSY': 74,
      'EFBIG': 22,
      'ENOSPC': 51,
      'ESPIPE': 70,
      'EROFS': 69,
      'EMLINK': 34,
      'EPIPE': 64,
      'EDOM': 18,
      'ERANGE': 68,
      'ENOMSG': 49,
      'EIDRM': 24,
      'ECHRNG': 106,
      'EL2NSYNC': 156,
      'EL3HLT': 107,
      'EL3RST': 108,
      'ELNRNG': 109,
      'EUNATCH': 110,
      'ENOCSI': 111,
      'EL2HLT': 112,
      'EDEADLK': 16,
      'ENOLCK': 46,
      'EBADE': 113,
      'EBADR': 114,
      'EXFULL': 115,
      'ENOANO': 104,
      'EBADRQC': 103,
      'EBADSLT': 102,
      'EDEADLOCK': 16,
      'EBFONT': 101,
      'ENOSTR': 100,
      'ENODATA': 116,
      'ETIME': 117,
      'ENOSR': 118,
      'ENONET': 119,
      'ENOPKG': 120,
      'EREMOTE': 121,
      'ENOLINK': 47,
      'EADV': 122,
      'ESRMNT': 123,
      'ECOMM': 124,
      'EPROTO': 65,
      'EMULTIHOP': 36,
      'EDOTDOT': 125,
      'EBADMSG': 9,
      'ENOTUNIQ': 126,
      'EBADFD': 127,
      'EREMCHG': 128,
      'ELIBACC': 129,
      'ELIBBAD': 130,
      'ELIBSCN': 131,
      'ELIBMAX': 132,
      'ELIBEXEC': 133,
      'ENOSYS': 52,
      'ENOTEMPTY': 55,
      'ENAMETOOLONG': 37,
      'ELOOP': 32,
      'EOPNOTSUPP': 138,
      'EPFNOSUPPORT': 139,
      'ECONNRESET': 15,
      'ENOBUFS': 42,
      'EAFNOSUPPORT': 5,
      'EPROTOTYPE': 67,
      'ENOTSOCK': 57,
      'ENOPROTOOPT': 50,
      'ESHUTDOWN': 140,
      'ECONNREFUSED': 14,
      'EADDRINUSE': 3,
      'ECONNABORTED': 13,
      'ENETUNREACH': 40,
      'ENETDOWN': 38,
      'ETIMEDOUT': 73,
      'EHOSTDOWN': 142,
      'EHOSTUNREACH': 23,
      'EINPROGRESS': 26,
      'EALREADY': 7,
      'EDESTADDRREQ': 17,
      'EMSGSIZE': 35,
      'EPROTONOSUPPORT': 66,
      'ESOCKTNOSUPPORT': 137,
      'EADDRNOTAVAIL': 4,
      'ENETRESET': 39,
      'EISCONN': 30,
      'ENOTCONN': 53,
      'ETOOMANYREFS': 141,
      'EUSERS': 136,
      'EDQUOT': 19,
      'ESTALE': 72,
      'ENOTSUP': 138,
      'ENOMEDIUM': 148,
      'EILSEQ': 25,
      'EOVERFLOW': 61,
      'ECANCELED': 11,
      'ENOTRECOVERABLE': 56,
      'EOWNERDEAD': 62,
      'ESTRPIPE': 135,
    };
  var FS = {
  root:null,
  mounts:[],
  devices:{
  },
  streams:[],
  nextInode:1,
  nameTable:null,
  currentPath:"/",
  initialized:false,
  ignorePermissions:true,
  ErrnoError:class extends Error {
        // We set the `name` property to be able to identify `FS.ErrnoError`
        // - the `name` is a standard ECMA-262 property of error objects. Kind of good to have it anyway.
        // - when using PROXYFS, an error can come from an underlying FS
        // as different FS objects have their own FS.ErrnoError each,
        // the test `err instanceof FS.ErrnoError` won't detect an error coming from another filesystem, causing bugs.
        // we'll use the reliable test `err.name == "ErrnoError"` instead
        constructor(errno) {
          super(ERRNO_MESSAGES[errno]);
          // TODO(sbc): Use the inline member declaration syntax once we
          // support it in acorn and closure.
          this.name = 'ErrnoError';
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
        }
      },
  genericErrors:{
  },
  filesystems:null,
  syncFSRequests:0,
  FSStream:class {
        constructor() {
          // TODO(https://github.com/emscripten-core/emscripten/issues/21414):
          // Use inline field declarations.
          this.shared = {};
        }
        get object() {
          return this.node;
        }
        set object(val) {
          this.node = val;
        }
        get isRead() {
          return (this.flags & 2097155) !== 1;
        }
        get isWrite() {
          return (this.flags & 2097155) !== 0;
        }
        get isAppend() {
          return (this.flags & 1024);
        }
        get flags() {
          return this.shared.flags;
        }
        set flags(val) {
          this.shared.flags = val;
        }
        get position() {
          return this.shared.position;
        }
        set position(val) {
          this.shared.position = val;
        }
      },
  FSNode:class {
        constructor(parent, name, mode, rdev) {
          if (!parent) {
            parent = this;  // root node sets parent to itself
          }
          this.parent = parent;
          this.mount = parent.mount;
          this.mounted = null;
          this.id = FS.nextInode++;
          this.name = name;
          this.mode = mode;
          this.node_ops = {};
          this.stream_ops = {};
          this.rdev = rdev;
          this.readMode = 292/*292*/ | 73/*73*/;
          this.writeMode = 146/*146*/;
        }
        get read() {
          return (this.mode & this.readMode) === this.readMode;
        }
        set read(val) {
          val ? this.mode |= this.readMode : this.mode &= ~this.readMode;
        }
        get write() {
          return (this.mode & this.writeMode) === this.writeMode;
        }
        set write(val) {
          val ? this.mode |= this.writeMode : this.mode &= ~this.writeMode;
        }
        get isFolder() {
          return FS.isDir(this.mode);
        }
        get isDevice() {
          return FS.isChrdev(this.mode);
        }
      },
  lookupPath(path, opts = {}) {
        path = PATH_FS.resolve(path);
  
        if (!path) return { path: '', node: null };
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        opts = Object.assign(defaults, opts)
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(32);
        }
  
        // split the absolute path
        var parts = path.split('/').filter((p) => !!p);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
  
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count + 1 });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(32);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },
  getPath(node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? `${mount}/${path}` : mount + path;
          }
          path = path ? `${node.name}/${path}` : node.name;
          node = node.parent;
        }
      },
  hashName(parentid, name) {
        var hash = 0;
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },
  hashAddNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },
  hashRemoveNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },
  lookupNode(parent, name) {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },
  createNode(parent, name, mode, rdev) {
        assert(typeof parent == 'object')
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },
  destroyNode(node) {
        FS.hashRemoveNode(node);
      },
  isRoot(node) {
        return node === node.parent;
      },
  isMountpoint(node) {
        return !!node.mounted;
      },
  isFile(mode) {
        return (mode & 61440) === 32768;
      },
  isDir(mode) {
        return (mode & 61440) === 16384;
      },
  isLink(mode) {
        return (mode & 61440) === 40960;
      },
  isChrdev(mode) {
        return (mode & 61440) === 8192;
      },
  isBlkdev(mode) {
        return (mode & 61440) === 24576;
      },
  isFIFO(mode) {
        return (mode & 61440) === 4096;
      },
  isSocket(mode) {
        return (mode & 49152) === 49152;
      },
  flagsToPermissionString(flag) {
        var perms = ['r', 'w', 'rw'][flag & 3];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },
  nodePermissions(node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.includes('r') && !(node.mode & 292)) {
          return 2;
        } else if (perms.includes('w') && !(node.mode & 146)) {
          return 2;
        } else if (perms.includes('x') && !(node.mode & 73)) {
          return 2;
        }
        return 0;
      },
  mayLookup(dir) {
        if (!FS.isDir(dir.mode)) return 54;
        var errCode = FS.nodePermissions(dir, 'x');
        if (errCode) return errCode;
        if (!dir.node_ops.lookup) return 2;
        return 0;
      },
  mayCreate(dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return 20;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },
  mayDelete(dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var errCode = FS.nodePermissions(dir, 'wx');
        if (errCode) {
          return errCode;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return 54;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return 10;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return 31;
          }
        }
        return 0;
      },
  mayOpen(node, flags) {
        if (!node) {
          return 44;
        }
        if (FS.isLink(node.mode)) {
          return 32;
        } else if (FS.isDir(node.mode)) {
          if (FS.flagsToPermissionString(flags) !== 'r' || // opening for write
              (flags & 512)) { // TODO: check for O_SEARCH? (== search for dir only)
            return 31;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },
  MAX_OPEN_FDS:4096,
  nextfd() {
        for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(33);
      },
  getStreamChecked(fd) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        return stream;
      },
  getStream:(fd) => FS.streams[fd],
  createStream(stream, fd = -1) {
  
        // clone it, so we can return an instance of FSStream
        stream = Object.assign(new FS.FSStream(), stream);
        if (fd == -1) {
          fd = FS.nextfd();
        }
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },
  closeStream(fd) {
        FS.streams[fd] = null;
      },
  dupStream(origStream, fd = -1) {
        var stream = FS.createStream(origStream, fd);
        stream.stream_ops?.dup?.(stream);
        return stream;
      },
  chrdev_stream_ops:{
  open(stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          stream.stream_ops.open?.(stream);
        },
  llseek() {
          throw new FS.ErrnoError(70);
        },
  },
  major:(dev) => ((dev) >> 8),
  minor:(dev) => ((dev) & 0xff),
  makedev:(ma, mi) => ((ma) << 8 | (mi)),
  registerDevice(dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },
  getDevice:(dev) => FS.devices[dev],
  getMounts(mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push(...m.mounts);
        }
  
        return mounts;
      },
  syncfs(populate, callback) {
        if (typeof populate == 'function') {
          callback = populate;
          populate = false;
        }
  
        FS.syncFSRequests++;
  
        if (FS.syncFSRequests > 1) {
          err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function doCallback(errCode) {
          assert(FS.syncFSRequests > 0);
          FS.syncFSRequests--;
          return callback(errCode);
        }
  
        function done(errCode) {
          if (errCode) {
            if (!done.errored) {
              done.errored = true;
              return doCallback(errCode);
            }
            return;
          }
          if (++completed >= mounts.length) {
            doCallback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach((mount) => {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },
  mount(type, opts, mountpoint) {
        if (typeof type == 'string') {
          // The filesystem was not included, and instead we have an error
          // message stored in the variable.
          throw type;
        }
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(10);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54);
          }
        }
  
        var mount = {
          type,
          opts,
          mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },
  unmount(mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(28);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach((hash) => {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.includes(current.mount)) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },
  lookup(parent, name) {
        return parent.node_ops.lookup(parent, name);
      },
  mknod(path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === '.' || name === '..') {
          throw new FS.ErrnoError(28);
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },
  create(path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },
  mkdir(path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },
  mkdirTree(path, mode) {
        var dirs = path.split('/');
        var d = '';
        for (var i = 0; i < dirs.length; ++i) {
          if (!dirs[i]) continue;
          d += '/' + dirs[i];
          try {
            FS.mkdir(d, mode);
          } catch(e) {
            if (e.errno != 20) throw e;
          }
        }
      },
  mkdev(path, mode, dev) {
        if (typeof dev == 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },
  symlink(oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
          throw new FS.ErrnoError(44);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },
  rename(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
  
        // let the errors from non existent directories percolate up
        lookup = FS.lookupPath(old_path, { parent: true });
        old_dir = lookup.node;
        lookup = FS.lookupPath(new_path, { parent: true });
        new_dir = lookup.node;
  
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(75);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(28);
        }
        // new path should not be an ancestor of the old path
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(55);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        errCode = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(10);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          errCode = FS.nodePermissions(old_dir, 'w');
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },
  rmdir(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },
  readdir(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(54);
        }
        return node.node_ops.readdir(node);
      },
  unlink(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
          // According to POSIX, we should map EISDIR to EPERM, but
          // we instead do what Linux does (and we must, as we use
          // the musl linux libc).
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },
  readlink(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(44);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(28);
        }
        return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
      },
  stat(path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(63);
        }
        return node.node_ops.getattr(node);
      },
  lstat(path) {
        return FS.stat(path, true);
      },
  chmod(path, mode, dontFollow) {
        var node;
        if (typeof path == 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },
  lchmod(path, mode) {
        FS.chmod(path, mode, true);
      },
  fchmod(fd, mode) {
        var stream = FS.getStreamChecked(fd);
        FS.chmod(stream.node, mode);
      },
  chown(path, uid, gid, dontFollow) {
        var node;
        if (typeof path == 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },
  lchown(path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },
  fchown(fd, uid, gid) {
        var stream = FS.getStreamChecked(fd);
        FS.chown(stream.node, uid, gid);
      },
  truncate(path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(28);
        }
        var node;
        if (typeof path == 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(28);
        }
        var errCode = FS.nodePermissions(node, 'w');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },
  ftruncate(fd, len) {
        var stream = FS.getStreamChecked(fd);
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(28);
        }
        FS.truncate(stream.node, len);
      },
  utime(path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },
  open(path, flags, mode) {
        if (path === "") {
          throw new FS.ErrnoError(44);
        }
        flags = typeof flags == 'string' ? FS_modeStringToFlags(flags) : flags;
        mode = typeof mode == 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path == 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        var created = false;
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(20);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // if asked only for a directory, then this must be one
        if ((flags & 65536) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(54);
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
          var errCode = FS.mayOpen(node, flags);
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        // do truncation if necessary
        if ((flags & 512) && !created) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512 | 131072);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        });
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
          }
        }
        return stream;
      },
  close(stream) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (stream.getdents) stream.getdents = null; // free readdir state
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
        stream.fd = null;
      },
  isClosed(stream) {
        return stream.fd === null;
      },
  llseek(stream, offset, whence) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(70);
        }
        if (whence != 0 && whence != 1 && whence != 2) {
          throw new FS.ErrnoError(28);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      },
  read(stream, buffer, offset, length, position) {
        assert(offset >= 0);
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(28);
        }
        var seeking = typeof position != 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },
  write(stream, buffer, offset, length, position, canOwn) {
        assert(offset >= 0);
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(28);
        }
        if (stream.seekable && stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position != 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },
  allocate(stream, offset, length) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(28);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(43);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(138);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },
  mmap(stream, length, position, prot, flags) {
        // User requests writing to file (prot & PROT_WRITE != 0).
        // Checking if we have permissions to write to the file unless
        // MAP_PRIVATE flag is set. According to POSIX spec it is possible
        // to write to file opened in read-only mode with MAP_PRIVATE flag,
        // as all modifications will be visible only in the memory of
        // the current process.
        if ((prot & 2) !== 0
            && (flags & 2) === 0
            && (stream.flags & 2097155) !== 2) {
          throw new FS.ErrnoError(2);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(2);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(43);
        }
        return stream.stream_ops.mmap(stream, length, position, prot, flags);
      },
  msync(stream, buffer, offset, length, mmapFlags) {
        assert(offset >= 0);
        if (!stream.stream_ops.msync) {
          return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
      },
  ioctl(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(59);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },
  readFile(path, opts = {}) {
        opts.flags = opts.flags || 0;
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error(`Invalid encoding type "${opts.encoding}"`);
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = UTF8ArrayToString(buf, 0);
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },
  writeFile(path, data, opts = {}) {
        opts.flags = opts.flags || 577;
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data == 'string') {
          var buf = new Uint8Array(lengthBytesUTF8(data)+1);
          var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
          FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
        } else if (ArrayBuffer.isView(data)) {
          FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
        } else {
          throw new Error('Unsupported data type');
        }
        FS.close(stream);
      },
  cwd:() => FS.currentPath,
  chdir(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
          throw new FS.ErrnoError(44);
        }
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(54);
        }
        var errCode = FS.nodePermissions(lookup.node, 'x');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        FS.currentPath = lookup.path;
      },
  createDefaultDirectories() {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      },
  createDefaultDevices() {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: () => 0,
          write: (stream, buffer, offset, length, pos) => length,
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using err() rather than out()
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        // use a buffer to avoid overhead of individual crypto calls per byte
        var randomBuffer = new Uint8Array(1024), randomLeft = 0;
        var randomByte = () => {
          if (randomLeft === 0) {
            randomLeft = randomFill(randomBuffer).byteLength;
          }
          return randomBuffer[--randomLeft];
        };
        FS.createDevice('/dev', 'random', randomByte);
        FS.createDevice('/dev', 'urandom', randomByte);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },
  createSpecialDirectories() {
        // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the
        // name of the stream for fd 6 (see test_unistd_ttyname)
        FS.mkdir('/proc');
        var proc_self = FS.mkdir('/proc/self');
        FS.mkdir('/proc/self/fd');
        FS.mount({
          mount() {
            var node = FS.createNode(proc_self, 'fd', 16384 | 511 /* 0777 */, 73);
            node.node_ops = {
              lookup(parent, name) {
                var fd = +name;
                var stream = FS.getStreamChecked(fd);
                var ret = {
                  parent: null,
                  mount: { mountpoint: 'fake' },
                  node_ops: { readlink: () => stream.path },
                };
                ret.parent = ret; // make it look like a simple root node
                return ret;
              }
            };
            return node;
          }
        }, {}, '/proc/self/fd');
      },
  createStandardStreams() {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 0);
        var stdout = FS.open('/dev/stdout', 1);
        var stderr = FS.open('/dev/stderr', 1);
        assert(stdin.fd === 0, `invalid handle for stdin (${stdin.fd})`);
        assert(stdout.fd === 1, `invalid handle for stdout (${stdout.fd})`);
        assert(stderr.fd === 2, `invalid handle for stderr (${stderr.fd})`);
      },
  staticInit() {
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [44].forEach((code) => {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
  
        FS.filesystems = {
          'MEMFS': MEMFS,
        };
      },
  init(input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },
  quit() {
        FS.init.initialized = false;
        // force-flush all streams, so we get musl std streams printed out
        _fflush(0);
        // close all of our streams
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },
  findObject(path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (!ret.exists) {
          return null;
        }
        return ret.object;
      },
  analyzePath(path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },
  createPath(parent, path, canRead, canWrite) {
        parent = typeof parent == 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },
  createFile(parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent == 'string' ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(canRead, canWrite);
        return FS.create(path, mode);
      },
  createDataFile(parent, name, data, canRead, canWrite, canOwn) {
        var path = name;
        if (parent) {
          parent = typeof parent == 'string' ? parent : FS.getPath(parent);
          path = name ? PATH.join2(parent, name) : parent;
        }
        var mode = FS_getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data == 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 577);
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
      },
  createDevice(parent, name, input, output) {
        var path = PATH.join2(typeof parent == 'string' ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open(stream) {
            stream.seekable = false;
          },
          close(stream) {
            // flush any pending line data
            if (output?.buffer?.length) {
              output(10);
            }
          },
          read(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(6);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },
  forceLoadFile(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        if (typeof XMLHttpRequest != 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (read_) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(read_(obj.url), true);
            obj.usedBytes = obj.contents.length;
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
      },
  createLazyFile(parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array).
        // Actual getting is abstracted away for eventual reuse.
        class LazyUint8Array {
          constructor() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = (idx / this.chunkSize)|0;
            return this.getter(chunkNum)[chunkOffset];
          }
          setDataGetter(getter) {
            this.getter = getter;
          }
          cacheLength() {
            // Find length
            var xhr = new XMLHttpRequest();
            xhr.open('HEAD', url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
  
            var chunkSize = 1024*1024; // Chunk size in bytes
  
            if (!hasByteServing) chunkSize = datalength;
  
            // Function to get a range from the remote URL.
            var doXHR = (from, to) => {
              if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
              if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
              // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
              var xhr = new XMLHttpRequest();
              xhr.open('GET', url, false);
              if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
              // Some hints to the browser that we want binary data.
              xhr.responseType = 'arraybuffer';
              if (xhr.overrideMimeType) {
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
              }
  
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              if (xhr.response !== undefined) {
                return new Uint8Array(/** @type{Array<number>} */(xhr.response || []));
              }
              return intArrayFromString(xhr.responseText || '', true);
            };
            var lazyArray = this;
            lazyArray.setDataGetter((chunkNum) => {
              var start = chunkNum * chunkSize;
              var end = (chunkNum+1) * chunkSize - 1; // including this byte
              end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
              if (typeof lazyArray.chunks[chunkNum] == 'undefined') {
                lazyArray.chunks[chunkNum] = doXHR(start, end);
              }
              if (typeof lazyArray.chunks[chunkNum] == 'undefined') throw new Error('doXHR failed!');
              return lazyArray.chunks[chunkNum];
            });
  
            if (usesGzip || !datalength) {
              // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
              chunkSize = datalength = 1; // this will force getter(0)/doXHR do download the whole file
              datalength = this.getter(0).length;
              chunkSize = datalength;
              out("LazyFiles on gzip forces download of the whole file when length is accessed");
            }
  
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true;
          }
          get length() {
            if (!this.lengthKnown) {
              this.cacheLength();
            }
            return this._length;
          }
          get chunkSize() {
            if (!this.lengthKnown) {
              this.cacheLength();
            }
            return this._chunkSize;
          }
        }
  
        if (typeof XMLHttpRequest != 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // Add a function that defers querying the file size until it is asked the first time.
        Object.defineProperties(node, {
          usedBytes: {
            get: function() { return this.contents.length; }
          }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach((key) => {
          var fn = node.stream_ops[key];
          stream_ops[key] = (...args) => {
            FS.forceLoadFile(node);
            return fn(...args);
          };
        });
        function writeChunks(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        }
        // use a custom read function
        stream_ops.read = (stream, buffer, offset, length, position) => {
          FS.forceLoadFile(node);
          return writeChunks(stream, buffer, offset, length, position)
        };
        // use a custom mmap function
        stream_ops.mmap = (stream, length, position, prot, flags) => {
          FS.forceLoadFile(node);
          var ptr = mmapAlloc(length);
          if (!ptr) {
            throw new FS.ErrnoError(48);
          }
          writeChunks(stream, HEAP8, ptr, length, position);
          return { ptr, allocated: true };
        };
        node.stream_ops = stream_ops;
        return node;
      },
  absolutePath() {
        abort('FS.absolutePath has been removed; use PATH_FS.resolve instead');
      },
  createFolder() {
        abort('FS.createFolder has been removed; use FS.mkdir instead');
      },
  createLink() {
        abort('FS.createLink has been removed; use FS.symlink instead');
      },
  joinPath() {
        abort('FS.joinPath has been removed; use PATH.join instead');
      },
  mmapAlloc() {
        abort('FS.mmapAlloc has been replaced by the top level function mmapAlloc');
      },
  standardizePath() {
        abort('FS.standardizePath has been removed; use PATH.normalize instead');
      },
  };
  
  var SYSCALLS = {
  DEFAULT_POLLMASK:5,
  calculateAt(dirfd, path, allowEmpty) {
        if (PATH.isAbs(path)) {
          return path;
        }
        // relative path
        var dir;
        if (dirfd === -100) {
          dir = FS.cwd();
        } else {
          var dirstream = SYSCALLS.getStreamFromFD(dirfd);
          dir = dirstream.path;
        }
        if (path.length == 0) {
          if (!allowEmpty) {
            throw new FS.ErrnoError(44);;
          }
          return dir;
        }
        return PATH.join2(dir, path);
      },
  doStat(func, path, buf) {
        var stat = func(path);
        HEAP32[((buf)>>2)] = stat.dev;
        HEAP32[(((buf)+(4))>>2)] = stat.mode;
        HEAPU32[(((buf)+(8))>>2)] = stat.nlink;
        HEAP32[(((buf)+(12))>>2)] = stat.uid;
        HEAP32[(((buf)+(16))>>2)] = stat.gid;
        HEAP32[(((buf)+(20))>>2)] = stat.rdev;
        (tempI64 = [stat.size>>>0,(tempDouble = stat.size,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[(((buf)+(24))>>2)] = tempI64[0],HEAP32[(((buf)+(28))>>2)] = tempI64[1]);
        HEAP32[(((buf)+(32))>>2)] = 4096;
        HEAP32[(((buf)+(36))>>2)] = stat.blocks;
        var atime = stat.atime.getTime();
        var mtime = stat.mtime.getTime();
        var ctime = stat.ctime.getTime();
        (tempI64 = [Math.floor(atime / 1000)>>>0,(tempDouble = Math.floor(atime / 1000),(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[(((buf)+(40))>>2)] = tempI64[0],HEAP32[(((buf)+(44))>>2)] = tempI64[1]);
        HEAPU32[(((buf)+(48))>>2)] = (atime % 1000) * 1000;
        (tempI64 = [Math.floor(mtime / 1000)>>>0,(tempDouble = Math.floor(mtime / 1000),(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[(((buf)+(56))>>2)] = tempI64[0],HEAP32[(((buf)+(60))>>2)] = tempI64[1]);
        HEAPU32[(((buf)+(64))>>2)] = (mtime % 1000) * 1000;
        (tempI64 = [Math.floor(ctime / 1000)>>>0,(tempDouble = Math.floor(ctime / 1000),(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[(((buf)+(72))>>2)] = tempI64[0],HEAP32[(((buf)+(76))>>2)] = tempI64[1]);
        HEAPU32[(((buf)+(80))>>2)] = (ctime % 1000) * 1000;
        (tempI64 = [stat.ino>>>0,(tempDouble = stat.ino,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[(((buf)+(88))>>2)] = tempI64[0],HEAP32[(((buf)+(92))>>2)] = tempI64[1]);
        return 0;
      },
  doMsync(addr, stream, len, flags, offset) {
        if (!FS.isFile(stream.node.mode)) {
          throw new FS.ErrnoError(43);
        }
        if (flags & 2) {
          // MAP_PRIVATE calls need not to be synced back to underlying fs
          return 0;
        }
        var buffer = HEAPU8.slice(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags);
      },
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
  getStreamFromFD(fd) {
        var stream = FS.getStreamChecked(fd);
        return stream;
      },
  };
  function _fd_close(fd) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.close(stream);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  }

  /** @param {number=} offset */
  var doReadv = (stream, iov, iovcnt, offset) => {
      var ret = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[((iov)>>2)];
        var len = HEAPU32[(((iov)+(4))>>2)];
        iov += 8;
        var curr = FS.read(stream, HEAP8, ptr, len, offset);
        if (curr < 0) return -1;
        ret += curr;
        if (curr < len) break; // nothing more to read
        if (typeof offset !== 'undefined') {
          offset += curr;
        }
      }
      return ret;
    };
  
  function _fd_read(fd, iov, iovcnt, pnum) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = doReadv(stream, iov, iovcnt);
      HEAPU32[((pnum)>>2)] = num;
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  }

  
  var convertI32PairToI53Checked = (lo, hi) => {
      assert(lo == (lo >>> 0) || lo == (lo|0)); // lo should either be a i32 or a u32
      assert(hi === (hi|0));                    // hi should be a i32
      return ((hi + 0x200000) >>> 0 < 0x400001 - !!lo) ? (lo >>> 0) + hi * 4294967296 : NaN;
    };
  function _fd_seek(fd,offset_low, offset_high,whence,newOffset) {
    var offset = convertI32PairToI53Checked(offset_low, offset_high);
  
    
  try {
  
      if (isNaN(offset)) return 61;
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.llseek(stream, offset, whence);
      (tempI64 = [stream.position>>>0,(tempDouble = stream.position,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[((newOffset)>>2)] = tempI64[0],HEAP32[(((newOffset)+(4))>>2)] = tempI64[1]);
      if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  ;
  }

  /** @param {number=} offset */
  var doWritev = (stream, iov, iovcnt, offset) => {
      var ret = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[((iov)>>2)];
        var len = HEAPU32[(((iov)+(4))>>2)];
        iov += 8;
        var curr = FS.write(stream, HEAP8, ptr, len, offset);
        if (curr < 0) return -1;
        ret += curr;
        if (typeof offset !== 'undefined') {
          offset += curr;
        }
      }
      return ret;
    };
  
  function _fd_write(fd, iov, iovcnt, pnum) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = doWritev(stream, iov, iovcnt);
      HEAPU32[((pnum)>>2)] = num;
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  }

  var isLeapYear = (year) => year%4 === 0 && (year%100 !== 0 || year%400 === 0);
  
  var arraySum = (array, index) => {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]) {
        // no-op
      }
      return sum;
    };
  
  
  var MONTH_DAYS_LEAP = [31,29,31,30,31,30,31,31,30,31,30,31];
  
  var MONTH_DAYS_REGULAR = [31,28,31,30,31,30,31,31,30,31,30,31];
  var addDays = (date, days) => {
      var newDate = new Date(date.getTime());
      while (days > 0) {
        var leap = isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR)[currentMonth];
  
        if (days > daysInCurrentMonth-newDate.getDate()) {
          // we spill over to next month
          days -= (daysInCurrentMonth-newDate.getDate()+1);
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth+1)
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear()+1);
          }
        } else {
          // we stay in current month
          newDate.setDate(newDate.getDate()+days);
          return newDate;
        }
      }
  
      return newDate;
    };
  
  
  
  
  var writeArrayToMemory = (array, buffer) => {
      assert(array.length >= 0, 'writeArrayToMemory array must have a length (should be an array or typed array)')
      HEAP8.set(array, buffer);
    };
  
  var _strftime = (s, maxsize, format, tm) => {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
  
      var tm_zone = HEAPU32[(((tm)+(40))>>2)];
  
      var date = {
        tm_sec: HEAP32[((tm)>>2)],
        tm_min: HEAP32[(((tm)+(4))>>2)],
        tm_hour: HEAP32[(((tm)+(8))>>2)],
        tm_mday: HEAP32[(((tm)+(12))>>2)],
        tm_mon: HEAP32[(((tm)+(16))>>2)],
        tm_year: HEAP32[(((tm)+(20))>>2)],
        tm_wday: HEAP32[(((tm)+(24))>>2)],
        tm_yday: HEAP32[(((tm)+(28))>>2)],
        tm_isdst: HEAP32[(((tm)+(32))>>2)],
        tm_gmtoff: HEAP32[(((tm)+(36))>>2)],
        tm_zone: tm_zone ? UTF8ToString(tm_zone) : ''
      };
      
  
      var pattern = UTF8ToString(format);
  
      // expand format
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
        '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
        '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
        '%h': '%b',                       // Equivalent to %b
        '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
        '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
        '%T': '%H:%M:%S',                 // Replaced by the time
        '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
        '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate time representation
        // Modified Conversion Specifiers
        '%Ec': '%c',                      // Replaced by the locale's alternative appropriate date and time representation.
        '%EC': '%C',                      // Replaced by the name of the base year (period) in the locale's alternative representation.
        '%Ex': '%m/%d/%y',                // Replaced by the locale's alternative date representation.
        '%EX': '%H:%M:%S',                // Replaced by the locale's alternative time representation.
        '%Ey': '%y',                      // Replaced by the offset from %EC (year only) in the locale's alternative representation.
        '%EY': '%Y',                      // Replaced by the full alternative year representation.
        '%Od': '%d',                      // Replaced by the day of the month, using the locale's alternative numeric symbols, filled as needed with leading zeros if there is any alternative symbol for zero; otherwise, with leading <space> characters.
        '%Oe': '%e',                      // Replaced by the day of the month, using the locale's alternative numeric symbols, filled as needed with leading <space> characters.
        '%OH': '%H',                      // Replaced by the hour (24-hour clock) using the locale's alternative numeric symbols.
        '%OI': '%I',                      // Replaced by the hour (12-hour clock) using the locale's alternative numeric symbols.
        '%Om': '%m',                      // Replaced by the month using the locale's alternative numeric symbols.
        '%OM': '%M',                      // Replaced by the minutes using the locale's alternative numeric symbols.
        '%OS': '%S',                      // Replaced by the seconds using the locale's alternative numeric symbols.
        '%Ou': '%u',                      // Replaced by the weekday as a number in the locale's alternative representation (Monday=1).
        '%OU': '%U',                      // Replaced by the week number of the year (Sunday as the first day of the week, rules corresponding to %U ) using the locale's alternative numeric symbols.
        '%OV': '%V',                      // Replaced by the week number of the year (Monday as the first day of the week, rules corresponding to %V ) using the locale's alternative numeric symbols.
        '%Ow': '%w',                      // Replaced by the number of the weekday (Sunday=0) using the locale's alternative numeric symbols.
        '%OW': '%W',                      // Replaced by the week number of the year (Monday as the first day of the week) using the locale's alternative numeric symbols.
        '%Oy': '%y',                      // Replaced by the year (offset from %C ) using the locale's alternative numeric symbols.
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }
  
      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
      function leadingSomething(value, digits, character) {
        var str = typeof value == 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
          str = character[0]+str;
        }
        return str;
      }
  
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
      }
  
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : (value > 0 ? 1 : 0);
        }
  
        var compare;
        if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
            compare = sgn(date1.getDate()-date2.getDate());
          }
        }
        return compare;
      }
  
      function getFirstWeekStartDate(janFourth) {
          switch (janFourth.getDay()) {
            case 0: // Sunday
              return new Date(janFourth.getFullYear()-1, 11, 29);
            case 1: // Monday
              return janFourth;
            case 2: // Tuesday
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3: // Wednesday
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4: // Thursday
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5: // Friday
              return new Date(janFourth.getFullYear()-1, 11, 31);
            case 6: // Saturday
              return new Date(janFourth.getFullYear()-1, 11, 30);
          }
      }
  
      function getWeekBasedYear(date) {
          var thisDate = addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
  
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
  
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            // this date is after the start of the first week of this year
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear()+1;
            }
            return thisDate.getFullYear();
          }
          return thisDate.getFullYear()-1;
      }
  
      var EXPANSION_RULES_2 = {
        '%a': (date) => WEEKDAYS[date.tm_wday].substring(0,3) ,
        '%A': (date) => WEEKDAYS[date.tm_wday],
        '%b': (date) => MONTHS[date.tm_mon].substring(0,3),
        '%B': (date) => MONTHS[date.tm_mon],
        '%C': (date) => {
          var year = date.tm_year+1900;
          return leadingNulls((year/100)|0,2);
        },
        '%d': (date) => leadingNulls(date.tm_mday, 2),
        '%e': (date) => leadingSomething(date.tm_mday, 2, ' '),
        '%g': (date) => {
          // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year.
          // In this system, weeks begin on a Monday and week 1 of the year is the week that includes
          // January 4th, which is also the week that includes the first Thursday of the year, and
          // is also the first week that contains at least four days in the year.
          // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of
          // the last week of the preceding year; thus, for Saturday 2nd January 1999,
          // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th,
          // or 31st is a Monday, it and any following days are part of week 1 of the following year.
          // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
  
          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': getWeekBasedYear,
        '%H': (date) => leadingNulls(date.tm_hour, 2),
        '%I': (date) => {
          var twelveHour = date.tm_hour;
          if (twelveHour == 0) twelveHour = 12;
          else if (twelveHour > 12) twelveHour -= 12;
          return leadingNulls(twelveHour, 2);
        },
        '%j': (date) => {
          // Day of the year (001-366)
          return leadingNulls(date.tm_mday + arraySum(isLeapYear(date.tm_year+1900) ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
        },
        '%m': (date) => leadingNulls(date.tm_mon+1, 2),
        '%M': (date) => leadingNulls(date.tm_min, 2),
        '%n': () => '\n',
        '%p': (date) => {
          if (date.tm_hour >= 0 && date.tm_hour < 12) {
            return 'AM';
          }
          return 'PM';
        },
        '%S': (date) => leadingNulls(date.tm_sec, 2),
        '%t': () => '\t',
        '%u': (date) => date.tm_wday || 7,
        '%U': (date) => {
          var days = date.tm_yday + 7 - date.tm_wday;
          return leadingNulls(Math.floor(days / 7), 2);
        },
        '%V': (date) => {
          // Replaced by the week number of the year (Monday as the first day of the week)
          // as a decimal number [01,53]. If the week containing 1 January has four
          // or more days in the new year, then it is considered week 1.
          // Otherwise, it is the last week of the previous year, and the next week is week 1.
          // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
          var val = Math.floor((date.tm_yday + 7 - (date.tm_wday + 6) % 7 ) / 7);
          // If 1 Jan is just 1-3 days past Monday, the previous week
          // is also in this year.
          if ((date.tm_wday + 371 - date.tm_yday - 2) % 7 <= 2) {
            val++;
          }
          if (!val) {
            val = 52;
            // If 31 December of prev year a Thursday, or Friday of a
            // leap year, then the prev year has 53 weeks.
            var dec31 = (date.tm_wday + 7 - date.tm_yday - 1) % 7;
            if (dec31 == 4 || (dec31 == 5 && isLeapYear(date.tm_year%400-1))) {
              val++;
            }
          } else if (val == 53) {
            // If 1 January is not a Thursday, and not a Wednesday of a
            // leap year, then this year has only 52 weeks.
            var jan1 = (date.tm_wday + 371 - date.tm_yday) % 7;
            if (jan1 != 4 && (jan1 != 3 || !isLeapYear(date.tm_year)))
              val = 1;
          }
          return leadingNulls(val, 2);
        },
        '%w': (date) => date.tm_wday,
        '%W': (date) => {
          var days = date.tm_yday + 7 - ((date.tm_wday + 6) % 7);
          return leadingNulls(Math.floor(days / 7), 2);
        },
        '%y': (date) => {
          // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
          return (date.tm_year+1900).toString().substring(2);
        },
        // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
        '%Y': (date) => date.tm_year+1900,
        '%z': (date) => {
          // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ).
          // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich).
          var off = date.tm_gmtoff;
          var ahead = off >= 0;
          off = Math.abs(off) / 60;
          // convert from minutes into hhmm format (which means 60 minutes = 100 units)
          off = (off / 60)*100 + (off % 60);
          return (ahead ? '+' : '-') + String("0000" + off).slice(-4);
        },
        '%Z': (date) => date.tm_zone,
        '%%': () => '%'
      };
  
      // Replace %% with a pair of NULLs (which cannot occur in a C string), then
      // re-inject them after processing.
      pattern = pattern.replace(/%%/g, '\0\0')
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.includes(rule)) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }
      pattern = pattern.replace(/\0\0/g, '%')
  
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      }
  
      writeArrayToMemory(bytes, s);
      return bytes.length-1;
    };
  var _strftime_l = (s, maxsize, format, tm, loc) => {
      return _strftime(s, maxsize, format, tm); // no locale support yet
    };
embind_init_charCodes();
BindingError = Module['BindingError'] = class BindingError extends Error { constructor(message) { super(message); this.name = 'BindingError'; }};
InternalError = Module['InternalError'] = class InternalError extends Error { constructor(message) { super(message); this.name = 'InternalError'; }};
init_ClassHandle();
init_embind();;
init_RegisteredPointer();
UnboundTypeError = Module['UnboundTypeError'] = extendError(Error, 'UnboundTypeError');;
init_emval();;

  FS.createPreloadedFile = FS_createPreloadedFile;
  FS.staticInit();;
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
  environ_get: _environ_get,
  /** @export */
  environ_sizes_get: _environ_sizes_get,
  /** @export */
  fd_close: _fd_close,
  /** @export */
  fd_read: _fd_read,
  /** @export */
  fd_seek: _fd_seek,
  /** @export */
  fd_write: _fd_write,
  /** @export */
  strftime_l: _strftime_l
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
var dynCall_viijii = Module['dynCall_viijii'] = createExportWrapper('dynCall_viijii');
var dynCall_jiji = Module['dynCall_jiji'] = createExportWrapper('dynCall_jiji');
var dynCall_iiiiij = Module['dynCall_iiiiij'] = createExportWrapper('dynCall_iiiiij');
var dynCall_iiiiijj = Module['dynCall_iiiiijj'] = createExportWrapper('dynCall_iiiiijj');
var dynCall_iiiiiijj = Module['dynCall_iiiiiijj'] = createExportWrapper('dynCall_iiiiiijj');


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
  'exitJS',
  'growMemory',
  'ydayFromDate',
  'inetPton4',
  'inetNtop4',
  'inetPton6',
  'inetNtop6',
  'readSockaddr',
  'writeSockaddr',
  'getCallstack',
  'emscriptenLog',
  'convertPCtoSourceLocation',
  'readEmAsmArgs',
  'jstoi_q',
  'listenOnce',
  'autoResumeAudioContext',
  'handleException',
  'keepRuntimeAlive',
  'runtimeKeepalivePush',
  'runtimeKeepalivePop',
  'callUserCallback',
  'maybeExit',
  'asmjsMangle',
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
  'intArrayToString',
  'AsciiToString',
  'stringToNewUTF8',
  'stringToUTF8OnStack',
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
  'zeroMemory',
  'getHeapMax',
  'abortOnCannotGrowMemory',
  'ENV',
  'MONTH_DAYS_REGULAR',
  'MONTH_DAYS_LEAP',
  'MONTH_DAYS_REGULAR_CUMULATIVE',
  'MONTH_DAYS_LEAP_CUMULATIVE',
  'isLeapYear',
  'arraySum',
  'addDays',
  'ERRNO_CODES',
  'ERRNO_MESSAGES',
  'DNS',
  'Protocols',
  'Sockets',
  'initRandomFill',
  'randomFill',
  'timers',
  'warnOnce',
  'UNWIND_CACHE',
  'readEmAsmArgsArray',
  'jstoi_s',
  'getExecutableName',
  'dynCallLegacy',
  'getDynCaller',
  'dynCall',
  'asyncLoad',
  'alignMemory',
  'mmapAlloc',
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
  'intArrayFromString',
  'stringToAscii',
  'UTF16Decoder',
  'UTF16ToString',
  'stringToUTF16',
  'lengthBytesUTF16',
  'UTF32ToString',
  'stringToUTF32',
  'lengthBytesUTF32',
  'writeArrayToMemory',
  'JSEvents',
  'specialHTMLTargets',
  'findCanvasEventTarget',
  'currentFullscreenStrategy',
  'restoreOldWindowedStyle',
  'ExitStatus',
  'getEnvStrings',
  'doReadv',
  'doWritev',
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
  'FS_createPreloadedFile',
  'FS_modeStringToFlags',
  'FS_getMode',
  'FS_stdin_getChar_buffer',
  'FS_stdin_getChar',
  'FS',
  'FS_createDataFile',
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
    _fflush(0);
    // also flush in the JS FS layer
    ['stdout', 'stderr'].forEach(function(name) {
      var info = FS.analyzePath('/dev/' + name);
      if (!info) return;
      var stream = info.object;
      var rdev = stream.rdev;
      var tty = TTY.ttys[rdev];
      if (tty?.output?.length) {
        has = true;
      }
    });
  } catch(e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the Emscripten FAQ), or make sure to emit a newline when you printf etc.');
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

