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
  wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAABwAVZYAF/AX9gAn9/AX9gAn9/AGADf39/AX9gAX8AYAABf2ADf39/AGAGf39/f39/AX9gAABgBH9/f38AYAV/f39/fwF/YAZ/f39/f38AYAR/f39/AX9gCH9/f39/f39/AX9gBX9/f39/AGACf30AYAd/f39/f39/AGABfQF9YAd/f39/f39/AX9gAX8BfWAFf35+fn4AYAABfmADf35/AX5gBX9/f39+AX9gAn19AX1gBH9/f38BfmAGf39/f35/AX9gCn9/f39/f39/f38AYAd/f39/f35+AX9gBH9/f30AYAN/f30AYAF8AXxgBX9/fn9/AGAEf35+fwBgCn9/f39/f39/f38Bf2AGf39/f35+AX9gAX8BfGACf3wAYAF9AX9gAnx/AXxgBH5+fn4Bf2AEf39/fgF+YAZ/fH9/f38Bf2ACfn8Bf2ADf39/AX5gAn9/AX1gAn9/AXxgA39/fwF9YAN/f38BfGAMf39/f39/f39/f39/AX9gBX9/f398AX9gBn9/f398fwF/YAd/f39/fn5/AX9gC39/f39/f39/f39/AX9gD39/f39/f39/f39/f39/fwBgCH9/f39/f39/AGANf39/f39/f39/f39/fwBgCX9/f39/f39/fwBgBX9/f399AGAFf399fX0BfWADfX19AX1gA399fwF9YAR/f319AX1gBX9/f31/AGAEf319fwBgBn99fX19fwBgA399fQBgAnx8AXxgAnx/AX9gA3x8fwF8YAJ/fQF9YAJ8fwF9YAJ/fgF/YAJ/fgBgAn5+AX9gA39+fgBgAn9/AX5gAn5+AX1gAn5+AXxgA39/fgBgA35/fwF/YAF8AX5gBn9/f35/fwBgBH9/fn8BfmAGf39/f39+AX9gCH9/f39/f35+AX9gCX9/f39/f39/fwF/YAV/f39+fgBgBH9+f38BfwLBBRcDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfY2xhc3MAOANlbnYiX2VtYmluZF9yZWdpc3Rlcl9jbGFzc19jb25zdHJ1Y3RvcgALA2VudgtfX2N4YV90aHJvdwAGA2Vudh9fZW1iaW5kX3JlZ2lzdGVyX2NsYXNzX2Z1bmN0aW9uADkDZW52FV9lbWJpbmRfcmVnaXN0ZXJfdm9pZAACA2VudhVfZW1iaW5kX3JlZ2lzdGVyX2Jvb2wA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AgINAwAHBwcLBwsHCwoNCwsLCwsLDgsLCwsODQMABwcAAAAAAAcLBwsHCwoNCwsLCwsLDgsLCwsOEgsDAgEJEgsDAQoECQAFBQACAgICAAICAAACAgICAAICAAUFAAICAAQCAgACAgAAAgICAgACAgEEAwEABAMAAAASBDUAAAMDABsGAAMBAAABAQMGBgAAAAASBAMBEAIDAAACAgIAAAICAAACAgIAAAICAAMAAQADAQAAAQAAAQICEjUAAAMbBgABAwEAAAEBAwYAEgQDAAICAAIAAQEQAgAMAAICAQIAAAICAAACAgIAAAICAAMAAQADAQAAAQIcARs2AAICAAEAAwUHHAEbNgAAAAICAAEAAwcJAQUBCQEBAwsCAwsCAAEBAQQIAggCCAIIAggCCAIIAggCCAIIAggCCAIIAggCCAIIAggCCAIIAggCCAIIAggCCAIIAggCCAIIAggCCAIBAwECAgIEAAQCAAYBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQUBBAUAAQEAAQIAAAQAAAAEBAICAAEBCAUFAAEABAMCBAQAAQEEBQQDDAwMAQUDAQUDAQwDCgwAAAQBAwEDAQwDCgQNDQoAAAoAAQAEDQcMDQcKCgAMAAAKDAAEDQ0NDQoAAAoKAAQNDQoAAAoABA0NDQ0KAAAKCgAEDQ0KAAAKAAEBAAQABAAAAAACAgICAQACAgEBAgAIBAAIBAEACAQACAQACAQACAQABAAEAAQABAAEAAQABAAEAAEEBAQEAAAEAAAEBAAEAAQEBAQEBAQEBAQBCQEAAAEJAAABAAAABgICAgQAAAEAAAAAAAACAxAGBgAAAwMDAwEBAgICAgICAgAACQkGAA4BAQYGAAMBAQMJCQYADgEBBgYAAwEBAwEBAwMADAMAAAAAARABAwMGAwEJAAwDAAAAAAECAgkJBgEGBgMBAAAAAAABAQEJCQYBBgYDAQAAAAAAAQEBAQABAAQABgACAwAAAgAAAAMAAAAADgAAAAABAAAAAAAAAAACAgQEAQQGBgYMAgIAAwAAAwABDAACBAABAAAAAwkJCQYADgEBBgYBAAAAAAMBAQgCAAIAAAICAgMAAAAAAAAAAAABBAABBAEEAAQEAAMAAAEAARkFBRUVFRUZBQUVFS0uBgEBAAABAAAAAAEAAAAEAAAGAQQEAAEABAQB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IRsgAiAbaiEcIAIgHDYCjAEgAigCjAEhHSACIB02AoQDQQQhHiACIB42AoADIAIoAoQDIR8gAigCgAMhICAgEChBACEhIAIgITYCbEEFISIgAiAiNgJoIAIpAmghfCACIHw3A5ABIAIoApABISMgAigClAEhJCACIB82ArABQfqBBCElIAIgJTYCrAEgAiAkNgKoASACICM2AqQBIAIoAqwBISYgAigCpAEhJyACKAKoASEoIAIgKDYCoAEgAiAnNgKcASACKQKcASF9IAIgfTcDKEEoISkgAiApaiEqICYgKhAqQecAISsgAiAraiEsIAIgLDYCyAFB3IQEIS0gAiAtNgLEARArQQYhLiACIC42AsABEC0hLyACIC82ArwBEC4hMCACIDA2ArgBQQchMSACIDE2ArQBEDAhMhAxITMQMiE0EDMhNSACKALAASE2IAIgNjYCiAMQJSE3IAIoAsABITggAigCvAEhOSACIDk2ApADEDQhOiACKAK8ASE7IAIoArgBITwgAiA8NgKMAxA0IT0gAigCuAEhPiACKALEASE/IAIoArQBIUAgAiBANgKUAxAmIUEgAigCtAEhQiAyIDMgNCA1IDcgOCA6IDsgPSA+ID8gQSBCEABB5wAhQyACIENqIUQgAiBENgLMASACKALMASFFIAIgRTYCnANBCCFGIAIgRjYCmAMgAigCnAMhRyACKAKYAyFIIEgQNiACICE2AmBBCSFJIAIgSTYCXCACKQJcIX4gAiB+NwPQASACKALQASFKIAIoAtQBIUsgAiBHNgLsAUHTgQQhTCACIEw2AugBIAIgSzYC5AEgAiBKNgLgASACKALsASFNIAIoAugBIU4gAigC4AEhTyACKALkASFQIAIgUDYC3AEgAiBPNgLYASACKQLYASF/IAIgfzcDIEEgIVEgAiBRaiFSIE4gUhA3IAIgITYCWEEKIVMgAiBTNgJUIAIpAlQhgAEgAiCAATcD8AEgAigC8AEhVCACKAL0ASFVIAIgTTYCjAJB8oQEIVYgAiBWNgKIAiACIFU2AoQCIAIgVDYCgAIgAigCjAIhVyACKAKIAiFYIAIoAoACIVkgAigChAIhWiACIFo2AvwBIAIgWTYC+AEgAikC+AEhgQEgAiCBATcDGEEYIVsgAiBbaiFcIFggXBA4IAIgITYCUEELIV0gAiBdNgJM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IACqIQcMAQtBgICAgHghBwsgAyAHtyIJOQMAIAAgCaFEAAAAAAAAcEGiIQAgBUEBcSEHQQAhBSAGIQMgBw0ACyACIAA5AyBBAiEDA0AgAyIFQX9qIQMgAkEQaiAFQQN0aisDAEQAAAAAAAAAAGENAAsgAkEQaiACIARBFHZB6ndqIAVBAWpBARCwBCEDIAIrAwAhAAJAIAhCf1UNACABIACaOQMAIAEgAisDCJo5AwhBACADayEDDAELIAEgADkDACABIAIrAwg5AwgLIAJBMGokACADC5oBAQN8IAAgAKIiAyADIAOioiADRHzVz1o62eU9okTrnCuK5uVavqCiIAMgA0R9/rFX4x3HPqJE1WHBGaABKr+gokSm+BARERGBP6CgIQQgAyAAoiEFAkAgAg0AIAUgAyAEokRJVVVVVVXFv6CiIACgDwsgACADIAFEAAAAAAAA4D+iIAQgBaKhoiABoSAFRElVVVVVVcU/oqChC9QBAgJ/AXwjAEEQayIBJAACQAJAIAC9QiCIp0H/////B3EiAkH7w6T/A0sNAEQAAAAAAADwPyEDIAJBnsGa8gNJDQEgAEQAAAAAAAAAABCvBCEDDAELAkAgAkGAgMD/B0kNACAAIAChIQMMAQsgACABELEEIQIgASsDCCEAIAErAwAhAwJAAkACQAJAIAJBA3EOAwABAgMLIAMgABCvBCEDDAMLIAMgAEEBELIEmiEDDAILIAMgABCvBJohAwwBCyADIABBARCyBCEDCyABQRBqJAAgAwvyAgIDfwF+AkAgAkUNACAAIAE6AAAgACACaiIDQX9qIAE6AAAgAkEDSQ0AIAAgAToAAiAAIAE6AAEgA0F9aiABOgAAIANBfmogAToAACACQQdJDQAgACABOgADIANBfGogAToAACACQQlJDQAgAEEAIABrQQNxIgRqIgMgAUH/AXFBgYKECGwiATYCACADIAIgBGtBfHEiBGoiAkF8aiABNgIAIARBCUkNACADIAE2AgggAyABNgIEIAJBeGogATYCACACQXRqIAE2AgAgBEEZSQ0AIAMgATYCGCADIAE2AhQgAyABNgIQIAMgATYCDCACQXBqIAE2AgAgAkFsaiABNgIAIAJBaGogATYCACACQWRqIAE2AgAgBCADQQRxQRhyIgVrIgJBIEkNACABrUKBgICAEH4hBiADIAVq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EK0GGgs4AQF/IwBBEGsiAyQAIAMgARCwBjYCDCADIAIQsAY2AgggACADQQxqIANBCGoQsQYaIANBEGokAAtDAQF/IwBBEGsiBCQAIAQgAjYCDCADIAEgAiABayICELQGGiAEIAMgAmo2AgggACAEQQxqIARBCGoQtQYgBEEQaiQACwcAIAAQggYLGAAgACABKAIANgIAIAAgAigCADYCBCAACwkAIAAgARC3BgsNACAAIAEgABCCBmtqCwcAIAAQsgYLGAAgACABKAIANgIAIAAgAigCADYCBCAACwcAIAAQswYLBAAgAAsWAAJAIAJFDQAgACABIAIQ9QQaCyAACwwAIAAgASACELYGGgsYACAAIAEoAgA2AgAgACACKAIANgIEIAALCQAgACABELgGCw0AIAAgASAAELMGa2oLKwEBfyMAQRBrIgMkACADQQhqIAAgASACELoGIAMoAgwhAiADQRBqJAAgAgsNACAAIAEgAiADELsGCw0AIAAgASACIAMQvAYLaQEBfyMAQSBrIgQkACAEQRhqIAEgAhC9BiAEQRBqIARBDGogBCgCGCAEKAIcIAMQvgYQvwYgBCABIAQoAhAQwAY2AgwgBCADIAQoAhQQwQY2AgggACAEQQxqIARBCGoQwgYgBEEgaiQACwsAIAAgASACEMMGCwcAIAAQxQYLDQAgACACIAMgBBDEBgsJACAAIAEQxwYLCQAgACABEMgGCwwAIAAgASACEMYGGgs4AQF/IwBBEGsiAyQAIAMgARDJBjYCDCADIAIQyQY2AgggACADQQxqIANBCGoQygYaIANBEGokAAtGAQF/IwBBEGsiBCQAIAQgAjYCDCADIAEgAiABayICQQJ1EM0GGiAEIAMgAmo2AgggACAEQQxqIARBCGoQzgYgBEEQaiQACwcAIAAQ0AYLGAAgACABKAIANgIAIAAgAigCADYCBCAACwkAIAAgARDRBgsNACAAIAEgABDQBmtqCwcAIAAQywYLGAAgACABKAIANgIAIAAgAigCADYCBCAACwcAIAAQzAYLBAAgAAsZAAJAIAJFDQAgACABIAJBAnQQ9QQaCyAACwwAIAAgASACEM8GGgsYACAAIAEoAgA2AgAgACACKAIANgIEIAALBAAgAAsJACAAIAEQ0gYLDQAgACABIAAQzAZragsEACAACwcAIAAQ1QYLBwAgABDWBgsEACAACwQAIAALCgAgABCFBigCAAsKACAAEIUGENoGCwQAIAALBAAgAAsLACAAIAEgAhDgBgsJACAAIAEQ4gYLMQEBfyAAEIUGIgIgAi0AC0GAAXEgAUH/AHFyOgALIAAQhQYiACAALQALQf8AcToACwsMACAAIAEtAAA6AAALCwAgASACQQEQ4wYLBwAgABDpBgsOACABEIYGGiAAEIYGGgseAAJAIAIQ5AZFDQAgACABIAIQ5QYPCyAAIAEQ5gYLBwAgAEEISwsJACAAIAIQ5wYLBwAgABDoBgsJACAAIAEQlBELBwAgABCQEQsEACAACwcAIAAQ6wYLBAAgAAsEACAACwkAIAAgARDvBgu4AQECfyMAQRBrIgQkAAJAIAAQ8AYgA0kNAAJAAkAgAxDxBkUNACAAIAMQ3gYgABDZBiEFDAELIARBCGogABCGBiADEPIGQQFqEPMGIAQoAggiBSAEKAIMEPQGIAAgBRD1BiAAIAQoAgwQ9gYgACADEPcGCwJAA0AgASACRg0BIAUgARDfBiAFQQFqIQUgAUEBaiEBDAALAAsgBEEAOgAHIAUgBEEHahDfBiAEQRBqJAAPCyAAEPgGAAsHACABIABrCxkAIAAQiAYQ+QYiACAAEPoGQQF2S3ZBcGoLBwAgAEELSQstAQF/QQohAQJAIABBC0kNACAAQQFqEP0GIgAgAEF/aiIAIABBC0YbIQELIAELGQAgASACEPwGIQEgACACNgIEIAAgATYCAAsCAAsMACAAEIUGIAE2AgALOgEBfyAAEIUGIgIgAigCCEGAgICAeHEgAUH/////B3FyNgIIIAAQhQYiACAAKAIIQYCAgIB4cjYCCAsMACAAEIUGIAE2AgQLCgBBiIQEEPsGAAsFABD6BgsFABD+BgsFABARAAsaAAJAIAAQ+QYgAU8NABD/BgALIAFBARCABwsKACAAQQ9qQXBxCwQAQX8LBQAQEQALGgACQCABEOQGRQ0AIAAgARCBBw8LIAAQggcLCQAgACABEJIRCwcAIAAQjxELGAACQCAAEIsGRQ0AIAAQhQcPCyAAEIYHCw0AIAEoAgAgAigCAEkLCgAgABCMBigCAAsKACAAEIwGEIcHCwQAIAALMQEBfwJAIAAoAgAiAUUNAAJAIAEQqAUQjgUQqwUNACAAKAIARQ8LIABBADYCAAtBAQsRACAAIAEgACgCACgCHBEBAAsxAQF/AkAgACgCACIBRQ0AAkAgARDsBRDUBRDuBQ0AIAAoAgBFDwsgAEEANgIAC0EBCxEAIAAgASAAKAIAKAIsEQEACwQAQQALMQEBfyMAQRBrIgIkACAAIAJBD2ogAkEOahD8BSIAIAEgARCOBxChESACQRBqJAAgAAsHACAAEJgHC0ABAn8gACgCKCECA0ACQCACDQAPCyABIAAgACgCJCACQX9qIgJBAnQiA2ooAgAgACgCICADaigCABEGAAwACwALDQAgACABQRxqELENGgsJACAAIAEQkwcLKAAgACAAKAIYRSABciIBNgIQAkAgACgCFCABcUUNAEGzggQQlgcACwspAQJ/IwBBEGsiAiQAIAJBD2ogACABEIQHIQMgAkEQaiQAIAEgACADGwtAACAAQfS9BEEIajYCACAAQQAQjwcgAEEcahCyDRogACgCIBDWBCAAKAIkENYEIAAoAjAQ1gQgACgCPBDWBCAACw0AIAAQlAcaIAAQkBELBQAQEQALQQAgAEEANgIUIAAgATYCGCAAQQA2AgwgAEKCoICA4AA3AgQgACABRTYCECAAQSBqQQBBKBC0BBogAEEcahCwDRoLBwAgABDQBAsOACAAIAEoAgA2AgAgAAsEACAACwQAQQALBABCAAuhAQEDf0F/IQICQCAAQX9GDQACQAJAIAEoAkxBAE4NAEEBIQMMAQsgARDyBEUhAwsCQAJAAkAgASgCBCIEDQAgARD2BBogASgCBCIERQ0BCyAEIAEoAixBeGpLDQELIAMNASABEPMEQX8PCyABIARBf2oiAjYCBCACIAA6AAAgASABKAIAQW9xNgIAAkAgAw0AIAEQ8wQLIABB/wFxIQILIAILQQECfyMAQRBrIgEkAEF/IQICQCAAEPYEDQAgACABQQ9qQQEgACgCIBEDAEEBRw0AIAEtAA8hAgsgAUEQaiQAIAILBwAgABCgBwtaAQF/AkACQCAAKAJMIgFBAEgNACABRQ0BIAFB/////wNxEMoEKAIYRw0BCwJAIAAoAgQiASAAKAIIRg0AIAAgAUEBajYCBCABLQAADwsgABCeBw8LIAAQoQcLYwECfwJAIABBzABqIgEQogdFDQAgABDyBBoLAkACQCAAKAIEIgIgACgCCEYNACAAIAJBAWo2AgQg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wQUQvgcaQei+BUHAvQVBACgCwL0FQXRqKAIAahDoBRC+BxpB7LoFQQAoAuy6BUF0aigCAGpBmLwFEL8HGkHAvQVBACgCwL0FQXRqKAIAahC6BxpBwL0FQQAoAsC9BUF0aigCAGpBmLwFEL8HGiAAC20BAX8jAEEQayIDJAAgABD+BCIAIAI2AiggACABNgIgIABB7MAEQQhqNgIAEI4FIQIgAEEAOgA0IAAgAjYCMCADQQxqIAAQgAYgACADQQxqIAAoAgAoAggRAgAgA0EMahCyDRogA0EQaiQAIAALNgEBfyAAQQhqEMAHIQIgAEHMtwRBDGo2AgAgAkHMtwRBIGo2AgAgAEEANgIEIAIgARDBByAAC2MBAX8jAEEQayIDJAAgABD+BCIAIAE2AiAgAEHQwQRBCGo2AgAgA0EMaiAAEIAGIANBDGoQlgYhASADQQxqELINGiAAIAI2AiggACABNgIkIAAgARCXBjoALCADQRBqJAAgAAsvAQF/IABBBGoQwAchAiAAQfy3BEEMajYCACACQfy3BEEgajYCACACIAEQwQcgAAsUAQF/IAAoAkghAiAAIAE2AkggAgsOACAAQYDAABDCBxogAAttAQF/IwBBEGsiAyQAIAAQxwUiACACNgIoIAAgATYCICAAQbjCBEEIajYCABDUBSECIABBADoANCAAIAI2AjAgA0EMaiAAEMMHIAAgA0EMaiAAKAIAKAIIEQIAIANBDGoQsg0aIANBEGokACAACzYBAX8gAEEIahDEByECIABB7LgEQQxqNgIAIAJB7LgEQSBqNgIAIABBADYCBCACIAEQxQcgAAtjAQF/IwBBEGsiAyQAIAAQxwUiACABNgIgIABBnMMEQQhqNgIAIANBDGogABDDByADQQxqEMYHIQEgA0EMahCyDRogACACNgIoIAAgATYCJCAAIAEQxwc6ACwgA0EQaiQAIAALLwEBfyAAQQRqEMQHIQIgAEGcuQRBDGo2AgAgAkGcuQRBIGo2AgAgAiABEMUHIAALFAEBfyAAKAJIIQIgACABNgJIIAILFQAgABDXByIAQcy5BEEIajYCACAACxgAIAAgARCXByAAQQA2AkggABCOBTYCTAsVAQF/IAAgACgCBCICIAFyNgIEIAILDQAgACABQQRqELENGgsVACAAENcHIgBB4LsEQQhqNgIAIAAL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AyABa6xZDQAgASAFp2ohAwsgACADNgJoIAAgBCAAKAIsIgMgAWusfDcDeAJAIAEgA0sNACABQX9qIAI6AAALIAILUwEBfgJAAkAgA0HAAHFFDQAgASADQUBqrYYhAkIAIQEMAQsgA0UNACABQcAAIANrrYggAiADrSIEhoQhAiABIASGIQELIAAgATcDACAAIAI3AwgL4QECA38CfiMAQRBrIgIkAAJAAkAgAbwiA0H/////B3EiBEGAgIB8akH////3B0sNACAErUIZhkKAgICAgICAwD98IQVCACEGDAELAkAgBEGAgID8B0kNACADrUIZhkKAgICAgIDA//8AhCEFQgAhBgwBCwJAIAQNAEIAIQZCACEFDAELIAIgBK1CACAEZyIEQdEAahD0ByACQQhqKQMAQoCAgICAgMAAhUGJ/wAgBGutQjCGhCEFIAIpAwAhBgsgACAGNwMAIAAgBSADQYCAgIB4ca1CIIaENwMIIAJBEGokAAuNAQICfwJ+IwBBEGsiAiQAAkACQCABDQBCACEEQgAhBQwBCyACIAEgAUEfdSIDcyADayIDrUIAIANnIgNB0QBqEPQHIAJBCGopAwBCgICAgICAwACFQZ6AASADa61CMIZ8IAFBgICAgHhxrUIghoQhBSACKQMAIQQLIAAgBDcDACAAIAU3AwggAkEQaiQAC1MBAX4CQAJAIANBwABxRQ0AIAIgA0FAaq2IIQFCACECDAELIANFDQAgAkHAACADa62GIAEgA60iBIiEIQEgAiAEiCECCyAAIAE3AwAgACACNwMIC5oLAgV/D34jAEHgAGsiBSQAIARC////////P4MhCiAEIAKFQoCAgICAgICAgH+DIQsgAkL///////8/gyIMQiCIIQ0gBEIwiKdB//8BcSEGAkACQAJAIAJCMIinQf//AXEiB0GBgH5qQYKAfkkNAEEAIQggBkGBgH5qQYGAfksNAQsCQCABUCACQv///////////wCDIg5CgICAgICAwP//AFQgDkKAgICAgIDA//8AURsNACACQoCAgICAgCCEIQsMAgsCQCADUCAEQv///////////wCDIgJCgICAgICAwP//AFQgAkKAgICAgIDA//8AURsNACAEQoCAgICAgCCEIQsgAyEBDAILAkAgASAOQoCAgICAgMD//wCFhEIAUg0AAkAgAyAChFBFDQBCgICAgICA4P//ACELQgAhAQwDCyALQoCAgICAgMD//wCEIQtCACEBDAILAkAgAyACQoCAgICAgMD//wCFhEIAUg0AIAEgDoQhAkIAIQECQCACUEUNAEKAgICAgIDg//8AIQsMAwsgC0KAgICAgIDA//8AhCELDAILAkAgASAOhEIAUg0AQgAhAQwCCwJAIAMgAoRCAFINAEIAIQEMAgtBACEIAkAgDkL///////8/Vg0AIAVB0ABqIAEgDCABIAwgDFAiCBt5IAhBBnStfKciCEFxahD0B0EQIAhrIQggBUHYAGopAwAiDEIgiCENIAUpA1AhAQsgAkL///////8/Vg0AIAVBwABqIAMgCiADIAogClAiCRt5IAlBBnStfKciCUFxahD0ByAIIAlrQRBqIQggBUHIAGopAwAhCiAFKQNAIQMLIANCD4YiDkKAgP7/D4MiAiABQiCIIgR+Ig8gDkIgiCIOIAFC/////w+DIgF+fCIQQiCGIhEgAiABfnwiEiARVK0gAiAMQv////8PgyIMfiITIA4gBH58IhEgA0IxiCAKQg+GIhSEQv////8PgyIDIAF+fCIVIBBCIIggECAPVK1CIIaEfCIQIAIgDUKAgASEIgp+IhYgDiAMfnwiDSAUQiCIQoCAgIAIhCICIAF+fCIPIAMgBH58IhRCIIZ8Ihd8IQEgByAGaiAIakGBgH9qIQYCQAJAIAIgBH4iGCAOIAp+fCIEIBhUrSAEIAMgDH58Ig4gBFStfCACIAp+fCAOIBEgE1StIBUgEVStfHwiBCAOVK18IAMgCn4iAyACIAx+fCICIANUrUIghiACQiCIhHwgBCACQiCGfCICIARUrXwgAiAUQiCIIA0gFlStIA8gDVStfCAUIA9UrXxCIIaEfCIEIAJUrXwgBCAQIBVUrSAXIBBUrXx8IgIgBFStfCIEQoCAgICAgMAAg1ANACAGQQFqIQYMAQsgEkI/iCEDIARCAYYgAkI/iIQhBCACQgGGIAFCP4iEIQIgEkIBhiESIAMgAUIBhoQhAQsCQCAGQf//AUgNACALQoCAgICAgMD//wCEIQtCACEBDAELAkACQCAGQQBKDQACQEEBIAZrIgdB/wBLDQAgBUEwaiASIAEgBkH/AGoiBhD0ByAFQSBqIAIgBCAGEPQHIAVBEGogEiABIAcQ9wcgBSACIAQgBxD3ByAFKQMgIAUpAxCEIAUpAzAgBUEwakEIaikDAIRCAFKthCESIAVBIGpBCGopAwAgBUEQakEIaikDAIQhASAFQQhqKQMAIQQgBSkDACECDAILQgAhAQwCCyAGrUIwhiAEQv///////z+DhCEECyAEIAuEIQsCQCASUCABQn9VIAFCgICAgICAgICAf1EbDQAgCyACQgF8IgFQrXwhCwwBCwJAIBIgAUKAgICAgICAgIB/hYRCAFENACACIQEMAQsgCyACIAJCAYN8IgEgAlStfCELCyAAIAE3AwAgACALNwMIIAVB4ABqJAALBABBAAsEAEEAC+oKAgR/BH4jAEHwAGsiBSQAIARC////////////AIMhCQJAAkACQCABUCIGIAJC////////////AIMiCkKAgICAgIDAgIB/fEKAgICAgIDAgIB/VCAKUBsNACADQgBSIAlCgICAgICAwICAf3wiC0KAgICAgIDAgIB/ViALQoCAgICAgMCAgH9RGw0BCwJAIAYgCkKAgICAgIDA//8AVCAKQoCAgICAgMD//wBRGw0AIAJCgICAgICAIIQhBCABIQMMAgsCQCADUCAJQoCAgICAgMD//wBUIAlCgICAgICAwP//AFEbDQAgBEKAgICAgIAghCEEDAILAkAgASAKQoCAgICAgMD//wCFhEIAUg0AQoCAgICAgOD//wAgAiADIAGFIAQgAoVCgICAgICAgICAf4WEUCIGGyEEQgAgASAGGyEDDAILIAMgCUKAgICAgIDA//8AhYRQDQECQCABIAqEQgBSDQAgAyAJhEIAUg0CIAMgAYMhAyAEIAKDIQQMAgsgAyAJhFBFDQAgASEDIAIhBAwBCyADIAEgAyABViAJIApWIAkgClEbIgcbIQkgBCACIAcbIgtC////////P4MhCiACIAQgBxsiDEIwiKdB//8BcSEIAkAgC0IwiKdB//8BcSIGDQAgBUHgAGogCSAKIAkgCiAKUCIGG3kgBkEGdK18pyIGQXFqEPQHQRAgBmshBiAFQegAaikDACEKIAUpA2AhCQsgASADIAcbIQMgDEL///////8/gyEBAkAgCA0AIAVB0ABqIAMgASADIAEgAVAiBxt5IAdBBnStfKciB0FxahD0B0EQIAdrIQggBUHYAGopAwAhASAFKQNQIQMLIAFCA4YgA0I9iIRCgICAgICAgASEIQEgCkIDhiAJQj2IhCEMIANCA4YhCiAEIAKFIQMCQCAGIAhGDQACQCAGIAhrIgdB/wBNDQBCACEBQgEhCgwBCyAFQcAAaiAKIAFBgAEgB2sQ9AcgBUEwaiAKIAEgBxD3ByAFKQMwIAUpA0AgBUHAAGpBCGopAwCEQgBSrYQhCiAFQTBqQQhqKQMAIQELIAxCgICAgICAgASEIQwgCUIDhiEJAkACQCADQn9VDQBCACEDQgAhBCAJIAqFIAwgAYWEUA0CIAkgCn0hAiAMIAF9IAkgClStfSIEQv////////8DVg0BIAVBIGogAiAEIAIgBCAEUCIHG3kgB0EGdK18p0F0aiIHEPQHIAYgB2shBiAFQShqKQMAIQQgBSkDICECDAELIAEgDHwgCiAJfCICIApUrXwiBEKAgICAgICACINQDQAgAkIBiCAEQj+GhCAKQgGDhCECIAZBAWohBiAEQgGIIQQLIAtCgICAgICAgICAf4MhCgJAIAZB//8BSA0AIApCgICAgICAwP//AIQhBEIAIQMMAQtBACEHAkACQCAGQQBMDQAgBiEHDAELIAVBEGogAiAEIAZB/wBqEPQHIAUgAiAEQQEgBmsQ9wcgBSkDACAFKQMQIAVBEGpBCGopAwCEQgBSrYQhAiAFQQhqKQMAIQQLIAJCA4ggBEI9hoQhAyAHrUIwhiAEQgOIQv///////z+DhCAKhCEEIAKnQQdxIQYCQAJAAkACQAJAEPkHDgMAAQIDCwJAIAZBBEYNACAEIAMgBkEES618IgogA1StfCEEIAohAwwDCyAEIAMgA0IBg3wiCiADVK18IQQgCiEDDAMLIAQgAyAKQgBSIAZBAEdxrXwiCiADVK18IQQgCiEDDAELIAQgAyAKUCAGQQBHca18IgogA1StfCEEIAohAwsgBkUNAQsQ+gcaCyAAIAM3AwAgACAENwMIIAVB8ABqJAALjgICAn8DfiMAQRBrIgIkAAJAAkAgAb0iBEL///////////8AgyIFQoCAgICAgIB4fEL/////////7/8AVg0AIAVCPIYhBiAFQgSIQoCAgICAgICAPHwhBQwBCwJAIAVCgICAgICAgPj/AFQNACAEQjyGIQYgBEIEiEKAgICAgIDA//8AhCEFDAELAkAgBVBFDQBCACEGQgAhBQwBCyACIAVCACAFp2dBIGogBUIgiKdnIAVCgICAgBBUGyIDQTFqEPQHIAJBCGopAwBCgICAgICAwACFQYz4ACADa61CMIaEIQUgAikDACEGCyAAIAY3AwAgACAFIARCgICAgICAgICAf4OENwMIIAJBEGokAAvgAQIBfwJ+QQEhBAJAIABCAFIgAUL///////////8AgyIFQoCAgICAgMD//wBWIAVCgICAgICAwP//AFEbDQAgAkIAUiADQv///////////wCDIgZCgICAgICAwP//AFYgBkKAgICAgIDA//8AURsNAAJAIAIgAIQgBiAFhIRQRQ0AQQAPCwJAIAMgAYNCAFMNAEF/IQQgACACVCABIANTIAEgA1EbDQEgACAChSABIAOFhEIAUg8LQX8hBCAAIAJWIAEgA1UgASADURsNACAAIAKFIAEgA4WEQgBSIQQLIAQL2AECAX8CfkF/IQQCQCAAQgBSIAFC////////////AIMiBUKAgICAgIDA//8AViAFQoCAgICAgMD//wBRGw0AIAJCAFIgA0L///////////8AgyIGQoCAgICAgMD//wBWIAZCgICAgICAwP//AFEbDQACQCACIACEIAYgBYSEUEUNAEEADwsCQCADIAGDQgBTDQAgACACVCABIANTIAEgA1EbDQEgACAChSABIAOFhEIAUg8LIAAgAlYgASADVSABIANRGw0AIAAgAoUgASADhYRCAFIhBAsgBAs8ACAAIAE3AwAgACAEQjCIp0GAgAJxIAJCgICAgICAwP//AINCMIincq1CMIYgAkL///////8/g4Q3AwgLdQIBfwJ+IwBBEGsiAiQAAkACQCABDQBCACEDQgAhBAwBCyACIAGtQgBB8AAgAWciAUEfc2sQ9AcgAkEIaikDAEKAgICAgIDAAIVBnoABIAFrrUIwhnwhBCACKQMAIQMLIAAgAzcDACAAIAQ3AwggAkEQaiQAC0gBAX8jAEEQayIFJAAgBSABIAIgAyAEQoCAgICAgICAgH+FEPsHIAUpAwAhBCAAIAVBCGopAwA3AwggACAENwMAIAVBEGokAAvnAgEBfyMAQdAAayIEJAACQAJAIANBgIABSA0AIARBIGogASACQgBCgICAgICAgP//ABD4ByAEQSBqQQhqKQMAIQIgBCkDICEBAkAgA0H//wFPDQAgA0GBgH9qIQMMAgsgBEEQaiABIAJCAEKAgICAgICA//8AEPgHIANB/f8CIANB/f8CSRtBgoB+aiEDIARBEGpBCGopAwAhAiAEKQMQIQEMAQsgA0GBgH9KDQAgBEHAAGogASACQgBCgICAgICAgDkQ+AcgBEHAAGpBCGopAwAhAiAEKQNAIQECQCADQfSAfk0NACADQY3/AGohAwwBCyAEQTBqIAEgAkIAQoCAgICAgIA5EPgHIANB6IF9IANB6IF9SxtBmv4BaiEDIARBMGpBCGopAwAhAiAEKQMwIQELIAQgASACQgAgA0H//wBqrUIwhhD4ByAAIARBCGopAwA3AwggACAEKQMANwMAIARB0ABqJAALdQEBfiAAIAQgAX4gAiADfnwgA0IgiCICIAFCIIgiBH58IANC/////w+DIgMgAUL/////D4MiAX4iBUIgiCADIAR+fCIDQiCIfCADQv////8PgyACIAF+fCIBQiCIfDcDCCAAIAFCIIYgBUL/////D4OENwMAC+cQAgV/D34jAEHQAmsiBSQAIARC////////P4MhCiACQv///////z+DIQsgBCAChUKAgICAgICAgIB/gyEMIARCMIinQf//AXEhBgJAAkACQCACQjCIp0H//wFxIgdBgYB+akGCgH5JDQBBACEIIAZBgYB+akGBgH5LDQELAkAgAVAgAkL///////////8AgyINQoCAgICAgMD//wBUIA1CgICAgICAwP//AFEbDQAgAkKAgICAgIAghCEMDAILAkAgA1AgBEL///////////8AgyICQoCAgICAgMD//wBUIAJCgICAgICAwP//AFEbDQAgBEKAgICAgIAghCEMIAMhAQwCCwJAIAEgDUKAgICAgIDA//8AhYRCAFINAAJAIAMgAkKAgICAgIDA//8AhYRQRQ0AQgAhAUKAgICAgIDg//8AIQwMAwsgDEKAgICAgIDA//8AhCEMQgAhAQwCCwJAIAMgAkKAgICAgIDA//8AhYRCAFINAEIAIQEMAgsCQCABIA2EQgBSDQBCgICAgICA4P//ACAMIAMgAoRQGyEMQgAhAQwCCwJAIAMgAoRCAFINACAMQoCAgICAgMD//wCEIQxCACEBDAILQQAhCAJAIA1C////////P1YNACAFQcACaiABIAsgASALIAtQIggbeSAIQQZ0rXynIghBcWoQ9AdBECAIayEIIAVByAJqKQMAIQsgBSkDwAIhAQsgAkL///////8/Vg0AIAVBsAJqIAMgCiADIAogClAiCRt5IAlBBnStfKciCUFxahD0ByAJIAhqQXBqIQggBUG4AmopAwAhCiAFKQOwAiEDCyAFQaACaiADQjGIIApCgICAgICAwACEIg5CD4aEIgJCAEKAgICAsOa8gvUAIAJ9IgRCABCDCCAFQZACakIAIAVBoAJqQQhqKQMAfUIAIARCABCDCCAFQYACaiAFKQOQAkI/iCAFQZACakEIaikDAEIBhoQiBEIAIAJCABCDCCAFQfABaiAEQgBCACAFQYACakEIaikDAH1CABCDCCAFQeABaiAFKQPwAUI/iCAFQfABakEIaikDAEIBhoQiBEIAIAJCABCDCCAFQdABaiAEQgBCACAFQeABakEIaikDAH1CABCDCCAFQcABaiAFKQPQAUI/iCAFQdABakEIaikDAEIBhoQiBEIAIAJCABCDCCAFQbABaiAEQgBCACAFQcABakEIaikDAH1CABCDCCAFQaABaiACQgAgBSkDsAFCP4ggBUGwAWpBCGopAwBCAYaEQn98IgRCABCDCCAFQZABaiADQg+GQgAgBEIAEIMIIAVB8ABqIARCAEIAIAVBoAFqQQhqKQMAIAUpA6ABIgogBUGQAWpBCGopAwB8IgIgClStfCACQgFWrXx9QgAQgwggBUGAAWpCASACfUIAIARCABCDCCAIIAcgBmtqIQYCQAJAIAUpA3AiD0IBhiIQIAUpA4ABQj+IIAVBgAFqQQhqKQMAIhFCAYaEfCINQpmTf3wiEkIgiCICIAtCgICAgICAwACEIhNCAYYiFEIgiCIEfiIVIAFCAYYiFkIgiCIKIAVB8ABqQQhqKQMAQgGGIA9CP4iEIBFCP4h8IA0gEFStfCASIA1UrXxCf3wiD0IgiCINfnwiECAVVK0gECAPQv////8PgyIPIAFCP4giFyALQgGGhEL/////D4MiC358IhEgEFStfCANIAR+fCAPIAR+IhUgCyANfnwiECAVVK1CIIYgEEIgiIR8IBEgEEIghnwiECARVK18IBAgEkL/////D4MiEiALfiIVIAIgCn58IhEgFVStIBEgDyAWQv7///8PgyIVfnwiGCARVK18fCIRIBBUrXwgESASIAR+IhAgFSANfnwiBCACIAt+fCILIA8gCn58Ig1CIIggBCAQVK0gCyAEVK18IA0gC1StfEIghoR8IgQgEVStfCAEIBggAiAVfiICIBIgCn58IgtCIIggCyACVK1CIIaEfCICIBhUrSACIA1CIIZ8IAJUrXx8IgIgBFStfCIEQv////////8AVg0AIBQgF4QhEyAFQdAAaiACIAQgAyAOEIMIIAFCMYYgBUHQAGpBCGopAwB9IAUpA1AiAUIAUq19IQogBkH+/wBqIQZCACABfSELDAELIAVB4ABqIAJCAYggBEI/hoQiAiAEQgGIIgQgAyAOEIMIIAFCMIYgBUHgAGpBCGopAwB9IAUpA2AiC0IAUq19IQogBkH//wBqIQZCACALfSELIAEhFgsCQCAGQf//AUgNACAMQoCAgICAgMD//wCEIQxCACEBDAELAkACQCAGQQFIDQAgCkIBhiALQj+IhCEBIAatQjCGIARC////////P4OEIQogC0IBhiEEDAELAkAgBkGPf0oNAEIAIQEMAgsgBUHAAGogAiAEQQEgBmsQ9wcgBUEwaiAWIBMgBkHwAGoQ9AcgBUEgaiADIA4gBSkDQCICIAVBwABqQQhqKQMAIgoQgwggBUEwakEIaikDACAFQSBqQQhqKQMAQgGGIAUpAyAiAUI/iIR9IAUpAzAiBCABQgGGIgtUrX0hASAEIAt9IQQLIAVBEGogAyAOQgNCABCDCCAFIAMgDkIFQgAQgwggCiACIAJCAYMiCyAEfCIEIANWIAEgBCALVK18IgEgDlYgASAOURutfCIDIAJUrXwiAiADIAJCgICAgICAwP//AFQgBCAFKQMQViABIAVBEGpBCGopAwAiAlYgASACURtxrXwiAiADVK18IgMgAiADQoCAgICAgMD//wBUIAQgBSkDAFYgASAFQQhqKQMAIgRWIAEgBFEbca18IgEgAlStfCAMhCEMCyAAIAE3AwAgACAMNwMIIAVB0AJqJAALSwIBfgJ/IAFC////////P4MhAgJAAkAgAUIwiKdB//8BcSIDQf//AUYNAEEEIQQgAw0BQQJBAyACIACEUBsPCyACIACEUCEECyAEC9UGAgR/A34jAEGAAWsiBSQAAkACQAJAIAMgBEIAQgAQ/QdFDQAgAyAEEIUIIQYgAkIwiKciB0H//wFxIghB//8BRg0AIAYNAQsgBUEQaiABIAIgAyAEEPgHIAUgBSkDECIEIAVBEGpBCGopAwAiAyAEIAMQhAggBUEIaikDACECIAUpAwAhBAwBCwJAIAEgAkL///////////8AgyIJIAMgBEL///////////8AgyIKEP0HQQBKDQACQCABIAkgAyAKEP0HRQ0AIAEhBAwCCyAFQfAAaiABIAJCAEIAEPgHIAVB+ABqKQMAIQIgBSkDcCEEDAELIARCMIinQf//AXEhBgJAAkAgCEUNACABIQQMAQsgBUHgAGogASAJQgBCgICAgICAwLvAABD4ByAFQegAaikDACIJQjCIp0GIf2ohCCAFKQNgIQQLAkAgBg0AIAVB0ABqIAMgCkIAQoCAgICAgMC7wAAQ+AcgBUHYAGopAwAiCkIwiKdBiH9qIQYgBSkDUCEDCyAKQv///////z+DQoCAgICAgMAAhCELIAlC////////P4NCgICAgICAwACEIQkCQCAIIAZMDQADQAJAAkAgCSALfSAEIANUrX0iCkIAUw0AAkAgCiAEIAN9IgSEQgBSDQAgBUEgaiABIAJCAEIAEPgHIAVBKGopAwAhAiAFKQMgIQQMBQsgCkIBhiAEQj+IhCEJDAELIAlCAYYgBEI/iIQhCQsgBEIBhiEEIAhBf2oiCCAGSg0ACyAGIQgLAkACQCAJIAt9IAQgA1StfSIKQgBZDQAgCSEKDAELIAogBCADfSIEhEIAUg0AIAVBMGogASACQgBCABD4ByAFQThqKQMAIQIgBSkDMCEEDAELAkAgCkL///////8/Vg0AA0AgBEI/iCEDIAhBf2ohCCAEQgGGIQQgAyAKQgGGhCIKQoCAgICAgMAAVA0ACwsgB0GAgAJxIQYCQCAIQQBKDQAgBUHAAGogBCAKQv///////z+DIAhB+ABqIAZyrUIwhoRCAEKAgICAgIDAwz8Q+AcgBUHIAGopAwAhAiAFKQNAIQQMAQsgCkL///////8/gyAIIAZyrUIwhoQhAgsgACAENwMAIAAgAjcDCCAFQYABaiQACxwAIAAgAkL///////////8AgzcDCCAAIAE3AwALlQkCBn8DfiMAQTBrIgQkAEIAIQoCQAJAIAJBAksNACACQQJ0IgJBzMQEaigCACEFIAJBwMQEaigCACEGA0ACQAJAIAEoAgQiAiABKAJoRg0AIAEgAkEBajYCBCACLQAAIQIMAQsg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LQAAIQUMAQsgABDzByEFCyAJIAuGIAqEIQkgASAFQeHEBGotAAAiAk0NASAJIAxYDQALCyABIAVB4cQEai0AAE0NAANAAkACQCAAKAIEIgUgACgCaEYNACAAIAVBAWo2AgQgBS0AACEFDAELIAAQ8wchBQsgASAFQeHEBGotAABLDQALENIEQcQANgIAIAZBACADQgGDUBshBiADIQkLAkAgACkDcEIAUw0AIAAgACgCBEF/ajYCBAsCQCAJIANUDQACQCADp0EBcQ0AIAYNABDSBEHEADYCACADQn98IQMMAgsgCSADWA0AENIEQcQANgIADAELIAkgBqwiA4UgA30hAwsgBEEQaiQAIAMLEAAgAEEgRiAAQXdqQQVJcgvEAwIDfwF+IwBBIGsiAiQAAkACQCABQv///////////wCDIgVCgICAgICAwL9AfCAFQoCAgICAgMDAv398Wg0AIAFCGYinIQMCQCAAUCABQv///w+DIgVCgICACFQgBUKAgIAIURsNACADQYGAgIAEaiEEDAILIANBgICAgARqIQQgACAFQoCAgAiFhEIAUg0BIAQgA0EBcWohBAwBCwJAIABQIAVCgICAgICAwP//AFQgBUKAgICAgIDA//8AURsNACABQhmIp0H///8BcUGAgID+B3IhBAwBC0GAgID8ByEEIAVC////////v7/AAFYNAEEAIQQgBUIwiKciA0GR/gBJDQAgAkEQaiAAIAFC////////P4NCgICAgICAwACEIgUgA0H/gX9qEPQHIAIgACAFQYH/ACADaxD3ByACQQhqKQMAIgVCGYinIQQCQCACKQMAIAIpAxAgAkEQakEIaikDAIRCAFKthCIAUCAFQv///w+DIgVCgICACFQgBUKAgIAIURsNACAEQQFqIQQMAQsgACAFQoCAgAiFhEIAUg0AIARBAXEgBGohBAsgAkEgaiQAIAQgAUIgiKdBgICAgHhxcr4L5AMCAn8CfiMAQSBrIgIkAAJAAkAgAUL///////////8AgyIEQoCAgICAgMD/Q3wgBEKAgICAgIDAgLx/fFoNACAAQjyIIAFCBIaEIQQCQCAAQv//////////D4MiAEKBgICAgICAgAhUDQAgBEKBgICAgICAgMAAfCEFDAILIARCgICAgICAgIDAAHwhBSAAQoCAgICAgICACFINASAF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DAELCwtBACELDAMLQT0hFgsQ0gQgFjYCAAtBfyELCyAHQdAAaiQAIAsLGQACQCAALQAAQSBxDQAgASACIAAQ+AQaCwt7AQV/QQAhAQJAIAAoAgAiAiwAAEFQaiIDQQlNDQBBAA8LA0BBfyEEAkAgAUHMmbPmAEsNAEF/IAMgAUEKbCIBaiADIAFB/////wdzSxshBAsgACACQQFqIgM2AgAgAiwAASEFIAQhASADIQIgBUFQaiIDQQpJDQALIAQLtgQAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgAUF3ag4SAAECBQMEBgcICQoLDA0ODxAREgsgAiACKAIAIgFBBGo2AgAgACABKAIANgIADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABMgEANwMADwsgAiACKAIAIgFBBGo2AgAgACABMwEANwMADwsgAiACKAIAIgFBBGo2AgAgACABMAAANwMADwsgAiACKAIAIgFBBGo2AgAgACABMQAANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKwMAOQMADwsgACACIAMRAgALCz4BAX8CQCAAUA0AA0AgAUF/aiIBIACnQQ9xQZDLBGotAAAgAnI6AAAgAEIPViEDIABCBIghACADDQALCyABCzYBAX8CQCAAUA0AA0AgAUF/aiIBIACnQQdxQTByOgAAIABCB1YhAiAAQgOIIQAgAg0ACwsgAQuIAQIBfgN/AkACQCAAQoCAgIAQWg0A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AQsgABDZBiECIAFBADoADiACIAFBDmoQ3wYgAEEAEN4GCyABQRBqJAAL0wEBBH8jAEEQayIDJAAgABCOBiEEIAAQjwYhBQJAIAEgAhDtBiIGRQ0AAkAgACABEKQLDQACQCAFIARrIAZPDQAgACAFIAQgBWsgBmogBCAEQQBBABClCwsgABCBBiAEaiEFAkADQCABIAJGDQEgBSABEN8GIAFBAWohASAFQQFqIQUMAAsACyADQQA6AA8gBSADQQ9qEN8GIAAgBiAEahCmCwwBCyAAIAMgASACIAAQhgYQhwYiARCNBiABEI4GEKURGiABEJ4RGgsgA0EQaiQAIAALGgAgABCNBiAAEI0GIAAQjgZqQQFqIAEQuA8LIAAgACABIAIgAyAEIAUgBhCGDyAAIAMgBWsgBmoQ9wYLHAACQCAAEIsGRQ0AIAAgARD3Bg8LIAAgARDeBgsWACAAIAEQ/RAiAUEEaiACEJkHGiABCwcAIAAQgRELCwAgAEHAwwUQ5wgLEQAgACABIAEoAgAoAiwRAgALEQAgACABIAEoAgAoAiARAgALEQAgACABIAEoAgAoAhwRAgALDwAgACAAKAIAKAIMEQAACw8AIAAgACgCACgCEBEAAAsRACAAIAEgASgCACgCFBECAAsRACAAIAEgASgCACgCGBECAAsPACAAIAAoAgAoAiQRAAALCwAgAEG4wwUQ5wgLEQAgACABIAEoAgAoAiwRAgALEQAgACABIAEoAgAoAiARAgALEQAgACABIAEoAgAoAhwRAgALDwAgACAAKAIAKAIMEQAACw8AIAAgACgCACgCEBEAAAsRACAAIAEgASgCACgCFBECAAsRACAAIAEgASgCACgCGBECAAsPACAAIAAoAgAoAiQRAAALEgAgACACNgIEIAAgAToAACAACwcAIAAoAgALDQAgABC+CyABELwLRgsHACAAKAIACy8BAX8jAEEQayIDJAAgABC6DyABELoPIAIQug8gA0EPahC7DyECIANBEGokACACCzIBAX8jAEEQayICJAAgAiAAKAIANgIMIAJBDGogARDBDxogAigCDCEAIAJBEGokACAACwcAIAAQoAsLGgEBfyAAEJ8LKAIAIQEgABCfC0EANgIAIAELIgAgACABEMILEOYJIAEQwQsoAgAhASAAEKALIAE2AgAgAAsHACAAEP8QCxoBAX8gABD+ECgCACEBIAAQ/hBBADYCACABCyIAIAAgARDFCxDICyABEMQLKAIAIQEgABD/ECABNgIAIAALCQAgACABEKsOCy0BAX8gABD+ECgCACECIAAQ/hAgATYCAAJAIAJFDQAgAiAAEP8QKAIAEQQACwuVBAECfyMAQfAEayIHJAAgByACNgLoBCAHIAE2AuwEIAdBiAE2AhAgB0HIAWogB0HQAWogB0EQahCECiEBIAdBwAFqIAQQkAcgB0HAAWoQ4gUhCCAHQQA6AL8BAkAgB0HsBGogAiADIAdBwAFqIAQQnAUgBSAHQb8BaiAIIAEgB0HEAWogB0HgBGoQygtFDQAgB0EAOgC+ASAHQbjyADsAvAEgB0Kw4siZw6aNmzc3ALQBIAggB0G0AWogB0G+AWogB0GAAWoQuwkaIAdBhwE2AhAgB0EIakEAIAdBEGoQ5AkhCCAHQRBqIQQCQAJAIAcoAsQBIAEQywtrQYkDSA0AIAggBygCxAEgARDLC2tBAnVBAmoQ1AQQ5gkgCBCMC0UNASAIEIwLIQQLAkAgBy0AvwFFDQAgBEEtOgAAIARBAWohBAsgARDLCyECAkADQAJAIAIgBygCxAFJDQAgBEEAOgAAIAcgBjYCACAHQRBqQcmEBCAHELkIQQFHDQIgCBDoCRoMBAsgBCAHQbQBaiAHQYABaiAHQYABahDMCyACEMcJIAdBgAFqa0ECdWotAAA6AAAgBEEBaiEEIAJBBGohAgwACwALIAcQ0woACxCWEQALAkAgB0HsBGogB0HoBGoQ4wVFDQAgBSAFKAIAQQJyNgIACyAHKALsBCECIAdBwAFqELINGiABEIcKGiAHQfAEaiQAIAILig4BCH8jAEGQBGsiCyQAIAsgCjYCiAQgCyABNgKMBAJAAkAgACALQYwEahDjBUUNACAFIAUoAgBBBHI2AgBBACEADAELIAtBiAE2AkggCyALQegAaiALQfAAaiALQcgAahCPCyIMEJALIgo2AmQgCyAKQZADajYCYCALQcgAahD7BSENIAtBPGoQ7wohDiALQTBqEO8KIQ8gC0EkahDvCiEQIAtBGGoQ7wohESACIAMgC0HcAGogC0HYAGogC0HUAGogDSAOIA8gECALQRRqEM4LIAkgCBDLCzYCACAEQYAEcSESQQAhA0EAIQEDQCABIQICQAJAAkACQCADQQRGDQAgACALQYwEahDjBQ0AQQAhCiACIQECQAJAAkACQAJAAkAgC0HcAGogA2otAAAOBQEABAMFCQsgA0EDRg0HAkAgB0EBIAAQ5AUQ5QVFDQAgC0EMaiAAQQAQzwsgESALQQxqENALELURDAILIAUgBSgCAEEEcjYCAEEAIQAMBgsgA0EDRg0GCwNAIAAgC0GMBGoQ4wUNBiAHQQEgABDkBRDlBUUNBiALQQxqIABBABDPCyARIAtBDGoQ0AsQtREMAAsACwJAIA8QoAlFDQAgABDkBSAPQQAQ0QsoAgBHDQAgABDmBRogBkEAOgAAIA8gAiAPEKAJQQFLGyEBDAYLAkAgEBCgCUUNACAAEOQFIBBBABDRCygCAEcNACAAEOYFGiAGQQE6AAAgECACIBAQoAlBAUsbIQEMBgsCQCAPEKAJRQ0AIBAQoAlFDQAgBSAFKAIAQQRyNgIAQQAhAAwECwJAIA8QoAkNACAQEKAJRQ0FCyAGIBAQoAlFOgAADAQLAkAgA0ECSQ0AIAINACASDQBBACEBIANBAkYgCy0AX0EAR3FFDQULIAsgDhDwCTYCCCALQQxqIAtBCGpBABDSCyEKAkAgA0UNACADIAtB3ABqakF/ai0AAEEBSw0AAkADQCALIA4Q8Qk2AgggCiALQQhqENMLRQ0BIAdBASAKENQLKAIAEOUFRQ0BIAoQ1QsaDAALAAsgCyAOEPAJNgIIAkAgCiALQQhqENYLIgEgERCgCUsNACALIBEQ8Qk2AgggC0EIaiABENcLIBEQ8QkgDhDwCRDYCw0BCyALIA4Q8Ak2AgQgCiALQQhqIAtBBGpBABDSCygCADYCAAsgCyAKKAIANgIIAkADQCALIA4Q8Qk2AgQgC0EIaiALQQRqENMLRQ0BIAAgC0GMBGoQ4wUNASAAEOQFIAtBCGoQ1AsoAgBHDQEgABDmBRogC0EIahDVCxoMAAsACyASRQ0DIAsgDhDxCTYCBCALQQhqIAtBBGoQ0wtFDQMgBSAFKAIAQQRyNgIAQQAhAAwCCwJAA0AgACALQYwEahDjBQ0BAkACQCAHQcAAIAAQ5AUiARDlBUUNAAJAIAkoAgAiBCALKAKIBEcNACAIIAkgC0GIBGoQ2QsgCSgCACEECyAJIARBBGo2AgAgBCABNgIAIApBAWohCgwBCyANEI4GRQ0CIApFDQIgASALKAJURw0CAkAgCygCZCIBIAsoAmBHDQAgDCALQeQAaiALQeAAahCcCyALKAJkIQELIAsgAUEEajYCZCABIAo2AgBBACEKCyAAEOYFGgwACwALAkAgDBCQCyALKAJkIgFGDQAgCkUNAAJAIAEgCygCYEcNACAMIAtB5ABqIAtB4ABqEJwLIAsoAmQhAQsgCyABQQRqNgJkIAEgCjYCAAsCQCALKAIUQQFIDQACQAJAIAAgC0GMBGoQ4wUNACAAEOQFIAsoAlhGDQELIAUgBSgCAEEEcjYCAEEAIQAMAwsDQCAAEOYFGiALKAIUQQFIDQECQAJAIAAgC0GMBGoQ4wUNACAHQcAAIAAQ5AUQ5QUNAQsgBSAFKAIAQQRyNgIAQQAhAAwECwJAIAkoAgAgCygCiARHDQAgCCAJIAtBiARqENkLCyAAEOQFIQogCSAJKAIAIgFBBGo2AgAgASAKNgIAIAsgCygCFEF/ajYCFAwACwALIAIhASAJKAIAIAgQywtHDQMgBSAFKAIAQQRyNgIAQQAhAAwBCwJAIAJFDQBBASEKA0AgCiACEKAJTw0BAkACQCAAIAtBjARqEOMFDQAgABDkBSACIAoQoQkoAgBGDQELIAUgBSgCAEEEcjYCAEEAIQAMAwsgABDmBRogCkEBaiEKDAALAAtBASEAIAwQkAsgCygCZEYNAEEAIQAgC0EANgIMIA0gDBCQCyALKAJkIAtBDGoQ9wgCQCALKAIMRQ0AIAUgBSgCAEEEcjYCAAwBC0EBIQALIBEQrBEaIBAQrBEaIA8QrBEaIA4QrBEaIA0QnhEaIAwQnQsaDAMLIAIhAQsgA0EBaiEDDAALAAsgC0GQBGokACAACwoAIAAQ2gsoAgALBwAgAEEoagsWACAAIAEQghEiAUEEaiACEJkHGiABC4ADAQF/IwBBEGsiCiQAAkACQCAARQ0AIApBBGogARDqCyIBEOsLIAIgCigCBDYAACAKQQRqIAEQ7AsgCCAKQQRqEO0LGiAKQQRqEKwRGiAKQQRqIAEQ7gsgByAKQQRqEO0LGiAKQQRqEKwRGiADIAEQ7ws2AgAgBCABEPALNgIAIApBBGogARDxCyAFIApBBGoQ/wUaIApBBGoQnhEaIApBBGogARDyCyAGIApBBGoQ7QsaIApBBGoQrBEaIAEQ8wshAQwBCyAKQQRqIAEQ9AsiARD1CyACIAooAgQ2AAAgCkEEaiABEPYLIAggCkEEahDtCxogCkEEahCsERogCkEEaiABEPcLIAcgCkEEahDtCxogCkEEahCsERogAyABEPgLNgIAIAQgARD5CzYCACAKQQRqIAEQ+gsgBSAKQQRqEP8FGiAKQQRqEJ4RGiAKQQRqIAEQ+wsgBiAKQQRqEO0LGiAKQQRqEKwRGiABEPwLIQELIAkgATYCACAKQRBqJAALFQAgACABKAIAEO0FIAEoAgAQ/QsaCwcAIAAoAgALDQAgABD1CSABQQJ0agsOACAAIAEQ/gs2AgAgAAsMACAAIAEQ/wtBAXMLBwAgACgCAAsRACAAIAAoAgBBBGo2AgAgAAsQACAAEIAMIAEQ/gtrQQJ1CwwAIABBACABaxCCDAsLACAAIAEgAhCBDAvkAQEGfyMAQRBrIgMkACAAEIMMKAIAIQQCQAJAIAIoAgAgABDLC2siBRD6BkEBdk8NACAFQQF0IQUMAQsQ+gYhBQsgBUEEIAUbIQUgASgCACEGIAAQywshBwJAAkAgBEGIAUcNAEEAIQgMAQsgABDLCyEICwJAIAggBRDXBCIIRQ0AAkAgBEGIAUYNACAAEIQMGgsgA0GHATYCBCAAIANBCGogCCADQQRqEIQKIgQQhQwaIAQQhwoaIAEgABDLCyAGIAdrajYCACACIAAQywsgBUF8cWo2AgAgA0EQaiQADwsQlhEACwcAIAAQgxELrgIBAn8jAEHAA2siByQAIAcgAjYCuAMgByABNgK8AyAHQYgBNgIUIAdBGGogB0EgaiAHQRRqEIQKIQggB0EQaiAEEJAHIAdBEGoQ4gUhASAHQQA6AA8CQCAHQbwDaiACIAMgB0EQaiAEEJwFIAUgB0EPaiABIAggB0EUaiAHQbADahDKC0UNACAGENwLAkAgBy0AD0UNACAGIAFBLRCLBxC1EQsgAUEwEIsHIQEgCBDLCyECIAcoAhQiA0F8aiEEAkADQCACIARPDQEgAigCACABRw0BIAJBBGohAgwACwALIAYgAiADEN0LGgsCQCAHQbwDaiAHQbgDahDjBUUNACAFIAUoAgBBAnI2AgALIAcoArwDIQIgB0EQahCyDRogCBCHChogB0HAA2okACACC2IBAn8jAEEQayIBJAACQAJAIAAQsQpFDQAgABDeCyECIAFBADYCDCACIAFBDGoQ3wsgAEEAEOALDAELIAAQ4QshAiABQQA2AgggAiABQQhqEN8LIABBABDiCwsgAUEQaiQAC9kBAQR/IwBBEGsiAyQAIAAQoAkhBCAAEOMLIQUCQCABIAIQ5AsiBkUNAAJAIAAgARDlCw0AAkAgBSAEayAGTw0AIAAgBSAEIAVrIAZqIAQgBEEAQQAQ5gsLIAAQ9QkgBEECdGohBQJAA0AgASACRg0BIAUgARDfCyABQQRqIQEgBUEEaiEFDAALAAsgA0EANgIEIAUgA0EEahDfCyAAIAYgBGoQ5wsMAQsgACADQQRqIAEgAiAAEOgLEOkLIgEQrwogARCgCRCzERogARCsERoLIANBEGokACAACwoAIAAQhwsoAgALDAAgACABKAIANgIACwwAIAAQhwsgATYCBAsKACAAEIcLEPwOCzEBAX8gABCHCyICIAItAAtBgAFxIAFB/wBxcjoACyAAEIcLIgAgAC0AC0H/AHE6AAsLHwEBf0EBIQECQCAAELEKRQ0AIAAQiQ9Bf2ohAQsgAQsJACAAIAEQww8LHQAgABCvCiAAEK8KIAAQoAlBAnRqQQRqIAEQxA8LIAAgACABIAIgAyAEIAUgBhDCDyAAIAMgBWsgBmoQ4AsLHAACQCAAELEKRQ0AIAAgARDgCw8LIAAgARDiCwsHACAAEP4OCysBAX8jAEEQayIEJAAgACAEQQ9qIAMQxQ8iAyABIAIQxg8gBEEQaiQAIAMLCwAgAEHQwwUQ5wgLEQAgACABIAEoAgAoAiwRAgALEQAgACABIAEoAgAoAiARAgALCwAgACABEIYMIAALEQAgACABIAEoAgAoAhwRAgALDwAgACAAKAIAKAIMEQAACw8AIAAgACgCACgCEBEAAAsRACAAIAEgASgCACgCFBECAAsRACAAIAEgASgCACgCGBECAAsPACAAIAAoAgAoAiQRAAALCwAgAEHIwwUQ5wgLEQAgACABIAEoAgAoAiwRAgALEQAgACABIAEoAgAoAiARAgALEQAgACABIAEoAgAoAhwRAgALDwAgACAAKAIAKAIMEQAACw8AIAAgACgCACgCEBEAAAsRACAAIAEgASgCACgCFBECAAsRACAAIAEgASgCACgCGBECAAsPACAAIAAoAgAoAiQRAAALEgAgACACNgIEIAAgATYCACAACwcAIAAoAgALDQAgABCADCABEP4LRgsHACAAKAIACy8BAX8jAEEQayIDJAAgABDKDyABEMoPIAIQyg8gA0EPahDLDyECIANBEGokACACCzIBAX8jAEEQayICJAAgAiAAKAIANgIMIAJBDGogARDRDxogAigCDCEAIAJBEGokACAACwcAIAAQmQwLGgEBfyAAEJgMKAIAIQEgABCYDEEANgIAIAELIgAgACABEIQMEIUKIAEQgwwoAgAhASAAEJkMIAE2AgAgAAt9AQJ/IwBBEGsiAiQAAkAgABCxCkUNACAAEOgLIAAQ3gsgABCJDxCHDwsgACABENIPIAEQhwshAyAAEIcLIgBBCGogA0EIaigCADYCACAAIAMpAgA3AgAgAUEAEOILIAEQ4QshACACQQA2AgwgACACQQxqEN8LIAJBEGokAAuEBQEMfyMAQcADayIHJAAgByAFNwMQIAcgBjcDGCAHIAdB0AJqNgLMAiAHQdACakHkAEHDhAQgB0EQahC6CCEIIAdBhwE2AuABQQAhCSAHQdgBakEAIAdB4AFqEOQJIQogB0GHATYC4AEgB0HQAWpBACAHQeABahDkCSELIAdB4AFqIQwCQAJAIAhB5ABJDQAQlAkhCCAHIAU3AwAgByAGNwMIIAdBzAJqIAhBw4QEIAcQ5QkiCEF/Rg0BIAogBygCzAIQ5gkgCyAIENQEEOYJIAtBABCIDA0BIAsQjAshDAsgB0HMAWogAxCQByAHQcwBahCdBSINIAcoAswCIg4gDiAIaiAMEJMJGgJAIAhBAUgNACAHKALMAi0AAEEtRiEJCyACIAkgB0HMAWogB0HIAWogB0HHAWogB0HGAWogB0G4AWoQ+wUiDyAHQawBahD7BSIOIAdBoAFqEPsFIhAgB0GcAWoQiQwgB0GHATYCMCAHQShqQQAgB0EwahDkCSERAkACQCAIIAcoApwBIgJMDQAgEBCOBiAIIAJrQQF0aiAOEI4GaiAHKAKcAWpBAWohEgwBCyAQEI4GIA4QjgZqIAcoApwBakECaiESCyAHQTBqIQICQCASQeUASQ0AIBEgEhDUBBDmCSAREIwLIgJFDQELIAIgB0EkaiAHQSBqIAMQnAUgDCAMIAhqIA0gCSAHQcgBaiAHLADHASAHLADGASAPIA4gECAHKAKcARCKDCABIAIgBygCJCAHKAIgIAMgBBDZCSEIIBEQ6AkaIBAQnhEaIA4QnhEaIA8QnhEaIAdBzAFqELINGiALEOgJGiAKEOgJGiAHQcADaiQAIAgPCxCWEQALCgAgABCLDEEBcwvGAwEBfyMAQRBrIgokAAJAAkAgAEUNACACEKkLIQICQAJAIAFFDQAgCkEEaiACEKoLIAMgCigCBDYAACAKQQRqIAIQqwsgCCAKQQRqEP8FGiAKQQRqEJ4RGgwBCyAKQQRqIAIQjAwgAyAKKAIENgAAIApBBGogAhCsCyAIIApBBGoQ/wUaIApBBGoQnhEaCyAEIAIQrQs6AAAgBSACEK4LOgAAIApBBGogAhCvCyAGIApBBGoQ/wUaIApBBGoQnhEaIApBBGogAhCwCyAHIApBBGoQ/wUaIApBBGoQnhEaIAIQsQshAgwBCyACELILIQICQAJAIAFFDQAgCkEEaiACELMLIAMgCigCBDYAACAKQQRqIAIQtAsgCCAKQQRqEP8FGiAKQQRqEJ4RGgwBCyAKQQRqIAIQjQwgAyAKKAIENgAAIApBBGogAhC1CyAIIApBBGoQ/wUaIApBBGoQnhEaCyAEIAIQtgs6AAAgBSACELcLOgAAIApBBGogAhC4CyAGIApBBGoQ/wUaIApBBGoQnhEaIApBBGogAhC5CyAHIApBBGoQ/wUaIApBBGoQnhEaIAIQugshAgsgCSACNgIAIApBEGokAAufBgEKfyMAQRBrIg8kACACIAA2AgAgA0GABHEhEEEAIREDQAJAIBFBBEcNAAJAIA0QjgZBAU0NACAPIA0Qjgw2AgwgAiAPQQxqQQEQjwwgDRCQDCACKAIAEJEMNgIACwJAIANBsAFxIhJBEEYNAAJAIBJBIEcNACACKAIAIQALIAEgADYCAAsgD0EQaiQADwsCQAJAAkACQAJAAkAgCCARai0AAA4FAAEDAgQFCyABIAIoAgA2AgAMBAsgASACKAIANgIAIAZBIBCJByESIAIgAigCACITQQFqNgIAIBMgEjoAAAwDCyANEO0IDQIgDUEAEOwILQAAIRIgAiACKAIAIhNBAWo2AgAgEyASOgAADAILIAwQ7QghEiAQRQ0BIBINASACIAwQjgwgDBCQDCACKAIAEJEMNgIADAELIAIoAgAhFCAEIAdqIgQhEgJAA0AgEiAFTw0BIAZBwAAgEiwAABCgBUUNASASQQFqIRIMAAsACyAOIRMCQCAOQQFIDQACQANAIBIgBE0NASATQQBGDQEgE0F/aiETIBJBf2oiEi0AACEVIAIgAigCACIWQQFqNgIAIBYgFToAAAwACwALAkACQCATDQBBACEWDAELIAZBMBCJByEWCwJAA0AgAiACKAIAIhVBAWo2AgAgE0EBSA0BIBUgFjoAACATQX9qIRMMAAsACyAVIAk6AAALAkACQCASIARHDQAgBkEwEIkHIRIgAiACKAIAIhNBAWo2AgAgEyASOgAADAELAkACQCALEO0IRQ0AEJIMIRcMAQsgC0EAEOwILAAAIRcLQQAhE0EAIRgDQCASIARGDQECQAJAIBMgF0YNACATIRUMAQsgAiACKAIAIhVBAWo2AgAgFSAKOgAAQQAhFQJAIBhBAWoiGCALEI4GSQ0AIBMhFwwBCwJAIAsgGBDsCC0AABDWCkH/AXFHDQAQkgwhFwwBCyALIBgQ7AgsAAAhFwsgEkF/aiISLQAAIRMgAiACKAIAIhZBAWo2AgAgFiATOgAAIBVBAWohEwwACwALIBQgAigCABCNCgsgEUEBaiERDAALAAsNACAAEJ4LKAIAQQBHCxEAIAAgASABKAIAKAIoEQIACxEAIAAgASABKAIAKAIoEQIACwwAIAAgABCDBxCjDAsyAQF/IwBBEGsiAiQAIAIgACgCADYCDCACQQxqIAEQpQwaIAIoAgwhACACQRBqJAAgAAsSACAAIAAQgwcgABCOBmoQowwLKwEBfyMAQRBrIgMkACADQQhqIAAgASACEKIMIAMoAgwhAiADQRBqJAAgAgsFABCkDAuwAwEIfyMAQbABayIGJAAgBkGsAWogAxCQByAGQawBahCdBSEHQQAhCAJAIAUQjgZFDQAgBUEAEOwILQAAIAdBLRCJB0H/AXFGIQgLIAIgCCAGQawBaiAGQagBaiAGQacBaiAGQaYBaiAGQZgBahD7BSIJIAZBjAFqEPsFIgogBkGAAWoQ+wUiCyAGQfwAahCJDCAGQYcBNgIQIAZBCGpBACAGQRBqEOQJIQwCQAJAIAUQjgYgBigCfEwNACAFEI4GIQIgBigCfCENIAsQjgYgAiANa0EBdGogChCOBmogBigCfGpBAWohDQwBCyALEI4GIAoQjgZqIAYoAnxqQQJqIQ0LIAZBEGohAgJAIA1B5QBJDQAgDCANENQEEOYJIAwQjAsiAg0AEJYRAAsgAiAGQQRqIAYgAxCcBSAFEI0GIAUQjQYgBRCOBmogByAIIAZBqAFqIAYsAKcBIAYsAKYBIAkgCiALIAYoAnwQigwgASACIAYoAgQgBigCACADIAQQ2QkhBSAMEOgJGiALEJ4RGiAKEJ4RGiAJEJ4RGiAGQawBahCyDRogBkGwAWokACAFC40FAQx/IwBBoAhrIgckACAHIAU3AxAgByAGNwMYIAcgB0GwB2o2AqwHIAdBsAdqQeQAQcOEBCAHQRBqELoIIQggB0GHATYCkARBACEJIAdBiARqQQAgB0GQBGoQ5AkhCiAHQYcBNgKQBCAHQYAEakEAIAdBkARqEIQKIQsgB0GQBGohDAJAAkAgCEHkAEkNABCUCSEIIAcgBTcDACAHIAY3AwggB0GsB2ogCEHDhAQgBxDlCSIIQX9GDQEgCiAHKAKsBxDmCSALIAhBAnQQ1AQQhQogC0EAEJUMDQEgCxDLCyEMCyAHQfwDaiADEJAHIAdB/ANqEOIFIg0gBygCrAciDiAOIAhqIAwQuwkaAkAgCEEBSA0AIAcoAqwHLQAAQS1GIQkLIAIgCSAHQfwDaiAHQfgDaiAHQfQDaiAHQfADaiAHQeQDahD7BSIPIAdB2ANqEO8KIg4gB0HMA2oQ7woiECAHQcgDahCWDCAHQYcBNgIwIAdBKGpBACAHQTBqEIQKIRECQAJAIAggBygCyAMiAkwNACAQEKAJIAggAmtBAXRqIA4QoAlqIAcoAsgDakEBaiESDAELIBAQoAkgDhCgCWogBygCyANqQQJqIRILIAdBMGohAgJAIBJB5QBJDQAgESASQQJ0ENQEEIUKIBEQywsiAkUNAQsgAiAHQSRqIAdBIGogAxCcBSAMIAwgCEECdGogDSAJIAdB+ANqIAcoAvQDIAcoAvADIA8gDiAQIAcoAsgDEJcMIAEgAiAHKAIkIAcoAiAgAyAEEPsJIQggERCHChogEBCsERogDhCsERogDxCeERogB0H8A2oQsg0aIAsQhwoaIAoQ6AkaIAdBoAhqJAAgCA8LEJYRAAsKACAAEJoMQQFzC8YDAQF/IwBBEGsiCiQAAkACQCAARQ0AIAIQ6gshAgJAAkAgAUUNACAKQQRqIAIQ6wsgAyAKKAIENgAAIApBBGogAhDsCyAIIApBBGoQ7QsaIApBBGoQrBEaDAELIApBBGogAhCbDCADIAooAgQ2AAAgCkEEaiACEO4LIAggCkEEahDtCxogCkEEahCsERoLIAQgAhDvCzYCACAFIAIQ8As2AgAgCkEEaiACEPELIAYgCkEEahD/BRogCkEEahCeERogCkEEaiACEPILIAcgCkEEahDtCxogCkEEahCsERogAhDzCyECDAELIAIQ9AshAgJAAkAgAUUNACAKQQRqIAIQ9QsgAyAKKAIENgAAIApBBGogAhD2CyAIIApBBGoQ7QsaIApBBGoQrBEaDAELIApBBGogAhCcDCADIAooAgQ2AAAgCkEEaiACEPcLIAggCkEEahDtCxogCkEEahCsERoLIAQgAhD4CzYCACAFIAIQ+Qs2AgAgCkEEaiACEPoLIAYgCkEEahD/BRogCkEEahCeERogCkEEaiACEPsLIAcgCkEEahDtCxogCkEEahCsERogAhD8CyECCyAJIAI2AgAgCkEQaiQAC8MGAQp/IwBBEGsiDyQAIAIgADYCAEEEQQAgBxshECADQYAEcSERQQAhEgNAAkAgEkEERw0AAkAgDRCgCUEBTQ0AIA8gDRCdDDYCDCACIA9BDGpBARCeDCANEJ8MIAIoAgAQoAw2AgALAkAgA0GwAXEiB0EQRg0AAkAgB0EgRw0AIAIoAgAhAAsgASAANgIACyAPQRBqJAAPCwJAAkACQAJAAkACQCAIIBJqLQAADgUAAQMCBAULIAEgAigCADYCAAwECyABIAIoAgA2AgAgBkEgEIsHIQcgAiACKAIAIhNBBGo2AgAgEyAHNgIADAMLIA0QogkNAiANQQAQoQkoAgAhByACIAIoAgAiE0EEajYCACATIAc2AgAMAgsgDBCiCSEHIBFFDQEgBw0BIAIgDBCdDCAMEJ8MIAIoAgAQoAw2AgAMAQsgAigCACEUIAQgEGoiBCEHAkADQCAHIAVPDQEgBkHAACAHKAIAEOUFRQ0BIAdBBGohBwwACwALAkAgDkEBSA0AIAIoAgAhEyAOIRUCQANAIAcgBE0NASAVQQBGDQEgFUF/aiEVIAdBfGoiBygCACEWIAIgE0EEaiIXNgIAIBMgFjYCACAXIRMMAAsACwJAAkAgFQ0AQQAhFwwBCyAGQTAQiwchFyACKAIAIRMLAkADQCATQQRqIRYgFUEBSA0BIBMgFzYCACAVQX9qIRUgFiETDAALAAsgAiAWNgIAIBMgCTYCAAsCQAJAIAcgBEcNACAGQTAQiwchEyACIAIoAgAiFUEEaiIHNgIAIBUgEzYCAAwBCwJAAkAgCxDtCEUNABCSDCEXDAELIAtBABDsCCwAACEXC0EAIRNBACEYAkADQCAHIARGDQECQAJAIBMgF0YNACATIRUMAQsgAiACKAIAIhVBBGo2AgAgFSAKNgIAQQAhFQJAIBhBAWoiGCALEI4GSQ0AIBMhFwwBCwJAIAsgGBDsCC0AABDWCkH/AXFHDQAQkgwhFwwBCyALIBgQ7AgsAAAhFwsgB0F8aiIHKAIAIRMgAiACKAIAIhZBBGo2AgAgFiATNgIAIBVBAWohEwwACwALIAIoAgAhBwsgFCAHEI8KCyASQQFqIRIMAAsACwcAIAAQhBELCgAgAEEEahCaBwsNACAAENoLKAIAQQBHCxEAIAAgASABKAIAKAIoEQIACxEAIAAgASABKAIAKAIoEQIACwwAIAAgABCwChCnDAsyAQF/IwBBEGsiAiQAIAIgACgCADYCDCACQQxqIAEQqAwaIAIoAgwhACACQRBqJAAgAAsVACAAIAAQsAogABCgCUECdGoQpwwLKwEBfyMAQRBrIgMkACADQQhqIAAgASACEKYMIAMoAgwhAiADQRBqJAAgAgu3AwEIfyMAQeADayIGJAAgBkHcA2ogAxCQByAGQdwDahDiBSEHQQAhCAJAIAUQoAlFDQAgBUEAEKEJKAIAIAdBLRCLB0YhCAsgAiAIIAZB3ANqIAZB2ANqIAZB1ANqIAZB0ANqIAZBxANqEPsFIgkgBkG4A2oQ7woiCiAGQawDahDvCiILIAZBqANqEJYMIAZBhwE2AhAgBkEIakEAIAZBEGoQhAohDAJAAkAgBRCgCSAGKAKoA0wNACAFEKAJIQIgBigCqAMhDSALEKAJIAIgDWtBAXRqIAoQoAlqIAYoAqgDakEBaiENDAELIAsQoAkgChCgCWogBigCqANqQQJqIQ0LIAZBEGohAgJAIA1B5QBJDQAgDCANQQJ0ENQEEIUKIAwQywsiAg0AEJYRAAsgAiAGQQRqIAYgAxCcBSAFEK8KIAUQrwogBRCgCUECdGogByAIIAZB2ANqIAYoAtQDIAYoAtADIAkgCiALIAYoAqgDEJcMIAEgAiAGKAIEIAYoAgAgAyAEEPsJIQUgDBCHChogCxCsERogChCsERogCRCeERogBkHcA2oQsg0aIAZB4ANqJAAgBQsNACAAIAEgAiADENQPCyUBAX8jAEEQayICJAAgAkEMaiABEOMPKAIAIQEgAkEQaiQAIAELBABBfwsRACAAIAAoAgAgAWo2AgAgAAsNACAAIAEgAiADEOQPCyUBAX8jAEEQayICJAAgAkEMaiABEPMPKAIAIQEgAkEQaiQAIAELFAAgACAAKAIAIAFBAnRqNgIAIAALBABBfwsKACAAIAUQ/woaCwIACwQAQX8LCgAgACAFEIILGgsCAAspACAAQbDsBEEIajYCAAJAIAAoAggQlAlGDQAgACgCCBC8CAsgABDTCAueAwAgACABELEMIgFB5OMEQQhqNgIAIAFBCGpBHhCyDCEAIAFBmAFqQfSFBBCNBxogABCzDBC0DCABQbDOBRC1DBC2DCABQbjOBRC3DBC4DCABQcDOBRC5DBC6DCABQdDOBRC7DBC8DCABQdjOBRC9DBC+DCABQeDOBRC/DBDADCABQfDOBRDBDBDCDCABQfjOBRDDDBDEDCABQYDPBRDFDBDGDCABQYjPBRDHDBDIDCABQZDPBRDJDBDKDCABQajPBRDLDBDMDCABQcjPBRDNDBDODCABQdDPBRDPDBDQDCABQdjPBRDRDBDSDCABQeDPBRDTDBDUDCABQejPBRDVDBDWDCABQfDPBRDXDBDYDCABQfjPBRDZDBDaDCABQYDQBRDbDBDcDCABQYjQBRDdDBDeDCABQZDQBRDfDBDgDCABQZjQBRDhDBDiDCABQaDQBRDjDBDkDCABQajQBRDlDBDmDCABQbjQBRDnDBDoDCABQcjQBRDpDBDqDCABQdjQBRDrDBDsDCABQejQBRDtDBDuDCABQfDQBRDvDCABCxoAIAAgAUF/ahDwDCIBQajvBEEIajYCACABC2oBAX8jAEEQayICJAAgAEIANwMAIAJBADYCDCAAQQhqIAJBDGogAkELahDxDBogAkEKaiACQQRqIAAQ8gwoAgAQ8wwCQCABRQ0AIAAgARD0DCAAIAEQ9QwLIAJBCmoQ9gwgAkEQaiQAIAALFwEBfyAAEPcMIQEgABD4DCAAIAEQ+QwLDABBsM4FQQEQ/AwaCxAAIAAgAUHowgUQ+gwQ+wwLDABBuM4FQQEQ/QwaCxAAIAAgAUHwwgUQ+gwQ+wwLEABBwM4FQQBBAEEBEMwNGgsQACAAIAFBtMQFEPoMEPsMCwwAQdDOBUEBEP4MGgsQACAAIAFBrMQFEPoMEPsMCwwAQdjOBUEBEP8MGgsQACAAIAFBvMQFEPoMEPsMCwwAQeDOBUEBEOANGgsQACAAIAFBxMQFEPoMEPsMCwwAQfDOBUEBEIANGgsQACAAIAFBzMQFEPoMEPsMCwwAQfjOBUEBEIENGgsQACAAIAFB3MQFEPoMEPsMCwwAQYDPBUEBEIINGgsQACAAIAFB1MQFEPoMEPsMCwwAQYjPBUEBEIMNGgsQACAAIAFB5MQFEPoMEPsMCwwAQZDPBUEBEJcOGgsQACAAIAFB7MQFEPoMEPsMCwwAQajPBUEBEJgOGgsQACAAIAFB9MQFEPoMEPsMCwwAQcjPBUEBEIQNGgsQACAAIAFB+MIFEPoMEPsMCwwAQdDPBUEBEIUNGgsQACAAIAFBgMMFEPoMEPsMCwwAQdjPBUEBEIYNGgsQACAAIAFBiMMFEPoMEPsMCwwAQeDPBUEBEIcNGgsQACAAIAFBkMMFEPoMEPsMCwwAQejPBUEBEIgNGgsQACAAIAFBuMMFEPoMEPsMCwwAQfDPBUEBEIkNGgsQACAAIAFBwMMFEPoMEPsMCwwAQfjPBUEBEIoNGgsQACAAIAFByMMFEPoMEPsMCwwAQYDQBUEBEIsNGgsQACAAIAFB0MMFEPoMEPsMCwwAQYjQBUEBEIwNGgsQACAAIAFB2MMFEPoMEPsMCwwAQZDQBUEBEI0NGgsQACAAIAFB4MMFEPoMEPsMCwwAQZjQBUEBEI4NGgsQACAAIAFB6MMFEPoMEPsMCwwAQaDQBUEBEI8NGgsQACAAIAFB8MMFEPoMEPsMCwwAQajQBUEBEJANGgsQACAAIAFBmMMFEPoMEPsMCwwAQbjQBUEBEJENGgsQACAAIAFBoMMFEPoMEPsMCwwAQcjQBUEBEJINGgsQACAAIAFBqMMFEPoMEPsMCwwAQdjQBUEBEJMNGgsQACAAIAFBsMMFEPoMEPsMCwwAQejQBUEBEJQNGgsQACAAIAFB+MMFEPoMEPsMCwwAQfDQBUEBEJUNGgsQACAAIAFBgMQFEPoMEPsMCxcAIAAgATYCBCAAQdCXBUEIajYCACAACxQAIAAgARD0DyIBQQhqEPUPGiABCwsAIAAgATYCACAACwoAIAAgARD2DxoLZwECfyMAQRBrIgIkAAJAIAAQ9w8gAU8NACAAEPgPAAsgAkEIaiAAEPkPIAEQ+g8gACACKAIIIgE2AgQgACABNgIAIAIoAgwhAyAAEPsPIAEgA0ECdGo2AgAgAEEAEPwPIAJBEGokAAteAQN/IwBBEGsiAiQAIAJBBGogACABEP0PIgMoAgQhASADKAIIIQQDQAJAIAEgBEcNACADEP4PGiACQRBqJAAPCyAAEPkPIAEQ/w8QgBAgAyABQQRqIgE2AgQMAAsACwkAIABBAToAAAsQACAAKAIEIAAoAgBrQQJ1CwwAIAAgACgCABCXEAszACAAIAAQhxAgABCHECAAEIgQQQJ0aiAAEIcQIAFBAnRqIAAQhxAgABD3DEECdGoQiRALSgEBfyMAQSBrIgEkACABQQA2AhAgAUGJATYCDCABIAEpAgw3AwAgACABQRRqIAEgABC0DRC1DSAAKAIEIQAgAUEgaiQAIABBf2oLeAECfyMAQRBrIgMkACABEJgNIANBDGogARCcDSEEAkAgAEEIaiIBEPcMIAJLDQAgASACQQFqEJ8NCwJAIAEgAhCXDSgCAEUNACABIAIQlw0oAgAQoA0aCyAEEKENIQAgASACEJcNIAA2AgAgBBCdDRogA0EQaiQACxcAIAAgARCxDCIBQfz3BEEIajYCACABCxcAIAAgARCxDCIBQZz4BEEIajYCACABCxoAIAAgARCxDBDNDSIBQeDvBEEIajYCACABCxoAIAAgARCxDBDhDSIBQfTwBEEIajYCACABCxoAIAAgARCxDBDhDSIBQYjyBEEIajYCACABCxoAIAAgARCxDBDhDSIBQfDzBEEIajYCACABCxoAIAAgARCxDBDhDSIBQfzyBEEIajYCACABCxoAIAAgARCxDBDhDSIBQeT0BEEIajYCACABCxcAIAAgARCxDCIBQbz4BEEIajYCACABCxcAIAAgARCxDCIBQbD6BEEIajYCACABCxcAIAAgARCxDCIBQYT8BEEIajYCACABCxcAIAAgARCxDCIBQez9BEEIajYCACABCxoAIAAgARCxDBDQECIBQcSFBUEIajYCACABCxoAIAAgARCxDBDQECIBQdiGBUEIajYCACABCxoAIAAgARCxDBDQECIBQcyHBUEIajYC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AQsgAQsIABC+CCgCAAtFAQF/AkADQCABIAJGDQECQCABKAIAIgNB/wBLDQAQww0gASgCAEECdGooAgAhAwsgASADNgIAIAFBBGohAQwACwALIAILHQACQCABQf8ASw0AEMYNIAFBAnRqKAIAIQELIAELCAAQvwgoAgALRQEBfwJAA0AgASACRg0BAkAgASgCACIDQf8ASw0AEMYNIAEoAgBBAnRqKAIAIQMLIAEgAzYCACABQQRqIQEMAAsACyACCwQAIAELLAACQANAIAEgAkYNASADIAEsAAA2AgAgA0EEaiEDIAFBAWohAQwACwALIAILDgAgASACIAFBgAFJG8ALOQEBfwJAA0AgASACRg0BIAQgASgCACIFIAMgBUGAAUkbOgAAIARBAWohBCABQQRqIQEMAAsACyACCzgAIAAgAxCxDBDNDSIDIAI6AAwgAyABNgIIIANB+OMEQQhqNgIAAkAgAQ0AIANBsOQENgIICyADCwQAIAALMwEBfyAAQfjjBEEIajYCAAJAIAAoAggiAUUNACAALQAMQf8BcUUNACABEJERCyAAENMICw0AIAAQzg0aIAAQkBELHQACQCABQQBIDQAQww0gAUECdGooAgAhAQsgAcALRAEBfwJAA0AgASACRg0BAkAgASwAACIDQQBIDQAQww0gASwAAEECdGooAgAhAwsgASADOgAAIAFBAWohAQwACwALIAILHQACQCABQQBIDQAQxg0gAUECdGooAgAhAQsgAcALRAEBfwJAA0AgASACRg0BAkAgASwAACIDQQBIDQAQxg0gASwAAEECdGooAgAhAwsgASADOgAAIAFBAWohAQwACwALIAILBAAgAQssAAJAA0AgASACRg0BIAMgAS0AADoAACADQQFqIQMgAUEBaiEBDAALAAsgAgsMACACIAEgAUEASBsLOAEBfwJAA0AgASACRg0BIAQgAyABLAAAIgUgBUEASBs6AAAgBEEBaiEEIAFBAWohAQwACwALIAILDQAgABDTCBogABCQEQsSACAEIAI2AgAgByAFNgIAQQMLEgAgBCACNgIAIAcgBTYCAEEDCwsAIAQgAjYCAEEDCwQAQQELBABBAQs5AQF/IwBBEGsiBSQAIAUgBDYCDCAFIAMgAms2AgggBUEMaiAFQQhqEJgGKAIAIQQgBUEQaiQAIAQLBABBAQsi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ayIBJAAgASAANgIMIAFBDGoQ7g8hACABQRBqJAAgAAsHACAAEO8PCwoAIAAoAgAQ8A8LKgEBfyMAQRBrIgEkACABIAA2AgwgAUEMahCADBDMBiEAIAFBEGokACAACwkAIAAgARDyDws1AQF/IwBBEGsiAiQAIAIgADYCDCACQQxqIAEgAkEMahDuD2tBAnUQngwhACACQRBqJAAgAAsLACAAIAE2AgAgAAsLACAAQQA2AgAgAAsHACAAEIEQCwsAIABBADoAACAACz0BAX8jAEEQayIBJAAgASAAEIIQEIMQNgIMIAEQrgU2AgggAUEMaiABQQhqEJgGKAIAIQAgAUEQaiQAIAALCgBB84EEEPsGAAsKACAAQQhqEIUQCxsAIAEgAkEAEIQQIQEgACACNgIEIAAgATYCAAsKACAAQQhqEIYQCzMAIAAgABCHECAAEIcQIAAQiBBBAnRqIAAQhxAgABCIEEECdGogABCHECABQQJ0ahCJEAskACAAIAE2AgAgACABKAIEIgE2AgQgACABIAJBAnRqNgIIIAALEQAgACgCACAAKAIENgIEIAALBAAgAAsIACABEJYQGgsLACAAQQA6AHggAAsKACAAQQhqEIsQCwcAIAAQihALRgEBfyMAQRBrIgMkAAJAAkAgAUEeSw0AIAAtAHhB/wFxDQAgAEEBOgB4DAELIANBD2oQjRAgARCOECEACyADQRBqJAAgAAsKACAAQQhqEJEQCwcAIAAQkhALCgAgACgCABD/DwsTACAAEJMQKAIAIAAoAgBrQQJ1CwIACwgAQf////8DCwoAIABBCGoQjBALBAAgAAsHACAAEI8QCx0AAkAgABCQECABTw0AEP8GAAsgAUECdEEEEIAHCwQAIAALCAAQ+gZBAnYLBAAgAAsEACAACwoAIABBCGoQlBALBwAgABCVEAsEACAACwsAIABBADYCACAACzQBAX8gACgCBCECAkADQCACIAFGDQEgABD5DyACQXxqIgIQ/w8QmBAMAAsACyAAIAE2AgQLBwAgARCZEAsHACAAEJoQCwIAC2EBAn8jAEEQayICJAAgAiABNgIMAkAgABD3DyIDIAFJDQACQCAAEIgQIgEgA0EBdk8NACACIAFBAXQ2AgggAkEIaiACQQxqEJEHKAIAIQMLIAJBEGokACADDwsgABD4DwALNgAgACAAEIcQIAAQhxAgABCIEEECdGogABCHECAAEPcMQQJ0aiAAEIcQIAAQiBBBAnRqEIkQCwsAIAAgASACEJ4QCzkBAX8jAEEQayIDJAACQAJAIAEgAEcNACABQQA6AHgMAQsgA0EPahCNECABIAIQnxALIANBEGokAAsOACABIAJBAnRBBBDjBguLAQECfyMAQRBrIgQkAEEAIQUgBEEANgIMIABBDGogBEEMaiADEKQQGgJAAkAgAQ0AQQAhAQwBCyAEQQRqIAAQpRAgARD6DyAEKAIIIQEgBCgCBCEFCyAAIAU2AgAgACAFIAJBAnRqIgM2AgggACADNgIEIAAQphAgBSABQQJ0ajYCACAEQRBqJAAgAAtiAQJ/IwBBEGsiAiQAIAJBBGogAEEIaiABEKcQIgEoAgAhAwJAA0AgAyABKAIERg0BIAAQpRAgASgCABD/DxCAECABIAEoAgBBBGoiAzYCAAwACwALIAEQqBAaIAJBEGokAAuoAQEFfyMAQRBrIgIkACAAEJwQIAAQ+Q8hAyACQQhqIAAoAgQQqRAhBCACQQRqIAAoAgAQqRAhBSACIAEoAgQQqRAhBiACIAMgBCgCACAFKAIAIAYoAgAQqhA2AgwgASACQQxqEKsQNgIEIAAgAUEEahCsECAAQQRqIAFBCGoQrBAgABD7DyABEKYQEKwQIAEgASgCBDYCACAAIAAQ9wwQ/A8gAkEQaiQACyYAIAAQrRACQCAAKAIARQ0AIAAQpRAgACgCACAAEK4QEJ0QCyAACxYAIAAgARD0DyIBQQRqIAIQrxAaIAELCgAgAEEMahCwEAsKACAAQQxqELEQCygBAX8gASgCACEDIAAgATYCCCAAIAM2AgAgACADIAJBAnRqNgIEIAALEQAgACgCCCAAKAIANgIAIAALCwAgACABNgIAIAALCwAgASACIAMQsxALBwAgACgCAAscAQF/IAAoAgAhAiAAIAEoAgA2AgAgASACNgIACwwAIAAgACgCBBDHEAsTACAAEMgQKAIAIAAoAgBrQQJ1CwsAIAAgATYCACAACwoAIABBBGoQshALBwAgABCSEAsHACAAKAIACysBAX8jAEEQayIDJAAgA0EIaiAAIAEgAhC0ECADKAIMIQIgA0EQaiQAIAILDQAgACABIAIgAxC1EAsNACAAIAEgAiADELYQC2kBAX8jAEEgayIEJAAgBEEYaiABIAIQtxAgBEEQaiAEQQxqIAQoAhggBCgCHCADELgQELkQIAQgASAEKAIQELoQNgIMIAQgAyAEKAIUELsQNgIIIAAgBEEMaiAEQQhqELwQIARBIGokAAsLACAAIAEgAhC9EAsHACAAEMIQC30BAX8jAEEQayIFJAAgBSADNgIIIAUgAjYCDCAFIAQ2AgQCQANAIAVBDGogBUEIahC+EEUNASAFQQxqEL8QKAIAIQMgBUEEahDAECADNgIAIAVBDGoQwRAaIAVBBGoQwRAaDAALAAsgACAFQQxqIAVBBGoQvBAgBUEQaiQACwkAIAAgARDEEAsJACAAIAEQxRALDAAgACABIAIQwxAaCzgBAX8jAEEQayIDJAAgAyABELgQNgIMIAMgAhC4EDYCCCAAIANBDGogA0EIahDDEBogA0EQaiQACw0AIAAQqxAgARCrEEcLCgAQxhAgABDAEAsKACAAKAIAQXxqCxEAIAAgACgCAEF8ajYCACAACwQAIAALGAAgACABKAIANgIAIAAgAigCADYCBCAACwkAIAAgARC7EAsEACABCwIACwkAIAAgARDJEAsKACAAQQxqEMoQCzcBAn8CQANAIAAoAgggAUYNASAAEKUQIQIgACAAKAIIQXxqIgM2AgggAiADEP8PEJgQDAALAAsLBwAgABCVEAsHACAAEL0IC2EBAX8jAEEQayICJAAgAiAANgIMAkAgACABRg0AA0AgAiABQXxqIgE2AgggACABTw0BIAJBDGogAkEIahDNECACIAIoAgxBBGoiADYCDCACKAIIIQEMAAsACyACQRBqJAALDwAgACgCACABKAIAEM4QCwkAIAAgARCEBgs0AQF/IwBBEGsiAyQAIAAgAhDnCyADQQA2AgwgASACQQJ0aiADQQxqEN8LIANBEGokACAACwQAIAALBAAgAAsEACAACwQAIAALBAAgAAsQACAAQYiXBUEIajYCACAACxAAIABBrJcFQQhqNgIAIAALDAAgABCUCTYCACAACwQAIAALDgAgACABKAIANgIAIAALCAAgABCgDRoLBAAgAAsJACAAIAEQ3hALBwAgABDfEAsLACAAIAE2AgAgAAsNACAAKAIAEOAQEOEQCwcAIAAQ4xALBwAgABDiEAs8AQJ/IAAoAgAgACgCCCIBQQF1aiECIAAoAgQhAAJAIAFBAXFFDQAgAigCACAAaigCACEACyACIAARBAALBwAgACgCAAsWACAAIAEQ5xAiAUEEaiACEJkHGiABCwcAIAAQ6BALCgAgAEEEahCaBwsOACAAIAEoAgA2AgAgAAsEACAACwoAIAEgAGtBDG0LCwAgACABIAIQyggLBQAQ7BALCABBgICAgHgLBQAQ7xALBQAQ8BALDQBCgICAgICAgICAfwsNAEL///////////8ACwsAIAAgASACEMcICwUAEPMQCwYAQf//AwsFABD1EAsEAEJ/CwwAIAAgARCUCRDPCAsMACAAIAEQlAkQ0AgLPQIBfwF+IwBBEGsiAyQAIAMgASACEJQJENEIIAMpAwAhBCAAIANBCGopAwA3AwggACAENwMAIANBEGokAAsKACABIABrQQxtCw4AIAAgASgCADYCACAACwQAIAALBAAgAAsOACAAIAEoAgA2AgAgAAsHACAAEIARCwoAIABBBGoQmgcLBAAgAAsEACAACw4AIAAgASgCADYCACAACwQAIAALBAAgAAsEACAACwMAAAsHACAAEOoECwcAIAAQ6wQLbQBBoNIFEIcRGgJAA0AgACgCAEEBRw0BQbjSBUGg0gUQihEaDAALAAsCQCAAKAIADQAgABCLEUGg0gUQiBEaIAEgAhEEAEGg0gUQhxEaIAAQjBFBoNIFEIgRGkG40gUQjREaDwtBoNIFEIgRGgsJACAAIAEQ7AQLCQAgAEEBNgIACwkAIABBfzYCAAsHACAAEO0EC0UBAn8jAEEQayICJABBACEDAkAgAEEDcQ0AIAEgAHANACACQQxqIAAgARDaBCEAQQAgAigCDCAAGyEDCyACQRBqJAAgAws2AQF/IABBASAAQQFLGyEBAkADQCABENQEIgANAQJAEMERIgBFDQAgABEIAAwBCwsQEQALIAALBwAgABDWBAsHACAAEJARCz8BAn8gAUEEIAFBBEsbIQIgAEEBIABBAUsbIQACQANAIAIgABCTESIDDQEQwREiAUUNASABEQgADAALAAsgAwshAQF/IAAgACABakF/akEAIABrcSICIAEgAiABSxsQjhELBwAgABCVEQsHACAAENYECwUAEBEACxAAIABB7J4FQQhqNgIAIAALPAECfyABENAEIgJBDWoQjxEiA0EANgIIIAMgAjYCBCADIAI2AgAg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BCABQQJ0aiADQQRqEN8LIANBEGokAA8LIAAQ+g4AC8UBAQN/IwBBEGsiAiQAIAIgATYCDAJAAkAgABCxCiIDDQBBASEEIAAQswohAQwBCyAAEIkPQX9qIQQgABCyCiEBCwJAAkACQCABIARHDQAgACAEQQEgBCAEQQBBABDmCyAAEPUJGgwBCyAAEPUJGiADDQAgABDhCyEEIAAgAUEBahDiCwwBCyAAEN4LIQQgACABQQFqEOALCyAEIAFBAnRqIgAgAkEMahDfCyACQQA2AgggAEEEaiACQQhqEN8LIAJBEGokAAsEACAACyoAAkADQCABRQ0BIAAgAi0AADoAACABQX9qIQEgAEEBaiEADAALAAsgAAsqAAJAA0AgAUUNASAAIAIoAgA2AgAgAUF/aiEBIABBBGohAAwACwALIAALCQAgACABELoRC3IBAn8CQAJAIAEoAkwiAkEASA0AIAJFDQEgAkH/////A3EQygQoAhhHDQELAkAgAEH/AXEiAiABKAJQRg0AIAEoAhQiAyABKAIQRg0AIAEgA0EBajYCFCADIAA6AAAgAg8LIAEgAhCuBw8LIAAgARC7EQt1AQN/AkAgAUHMAGoiAhC8EUUNACABEPIEGgsCQAJAIABB/wFxIgMgASgCUEYNACABKAIUIgQgASgCEEYNACABIARBAWo2AhQgBCAAOgAADAELIAEgAxCuByEDCwJAIAIQvRFBgICAgARxRQ0AIAIQvhELIAMLGwEBfyAAIAAoAgAiAUH/////AyABGzYCACABCxQBAX8gACgCACEBIABBADYCACABCwoAIABBARDpBBoLPgECfyMAQRBrIgIkAEHIiwRBC0EBQQAoAqi+BCIDEPkEGiACIAE2AgwgAyAAIAEQrwgaQQogAxC5ERoQEQALBwAgACgCAAsJAEHo0gUQwBELBABBAAsPACAAQdAAahDUBEHQAGoLDABBqosEQQAQvxEACwcAIAAQ+BELAgALAgALCgAgABDFERCQEQsKACAAEMUREJARCwoAIAAQxREQkBELCgAgABDFERCQEQsKACAAEMUREJARCwsAIAAgAUEAEM4RCzAAAkAgAg0AIAAoAgQgASgCBEYPCwJAIAAgAUcNAEEBDwsgABDPESABEM8REJkIRQsHACAAKAIEC60BAQJ/IwBBwABrIgMkAEEBIQQCQCAA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eQBNb25kYXkARnJpZGF5AE1heQAlbS8lZC8leQAtKyAgIDBYMHgALTBYKzBYIDBYLTB4KzB4IDB4AE5vdgBUaHUAdW5zdXBwb3J0ZWQgbG9jYWxlIGZvciBzdGFuZGFyZCBpbnB1dABBdWd1c3QAdW5zaWduZWQgc2hvcnQAdW5zaWduZWQgaW50AGluaXQAT2N0AGZsb2F0AFNhdAB1aW50NjRfdABBcHIAdmVjdG9yAHJlbmRlcgBPY3RvYmVyAE5vdmVtYmVyAFNlcHRlbWJlcgBEZWNlbWJlcgB1bnNpZ25lZCBjaGFyAGlvc19iYXNlOjpjbGVhcgBNYXIAU2VwACVJOiVNOiVTICVwAFN1bgBKdW4Ac3RkOjpleGNlcHRpb24ATW9uAG5hbgBKYW4ASnVsAGJvb2wAc3RkOjpiYWRfZnVuY3Rpb25fY2FsbABBcHJpbABzZXR0QXR0YWNrAEZyaQBTeW50aABiYWRfYXJyYXlfbmV3X2xlbmd0aABNYXJjaABBdWcAdW5zaWduZWQgbG9uZwBzdGFydFBsYXlpbmcAc3RvcFBsYXlpbmcAc3RkOjp3c3RyaW5nAGJhc2ljX3N0cmluZwBzdGQ6OnN0cmluZwBzdGQ6OnUxNnN0cmluZwBzdGQ6OnUzMnN0cmluZwBpbmYAJS4wTGYAJUxmAHRydWUAVHVlAGZhbHNlAFN5bnRoQmFzZQBKdW5lAGRvdWJsZQByZWNvcmQAdm9pZABXZWQAc3RkOjpiYWRfYWxsb2MARGVjAEZlYgBQTEFZACVhICViICVkICVIOiVNOiVTICVZAFBPU0lYAElOSVQAJUg6JU06JVMAU1RPUABOQU4AUE0AQU0ATENfQUxMAEVORCBSRUNPUkRJTkcATEFORwBJTkYAQwBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaG9ydD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgc2hvcnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgaW50PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxmbG9hdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDhfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MTZfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50MTZfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDY0X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDY0X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQzMl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQzMl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBjaGFyPgBzdGQ6OmJhc2ljX3N0cmluZzx1bnNpZ25lZCBjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8bG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgbG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8ZG91YmxlPgBDLlVURi04AC4AKG51bGwpAFB1cmUgdmlydHVhbCBmdW5jdGlvbiBjYWxsZWQhAGxpYmMrK2FiaTogAGJ1ZmZlclNpemU6IAAxMlN5bnRoV3JhcHBlcgA1U3ludGgAAFBOAQDwBQEAeE4BAOEFAQD4BQEAUDEyU3ludGhXcmFwcGVyADBPAQAMBgEAAAAAAAAGAQBQSzEyU3ludGhXcmFwcGVyAAAAADBPAQAsBgEAAQAAAAAGAQBpaQB2aQAAABwGAQAAAAAAcAYBABgAAAA0U2luZQAAAFBOAQBoBgEAAAAAAJAGAQAZAAAAOEdyYWluRW52AAAAeE4BAIQGAQBwBgEAAAAAAEAHAQAaAAAAGwAAABwAAAAdAAAAHgAAAB8AAAAgAAAAIQAAACIAAABOU3QzX18yMTBfX2Z1bmN0aW9uNl9fZnVuY0lOOEVudmVsb3BlN29uRW5kZWRNVWx2RV9FTlNfOWFsbG9jYXRvcklTNF9FRUZ2dkVFRQBOU3QzX18yMTBfX2Z1bmN0aW9uNl9fYmFzZUlGdnZFRUUAUE4BABYHAQB4TgEAyAYBADgHAQAAAAAAOAcBACMAAAAkAAAAJQAAACUAAAAlAAAAJQAAACUAAAAlAAAAJQAAAE44RW52ZWxvcGU3b25FbmRlZE1VbHZFX0UAAABQTgEAeAcBAAAAAACMTQEAHAYBABBOAQAQTgEA7E0BAHZpaWlpaQBQNVN5bnRoAAAwTwEAuwcBAAAAAAD4BQEAUEs1U3ludGgAAAAAME8BANQHAQABAAAA+AUBAHYAAADEBwEAAAAAAAAAAACMTQEAxAcBAOxNAQDsTQEANE4BAHZpaWlpZgAAjE0BAMQHAQB2aWkAjE0BAMQHAQC8TQEAdmlpaQAAAACMTQEAxAcBADROAQB2aWlmAAAAAAAAAADQCAEAKQAAACoAAAArAAAALAAAAC0AAAAuAAAALwAAADAAAAAxAAAATlN0M19fMjEwX19mdW5jdGlvbjZfX2Z1bmNJWk41Vm9pY2U0aW5pdEVpaWZQNVN5bnRoRTMkXzBOU185YWxsb2NhdG9ySVM1X0VFRnZ2RUVFAAAAeE4BAHwIAQA4BwEAWk41Vm9pY2U0aW5pdEVpaWZQNVN5bnRoRTMkXzAAAABQTgEA3AgBAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0ljTlNfMTFjaGFyX3RyYWl0c0ljRUVOU185YWxsb2NhdG9ySWNFRUVFAABQTgEABAkBAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0loTlNfMTFjaGFyX3RyYWl0c0loRUVOU185YWxsb2NhdG9ySWhFRUVFAABQTgEATAkBAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0l3TlNfMTFjaGFyX3RyYWl0c0l3RUVOU185YWxsb2NhdG9ySXdFRUVFAABQTgEAlAkBAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0lEc05TXzExY2hhcl90cmFpdHNJRHNFRU5TXzlhbGxvY2F0b3JJRHNFRUVFAAAAUE4BANwJAQBOU3QzX18yMTJiYXNpY19zdHJpbmdJRGlOU18xMWNoYXJfdHJhaXRzSURpRUVOU185YWxsb2NhdG9ySURpRUVFRQAAAFBOAQAoCgEATjEwZW1zY3JpcHRlbjN2YWxFAABQTgEAdAoBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWNFRQAAUE4BAJAKAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lh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FQAAwBYAAMAXAADAGAAAwBkAAMAaAADAGwAAwBwAAMAdAADAHgAAwB8AAMAAAACzAQAAwwIAAMMDAADDBAAAwwUAAMMGAADDBwAAwwgAAMMJAADDCgAAwwsAAMMMAADDDQAA0w4AAMMPAADDAAAMuwEADMMCAAzDAwAMwwQADNsAAAAAxCABADUAAABvAAAAcAAAADgAAAA5AAAAOgAAADsAAAA8AAAAPQAAAHEAAAByAAAAcwAAAEEAAABCAAAATlN0M19fMjEwX19zdGRpbmJ1ZkljRUUAeE4BAKwgAQBIHQEAAAAAACwhAQA1AAAAdAAAAHUAAAA4AAAAOQAAADoAAAB2AAAAPAAAAD0AAAA+AAAAPwAAAEAAAAB3AAAAeAAAAE5TdDNfXzIxMV9fc3Rkb3V0YnVmSWNFRQAAAAB4TgEAECEBAEgdAQAAAAAAkCEBAEsAAAB5AAAAegAAAE4AAABPAAAAUAAAAFEAAABSAAAAUwAAAHsAAAB8AAAAfQAAAFcAAABYAAAATlN0M19fMjEwX19zdGRpbmJ1Zkl3RUUAeE4BAHghAQBcHgEAAAAAAPghAQBLAAAAfgAAAH8AAABOAAAATwAAAFAAAACAAAAAUgAAAFMAAABUAAAAVQAAAFYAAACBAAAAggAAAE5TdDNfXzIxMV9fc3Rkb3V0YnVmSXdFRQAAAAB4TgEA3CEBAFweAQAAAAAAAAAAAAAAAADRdJ4AV529KoBwUg///z4nCgAAAGQAAADoAwAAECcAAKCGAQBAQg8AgJaYAADh9QUYAAAANQAAAHEAAABr////zvv//5K///8AAAAAAAAAAP////////////////////////////////////////////////////////////////8AAQIDBAUGBwgJ/////////woLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIj////////CgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiP/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AAECBAcDBgUAAAAAAAAA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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwC0BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAACAAAAAwAAAAQAAAAFAAAABgAAAAcAAAAIAAAACQAAAAoAAAALAAAADAAAAA0AAAAOAAAADwAAABAAAAARAAAAEgAAABMAAAAUAAAAFQAAABYAAAAXAAAAGAAAABkAAAAaAAAAGwAAABwAAAAdAAAAHgAAAB8AAAAgAAAAIQAAACIAAAAjAAAAJAAAACUAAAAmAAAAJwAAACgAAAApAAAAKgAAACsAAAAsAAAALQAAAC4AAAAvAAAAMAAAADEAAAAyAAAAMwAAADQAAAA1AAAANgAAADcAAAA4AAAAOQAAADoAAAA7AAAAPAAAAD0AAAA+AAAAPwAAAEAAAABhAAAAYgAAAGMAAABkAAAAZQAAAGYAAABnAAAAaAAAAGkAAABqAAAAawAAAGwAAABtAAAAbgAAAG8AAABwAAAAcQAAAHIAAABzAAAAdAAAAHUAAAB2AAAAdwAAAHgAAAB5AAAAegAAAFsAAABcAAAAXQAAAF4AAABfAAAAYAAAAGEAAABiAAAAYwAAAGQAAABlAAAAZgAAAGcAAABoAAAAaQAAAGoAAABrAAAAbAAAAG0AAABuAAAAbwAAAHAAAABxAAAAcgAAAHMAAAB0AAAAdQAAAHYAAAB3AAAAeAAAAHkAAAB6AAAAewAAAHwAAAB9AAAAfgAAAH8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAxMjM0NTY3ODlhYmNkZWZBQkNERUZ4WCstcFBpSW5OAAAAAAAAAAA0OwEAmQAAAJoAAACbAAAAAAAAAJQ7AQCcAAAAnQAAAJsAAACeAAAAnwAAAKAAAAChAAAAogAAAKMAAACkAAAApQAAAAAAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAFAgAABQAAAAUAAAAFAAAABQAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAMCAACCAAAAggAAAIIAAACCAAAAggAAAIIAAACCAAAAggAAAIIAAACCAAAAggAAAIIAAACCAAAAggAAAIIAAABCAQAAQgEAAEIBAABCAQAAQgEAAEIBAABCAQAAQgEAAEIBAABCAQAAggAAAIIAAACCAAAAggAAAIIAAACCAAAAggAAACoBAAAqAQAAKgEAACoBAAAqAQAAKgEAACoAAAAqAAAAKgAAACoAAAAqAAAAKgAAACoAAAAqAAAAKgAAACoAAAAqAAAAKgAAACoAAAAqAAAAKgAAACoAAAAqAAAAKgAAACoAAAAqAAAAggAAAIIAAACCAAAAggAAAIIAAACCAAAAMgEAADIBAAAyAQAAMgEAADIBAAAyAQAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAACCAAAAggAAAIIAAACCAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPw6AQCmAAAApwAAAJsAAACoAAAAqQAAAKoAAACrAAAArAAAAK0AAACuAAAAAAAAAMw7AQCvAAAAsAAAAJsAAACxAAAAsgAAALMAAAC0AAAAtQAAAAAAAADwOwEAtgAAALcAAACbAAAAuAAAALkAAAC6AAAAuwAAALwAAAB0AAAAcgAAAHUAAABlAAAAAAAAAGYAAABhAAAAbAAAAHMAAABlAAAAAAAAACUAAABtAAAALwAAACUAAABkAAAALwAAACUAAAB5AAAAAAAAACUAAABIAAAAOgAAACUAAABNAAAAOgAAACUAAABTAAAAAAAAACUAAABhAAAAIAAAACUAAABiAAAAIAAAACUAAABkAAAAIAAAACUAAABIAAAAOgAAACUAAABNAAAAOgAAACUAAABTAAAAIAAAACUAAABZAAAAAAAAACUAAABJAAAAOgAAACUAAABNAAAAOgAAACUAAABTAAAAIAAAACUAAABwAAAAAAAAAAAAAADUNwEAvQAAAL4AAACbAAAATlN0M19fMjZsb2NhbGU1ZmFjZXRFAAAAeE4BALw3AQAATAEAAAAAAFQ4AQC9AAAAvwAAAJsAAADAAAAAwQAAAMIAAADDAAAAxAAAAMUAAADGAAAAxwAAAMgAAADJAAAAygAAAMsAAABOU3QzX18yNWN0eXBlSXdFRQBOU3QzX18yMTBjdHlwZV9iYXNlRQAAUE4BADY4AQDUTgEAJDgBAAAAAAACAAAA1DcBAAIAAABMOAEAAgAAAAAAAADoOAEAvQAAAMwAAACbAAAAzQAAAM4AAADPAAAA0AAAANEAAADSAAAA0wAAAE5TdDNfXzI3Y29kZWN2dEljYzExX19tYnN0YXRlX3RFRQBOU3QzX18yMTJjb2RlY3Z0X2Jhc2VFAAAAAFBOAQDGOAEA1E4BAKQ4AQAAAAAAAgAAANQ3AQACAAAA4DgBAAIAAAAAAAAAXDkBAL0AAADUAAAAmwAAANUAAADWAAAA1wAAANgAAADZAAAA2gAAANsAAABOU3QzX18yN2NvZGVjdnRJRHNjMTFfX21ic3RhdGVfdEVFAADUTgEAODkBAAAAAAACAAAA1DcBAAIAAADgOAEAAgAAAAAAAADQOQEAvQAAANwAAACbAAAA3QAAAN4AAADfAAAA4AAAAOEAAADiAAAA4wAAAE5TdDNfXzI3Y29kZWN2dElEc0R1MTFfX21ic3RhdGVfdEVFANROAQCsOQEAAAAAAAIAAADUNwEAAgAAAOA4AQACAAAAAAAAAEQ6AQC9AAAA5AAAAJsAAADlAAAA5gAAAOcAAADoAAAA6QAAAOoAAADrAAAATlN0M19fMjdjb2RlY3Z0SURpYzExX19tYnN0YXRlX3RFRQAA1E4BACA6AQAAAAAAAgAAANQ3AQACAAAA4DgBAAIAAAAAAAAAuDoBAL0AAADsAAAAmwAAAO0AAADuAAAA7wAAAPAAAADxAAAA8gAAAPMAAABOU3QzX18yN2NvZGVjdnRJRGlEdTExX19tYnN0YXRlX3RFRQDUTgEAlDoBAAAAAAACAAAA1DcBAAIAAADgOAEAAgAAAE5TdDNfXzI3Y29kZWN2dEl3YzExX19tYnN0YXRlX3RFRQAAANROAQDYOgEAAAAAAAIAAADUNwEAAgAAAOA4AQACAAAATlN0M19fMjZsb2NhbGU1X19pbXBFAAAAeE4BABw7AQDUNwEATlN0M19fMjdjb2xsYXRlSWNFRQB4TgEAQDsBANQ3AQBOU3QzX18yN2NvbGxhdGVJd0VFAHhOAQBgOwEA1DcBAE5TdDNfXzI1Y3R5cGVJY0VFAAAA1E4BAIA7AQAAAAAAAgAAANQ3AQACAAAATDgBAAIAAABOU3QzX18yOG51bXB1bmN0SWNFRQAAAAB4TgEAtDsBANQ3AQBOU3QzX18yOG51bXB1bmN0SXdFRQAAAAB4TgEA2DsBANQ3AQAAAAAAVDsBAPQAAAD1AAAAmwAAAPYAAAD3AAAA+AAAAAAAAAB0OwEA+QAAAPoAAACbAAAA+wAAAPwAAAD9AAAAAAAAABA9AQC9AAAA/gAAAJsAAAD/AAAAAAEAAAEBAAACAQAAAwEAAAQBAAAFAQAABgEAAAcBAAAIAQAACQEAAE5TdDNfXzI3bnVtX2dldEljTlNfMTlpc3RyZWFtYnVmX2l0ZXJhdG9ySWNOU18xMWNoYXJfdHJhaXRzSWNFRUVFRUUATlN0M19fMjlfX251bV9nZXRJY0VFAE5TdDNfXzIxNF9fbnVtX2dldF9iYXNlRQAAUE4BANY8AQDUTgEAwDwBAAAAAAABAAAA8DwBAAAAAADUTgEAfDwBAAAAAAACAAAA1DcBAAIAAAD4PAEAAAAAAAAAAADkPQEAvQAAAAoBAACbAAAACwEAAAwBAAANAQAADgEAAA8BAAAQAQAAEQEAABIBAAATAQAAFAEAABUBAABOU3QzX18yN251bV9nZXRJd05TXzE5aXN0cmVhbWJ1Zl9pdGVyYXRvckl3TlNfMTFjaGFyX3RyYWl0c0l3RUVFRUVFAE5TdDNfXzI5X19udW1fZ2V0SXdFRQAAANROAQC0PQEAAAAAAAEAAADwPAEAAAAAANROAQBwPQEAAAAAAAIAAADUNwEAAgAAAMw9AQAAAAAAAAAAAMw+AQC9AAAAFgEAAJsAAAAXAQAAGAEAABkBAAAaAQAAGwEAABwBAAAdAQAAHgEAAE5TdDNfXzI3bnVtX3B1dEljTlNfMTlvc3RyZWFtYnVmX2l0ZXJhdG9ySWNOU18xMWNoYXJfdHJhaXRzSWNFRUVFRUUATlN0M19fMjlfX251bV9wdXRJY0VFAE5TdDNfXzIxNF9fbnVtX3B1dF9iYXNlRQAAUE4BAJI+AQDUTgEAfD4BAAAAAAABAAAArD4BAAAAAADUTgEAOD4BAAAAAAACAAAA1DcBAAIAAAC0PgEAAAAAAAAAAACUPwEAvQAAAB8BAACbAAAAIAEAACEBAAAiAQAAIwEAACQBAAAlAQAAJgEAACcBAABOU3QzX18yN251bV9wdXRJd05TXzE5b3N0cmVhbWJ1Zl9pdGVyYXRvckl3TlNfMTFjaGFyX3RyYWl0c0l3RUVFRUVFAE5TdDNfXzI5X19udW1fcHV0SXdFRQAAANROAQBkPwEAAAAAAAEAAACsPgEAAAAAANROAQAgPwEAAAAAAAIAAADUNwEAAgAAAHw/AQAAAAAAAAAAAJRAAQAoAQAAKQEAAJsAAAAqAQAAKwEAACwBAAAtAQAALgEAAC8BAAAwAQAA+P///5RAAQAxAQAAMgEAADMBAAA0AQAANQEAADYBAAA3AQAATlN0M19fMjh0aW1lX2dldEljTlNfMTlpc3RyZWFtYnVmX2l0ZXJhdG9ySWNOU18xMWNoYXJfdHJhaXRzSWNFRUVFRUUATlN0M19fMjl0aW1lX2Jhc2VFAFBOAQBNQAEATlN0M19fMjIwX190aW1lX2dldF9jX3N0b3JhZ2VJY0VFAAAAUE4BAGhAAQDUTgEACEABAAAAAAADAAAA1DcBAAIAAABgQAEAAgAAAIxAAQAACAAAAAAAAIBBAQA4AQAAOQEAAJsAAAA6AQAAOwEAADwBAAA9AQAAPgEAAD8BAABAAQAA+P///4BBAQBBAQAAQgEAAEMBAABEAQAARQEAAEYBAABHAQAATlN0M19fMjh0aW1lX2dldEl3TlNfMTlpc3RyZWFtYnVmX2l0ZXJhdG9ySXdOU18xMWNoYXJfdHJhaXRzSXdFRUVFRUUATlN0M19fMjIwX190aW1lX2dldF9jX3N0b3JhZ2VJd0VFAABQTgEAVUEBANROAQAQQQEAAAAAAAMAAADUNwEAAgAAAGBAAQACAAAAeEEBAAAIAAAAAAAAJEIBAEgBAABJAQAAmwAAAEoBAABOU3QzX18yOHRpbWVfcHV0SWNOU18xOW9zdHJlYW1idWZfaXRlcmF0b3JJY05TXzExY2hhcl90cmFpdHNJY0VFRUVFRQBOU3QzX18yMTBfX3RpbWVfcHV0RQAAAFBOAQAFQgEA1E4BAMBBAQAAAAAAAgAAANQ3AQACAAAAHEIBAAAIAAAAAAAApEIBAEsBAABMAQAAmwAAAE0BAABOU3QzX18yOHRpbWVfcHV0SXdOU18xOW9zdHJlYW1idWZfaXRlcmF0b3JJd05TXzExY2hhcl90cmFpdHNJd0VFRUVFRQAAAADUTgEAXEIBAAAAAAACAAAA1DcBAAIAAAAcQgEAAAgAAAAAAAA4QwEAvQAAAE4BAACbAAAATwEAAFABAABRAQAAUgEAAFMBAABUAQAAVQEAAFYBAABXAQAATlN0M19fMjEwbW9uZXlwdW5jdEljTGIwRUVFAE5TdDNfXzIxMG1vbmV5X2Jhc2VFAAAAAFBOAQAYQwEA1E4BAPxCAQAAAAAAAgAAANQ3AQACAAAAMEMBAAIAAAAAAAAArEMBAL0AAABYAQAAmwAAAFkBAABaAQAAWwEAAFwBAABdAQAAXgEAAF8BAABgAQAAYQEAAE5TdDNfXzIxMG1vbmV5cHVuY3RJY0xiMUVFRQDUTgEAkEMBAAAAAAACAAAA1DcBAAIAAAAwQwEAAgAAAAAAAAAgRAEAvQAAAGIBAACbAAAAYwEAAGQBAABlAQAAZgEAAGcBAABoAQAAaQEAAGoBAABrAQAATlN0M19fMjEwbW9uZXlwdW5jdEl3TGIwRUVFANROAQAERAEAAAAAAAIAAADUNwEAAgAAADBDAQACAAAAAAAAAJREAQC9AAAAbAEAAJsAAABtAQAAbgEAAG8BAABwAQAAcQEAAHIBAABzAQAAdAEAAHUBAABOU3QzX18yMTBtb25leXB1bmN0SXdMYjFFRUUA1E4BAHhEAQAAAAAAAgAAANQ3AQACAAAAMEMBAAIAAAAAAAAAOEUBAL0AAAB2AQAAmwAAAHcBAAB4AQAATlN0M19fMjltb25leV9nZXRJY05TXzE5aXN0cmVhbWJ1Zl9pdGVyYXRvckljTlNfMTFjaGFyX3RyYWl0c0ljRUVFRUVFAE5TdDNfXzIxMV9fbW9uZXlfZ2V0SWNFRQAAUE4BABZFAQDUTgEA0EQBAAAAAAACAAAA1DcBAAIAAAAwRQEAAAAAAAAAAADcRQEAvQAAAHkBAACbAAAAegEAAHsBAABOU3QzX18yOW1vbmV5X2dldEl3TlNfMTlpc3RyZWFtYnVmX2l0ZXJhdG9ySXdOU18xMWNoYXJfdHJhaXRzSXdFRUVFRUUATlN0M19fMjExX19tb25leV9nZXRJd0VFAABQTgEAukUBANROAQB0RQEAAAAAAAIAAADUNwEAAgAAANRFAQAAAAAAAAAAAIBGAQC9AAAAfAEAAJsAAAB9AQAAfgEAAE5TdDNfXzI5bW9uZXlfcHV0SWNOU18xOW9zdHJlYW1idWZfaXRlcmF0b3JJY05TXzExY2hhcl90cmFpdHNJY0VFRUVFRQBOU3QzX18yMTFfX21vbmV5X3B1dEljRUUAAFBOAQBeRgEA1E4BABhGAQAAAAAAAgAAANQ3AQACAAAAeEYBAAAAAAAAAAAAJEcBAL0AAAB/AQAAmwAAAIABAACBAQAATlN0M19fMjltb25leV9wdXRJd05TXzE5b3N0cmVhbWJ1Zl9pdGVyYXRvckl3TlNfMTFjaGFyX3RyYWl0c0l3RUVFRUVFAE5TdDNfXzIxMV9fbW9uZXlfcHV0SXdFRQAAUE4BAAJHAQDUTgEAvEYBAAAAAAACAAAA1DcBAAIAAAAcRwEAAAAAAAAAAACcRwEAvQAAAIIBAACbAAAAgwEAAIQBAACFAQAATlN0M19fMjhtZXNzYWdlc0ljRUUATlN0M19fMjEzbWVzc2FnZXNfYmFzZUUAAAAAUE4BAHlHAQDUTgEAZEcBAAAAAAACAAAA1DcBAAIAAACURwEAAgAAAAAAAAD0RwEAvQAAAIYBAACbAAAAhwEAAIgBAACJAQAATlN0M19fMjhtZXNzYWdlc0l3RUUAAAAA1E4BANxHAQAAAAAAAgAAANQ3AQACAAAAlEcBAAIAAABTAAAAdQAAAG4AAABkAAAAYQAAAHkAAAAAAAAATQAAAG8AAABuAAAAZAAAAGEAAAB5AAAAAAAAAFQAAAB1AAAAZQAAAHMAAABkAAAAYQAAAHkAAAAAAAAAVwAAAGUAAABkAAAAbgAAAGUAAABzAAAAZAAAAGEAAAB5AAAAAAAAAFQAAABoAAAAdQAAAHIAAABzAAAAZAAAAGEAAAB5AAAAAAAAAEYAAAByAAAAaQAAAGQAAABhAAAAeQAAAAAAAABTAAAAYQAAAHQAAAB1AAAAcgAAAGQAAABhAAAAeQAAAAAAAABTAAAAdQAAAG4AAAAAAAAATQAAAG8AAABuAAAAAAAAAFQAAAB1AAAAZQAAAAAAAABXAAAAZQAAAGQAAAAAAAAAVAAAAGgAAAB1AAAAAAAAAEYAAAByAAAAaQAAAAAAAABTAAAAYQAAAHQAAAAAAAAASgAAAGEAAABuAAAAdQAAAGEAAAByAAAAeQAAAAAAAABGAAAAZQAAAGIAAAByAAAAdQAAAGEAAAByAAAAeQAAAAAAAABNAAAAYQAAAHIAAABjAAAAaAAAAAAAAABBAAAAcAAAAHIAAABpAAAAbAAAAAAAAABNAAAAYQAAAHkAAAAAAAAASgAAAHUAAABuAAAAZQAAAAAAAABKAAAAdQAAAGwAAAB5AAAAAAAAAEEAAAB1AAAAZwAAAHUAAABzAAAAdAAAAAAAAABTAAAAZQAAAHAAAAB0AAAAZQAAAG0AAABiAAAAZQAAAHIAAAAAAAAATwAAAGMAAAB0AAAAbwAAAGIAAABlAAAAcgAAAAAAAABOAAAAbwAAAHYAAABlAAAAbQAAAGIAAABlAAAAcgAAAAAAAABEAAAAZQAAAGMAAABlAAAAbQAAAGIAAABlAAAAcgAAAAAAAABKAAAAYQAAAG4AAAAAAAAARgAAAGUAAABiAAAAAAAAAE0AAABhAAAAcgAAAAAAAABBAAAAcAAAAHIAAAAAAAAASgAAAHUAAABuAAAAAAAAAEoAAAB1AAAAbAAAAAAAAABBAAAAdQAAAGcAAAAAAAAAUwAAAGUAAABwAAAAAAAAAE8AAABjAAAAdAAAAAAAAABOAAAAbwAAAHYAAAAAAAAARAAAAGUAAABjAAAAAAAAAEEAAABNAAAAAAAAAFAAAABNAAAAAAAAAAAAAACMQAEAMQEAADIBAAAzAQAANAEAADUBAAA2AQAANwEAAAAAAAB4QQEAQQEAAEIBAABDAQAARAEAAEUBAABGAQAARwEAAAAAAAAATAEAigEAAIsBAAAlAAAATlN0M19fMjE0X19zaGFyZWRfY291bnRFAAAAAFBOAQDkSwEATjEwX19jeHhhYml2MTE2X19zaGltX3R5cGVfaW5mb0UAAAAAeE4BAAhMAQBQUAEATjEwX19jeHhhYml2MTE3X19jbGFzc190eXBlX2luZm9FAAAAeE4BADhMAQAsTAEATjEwX19jeHhhYml2MTE3X19wYmFzZV90eXBlX2luZm9FAAAAeE4BAGhMAQAsTAEATjEwX19jeHhhYml2MTE5X19wb2ludGVyX3R5cGVfaW5mb0UAeE4BAJhMAQCMTAEATjEwX19jeHhhYml2MTIwX19mdW5jdGlvbl90eXBlX2luZm9FAAAAAHhOAQDITAEALEwBAE4xMF9fY3h4YWJpdjEyOV9fcG9pbnRlcl90b19tZW1iZXJfdHlwZV9pbmZvRQAAAHhOAQD8TAEAjEwBAAAAAAB8TQEAjAEAAI0BAACOAQAAjwEAAJABAABOMTBfX2N4eGFiaXYxMjNfX2Z1bmRhbWVudGFsX3R5cGVfaW5mb0UAeE4BAFRNAQAsTAEAdgAAAEBNAQCITQEARG4AAEBNAQCUTQEAYgAAAEBNAQCgTQEAYwAAAEBNAQCsTQEAaAAAAEBNAQC4TQEAYQAAAEBNAQDETQEAcwAAAEBNAQDQTQEAdAAAAEBNAQDcTQEAaQAAAEBNAQDoTQEAagAAAEBNAQD0TQEAbAAAAEBNAQAATgEAbQAAAEBNAQAMTgEAeAAAAEBNAQAYTgEAeQAAAEBNAQAkTgEAZgAAAEBNAQAwTgEAZAAAAEBNAQA8TgEAAAAAAFxMAQCMAQAAkQEAAI4BAACPAQAAkgEAAJMBAACUAQAAlQEAAAAAAADATgEAjAEAAJYBAACOAQAAjwEAAJIBAACXAQAAmAEAAJkBAABOMTBfX2N4eGFiaXYxMjBfX3NpX2NsYXNzX3R5cGVfaW5mb0UAAAAAeE4BAJhOAQBcTAEAAAAAABxPAQCMAQAAmgEAAI4BAACPAQAAkgEAAJsBAACcAQAAnQEAAE4xMF9fY3h4YWJpdjEyMV9fdm1pX2NsYXNzX3R5cGVfaW5mb0UAAAB4TgEA9E4BAFxMAQAAAAAAvEwBAIwBAACeAQAAjgEAAI8BAACfAQAAAAAAAKhPAQAXAAAAoAEAAKEBAAAAAAAA0E8BABcAAACiAQAAowEAAAAAAACQTwEAFwAAAKQBAAClAQAAU3Q5ZXhjZXB0aW9uAAAAAFBOAQCATwEAU3Q5YmFkX2FsbG9jAAAAAHhOAQCYTwEAkE8BAFN0MjBiYWRfYXJyYXlfbmV3X2xlbmd0aAAAAAB4TgEAtE8BAKhPAQAAAAAAAFABACYAAACmAQAApwEAAFN0MTFsb2dpY19lcnJvcgB4TgEA8E8BAJBPAQAAAAAANFABACYAAACoAQAApwEAAFN0MTJsZW5ndGhfZXJyb3IAAAAAeE4BACBQAQAAUAEAU3Q5dHlwZV9pbmZvAAAAAFBOAQBAUAEAAEHYoAULxANwaQEAAAAAAAkAAAAAAAAAAAAAAGcAAAAAAAAAAAAAAAAAAAAAAAAAaAAAAAAAAABpAAAA+FQBAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAGoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGsAAABsAAAACFkBAAAEAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAD/////CgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPBQAQAAAAAABQAAAAAAAAAAAAAAZwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAawAAAGkAAAAQXQEAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAP//////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAiFEBAA==';
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

