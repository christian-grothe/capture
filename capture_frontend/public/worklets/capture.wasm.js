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
  wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAABwAVZYAF/AX9gAn9/AX9gAn9/AGADf39/AX9gAX8AYAABf2ADf39/AGAGf39/f39/AX9gAABgBH9/f38AYAV/f39/fwF/YAZ/f39/f38AYAR/f39/AX9gCH9/f39/f39/AX9gBX9/f39/AGAHf39/f39/fwBgAX0BfWACf30AYAd/f39/f39/AX9gAX8BfWAFf35+fn4AYAABfmADf35/AX5gBX9/f39+AX9gAn19AX1gBH9/f38BfmAGf39/f35/AX9gCn9/f39/f39/f38AYAd/f39/f35+AX9gBH9/f30AYAN/f30AYAF8AXxgBX9/fn9/AGAEf35+fwBgCn9/f39/f39/f38Bf2AGf39/f35+AX9gBX9/f31/AGABfwF8YAJ/fABgAX0Bf2ACfH8BfGAEfn5+fgF/YAR/f39+AX5gBn98f39/fwF/YAJ+fwF/YAN/f38BfmACf38BfWACf38BfGADf39/AX1gA39/fwF8YAx/f39/f39/f39/f38Bf2AFf39/f3wBf2AGf39/f3x/AX9gB39/f39+fn8Bf2ALf39/f39/f39/f38Bf2APf39/f39/f39/f39/f39/AGAIf39/f39/f38AYA1/f39/f39/f39/f39/AGAJf39/f39/f39/AGAFf39/f30AYAV/f319fQF9YAN9fX0BfWADf31/AX1gBH9/fX0BfWAEf319fwBgBn99fX19fwBgA399fQBgAnx8AXxgAnx/AX9gA3x8fwF8YAJ/fQF9YAJ8fwF9YAJ/fgF/YAJ/fgBgAn5+AX9gA39+fgBgAn9/AX5gAn5+AX1gAn5+AXxgA39/fgBgA35/fwF/YAF8AX5gBn9/f35/fwBgBH9/fn8BfmAGf39/f39+AX9gCH9/f39/f35+AX9gCX9/f39/f39/fwF/YAV/f39+fgBgBH9+f38BfwLBBRcDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfY2xhc3MAOQNlbnYiX2VtYmluZF9yZWdpc3Rlcl9jbGFzc19jb25zdHJ1Y3RvcgALA2VudgtfX2N4YV90aHJvdwAGA2Vudh9fZW1iaW5kX3JlZ2lzdGVyX2NsYXNzX2Z1bmN0aW9uADoDZW52FV9lbWJpbmRfcmVnaXN0ZXJfdm9pZAACA2VudhVfZW1iaW5kX3JlZ2lzdGVyX2Jvb2wA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CwoNCwsLCwsLDgsLCwsODQMABwcAAAAAAAcLBwsHCwoNCwsLCwsLDgsLCwsOEgsDAgEJEgsDAQoECQAFBQACAgICAAICAAACAgICAAICAAUFAAICAAQCAgACAgAAAgICAgACAgEEAwEABAMAAAASBDYAAAMDABsGAAMBAAABAQMGBgAAAAASBAMBDwIDAAACAgIAAAICAAACAgIAAAICAAMAAQADAQAAAQAAAQICEjYAAAMbBgABAwEAAAEBAwYAEgQDAAICAAIAAQEPAgAMAAICAQIAAAICAAACAgIAAAICAAMAAQADAQAAAQIcARs3AAICAAEAAwUHHAEbNwAAAAICAAEAAwcJAQUBCQEBAwsCAwsCAAEBAQQIAggCCAIIAggCCAIIAggCCAIIAggCCAIIAggCCAIIAggCCAIIAggCCAIIAggCCAIIAggCCAIIAggCCAIBAwECAgIEAAQCAAYBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQUBBAUAAQEAAQIAAAQAAAAEBAICAAEBCAUFAAEABAMCBAQAAQEEBQQDDAwMAQUDAQUDAQwDCgwAAAQBAwEDAQwDCgQNDQoAAAoAAQAEDQcMDQcKCgAMAAAKDAAEDQ0NDQoAAAoKAAQNDQoAAAoABA0NDQ0KAAAKCgAEDQ0KAAAKAAEBAAQABAAAAAACAgICAQACAgEBAgAIBAAIBAEACAQACAQACAQACAQABAAEAAQABAAEAAQABAAEAAEEBAQEAAAEAAAEBAAEAAQEBAQEBAQEBAQBCQEAAAEJAAABAAAABgICAgQAAAEAAAAAAAACAw8GBgAAAwMDAwEBAgICAgICAgAACQkGAA4BAQYGAAMBAQMJCQYADgEBBgYAAwEBAwEBAwMADAMAAAAAAQ8BAwMGAwEJAAwDAAAAAAECAgkJBgEGBgMBAAAAAAABAQEJCQYBBgYDAQAAAAAAAQEBAQABAAQABgACAwAAAgAAAAMAAAAADgAAAAABAAAAAAAAAAACAgQEAQQGBgYMAgIAAwAAAwABDAACBAABAAAAAwkJCQYADgEBBgYBAAAAAAMBAQgCAAIAAAICAgMAAAAAAAAAAAABBAABBAEEAAQEAAMAAAEAARkFBRUVFRUZBQUVFS4vBgEBAAABAAAAAAEAAAAEAAAGAQQEAAEABAQBAQIECAABAAEAAzgA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AigCjAEhHSACIB02AvwCQQQhHiACIB42AvgCIAIoAvwCIR8gAigC+AIhICAgEChBACEhIAIgITYCbEEFISIgAiAiNgJoIAIpAmgheCACIHg3A5ABIAIoApABISMgAigClAEhJCACIB82AqwBQfqBBCElIAIgJTYCqAEgAiAkNgKkASACICM2AqABIAIoAqgBISYgAigCoAEhJyACKAKkASEoIAIgKDYCnAEgAiAnNgKYASACKQKYASF5IAIgeTcDKEEoISkgAiApaiEqICYgKhAqQecAISsgAiAraiEsIAIgLDYCxAFB14QEIS0gAiAtNgLAARArQQYhLiACIC42ArwBEC0hLyACIC82ArgBEC4hMCACIDA2ArQBQQchMSACIDE2ArABEDAhMhAxITMQMiE0EDMhNSACKAK8ASE2IAIgNjYCgAMQJSE3IAIoArwBITggAigCuAEhOSACIDk2AogDEDQhOiACKAK4ASE7IAIoArQBITwgAiA8NgKEAxA0IT0gAigCtAEhPiACKALAASE/IAIoArABIUAgAiBANgKMAxAmIUEgAigCsAEhQiAyIDMgNCA1IDcgOCA6IDsgPSA+ID8gQSBCEAAgAiAhNgJgQQghQyACIEM2AlwgAikCXCF6IAIgejcDyAEgAigCyAEhRCACKALMASFFQecAIUYgAiBGaiFHIAIgRzYC5AFB04EEIUggAiBINgLgASACIEU2AtwBIAIgRDYC2AEgAigC5AEhSSACKALgASFKIAIoAtgBIUsgAigC3AEhTCACIEw2AtQBIAIgSzYC0AEgAikC0AEheyACIHs3AyBBICFNIAIgTWohTiBKIE4QNSACICE2AlhBCSFPIAIgTzYCVCACKQJUIXwgAiB8NwOoAiACKAKoAiFQIAIoAqwCIVEgAiBJNgLEAkHRgwQhUiACIFI2AsACIAIgUTYCvAIgAiBQNgK4AiACKALEAiFTIAIoAsACIVQgAigCuAIhVSACKAK8AiFWIAIgVjYCtAIgAiBVNgKwAiACKQKwAiF9IAIgfTcDGEEYIVcgAiBXaiFYIFQgWBA2IAIgITYCUEEKIVkgAiBZNgJMIAIpAkwhfiACIH43A4gCIAIoAogCIVogAigCjAIhWyACIFM2AqQCQd6DBCFcIAIgXDYCoAIgAiBbNgKcAiACIFo2ApgCIAIoAqQCIV0g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ADYCBCAACwcAIAAQpwYLBAAgAAsWAAJAIAJFDQAgACABIAIQ7gQaCyAACwwAIAAgASACEKoGGgsYACAAIAEoAgA2AgAgACACKAIANgIEIAALCQAgACABEKwGCw0AIAAgASAAEKcGa2oLKwEBfyMAQRBrIgMkACADQQhqIAAgASACEK4GIAMoAgwhAiADQRBqJAAgAgsNACAAIAEgAiADEK8GCw0AIAAgASACIAMQsAYLaQEBfyMAQSBrIgQkACAEQRhqIAEgAhCxBiAEQRBqIARBDGogBCgCGCAEKAIcIAMQsgYQswYgBCABIAQoAhAQtAY2AgwgBCADIAQoAhQQtQY2AgggACAEQQxqIARBCGoQtgYgBEEgaiQACwsAIAAgASACELcGCwcAIAAQuQYLDQAgACACIAMgBBC4BgsJACAAIAEQuwYLCQAgACABELwGCwwAIAAgASACELoGGgs4AQF/IwBBEGsiAyQAIAMgARC9BjYCDCADIAIQvQY2AgggACADQQxqIANBCGoQvgYaIANBEGokAAtGAQF/IwBBEGsiBCQAIAQgAjYCDCADIAEgAiABayICQQJ1EMEGGiAEIAMgAmo2AgggACAEQQxqIARBCGoQwgYgBEEQaiQACwcAIAAQxAYLGAAgACABKAIANgIAIAAgAigCADYCBCAACwkAIAAgARDFBgsNACAAIAEgABDEBmtqCwcAIAAQvwYLGAAgACABKAIANgIAIAAgAigCADYCBCAACwcAIAAQwAYLBAAgAAsZAAJAIAJFDQAgACABIAJBAnQQ7gQaCyAACwwAIAAgASACEMMGGgsYACAAIAEoAgA2AgAgACACKAIANgIEIAALBAAgAAsJACAAIAEQxgYLDQAgACABIAAQwAZragsEACAACwcAIAAQyQYLBwAgABDKBgsEACAACwQAIAALCgAgABD5BSgCAAsKACAAEPkFEM4GCwQAIAALBAAgAAsLACAAIAEgAhDUBgsJACAAIAEQ1gYLMQEBfyAAEPkFIgIgAi0AC0GAAXEgAUH/AHFyOgALIAAQ+QUiACAALQALQf8AcToACwsMACAAIAEtAAA6AAALCwAgASACQQEQ1wYLBwAgABDdBgsOACABEPoFGiAAEPoFGgseAAJAIAIQ2AZFDQAgACABIAIQ2QYPCyAAIAEQ2gYLBwAgAEEISwsJACAA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A0EQaiQAIAALNgEBfyAAQQhqELQHIQIgAEGstwRBDGo2AgAgAkGstwRBIGo2AgAgAEEANgIEIAIgARC1ByAAC2MBAX8jAEEQayIDJAAgABD3BCIAIAE2AiAgAEGwwQRBCGo2AgAgA0EMaiAAEPQFIANBDGoQigYhASADQQxqEKYNGiAAIAI2AiggACABNgIkIAAgARCLBjoALCADQRBqJAAgAAsvAQF/IABBBGoQtAchAiAAQdy3BEEMajYCACACQdy3BEEgajYCACACIAEQtQcgAAsUAQF/IAAoAkghAiAAIAE2AkggAgsOACAAQYDAABC2BxogAAttAQF/IwBBEGsiAyQAIAAQuwUiACACNgIoIAAgATYCICAAQZjCBEEIajYCABDIBSECIABBADoANCAAIAI2AjAgA0EMaiAAELcHIAAgA0EMaiAAKAIAKAIIEQIAIANBDGoQpg0aIANBEGokACAACzYBAX8gAEEIahC4ByECIABBzLgEQQxqNgIAIAJBzLgEQSBqNgIAIABBADYCBCACIAEQuQcgAAtjAQF/IwBBEGsiAyQAIAAQuwUiACABNgIgIABB/MIEQQhqNgIAIANBDGogABC3ByADQQxqELoHIQEgA0EMahCmDRogACACNgIoIAAgATYCJCAAIAEQuwc6ACwgA0EQaiQAIAALLwEBfyAAQQRqELgHIQIgAEH8uARBDGo2AgAgAkH8uARBIGo2AgAgAiABELkHIAALFAEBfyAAKAJIIQIgACABNgJIIAILFQAgABDLByIAQay5BEEIajYCACAACxgAIAAgARCLByAAQQA2AkggABCHBTYCTAsVAQF/IAAgACgCBCICIAFyNgIEIAILDQAgACABQQRqEKUNGgsVACAAEMsHIgBBwLsEQQhqNgIAIAALGAAgACABEIsHIABBADYCSCAAEMgFNgJMCwsAIABBpMQFENsICw8AIAAgACgCACgCHBEAAAskAEGkuwUQlAUaQfS9BRCUBRpB+LsFENUFGkHIvgUQ1QUaIAALLgACQEEALQCBwgUNAEGAwgUQqAcaQesAQQBBgIAEEIAHGkEAQQE6AIHCBQsgAAsKAEGAwgUQvAcaCwQAIAALCgAgABD1BBCEEQs6ACAAIAEQigYiATYCJCAAIAEQkQY2AiwgACAAKAIkEIsGOgA1AkAgACgCLEEJSA0A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wD98IQVCACEGDAELAkAgBEGAgID8B0kNACADrUIZhkKAgICAgIDA//8AhCEFQgAhBgwBCwJAIAQNAEIAIQZCACEFDAELIAIgBK1CACAEZyIEQdEAahDoByACQQhqKQMAQoCAgICAgMAAhUGJ/wAgBGutQjCGhCEFIAIpAwAhBgsgACAGNwMAIAAgBSADQYCAgIB4ca1CIIaENwMIIAJBEGokAAuNAQICfwJ+IwBBEGsiAiQAAkACQCABDQBCACEEQgAhBQwBCyACIAEgAUEfdSIDcyADayIDrUIAIANnIgNB0QBqEOgHIAJBCGopAwBCgICAgICAwACFQZ6AASADa61CMIZ8IAFBgICAgHhxrUIghoQhBSACKQMAIQQLIAAgBDcDACAAIAU3AwggAkEQaiQAC1MBAX4CQAJAIANBwABxRQ0AIAIgA0FAaq2IIQFCACECDAELIANFDQAgAkHAACADa62GIAEgA60iBIiEIQEgAiAEiCECCyAAIAE3AwAgACACNwMIC5oLAgV/D34jAEHgAGsiBSQAIARC////////P4MhCiAEIAKFQoCAgICAgICAgH+DIQsgAkL///////8/gyIMQiCIIQ0gBEIwiKdB//8BcSEGAkACQAJAIAJCMIinQf//AXEiB0GBgH5qQYKAfkkNAEEAIQggBkGBgH5qQYGAfksNAQsCQCABUCACQv///////////wCDIg5CgICAgICAwP//AFQgDkKAgICAgIDA//8AURsNACACQoCAgICAgCCEIQsMAgsCQCADUCAEQv///////////wCDIgJCgICAgICAwP//AFQgAkKAgICAgIDA//8AURsNACAEQoCAgICAgCCEIQsgAyEBDAILAkAgASAOQoCAgICAgMD//wCFhEIAUg0AAkAgAyAChFBFDQBCgICAgICA4P//ACELQgAhAQwDCyALQoCAgICAgMD//wCEIQtCACEBDAILAkAgAyACQoCAgICAgMD//wCFhEIAUg0AIAEgDoQhAkIAIQECQCACUEUNAEKAgICAgIDg//8AIQsMAwsgC0KAgICAgIDA//8AhCELDAILAkAgASAOhEIAUg0AQgAhAQwCCwJAIAMgAoRCAFINAEIAIQEMAgtBACEIAkAgDkL///////8/Vg0AIAVB0ABqIAEgDCABIAwgDFAiCBt5IAhBBnStfKciCEFxahDoB0EQIAhrIQggBUHYAGopAwAiDEIgiCENIAUpA1AhAQsgAkL///////8/Vg0AIAVBwABqIAMgCiADIAogClAiCRt5IAlBBnStfKciCUFxahDoByAIIAlrQRBqIQggBUHIAGopAwAhCiAFKQNAIQMLIANCD4YiDkKAgP7/D4MiAiABQiCIIgR+Ig8gDkIgiCIOIAFC/////w+DIgF+fCIQQiCGIhEgAiABfnwiEiARVK0gAiAMQv////8PgyIMfiITIA4gBH58IhEgA0IxiCAKQg+GIhSEQv////8PgyIDIAF+fCIVIBBCIIggECAPVK1CIIaEfCIQIAIgDUKAgASEIgp+IhYgDiAMfnwiDSAUQiCIQoCAgIAIhCICIAF+fCIPIAMgBH58IhRCIIZ8Ihd8IQEgByAGaiAIakGBgH9qIQYCQAJAIAIgBH4iGCAOIAp+fCIEIBhUrSAEIAMgDH58Ig4gBFStfCACIAp+fCAOIBEgE1StIBUgEVStfHwiBCAOVK18IAMgCn4iAyACIAx+fCICIANUrUIghiACQiCIhHwgBCACQiCGfCICIARUrXwgAiAUQiCIIA0gFlStIA8gDVStfCAUIA9UrXxCIIaEfCIEIAJUrXwgBCAQIBVUrSAXIBBUrXx8IgIgBFStfCIEQoCAgICAgMAAg1ANACAGQQFqIQYMAQsgEkI/iCEDIARCAYYgAkI/iIQhBCACQgGGIAFCP4iEIQIgEkIBhiESIAMgAUIBhoQhAQsCQCAGQf//AUgNACALQoCAgICAgMD//wCEIQtCACEBDAELAkACQCAGQQBKDQACQEEBIAZrIgdB/wBLDQAgBUEwaiASIAEgBkH/AGoiBhDoByAFQSBqIAIgBCAGEOgHIAVBEGogEiABIAcQ6wcgBSACIAQgBxDrByAFKQMgIAUpAxCEIAUpAzAgBUEwakEIaikDAIRCAFKthCESIAVBIGpBCGopAwAgBUEQakEIaikDAIQhASAFQQhqKQMAIQQgBSkDACECDAILQgAhAQwCCyAGrUIwhiAEQv///////z+DhCEECyAEIAuEIQsCQCASUCABQn9VIAFCgICAgICAgICAf1EbDQAgCyACQgF8IgFQrXwhCwwBCwJAIBIgAUKAgICAgICAgIB/hYRCAFENACACIQEMAQsgCyACIAJCAYN8IgEgAlStfCELCyAAIAE3AwAgACALNwMIIAVB4ABqJAALBABBAAsEAEEAC+oKAgR/BH4jAEHwAGsiBSQAIARC////////////AIMhCQJAAkACQCABUCIGIAJC////////////AIMiCkKAgICAgIDAgIB/fEKAgICAgIDAgIB/VCAKUBsNACADQgBSIAlCgICAgICAwICAf3wiC0KAgICAgIDAgIB/ViALQoCAgICAgMCAgH9RGw0BCwJAIAYgCkKAgICAgIDA//8AVCAKQoCAgICAgMD//wBRGw0AIAJCgICAgICAIIQhBCABIQMMAgsCQCADUCAJQoCAgICAgMD//wBUIAlCgICAgICAwP//AFEbDQAgBEKAgICAgIAghCEEDAILAkAgASAKQoCAgICAgMD//wCFhEIAUg0AQoCAgICAgOD//wAgAiADIAGFIAQgAoVCgICAgICAgICAf4WEUCIGGyEEQgAgASAGGyEDDAILIAMgCUKAgICAgIDA//8AhYRQDQECQCABIAqEQgBSDQAgAyAJhEIAUg0CIAMgAYMhAyAEIAKDIQQMAgsgAyAJhFBFDQAgASEDIAIhBAwBCyADIAEgAyABViAJIApWIAkgClEbIgcbIQkgBCACIAcbIgtC////////P4MhCiACIAQgBxsiDEIwiKdB//8BcSEIAkAgC0IwiKdB//8BcSIGDQAgBUHgAGogCSAKIAkgCiAKUCIGG3kgBkEGdK18pyIGQXFqEOgHQRAgBmshBiAFQegAaikDACEKIAUpA2AhCQsgASADIAcbIQMgDEL///////8/gyEBAkAgCA0AIAVB0ABqIAMgASADIAEgAVAiBxt5IAdBBnStfKciB0FxahDoB0EQIAdrIQggBUHYAGopAwAhASAFKQNQIQMLIAFCA4YgA0I9iIRCgICAgICAgASEIQEgCkIDhiAJQj2IhCEMIANCA4YhCiAEIAKFIQMCQCAGIAhGDQACQCAGIAhrIgdB/wBNDQBCACEBQgEhCgwBCyAFQcAAaiAKIAFBgAEgB2sQ6AcgBUEwaiAKIAEgBxDrByAFKQMwIAUpA0AgBUHAAGpBCGopAwCEQgBSrYQhCiAFQTBqQQhqKQMAIQELIAxCgICAgICAgASEIQwgCUIDhiEJAkACQCADQn9VDQBCACEDQgAhBCAJIAqFIAwgAYWEUA0CIAkgCn0hAiAMIAF9IAkgClStfSIEQv////////8DVg0BIAVBIGogAiAEIAIgBCAEUCIHG3kgB0EGdK18p0F0aiIHEOgHIAYgB2shBiAFQShqKQMAIQQgBSkDICECDAELIAEgDHwgCiAJfCICIApUrXwiBEKAgICAgICACINQDQAgAkIBiCAEQj+GhCAKQgGDhCECIAZBAWohBiAEQgGIIQQLIAtCgICAgICAgICAf4MhCgJAIAZB//8BSA0AIApCgICAgICAwP//AIQhBEIAIQMMAQtBACEHAkACQCAGQQBMDQAgBiEHDAELIAVBEGogAiAEIAZB/wBqEOgHIAUgAiAEQQEgBmsQ6wcgBSkDACAFKQMQIAVBEGpBCGopAwCEQgBSrYQhAiAFQQhqKQMAIQQLIAJCA4ggBEI9hoQhAyAHrUIwhiAEQgOIQv///////z+DhCAKhCEEIAKnQQdxIQYCQAJAAkACQAJAEO0HDgMAAQIDCwJAIAZBBEYNACAEIAMgBkEES618IgogA1StfCEEIAohAwwDCyAEIAMgA0IBg3wiCiADVK18IQQgCiEDDAMLIAQgAyAKQgBSIAZBAEdxrXwiCiADVK18IQQgCiEDDAELIAQgAyAKUCAGQQBHca18IgogA1StfCEEIAohAwsgBkUNAQsQ7gcaCyAAIAM3AwAgACAENwMIIAVB8ABqJAALjgICAn8DfiMAQRBrIgIkAAJAAkAgAb0iBEL///////////8AgyIFQoCAgICAgIB4fEL/////////7/8AVg0AIAVCPIYhBiAFQgSIQoCAgICAgICAPHwhBQwBCwJAIAVCgICAgICAgPj/AFQNACAEQjyGIQYgBEIEiEKAgICAgIDA//8AhCEFDAELAkAgBVBFDQBCACEGQgAhBQwBCyACIAVCACAFp2dBIGogBUIgiKdnIAVCgICAgBBUGyIDQTFqEOgHIAJBCGopAwBCgICAgICAwACFQYz4ACADa61CMIaEIQUgAikDACEGCyAAIAY3AwAgACAFIARCgICAgICAgICAf4OENwMIIAJBEGokAAvgAQIBfwJ+QQEhBAJAIABCAFIgAUL///////////8AgyIFQoCAgICAgMD//wBWIAVCgICAgICAwP//AFEbDQAgAkIAUiADQv///////////wCDIgZCgICAgICAwP//AFYgBkKAgICAgIDA//8AURsNAAJAIAIgAIQgBiAFhIRQRQ0AQQAPCwJAIAMgAYNCAFMNAEF/IQQgACACVCABIANTIAEgA1EbDQEgACAChSABIAOFhEIAUg8LQX8hBCAAIAJWIAEgA1UgASADURsNACAAIAKFIAEgA4WEQgBSIQQLIAQL2AECAX8CfkF/IQQCQCAAQgBSIAFC////////////AIMiBUKAgICAgIDA//8AViAFQoCAgICAgMD//wBRGw0AIAJCAFIgA0L///////////8AgyIGQoCAgICAgMD//wBWIAZCgICAgICAwP//AFEbDQACQCACIACEIAYgBYSEUEUNAEEADwsCQCADIAGDQgBTDQAgACACVCABIANTIAEgA1EbDQEgACAChSABIAOFhEIAUg8LIAAgAlYgASADVSABIANRGw0AIAAgAoUgASADhYRCAFIhBAsgBAs8ACAAIAE3AwAgACAEQjCIp0GAgAJxIAJCgICAgICAwP//AINCMIincq1CMIYgAkL///////8/g4Q3AwgLdQIBfwJ+IwBBEGsiAiQAAkACQCABDQBCACEDQgAhBAwBCyACIAGtQgBB8AAgAWciAUEfc2sQ6AcgAkEIaikDAEKAgICAgIDAAIVBnoABIAFrrUIwhnwhBCACKQMAIQMLIAAgAzcDACAAIAQ3AwggAkEQaiQAC0gBAX8jAEEQayIFJAAgBSABIAIgAyAEQoCAgICAgICAgH+FEO8HIAUpAwAhBCAAIAVBCGopAwA3AwggACAENwMAIAVBEGokAAvnAgEBfyMAQdAAayIEJAACQAJAIANBgIABSA0AIARBIGogASACQgBCgICAgICAgP//ABDsByAEQSBqQQhqKQMAIQIgBCkDICEBAkAgA0H//wFPDQAgA0GBgH9qIQMMAgsgBEEQaiABIAJCAEKAgICAgICA//8AEOwHIANB/f8CIANB/f8CSRtBgoB+aiEDIARBEGpBCGopAwAhAiAEKQMQIQEMAQsgA0GBgH9KDQAgBEHAAGogASACQgBCgICAgICAgDkQ7AcgBEHAAGpBCGopAwAhAiAEKQNAIQECQCADQfSAfk0NACADQY3/AGohAwwBCyAEQTBqIAEgAkIAQoCAgICAgIA5EOwHIANB6IF9IANB6IF9SxtBmv4BaiEDIARBMGpBCGopAwAhAiAEKQMwIQELIAQgASACQgAgA0H//wBqrUIwhhDsByAAIARBCGopAwA3AwggACAEKQMANwMAIARB0ABqJAALdQEBfiAAIAQgAX4gAiADfnwgA0IgiCICIAFCIIgiBH58IANC/////w+DIgMgAUL/////D4MiAX4iBUIgiCADIAR+fCIDQiCIfCADQv////8PgyACIAF+fCIBQiCIfDcDCCAAIAFCIIYgBUL/////D4OENwMAC+cQAgV/D34jAEHQAmsiBSQAIARC////////P4MhCiACQv///////z+DIQsgBCAChUKAgICAgICAgIB/gyEMIARCMIinQf//AXEhBgJAAkACQCACQjCIp0H//wFxIgdBgYB+akGCgH5JDQBBACEIIAZBgYB+akGBgH5LDQELAkAgAVAgAkL///////////8AgyINQoCAgICAgMD//wBUIA1CgICAgICAwP//AFEbDQAgAkKAgICAgIAghCEMDAILAkAgA1AgBEL///////////8AgyICQoCAgICAgMD//wBUIAJCgICAgICAwP//AFEbDQAgBEKAgICAgIAghCEMIAMhAQwCCwJAIAEgDUKAgICAgIDA//8AhYRCAFINAAJAIAMgAkKAgICAgIDA//8AhYRQRQ0AQgAhAUKAgICAgIDg//8AIQwMAwsgDEKAgICAgIDA//8AhCEMQgAhAQwCCwJAIAMgAkKAgICAgIDA//8AhYRCAFINAEIAIQEMAgsCQCABIA2EQgBSDQBCgICAgICA4P//ACAMIAMgAoRQGyEMQgAhAQwCCwJAIAMgAoRCAFINACAMQoCAgICAgMD//wCEIQxCACEBDAILQQAhCAJAIA1C////////P1YNACAFQcACaiABIAsgASALIAtQIggbeSAIQQZ0rXynIghBcWoQ6AdBECAIayEIIAVByAJqKQMAIQsgBSkDwAIhAQsgAkL///////8/Vg0AIAVBsAJqIAMgCiADIAogClAiCRt5IAlBBnStfKciCUFxahDoByAJIAhqQXBqIQggBUG4AmopAwAhCiAFKQOwAiEDCyAFQaACaiADQjGIIApCgICAgICAwACEIg5CD4aEIgJCAEKAgICAsOa8gvUAIAJ9IgRCABD3ByAFQZACakIAIAVBoAJqQQhqKQMAfUIAIARCABD3ByAFQYACaiAFKQOQAkI/iCAFQZACakEIaikDAEIBhoQiBEIAIAJCABD3ByAFQfABaiAEQgBCACAFQYACakEIaikDAH1CABD3ByAFQeABaiAFKQPwAUI/iCAFQfABakEIaikDAEIBhoQiBEIAIAJCABD3ByAFQdABaiAEQgBCACAFQeABakEIaikDAH1CABD3ByAFQcABaiAFKQPQAUI/iCAFQdABakEIaikDAEIBhoQiBEIAIAJCABD3ByAFQbABaiAEQgBCACAFQcABakEIaikDAH1CABD3ByAFQaABaiACQgAgBSkDsAFCP4ggBUGwAWpBCGopAwBCAYaEQn98IgRCABD3ByAFQZABaiADQg+GQgAgBEIAEPcHIAVB8ABqIARCAEIAIAVBoAFqQQhqKQMAIAUpA6ABIgogBUGQAWpBCGopAwB8IgIgClStfCACQgFWrXx9QgAQ9wcgBUGAAWpCASACfUIAIARCABD3ByAIIAcgBmtqIQYCQAJAIAUpA3AiD0IBhiIQIAUpA4ABQj+IIAVBgAFqQQhqKQMAIhFCAYaEfCINQpmTf3wiEkIgiCICIAtCgICAgICAwACEIhNCAYYiFEIgiCIEfiIVIAFCAYYiFkIgiCIKIAVB8ABqQQhqKQMAQgGGIA9CP4iEIBFCP4h8IA0gEFStfCASIA1UrXxCf3wiD0IgiCINfnwiECAVVK0gECAPQv////8PgyIPIAFCP4giFyALQgGGhEL/////D4MiC358IhEgEFStfCANIAR+fCAPIAR+IhUgCyANfnwiECAVVK1CIIYgEEIgiIR8IBEgEEIghnwiECARVK18IBAgEkL/////D4MiEiALfiIVIAIgCn58IhEgFVStIBEgDyAWQv7///8PgyIVfnwiGCARVK18fCIRIBBUrXwgESASIAR+IhAgFSANfnwiBCACIAt+fCILIA8gCn58Ig1CIIggBCAQVK0gCyAEVK18IA0gC1StfEIghoR8IgQgEVStfCAEIBggAiAVfiICIBIgCn58IgtCIIggCyACVK1CIIaEfCICIBhUrSACIA1CIIZ8IAJUrXx8IgIgBFStfCIEQv////////8AVg0AIBQgF4QhEyAFQdAAaiACIAQgAyAOEPcHIAFCMYYgBUHQAGpBCGopAwB9IAUpA1AiAUIAUq19IQogBkH+/wBqIQZCACABfSELDAELIAVB4ABqIAJCAYggBEI/hoQiAiAEQgGIIgQgAyAOEPcHIAFCMIYgBUHgAGpBCGopAwB9IAUpA2AiC0IAUq19IQogBkH//wBqIQZCACALfSELIAEhFgsCQCAGQf//AUgNACAMQoCAgICAgMD//wCEIQxCACEBDAELAkACQCAGQQFIDQAgCkIBhiALQj+IhCEBIAatQjCGIARC////////P4OEIQogC0IBhiEEDAELAkAgBkGPf0oNAEIAIQEMAgsgBUHAAGogAiAEQQEgBmsQ6wcgBUEwaiAWIBMgBkHwAGoQ6AcgBUEgaiADIA4gBSkDQCICIAVBwABqQQhqKQMAIgoQ9wcgBUEwakEIaikDACAFQSBqQQhqKQMAQgGGIAUpAyAiAUI/iIR9IAUpAzAiBCABQgGGIgtUrX0hASAEIAt9IQQLIAVBEGogAyAOQgNCABD3ByAFIAMgDkIFQgAQ9wcgCiACIAJCAYMiCyAEfCIEIANWIAEgBCALVK18IgEgDlYgASAOURutfCIDIAJUrXwiAiADIAJCgICAgICAwP//AFQgBCAFKQMQViABIAVBEGpBCGopAwAiAlYgASACURtxrXwiAiADVK18IgMgAiADQoCAgICAgMD//wBUIAQgBSkDAFYgASAFQQhqKQMAIgRWIAEgBFEbca18IgEgAlStfCAMhCEMCyAAIAE3AwAgACAMNwMIIAVB0AJqJAALSwIBfgJ/IAFC////////P4MhAgJAAkAgAUIwiKdB//8BcSIDQf//AUYNAEEEIQQgAw0BQQJBAyACIACEUBsPCyACIACEUCEECyAEC9UGAgR/A34jAEGAAWsiBSQAAkACQAJAIAMgBEIAQgAQ8QdFDQAgAyAEEPkHIQYgAkIwiKciB0H//wFxIghB//8BRg0AIAYNAQsgBUEQaiABIAIgAyAEEOwHIAUgBSkDECIEIAVBEGpBCGopAwAiAyAEIAMQ+AcgBUEIaikDACECIAUpAwAhBAwBCwJAIAEgAkL///////////8AgyIJIAMgBEL///////////8AgyIKEPEHQQBKDQACQCABIAkgAyAKEPEHRQ0AIAEhBAwCCyAFQfAAaiABIAJCAEIAEOwHIAVB+ABqKQMAIQIgBSkDcCEEDAELIARCMIinQf//AXEhBgJAAkAgCEUNACABIQQMAQsgBUHgAGogASAJQgBCgICAgICAwLvAABDsByAFQegAaikDACIJQjCIp0GIf2ohCCAFKQNgIQQLAkAgBg0AIAVB0ABqIAMgCkIAQoCAgICAgMC7wAAQ7AcgBUHYAGopAwAiCkIwiKdBiH9qIQYgBSkDUCEDCyAKQv///////z+DQoCAgICAgMAAhCELIAlC////////P4NCgICAgICAwACEIQkCQCAIIAZMDQADQAJAAkAgCSALfSAEIANUrX0iCkIAUw0AAkAgCiAEIAN9IgSEQgBSDQAgBUEgaiABIAJCAEIAEOwHIAVBKGopAwAhAiAFKQMgIQQMBQsgCkIBhiAEQj+IhCEJDAELIAlCAYYgBEI/iIQhCQsgBEIBhiEEIAhBf2oiCCAGSg0ACyAGIQgLAkACQCAJIAt9IAQgA1StfSIKQgBZDQAgCSEKDAELIAogBCADfSIEhEIAUg0AIAVBMGogASACQgBCABDsByAFQThqKQMAIQIgBSkDMCEEDAELAkAgCkL///////8/Vg0AA0AgBEI/iCEDIAhBf2ohCCAEQgGGIQQgAyAKQgGGhCIKQoCAgICAgMAAVA0ACwsgB0GAgAJxIQYCQCAIQQBKDQAgBUHAAGogBCAKQv///////z+DIAhB+ABqIAZyrUIwhoRCAEKAgICAgIDAwz8Q7AcgBUHIAGopAwAhAiAFKQNAIQQMAQsgCkL///////8/gyAIIAZyrUIwhoQhAgsgACAENwMAIAAgAjcDCCAFQYABaiQACxwAIAAgAkL///////////8AgzcDCCAAIAE3AwALlQkCBn8DfiMAQTBrIgQkAEIAIQoCQAJAIAJBAksNACACQQJ0IgJBrMQEaigCACEFIAJBoMQEaigCACEGA0ACQAJAIAEoAgQiAiABKAJoRg0AIAEgAkEBajYCBCACLQAAIQIMAQsgARDnByECCyACEP0HDQALQQEhBwJAAkAgAkFVag4DAAEAAQtBf0EBIAJBLUYbIQcCQCABKAIEIgIgASgCaEYNACABIAJBAWo2AgQgAi0AACECDAELIAEQ5wchAgtBACEIAkACQAJAIAJBX3FByQBHDQADQCAIQQdGDQICQAJAIAEoAgQiAiABKAJoRg0AIAEgAkEBajYCBCACLQAAIQIMAQsgARDnByECCyAIQYGABGohCSAIQQFqIQggAkEgciAJLAAARg0ACwsCQCAIQQNGDQAgCEEIRg0BIANFDQIgCEEESQ0CIAhBCEYNAQsCQCABKQNwIgpCAFMNACABIAEoAgRBf2o2AgQLIANFDQAgCEEESQ0AIApCAFMhAgNAAkAgAg0AIAEgASgCBEF/ajYCBAsgCEF/aiIIQQNLDQALCyAEIAeyQwAAgH+UEOkHIARBCGopAwAhCyAEKQMAIQoMAgsCQAJAAkACQAJAIAgNAEEAIQggAkFfcUHOAEcNAANAIAhBAkYNAgJAAkAgASgCBCICIAEoAmhGDQAgASACQQFqNgIEIAItAAAhAgwBCyABEOcHIQILIAhB84IEaiEJIAhBAWohCCACQSByIAksAABGDQALCyAIDgQDAQEAAQsCQAJAIAEoAgQiAiABKAJoRg0AIAEgAkEBajYCBCACLQAAIQIMAQsgARDnByECCwJAAkAgAkEoRw0AQQEhCAwBC0IAIQpCgICAgICA4P//ACELIAEpA3BCAFMNBSABIAEoAgRBf2o2AgQMBQsDQAJAAkAgASgCBCICIAEoAmhGDQAgASACQQFqNgIEIAItAAAhAgwBCyABEOcHIQILIAJBv39qIQkCQAJAIAJBUGpBCkkNACAJQRpJDQAgAkGff2ohCSACQd8ARg0AIAlBGk8NAQsgCEEBaiEIDAELC0KAgICAgIDg//8AIQsgAkEpRg0EAkAgASkDcCIMQgBTDQAgASABKAIEQX9qNgIECwJAAkAgA0UNACAIDQFCACEKDAYLEMsEQRw2AgBCACEKDAILA0ACQCAMQgBTDQAgASABKAIEQX9qNgIEC0IAIQogCEF/aiIIDQAMBQsAC0IAIQoCQCABKQNwQgBTDQAgASABKAIEQX9qNgIECxDLBEEcNgIACyABIAoQ5gcMAQsCQCACQTBHDQACQAJAIAEoAgQiCCABKAJoRg0AIAEgCEEBajYCBCAILQAAIQgMAQsgARDnByEICwJAIAhBX3FB2ABHDQAgBEEQaiABIAYgBSAHIAMQ/gcgBEEYaikDACELIAQpAxAhCgwDCyABKQNwQgBTDQAgASABKAIEQX9qNgIECyAEQSBqIAEgAiAGIAUgByADEP8HIARBKGopAwAhCyAEKQMgIQoMAQtCACELCyAAIAo3AwAgACALNwMIIARBMGokAAsQACAAQSBGIABBd2pBBUlyC8YPAgh/B34jAEGwA2siBiQAAkACQCABKAIEIgcgASgCaEYNACABIAdBAWo2AgQgBy0AACEHDAELIAEQ5wchBwtBACEIQgAhDkEAIQkCQAJAAkADQAJAIAdBMEYNACAHQS5HDQQgASgCBCIHIAEoAmhGDQIgASAHQQFqNgIEIActAAAhBwwDCwJAIAEoAgQiByABKAJoRg0AQQEhCSABIAdBAWo2AgQgBy0AACEHDAELQQEhCSABEOcHIQcMAAsACyABEOcHIQcLQQEhCEIAIQ4gB0EwRw0AA0ACQAJAIAEoAgQiByABKAJoRg0AIAEgB0EBajYCBCAHLQAAIQcMAQsgARDnByEHCyAOQn98IQ4gB0EwRg0AC0EBIQhBASEJC0KAgICAgIDA/z8hD0EAIQpCACEQQgAhEUIAIRJBACELQgAhEwJAA0AgByEMAkACQCAHQVBqIg1BCkkNACAHQSByIQwCQCAHQS5GDQAgDEGff2pBBUsNBAsgB0EuRw0AIAgNA0EBIQggEyEODAELIAxBqX9qIA0gB0E5ShshBwJAAkAgE0IHVQ0AIAcgCkEEdGohCgwBCwJAIBNCHFYNACAGQTBqIAcQ6gcgBkEgaiASIA9CAEKAgICAgIDA/T8Q7AcgBkEQaiAGKQMwIAZBMGpBCGopAwAgBikDICISIAZBIGpBCGopAwAiDxDsByAGIAYpAxAgBkEQakEIaikDACAQIBEQ7wcgBkEIaikDACERIAYpAwAhEAwBCyAHRQ0AIAsNACAGQdAAaiASIA9CAEKAgICAgICA/z8Q7AcgBkHAAGogBikDUCAGQdAAakEIaikDACAQIBEQ7wcgBkHAAGpBCGopAwAhEUEBIQsgBikDQCEQCyATQgF8IRNBASEJCwJAIAEoAgQiByABKAJoRg0AIAEgB0EBajYCBCAHLQAAIQcMAQsgARDnByEHDAALAAsCQAJAIAkNAAJAAkACQCABKQNwQgBTDQAgASABKAIEIgdBf2o2AgQgBUUNASABIAdBfmo2AgQgCEUNAiABIAdBfWo2AgQMAgsgBQ0BCyABQgAQ5gcLIAZB4ABqIAS3RAAAAAAAAAAAohDwByAGQegAaikDACETIAYpA2AhEAwBCwJAIBNCB1UNACATIQ8DQCAKQQR0IQogD0IBfCIPQghSDQALCwJAAkACQAJAIAdBX3FB0ABHDQAgASAFEIAIIg9CgICAgICAgICAf1INAwJAIAVFDQAgASkDcEJ/VQ0CDAMLQgAhECABQgAQ5gdCACETDAQLQgAhDyABKQNwQgBTDQILIAEgASgCBEF/ajYCBAtCACEPCwJAIAoNACAGQfAAaiAEt0QAAAAAAAAAAKIQ8AcgBkH4AGopAwAhEyAGKQNwIRAMAQsCQCAOIBMgCBtCAoYgD3xCYHwiE0EAIANrrVcNABDLBEHEADYCACAGQaABaiAEEOoHIAZBkAFqIAYpA6ABIAZBoAFqQQhqKQMAQn9C////////v///ABDsByAGQYABaiAGKQOQASAGQZABakEIaikDAEJ/Qv///////7///wAQ7AcgBkGAAWpBCGopAwAhEyAGKQOAASEQDAELAkAgEyADQZ5+aqxTDQACQCAKQX9MDQADQCAGQaADaiAQIBFCAEKAgICAgIDA/79/EO8HIBAgEUIAQoCAgICAgID/PxDyByEHIAZBkANqIBAgESAGKQOgAyAQIAdBf0oiBxsgBkGgA2pBCGopAwAgESAHGxDvByATQn98IRMgBkGQA2pBCGopAwAhESAGKQOQAyEQIApBAXQgB3IiCkF/Sg0ACwsCQAJAIBMgA6x9QiB8Ig6nIgdBACAHQQBKGyACIA4gAq1TGyIHQfEASA0AIAZBgANqIAQQ6gcgBkGIA2opAwAhDkIAIQ8gBikDgAMhEkIAIRQMAQsgBkHgAmpEAAAAAAAA8D9BkAEgB2sQxQQQ8AcgBkHQAmogBBDqByAGQfACaiAGKQPgAiAGQeACakEIaikDACAGKQPQAiISIAZB0AJqQQhqKQMAIg4Q8wcgBkHwAmpBCGopAwAhFCAGKQPwAiEPCyAGQcACaiAKIApBAXFFIAdBIEggECARQgBCABDxB0EAR3FxIgdyEPQHIAZBsAJqIBIgDiAGKQPAAiAGQcACakEIaikDABDsByAGQZACaiAGKQOwAiAGQbACakEIaikDACAPIBQQ7wcgBkGgAmogEiAOQgAgECAHG0IAIBEgBxsQ7AcgBkGAAmogBikDoAIgBkGgAmpBCGopAwAgBikDkAIgBkGQAmpBCGopAwAQ7wcgBkHwAWogBikDgAIgBkGAAmpBCGopAwAgDyAUEPUHAkAgBikD8AEiECAGQfABakEIaikDACIRQgBCABDxBw0AEMsEQcQANgIACyAGQeABaiAQIBEgE6cQ9gcgBkHgAWpBCGopAwAhEyAGKQPgASEQDAELEMsEQcQANgIAIAZB0AFqIAQQ6gcgBkHAAWogBikD0AEgBkHQAWpBCGopAwBCAEKAgICAgIDAABDsByAGQbABaiAGKQPAASAGQcABakEIaikDAEIAQoCAgICAgMAAEOwHIAZBsAFqQQhqKQMAIRMgBikDsAEhEAsgACAQNwMAIAAgEzcDCCAGQbADaiQAC/0fAwt/Bn4BfCMAQZDGAGsiByQAQQAhCEEAIARrIgkgA2shCkIAIRJBACELAkACQAJAA0ACQCACQTBGDQAgAkEuRw0EIAEoAgQiAiABKAJoRg0CIAEgAkEBajYCBCACLQAAIQIMAwsCQCABKAIEIgIgASgCaEYNAEEBIQsgASACQQFqNgIEIAItAAAhAgwBC0EBIQsgARDnByECDAALAAsgARDnByECC0EBIQhCACESIAJBMEcNAANAAkACQCABKAIEIgIgASgCaEYNACABIAJBAWo2AgQgAi0AACECDAELIAEQ5wchAgsgEkJ/fCESIAJBMEYNAAtBASELQQEhCAtBACEMIAdBADYCkAYgAkFQaiENAkACQAJAAkACQAJAAkAgAkEuRiIODQBCACETIA1BCU0NAEEAIQ9BACEQDAELQgAhE0EAIRBBACEPQQAhDANAAkACQCAOQQFxRQ0AAkAgCA0AIBMhEkEBIQgMAgsgC0UhDgwECyATQgF8IRMCQCAPQfwPSg0AIAdBkAZqIA9BAnRqIQ4CQCAQRQ0AIAIgDigCAEEKbGpBUGohDQsgDCATpyACQTBGGyEMIA4gDTYCAEEBIQtBACAQQQFqIgIgAkEJRiICGyEQIA8gAmohDwwBCyACQTBGDQAgByAHKAKARkEBcjYCgEZB3I8BIQwLAkACQCABKAIEIgIgASgCaEYNACABIAJBAWo2AgQgAi0AACECDAELIAEQ5wchAgsgAkFQaiENIAJBLkYiDg0AIA1BCkkNAAsLIBIgEyAIGyESAkAgC0UNACACQV9xQcUARw0AAkAgASAGEIAIIhRCgICAgICAgICAf1INACAGRQ0EQgAhFCABKQNwQgBTDQAgASABKAIEQX9qNgIECyAUIBJ8IRIMBAsgC0UhDiACQQBIDQELIAEpA3BCAFMNACABIAEoAgRBf2o2AgQLIA5FDQEQywRBHDYCAAtCACETIAFCABDmB0IAIRIMAQsCQCAHKAKQBiIBDQAgByAFt0QAAAAAAAAAAKIQ8AcgB0EIaikDACESIAcpAwAhEwwBCwJAIBNCCVUNACASIBNSDQACQCADQR5KDQAgASADdg0BCyAHQTBqIAUQ6gcgB0EgaiABEPQHIAdBEGogBykDMCAHQTBqQQhqKQMAIAcpAyAgB0EgakEIaikDABDsByAHQRBqQQhqKQMAIRIgBykDECETDAELAkAgEiAJQQF2rVcNABDLBEHEADYCACAHQeAAaiAFEOoHIAdB0ABqIAcpA2AgB0HgAGpBCGopAwBCf0L///////+///8AEOwHIAdBwABqIAcpA1AgB0HQAGpBCGopAwBCf0L///////+///8AEOwHIAdBwABqQQhqKQMAIRIgBykDQCETDAELAkAgEiAEQZ5+aqxZDQAQywRBxAA2AgAgB0GQAWogBRDqByAHQYABaiAHKQOQASAHQZABakEIaikDAEIAQoCAgICAgMAAEOwHIAdB8ABqIAcpA4ABIAdBgAFqQQhqKQMAQgBCgICAgICAwAAQ7AcgB0HwAGpBCGopAwAhEiAHKQNwIRMMAQsCQCAQRQ0AAkAgEEEISg0AIAdBkAZqIA9BAnRqIgIoAgAhAQNAIAFBCmwhASAQQQFqIhBBCUcNAAsgAiABNgIACyAPQQFqIQ8LIBKnIRACQCAMQQlODQAgDCAQSg0AIBBBEUoNAAJAIBBBCUcNACAHQcABaiAFEOoHIAdBsAFqIAcoApAGEPQHIAdBoAFqIAcpA8ABIAdBwAFqQQhqKQMAIAcpA7ABIAdBsAFqQQhqKQMAEOwHIAdBoAFqQQhqKQMAIRIgBykDoAEhEwwCCwJAIBBBCEoNACAHQZACaiAFEOoHIAdBgAJqIAcoApAGEPQHIAdB8AFqIAcpA5ACIAdBkAJqQQhqKQMAIAcpA4ACIAdBgAJqQQhqKQMAEOwHIAdB4AFqQQggEGtBAnRBgMQEaigCABDqByAHQdABaiAHKQPwASAHQfABakEIaikDACAHKQPgASAHQeABakEIaikDABD4ByAHQdABakEIaikDACESIAcpA9ABIRMMAgsgBygCkAYhAQJAIAMgEEF9bGpBG2oiAkEeSg0AIAEgAnYNAQsgB0HgAmogBRDqByAHQdACaiABEPQHIAdBwAJqIAcpA+ACIAdB4AJqQQhqKQMAIAcpA9ACIAdB0AJqQQhqKQMAEOwHIAdBsAJqIBBBAnRB2MMEaigCABDqByAHQaACaiAHKQPAAiAHQcACakEIaikDACAHKQOwAiAHQbACakEIaikDABDsByAHQaACakEIaikDACESIAcpA6ACIRMMAQsDQCAHQZAGaiAPIg5Bf2oiD0ECdGooAgBFDQALQQAhDAJAAkAgEEEJbyIBDQBBACENDAELQQAhDSABQQlqIAEgEEEASBshCQJAAkAgDg0AQQAhDgwBC0GAlOvcA0EIIAlrQQJ0QYDEBGooAgAiC20hBkEAIQJBACEBQQAhDQNAIAdBkAZqIAFBAnRqIg8gDygCACIPIAtuIgggAmoiAjYCACANQQFqQf8PcSANIAEgDUYgAkVxIgIbIQ0gEEF3aiAQIAIbIRAgBiAPIAggC2xrbCECIAFBAWoiASAORw0ACyACRQ0AIAdBkAZqIA5BAnRqIAI2AgAgDkEBaiEOCyAQIAlrQQlqIRALA0AgB0GQBmogDUECdGohCSAQQSRIIQYCQANAAkAgBg0AIBBBJEcNAiAJKAIAQdHp+QRPDQILIA5B/w9qIQ9BACELA0AgDiECAkACQCAHQZAGaiAPQf8PcSIBQQJ0aiIONQIAQh2GIAutfCISQoGU69wDWg0AQQAhCwwBCyASIBJCgJTr3AOAIhNCgJTr3AN+fSESIBOnIQsLIA4gEqciDzYCACACIAIgAiABIA8bIAEgDUYbIAEgAkF/akH/D3EiCEcbIQ4gAUF/aiEPIAEgDUcNAAsgDEFjaiEMIAIhDiALRQ0ACwJAAkAgDUF/akH/D3EiDSACRg0AIAIhDgwBCyAHQZAGaiACQf4PakH/D3FBAnRqIgEgASgCACAHQZAGaiAIQQJ0aigCAHI2AgAgCCEOCyAQQQlqIRAgB0GQBmogDUECdGogCzYCAAwBCwsCQANAIA5BAWpB/w9xIREgB0GQBmogDkF/akH/D3FBAnRqIQkDQEEJQQEgEEEtShshDwJAA0AgDSELQQAhAQJAAkADQCABIAtqQf8PcSICIA5GDQEgB0GQBmogAkECdGooAgAiAiABQQJ0QfDDBGooAgAiDUkNASACIA1LDQIgAUEBaiIBQQRHDQALCyAQQSRHDQBCACESQQAhAUIAIRMDQAJAIAEgC2pB/w9xIgIgDkcNACAOQQFqQf8PcSIOQQJ0IAdBkAZqakF8akEANgIACyAHQYAGaiAHQZAGaiACQQJ0aigCABD0ByAHQfAFaiASIBNCAEKAgICA5Zq3jsAAEOwHIAdB4AVqIAcpA/AFIAdB8AVqQQhqKQMAIAcpA4AGIAdBgAZqQQhqKQMAEO8HIAdB4AVqQQhqKQMAIRMgBykD4AUhEiABQQFqIgFBBEcNAAsgB0HQBWogBRDqByAHQcAFaiASIBMgBykD0AUgB0HQBWpBCGopAwAQ7AcgB0HABWpBCGopAwAhE0IAIRIgBykDwAUhFCAMQfEAaiINIARrIgFBACABQQBKGyADIAEgA0giCBsiAkHwAEwNAkIAIRVCACEWQgAhFwwFCyAPIAxqIQwgDiENIAsgDkYNAAtBgJTr3AMgD3YhCEF/IA90QX9zIQZBACEBIAshDQNAIAdBkAZqIAtBAnRqIgIgAigCACICIA92IAFqIgE2AgAgDUEBakH/D3EgDSALIA1GIAFFcSIBGyENIBBBd2ogECABGyEQIAIgBnEgCGwhASALQQFqQf8PcSILIA5HDQALIAFFDQECQCARIA1GDQAgB0GQBmogDkECdGogATYCACARIQ4MAwsgCSAJKAIAQQFyNgIADAELCwsgB0GQBWpEAAAAAAAA8D9B4QEgAmsQxQQQ8AcgB0GwBWogBykDkAUgB0GQBWpBCGopAwAgFCATEPMHIAdBsAVqQQhqKQMAIRcgBykDsAUhFiAHQYAFakQAAAAAAADwP0HxACACaxDFBBDwByAHQaAFaiAUIBMgBykDgAUgB0GABWpBCGopAwAQ+gcgB0HwBGogFCATIAcpA6AFIhIgB0GgBWpBCGopAwAiFRD1ByAHQeAEaiAWIBcgBykD8AQgB0HwBGpBCGopAwAQ7wcgB0HgBGpBCGopAwAhEyAHKQPgBCEUCwJAIAtBBGpB/w9xIg8gDkYNAAJAAkAgB0GQBmogD0ECdGooAgAiD0H/ybXuAUsNAAJAIA8NACALQQVqQf8PcSAORg0CCyAHQfADaiAFt0QAAAAAAADQP6IQ8AcgB0HgA2ogEiAVIAcpA/ADIAdB8ANqQQhqKQMAEO8HIAdB4ANqQQhqKQMAIRUgBykD4AMhEgwBCwJAIA9BgMq17gFGDQAgB0HQBGogBbdEAAAAAAAA6D+iEPAHIAdBwARqIBIgFSAHKQPQBCAHQdAEakEIaikDABDvByAHQcAEakEIaikDACEVIAcpA8AEIRIMAQsgBbchGAJAIAtBBWpB/w9xIA5HDQAgB0GQBGogGEQAAAAAAADgP6IQ8AcgB0GABGogEiAVIAcpA5AEIAdBkARqQQhqKQMAEO8HIAdBgARqQQhqKQMAIRUgBykDgAQhEgwBCyAHQbAEaiAYRAAAAAAAAOg/ohDwByAHQaAEaiASIBUgBykDsAQgB0GwBGpBCGopAwAQ7wcgB0GgBGpBCGopAwAhFSAHKQOgBCESCyACQe8ASg0AIAdB0ANqIBIgFUIAQoCAgICAgMD/PxD6ByAHKQPQAyAHQdADakEIaikDAEIAQgAQ8QcNACAHQcADaiASIBVCAEKAgICAgIDA/z8Q7wcgB0HAA2pBCGopAwAhFSAHKQPAAyESCyAHQbADaiAUIBMgEiAVEO8HIAdBoANqIAcpA7ADIAdBsANqQQhqKQMAIBYgFxD1ByAHQaADakEIaikDACETIAcpA6ADIRQCQCANQf////8HcSAKQX5qTA0AIAdBkANqIBQgExD7ByAHQYADaiAUIBNCAEKAgICAgICA/z8Q7AcgBykDkAMgB0GQA2pBCGopAwBCAEKAgICAgICAuMAAEPIHIQ0gB0GAA2pBCGopAwAgEyANQX9KIg4bIRMgBykDgAMgFCAOGyEUIBIgFUIAQgAQ8QchCwJAIAwgDmoiDEHuAGogCkoNACAIIAIgAUcgDUEASHJxIAtBAEdxRQ0BCxDLBEHEADYCAAsgB0HwAmogFCATIAwQ9gcgB0HwAmpBCGopAwAhEiAHKQPwAiETCyAAIBI3AwggACATNwMAIAdBkMYAaiQAC8QEAgR/AX4CQAJAIAAoAgQiAiAAKAJoRg0AIAAgAkEBajYCBCACLQAAIQMMAQsgABDnByEDCwJAAkACQAJAAkAgA0FVag4DAAEAAQsCQAJAIAAoAgQiAiAAKAJoRg0AIAAgAkEBajYCBCACLQAAIQIMAQsgABDnByECCyADQS1GIQQgAkFGaiEFIAFFDQEgBUF1Sw0BIAApA3BCAFMNAiAAIAAoAgRBf2o2AgQMAgsgA0FGaiEFQQAhBCADIQILIAVBdkkNAEIAIQYCQCACQVBqQQpPDQBBACEDA0AgAiADQQpsaiEDAkACQCAAKAIEIgIgACgCaEYNACAAIAJBAWo2AgQgAi0AACECDAELIAAQ5wchAgsgA0FQaiEDAkAgAkFQaiIFQQlLDQAgA0HMmbPmAEgNAQsLIAOsIQYgBUEKTw0AA0AgAq0gBkIKfnwhBgJAAkAgACgCBCICIAAoAmhGDQAgACACQQFqNgIEIAItAAAhAgwBCyAAEOcHIQILIAZCUHwhBgJAIAJBUGoiA0EJSw0AIAZCro+F18fC66MBUw0BCwsgA0EKTw0AA0ACQAJAIAAoAgQiAiAAKAJoRg0AIAAgAkEBajYCBCACLQAAIQIMAQsgABDnByECCyACQVBqQQpJDQALCwJAIAApA3BCAFMNACAAIAAoAgRBf2o2AgQLQgAgBn0gBiAEGyEGDAELQoCAgICAgICAgH8hBiAAKQNwQgBTDQAgACAAKAIEQX9qNgIEQoCAgICAgICAgH8PCyAGC+ULAgV/BH4jAEEQayIEJAACQAJAAkAgAUEkSw0AIAFBAUcNAQsQywRBHDYCAEIAIQMMAQsDQAJAAkAgACgCBCIFIAAoAmhGDQAgACAFQQFqNgIEIAUtAAAhBQwBCyAAEOcHIQULIAUQgggNAAtBACEGAkACQCAFQVVqDgMAAQABC0F/QQAgBUEtRhshBgJAIAAoAgQiBSAAKAJoRg0AIAAgBUEBajYCBCAFLQAAIQUMAQsgABDnByEFCwJAAkACQAJAAkAgAUEARyABQRBHcQ0AIAVBMEcNAAJAAkAgACgCBCIFIAAoAmhGDQAgACAFQQFqNgIEIAUtAAAhBQwBCyAAEOcHIQULAkAgBUFfcUHYAEcNAAJAAkAgACgCBCIFIAAoAmhGDQAgACAFQQFqNgIEIAUtAAAhBQwBCyAAEOcHIQULQRAhASAFQcHEBGotAABBEEkNA0IAIQMCQAJAIAApA3BCAFMNACAAIAAoAgQiBUF/ajYCBCACRQ0BIAAgBUF+ajYCBAwICyACDQcLQgAhAyAAQgAQ5gcMBgsgAQ0BQQghAQwCCyABQQogARsiASAFQcHEBGotAABLDQBCACEDAkAgACkDcEIAUw0AIAAgACgCBEF/ajYCBAsgAEIAEOYHEMsEQRw2AgAMBAsgAUEKRw0AQgAhCQJAIAVBUGoiAkEJSw0AQQAhBQNAAkACQCAAKAIEIgEgACgCaEYNACAAIAFBAWo2AgQgAS0AACEBDAELIAAQ5wchAQsgBUEKbCACaiEFAkAgAUFQaiICQQlLDQAgBUGZs+bMAUkNAQsLIAWtIQkLIAJBCUsNAiAJQgp+IQogAq0hCwNAAkACQCAAKAIEIgUgACgCaEYNACAAIAVBAWo2AgQgBS0AACEFDAELIAAQ5wchBQsgCiALfCEJAkACQCAFQVBqIgJBCUsNACAJQpqz5syZs+bMGVQNAQtBCiEBIAJBCU0NAwwECyAJQgp+IgogAq0iC0J/hVgNAAtBCiEBDAELAkAgASABQX9qcUUNAEIAIQkCQCABIAVBwcQEai0AACIHTQ0AQQAhAgNAAkACQCAAKAIEIgUgACgCaEYNACAAIAVBAWo2AgQgBS0AACEFDAELIAAQ5wchBQsgByACIAFsaiECAkAgASAFQcHEBGotAAAiB00NACACQcfj8ThJDQELCyACrSEJCyABIAdNDQEgAa0hCgNAIAkgCn4iCyAHrUL/AYMiDEJ/hVYNAgJAAkAgACgCBCIFIAAoAmhGDQAgACAFQQFqNgIEIAUtAAAhBQwBCyAAEOcHIQULIAsgDHwhCSABIAVBwcQEai0AACIHTQ0CIAQgCkIAIAlCABD3ByAEKQMIQgBSDQIMAAsACyABQRdsQQV2QQdxQcHGBGosAAAhCEIAIQkCQCABIAVBwcQEai0AACICTQ0AQQAhBwNAAkACQCAAKAIEIgUgACgCaEYNACAAIAVBAWo2AgQgBS0AACEFDAELIAAQ5wchBQsgAiAHIAh0ciEHAkAgASAFQcHEBGotAAAiAk0NACAHQYCAgMAASQ0BCwsgB60hCQsgASACTQ0AQn8gCK0iC4giDCAJVA0AA0AgAq1C/wGDIQoCQAJAIAAoAgQiBSAAKAJoRg0AIAAgBUEBajYCBCAFLQAAIQUMAQsgABDnByEFCyAJIAuGIAqEIQkgASAFQcHEBGotAAAiAk0NASAJIAxYDQALCyABIAVBwcQEai0AAE0NAANAAkACQCAAKAIEIgUgACgCaEYNACAAIAVBAWo2AgQgBS0AACEFDAELIAAQ5wchBQsgASAFQcHEBGotAABLDQALEMsEQcQANgIAIAZBACADQgGDUBshBiADIQkLAkAgACkDcEIAUw0AIAAgACgCBEF/ajYCBAsCQCAJIANUDQACQCADp0EBcQ0AIAYNABDLBEHEADYCACADQn98IQMMAgsgCSADWA0AEMsEQcQANgIADAELIAkgBqwiA4UgA30hAwsgBEEQaiQAIAMLEAAgAEEgRiAAQXdqQQVJcgvEAwIDfwF+IwBBIGsiAiQAAkACQCABQv///////////wCDIgVCgICAgICAwL9AfCAFQoCAgICAgMDAv398Wg0AIAFCGYinIQMCQCAAUCABQv///w+DIgVCgICACFQgBUKAgIAIURsNACADQYGAgIAEaiEEDAILIANBgICAgARqIQQgACAFQoCAgAiFhEIAUg0BIAQgA0EBcWohBAwBCwJAIABQIAVCgICAgICAwP//AFQgBUKAgICAgIDA//8AURsNACABQhmIp0H///8BcUGAgID+B3IhBAwBC0GAgID8ByEEIAVC////////v7/AAFYNAEEAIQQgBUIwiKciA0GR/gBJDQAgAkEQaiAAIAFC////////P4NCgICAgICAwACEIgUgA0H/gX9qEOgHIAIgACAFQYH/ACADaxDrByACQQhqKQMAIgVCGYinIQQCQCACKQMAIAIpAxAgAkEQakEIaikDAIRCAFKthCIAUCAFQv///w+DIgVCgICACFQgBUKAgIAIURsNACAEQQFqIQQMAQsgACAFQoCAgAiFhEIAUg0AIARBAXEgBGohBAsgAkEgaiQAIAQgAUIgiKdBgICAgHhxcr4L5AMCAn8CfiMAQSBrIgIkAAJAAkAgAUL///////////8AgyIEQoCAgICAgMD/Q3wgBEKAgICAgIDAgLx/fFoNACAAQjyIIAFCBIaEIQQCQCAAQv//////////D4MiAEKBgICAgICAgAhUDQAgBEKBgICAgICAgMAAfCEFDAILIARCgICAgICAgIDAAHwhBSAAQoCAgICAgICACFINASAFIARCAYN8IQUMAQsCQCAAUCAEQoCAgICAgMD//wBUIARCgICAgICAwP//AFEbDQAgAEI8iCABQgSGhEL/////////A4NCgICAgICAgPz/AIQhBQwBC0KAgICAgICA+P8AIQUgBEL///////+//8MAVg0AQgAhBSAEQjCIpyIDQZH3AEkNACACQRBqIAAgAUL///////8/g0KAgICAgIDAAIQiBCADQf+If2oQ6AcgAiAAIARBgfgAIANrEOsHIAIpAwAiBEI8iCACQQhqKQMAQgSGhCEF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AkACQAJAAkACQAJAAkACQAJAAkAgAUF3ag4SAAECBQMEBgcICQoLDA0ODxAREgsgAiACKAIAIgFBBGo2AgAgACABKAIANgIADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABMgEANwMADwsgAiACKAIAIgFBBGo2AgAgACABMwEANwMADwsgAiACKAIAIgFBBGo2AgAgACABMAAANwMADwsgAiACKAIAIgFBBGo2AgAgACABMQAANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKwMAOQMADwsgACACIAMRAgALCz4BAX8CQCAAUA0AA0AgAUF/aiIBIACnQQ9xQfDKBGotAAAgAnI6AAAgAEIPViEDIABCBIghACADDQALCyABCzYBAX8CQCAAUA0AA0AgAUF/aiIBIACnQQdxQTByOgAAIABCB1YhAiAAQgOIIQAgAg0ACwsgAQuIAQIBfgN/AkACQCAAQoCAgIAQWg0AIAAhAgwBCwNAIAFBf2oiASAAIABCCoAiAkIKfn2nQTByOgAAIABC/////58BViEDIAIhACADDQALCwJAIAKnIgNFDQADQCABQX9qIgEgAyADQQpuIgRBCmxrQTByOgAAIANBCUshBSAEIQMgBQ0ACwsgAQtvAQF/IwBBgAJrIgUkAAJAIAIgA0wNACAEQYDABHENACAFIAEgAiADayIDQYACIANBgAJJIgIbEK0EGgJAIAINAANAIAAgBUGAAhCcCCADQYB+aiIDQf8BSw0ACwsgACAF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hVYNACANIA58IQxBASEJIAIhCAsgB0EBaiEHIAghAgwACwALAkAgAUUNACABIAcgACAJGzYCAAsCQAJAAkAgAkUNABDLBEHEADYCACAFQQAgA0IBgyILUBshBSADIQwMAQsgDCADVA0BIANCAYMhCwsCQCALpw0AIAUNABDLBEHEADYCACADQn98IQMMAgsgDCADWA0AEMsEQcQANgIADAELIAwgBawiC4UgC30hAwsgBEEQaiQAIAMLEAAgAEEgRiAAQXdqQQVJcgsWACAAIAEgAkKAgICAgICAgIB/ELwICzUCAX8BfSMAQRBrIgIkACACIAAgAUEAEMAIIAIpAwAgAkEIaikDABCDCCEDIAJBEGokACADC4YBAgF/An4jAEGgAWsiBCQAIAQgATYCPCAEIAE2AhQgBEF/NgIYIARBEGpCABDmByAEIARBEGogA0EBEPwHIARBCGopAwAhBSAEKQMAIQYCQCACRQ0AIAIgASAEKAIUIAQoAjxraiAEKAKIAWo2AgALIAAgBTcDCCAAIAY3AwAgBEGgAWokAAs1AgF/AXwjAEEQayICJAAgAiAAIAFBARDACCACKQMAIAJBCGopAwAQhAghAyACQRBqJAAgAws8AgF/AX4jAEEQayIDJAAgAyABIAJBAhDACCADKQMAIQQgACADQQhqKQMANwMIIAAgBDcDACADQRBqJAALCQAgACABEL8ICwkAIAAgARDBCAs6AgF/AX4jAEEQayIEJAAgBCABIAIQwgggBCkDACEFIAAgBEEIaikDADcDCCAAIAU3AwAgBEEQaiQACwcAIAAQxwgLBwAgABD5EAsNACAAEMYIGiAAEIQRC2EBBH8gASAEIANraiEFAkACQANAIAMgBEYNAUF/IQYgASACRg0CIAEsAAAiByADLAAAIghIDQICQCAIIAdODQBBAQ8LIANBAWohAyABQQFqIQEMAAsACyAFIAJHIQYLIAYLDAAgACACIAMQywgaCy4BAX8jAEEQayIDJAAgACADQQ9qIANBDmoQ8AUiACABIAIQzAggA0EQaiQAIAALEgAgACABIAIgASACEN0OEN4OC0IBAn9BACEDA38CQCABIAJHDQAgAw8LIANBBHQgASwAAGoiA0GAgICAf3EiBEEYdiAEciADcyEDIAFBAWohAQwACwsHACAAEMcICw0AIAAQzgga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ASACIAAQ+gUQ+wUiARCBBiABEIIGEJkRGiABEJIRGgsgA0EQaiQAIAALGgAgABCBBiAAEIEGIAAQggZqQQFqIAEQrA8LIAAgACABIAIgAyAEIAUgBhD6DiAAIAMgBWsgBmoQ6wYLHAACQCAAEP8FRQ0AIAAgARDrBg8LIAAgARDSBgsWACAAIAEQ8RAiAUEEaiACEI0HGiABCwcAIAAQ9RALCwAgAEGgwwUQ2wgLEQAgACABIAEoAgAoAiwRAgALEQAgACABIAEoAgAoAiARAgALEQAgACABIAEoAgAoAhwRAgALDwAgACAAKAIAKAIMEQAACw8AIAAgACgCACgCEBEAAAsRACAAIAEgASgCACgCFBECAAsRACAAIAEgASgCACgCGBECAAsPACAAIAAoAgAoAiQRAAALCwAgAEGYwwUQ2wgLEQAgACABIAEoAgAoAiwRAgALEQAgACABIAEoAgAoAiARAgALEQAgACABIAEoAgAoAhwRAgALDwAgACAAKAIAKAIMEQAACw8AIAAgACgCACgCEBEAAAsRACAAIAEgASgCACgCFBECAAsRACAAIAEgASgCACgCGBECAAsPACAAIAAoAgAoAiQRAAALEgAgACACNgIEIAAgAToAACAACwcAIAAoAgALDQAgABCyCyABELALRgsHACAAKAIACy8BAX8jAEEQayIDJAAgABCuDyABEK4PIAIQrg8gA0EPahCvDyECIANBEGokACACCzIBAX8jAEEQayICJAAgAiAAKAIANgIMIAJBDGogARC1DxogAigCDCEAIAJBEGokACAACwcAIAAQlAsLGgEBfyAAEJMLKAIAIQEgABCTC0EANgIAIAELIgAgACABELYLENoJIAEQtQsoAgAhASAAEJQLIAE2AgAgAAsHACAAEPMQCxoBAX8gABDyECgCACEBIAAQ8hBBADYCACABCyIAIAAgARC5CxC8CyABELgLKAIAIQEgABDzECABNgIAIAALCQAgACABEJ8OCy0BAX8gABDyECgCACECIAAQ8hAgATYCAAJAIAJFDQAgAiAAEPMQKAIAEQQACwuVBAECfyMAQfAEayIHJAAgByACNgLoBCAHIAE2AuwEIAdBhQE2AhAgB0HIAWogB0HQAWogB0EQahD4CSEBIAdBwAFqIAQQhAcgB0HAAWoQ1gUhCCAHQQA6AL8BAkAg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IAUgA0EEahDTCyAAIAYgBGoQ2wsMAQsgACADQQRqIAEgAiAAENwLEN0LIgEQowogARCUCRCnERogARCgERoLIANBEGokACAACwoAIAAQ+wooAgALDAAgACABKAIANgIACwwAIAAQ+wogATYCBAsKACAAEPsKEPAOCzEBAX8gABD7CiICIAItAAtBgAFxIAFB/wBxcjoACyAAEPsKIgAgAC0AC0H/AHE6AAsLHwEBf0EBIQECQCAAEKUKRQ0AIAAQ/Q5Bf2ohAQsgAQsJACAAIAEQtw8LHQAgABCjCiAAEKMKIAAQlAlBAnRqQQRqIAEQuA8LIAAgACABIAIgAyAEIAUgBhC2DyAAIAMgBWsgBmoQ1AsLHAACQCAAEKUKRQ0AIAAgARDUCw8LIAAgARDWCwsHACAAEPIOCysBAX8jAEEQayIEJAAgACAEQQ9qIAMQuQ8iAyABIAIQug8gBEEQaiQAIAMLCwAgAEGwwwUQ2wgLEQAgACABIAEoAgAoAiwRAgALEQAgACABIAEoAgAoAiARAgALCwAgACABEPoLIAALEQAgACABIAEoAgAoAhwRAgALDwAgACAAKAIAKAIMEQAACw8AIAAgACgCACgCEBEAAAsRACAAIAEgASgCACgCFBECAAsRACAAIAEgASgCACgCGBECAAsPACAAIAAoAgAoAiQRAAALCwAgAEGowwUQ2wgLEQAgACABIAEoAgAoAiwRAgALEQAgACABIAEoAgAoAiARAgALEQAgACABIAEoAgAoAhwRAgALDwAgACAAKAIAKAIMEQAACw8AIAAgACgCACgCEBEAAAsRACAAIAEgASgCACgCFBECAAsRACAAIAEgASgCACgCGBECAAsPACAAIAAoAgAoAiQRAAALEgAgACACNgIEIAAgATYCACAACwcAIAAoAgALDQAgABD0CyABEPILRgsHACAAKAIACy8BAX8jAEEQayIDJAAgABC+DyABEL4PIAIQvg8gA0EPahC/DyECIANBEGokACACCzIBAX8jAEEQayICJAAgAiAAKAIANgIMIAJBDGogARDFDxogAigCDCEAIAJBEGokACAACwcAIAAQjQwLGgEBfyAAEIwMKAIAIQEgABCMDEEANgIAIAELIgAgACABEPgLEPkJIAEQ9wsoAgAhASAAEI0MIAE2AgAgAAt9AQJ/IwBBEGsiAiQA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AyABQQRqIgE2AgQMAAsACwkAIABBAToAAAsQACAAKAIEIAAoAgBrQQJ1CwwAIAAgACgCABCLEAszACAAIAAQ+w8gABD7DyAAEPwPQQJ0aiAAEPsPIAFBAnRqIAAQ+w8gABDrDEECdGoQ/Q8LSgEBfyMAQSBrIgEkACABQQA2AhAgAUGGATYCDCABIAEpAgw3AwAgACABQRRqIAEgABCoDRCpDSAAKAIEIQAgAUEgaiQAIABBf2oLeAECfyMAQRBrIgMkACABEIwNIANBDGogARCQDSEEAkAgAEEIaiIBEOsMIAJLDQAgASACQQFqEJMNCwJAIAEgAhCLDSgCAEUNACABIAIQiw0oAgAQlA0aCyAEEJUNIQAgASACEIsNIAA2AgAgBBCRDRogA0EQaiQACxcAIAAgARClDCIBQdz3BEEIajYCACABCxcAIAAgARClDCIBQfz3BEEIajYCACABCxoAIAAgARClDBDBDSIBQcDvBEEIajYCACABCxoAIAAgARClDBDVDSIBQdTwBEEIajYCACABCxoAIAAgARClDBDVDSIBQejxBEEIajYCACABCxoAIAAgARClDBDVDSIBQdDzBEEIajYCACABCxoAIAAgARClDBDVDSIBQdzyBEEIajYCACABCxoAIAAgARClDBDVDSIBQcT0BEEIajYCACABCxcAIAAgARClDCIBQZz4BEEIajYCACABCxcAIAAgARClDCIBQZD6BEEIajYCACABCxcAIAAgARClDCIBQeT7BEEIajYCACABCxcAIAAgARClDCIBQcz9BEEIajYCACABCxoAIAAgARClDBDEECIBQaSFBUEIajYCACABCxoAIAAgARClDBDEECIBQbiGBUEIajYCACABCxoAIAAgARClDBDEECIBQayHBUEIajYCACABCxoAIAAgARClDBDEECIBQaCIBUEIajYCACABCxoAIAAgARClDBDFECIBQZSJBUEIajYCACABCxoAIAAgARClDBDGECIBQbiKBUEIajYCACABCxoAIAAgARClDBDHECIBQdyLBUEIajYCACABCxoAIAAgARClDBDIECIBQYCNBUEIajYCACABCy0AIAAgARClDCIBQQhqEMkQIQAgAUGU/wRBCGo2AgAgAEGU/wRBOGo2AgAgAQstACAAIAEQpQwiAUEIahDKECEAIAFBnIEFQQhqNgIAIABBnIEFQThqNgIAIAELIAAgACABEKUMIgFBCGoQyxAaIAFBiIMFQQhqNgIAIAELIAAgACABEKUMIgFBCGoQyxAaIAFBpIQFQQhqNgIAIAELGgAgACABEKUMEMwQIgFBpI4FQQhqNgIAIAELGgAgACABEKUMEMwQIgFBnI8FQQhqNgIAIAELMwACQEEALQD4wwVFDQBBACgC9MMFDwsQjQ0aQQBBAToA+MMFQQBB8MMFNgL0wwVB8MMFCw0AIAAoAgAgAUECdGoLCwAgAEEEahCODRoLFAAQoQ1BAEHY0AU2AvDDBUHwwwULFQEBfyAAIAAoAgBBAWoiATYCACABCx8AAkAgACABEJ8NDQAQjgYACyAAQQhqIAEQoA0oAgALKQEBfyMAQRBrIgIkACACIAE2AgwgACACQQxqEJINIQEgAkEQaiQAIAELCQAgABCWDSAACwkAIAAgARDNEAs4AQF/AkAgASAAEOsMIgJNDQAgACABIAJrEJwNDwsCQCABIAJPDQAgACAAKAIAIAFBAnRqEJ0NCwsoAQF/AkAgAEEEahCZDSIBQX9HDQAgACAAKAIAKAIIEQQACyABQX9GCxoBAX8gABCeDSgCACEBIAAQng1BADYCACABCyUBAX8gABCeDSgCACEBIAAQng1BADYCAAJAIAFFDQAgARDOEAsLaAECfyAAQcTjBEEIajYCACAAQQhqIQFBACECAkADQCACIAEQ6wxPDQECQCABIAIQiw0oAgBFDQAgASACEIsNKAIAEJQNGgsgAkEBaiECDAALAAsgAEGYAWoQkhEaIAEQmA0aIAAQxwgLIwEBfyMAQRBrIgEkACABQQxqIAAQ5gwQmg0gAUEQaiQAIAALFQEBfyAAIAAoAgBBf2oiATYCACABCzsBAX8CQCAAKAIAIgEoAgBFDQAgARDsDCAAKAIAEJAQIAAoAgAQ7Q8gACgCACIAKAIAIAAQ/A8QkRALCw0AIAAQlw0aIAAQhBELcAECfyMAQSBrIgIkAAJAAkAgABDvDygCACAAKAIEa0ECdSABSQ0AIAAgARDpDAwBCyAAEO0PIQMgAkEMaiAAIAAQ6wwgAWoQjxAgABDrDCADEJQQIgMgARCVECAAIAMQlhAgAxCXEBoLIAJBIGokAAsZAQF/IAAQ6wwhAiAAIAEQixAgACACEO0MCwcAIAAQzxALKwEBf0EAIQICQCAAQQhqIgAQ6wwgAU0NACAAIAEQoA0oAgBBAEchAgsgAgsNACAAKAIAIAFBAnRqCwwAQdjQBUEBEKQMGgsRAEH8wwUQig0QpQ0aQfzDBQszAAJAQQAtAITEBUUNAEEAKAKAxAUPCxCiDRpBAEEBOgCExAVBAEH8wwU2AoDEBUH8wwULGAEBfyAAEKMNKAIAIgE2AgAgARCMDSAACxUAIAAgASgCACIBNgIAIAEQjA0gAAsNACAAKAIAEJQNGiAACwoAIAAQsA02AgQLFQAgACABKQIANwIEIAAgAjYCACAACzsBAX8jAEEQayICJAACQCAAEKwNQX9GDQAgACACQQhqIAJBDGogARCtDRCuDUGHARD9EAsgAkEQaiQACw0AIAAQxwgaIAAQhBELDwAgACAAKAIAKAIEEQQACwcAIAAoAgALCQAgACABENAQCwsAIAAgATYCACAACwcAIAAQ0RALGQEBf0EAQQAoAojEBUEBaiIANgKIxAUgAAsNACAAEMcIGiAAEIQRCyoBAX9BACEDAkAgAkH/AEsNACACQQJ0QZDkBGooAgAgAXFBAEchAwsgAwtOAQJ/AkADQCABIAJGDQFBACEEAkAgASgCACIFQf8ASw0AIAVBAnRBkOQEaigCACEECyADIAQ2AgAgA0EEaiEDIAFBBGohAQwACwALIAILRAEBfwN/AkACQCACIANGDQAgAigCACIEQf8ASw0BIARBAnRBkOQEaigCACABcUUNASACIQMLIAMPCyACQQRqIQIMAAsLQwEBfwJAA0AgAiADRg0BAkAgAigCACIEQf8ASw0AIARBAnRBkOQEaigCACABcUUNACACQQRqIQIMAQsLIAIhAwsgAwsdAAJAIAFB/wBLDQAQtw0gAUECdGooAgAhAQsgAQsIABCyCCgCAAtFAQF/AkADQCABIAJGDQECQCABKAIAIgNB/wBLDQAQtw0gASgCAEECdGooAgAhAwsgASADNgIAIAFBBGohAQwACwALIAILHQACQCABQf8ASw0AELoNIAFBAnRqKAIAIQELIAELCAAQswgoAgALRQEBfwJAA0AgASACRg0BAkAgASgCACIDQf8ASw0AELoNIAEoAgBBAnRqKAIAIQMLIAEgAzYCACABQQRqIQEMAAsACyACCwQAIAELLAACQANAIAEgAkYNASADIAEsAAA2AgAgA0EEaiEDIAFBAWohAQwACwALIAILDgAgASACIAFBgAFJG8ALOQEBfwJAA0AgASACRg0BIAQgASgCACIFIAMgBUGAAUkbOgAAIARBAWohBCABQQRqIQEMAAsACyACCzgAIAAgAxClDBDBDSIDIAI6AAwgAyABNgIIIANB2OMEQQhqNgIAAkAgAQ0AIANBkOQENgIICyADCwQAIAALMwEBfyAAQdjjBEEIajYCAAJAIAAoAggiAUUNACAALQAMQf8BcUUNACABEIURCyAAEMcICw0AIAAQwg0aIAAQhBELHQACQCABQQBIDQAQtw0gAUECdGooAgAhAQsgAcALRAEBfwJAA0AgASACRg0BAkAgASwAACIDQQBIDQAQtw0gASwAAEECdGooAgAhAwsgASADOgAAIAFBAWohAQwACwALIAILHQACQCABQQBIDQAQug0gAUECdGooAgAhAQsgAcALRAEBfwJAA0AgASACRg0BAkAgASwAACIDQQBIDQAQug0gASwAAEECdGooAgAhAwsgASADOgAAIAFBAWohAQwACwALIAILBAAgAQssAAJAA0AgASACRg0BIAMgAS0AADoAACADQQFqIQMgAUEBaiEBDAALAAsgAgsMACACIAEgAUEASBsLOAEBfwJAA0AgASACRg0BIAQgAyABLAAAIgUgBUEASBs6AAAgBEEBaiEEIAFBAWohAQwACwALIAILDQAgABDHCBogABCEEQsSACAEIAI2AgAgByAFNgIAQQMLEgAgBCACNgIAIAcgBTYCAEEDCwsAIAQgAjYCAEEDCwQAQQELBABBAQs5AQF/IwBBEGsiBSQAIAUgBDYCDCAFIAMgAms2AgggBUEMaiAFQQhqEIwGKAIAIQQgBUEQaiQAIAQLBABBAQsiACAAIAEQpQwQ1Q0iAUGQ7ARBCGo2AgAgARCICTYCCCABCwQAIAALDQAgABCjDBogABCEEQvuAwEEfyMAQRBrIggkACACIQkCQANAAkAgCSADRw0AIAMhCQwCCyAJKAIARQ0BIAlBBGohCQwACwALIAcgBTYCACAEIAI2AgACQAJAA0ACQAJAIAIgA0YNACAFIAZGDQAgCCABKQIANwMIQQEhCgJAAkACQAJAIAUgBCAJIAJrQQJ1IAYgBWsgASAAKAIIENgNIgtBAWoOAgAIAQsgByAF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IAIgAxDJDwtpAQF/IwBBIGsiBCQAIARBGGogASACEMoPIARBEGogBEEMaiAEKAIYIAQoAhwgAxCZBhCaBiAEIAEgBCgCEBDLDzYCDCAEIAMgBCgCFBCcBjYCCCAAIARBDGogBEEIahDMDyAEQSBqJAALCwAgACABIAIQzQ8LCQAgACABEM8PCwwAIAAgASACEM4PGgs4AQF/IwBBEGsiAyQAIAMgARDQDzYCDCADIAIQ0A82AgggACADQQxqIANBCGoQpQYaIANBEGokAAsYACAAIAEoAgA2AgAgACACKAIANgIEIAALCQAgACABENUPCwcAIAAQ0Q8LJwEBfyMAQRBrIgEkACABIAA2AgwgAUEMahDSDyEAIAFBEGokACAACwcAIAAQ0w8LCgAgACgCABDUDwsqAQF/IwBBEGsiASQAIAEgADYCDCABQQxqELILEKcGIQAgAUEQaiQAIAALCQAgACABENYPCzIBAX8jAEEQayICJAAgAiAANgIMIAJBDGogASACQQxqENIPaxCDDCEAIAJBEGokACAACwsAIAAgATYCACAACw0AIAAgASACIAMQ2Q8LaQEBfyMAQSBrIgQkACAEQRhqIAEgAhDaDyAEQRBqIARBDGogBCgCGCAEKAIcIAMQsgYQswYgBCABIAQoAhAQ2w82AgwgBCADIAQoAhQQtQY2AgggACAEQQxqIARBCGoQ3A8gBEEgaiQACwsAIAAgASACEN0PCwkAIAAgARDfDwsMACAAIAEgAhDeDxoLOAEBfyMAQRBrIgMkACADIAEQ4A82AgwgAyACEOAPNgIIIAAgA0EMaiADQQhqEL4GGiADQRBqJAALGAAgACABKAIANgIAIAAgAigCADYCBCAACwkAIAAgARDlDwsHACAAEOEPCycBAX8jAEEQayIBJAAgASAANgIMIAFBDGoQ4g8hACABQRBqJAAgAAsHACAAEOMPCwoAIAAoAgAQ5A8LKgEBfyMAQRBrIgEkACABIAA2AgwgAUEMahD0CxDABiEAIAFBEGokACAACwkAIAAgARDmDws1AQF/IwBBEGsiAiQAIAIgADYCDCACQQxqIAEgAkEMahDiD2tBAnUQkgwhACACQRBqJAAgAAsLACAAIAE2AgAgAAsLACAAQQA2AgAgAAsHACAAEPUPCwsAIABBADoAACAACz0BAX8jAEEQayIB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tRAaDAALAAsgACAFQQxqIAVBBGoQsBAgBUEQaiQACwkAIAAgARC4EAsJACAAIAEQuRALDAAgACABIAIQtxAaCzgBAX8jAEEQayIDJAAgAyABEKwQNgIMIAMgAhCsEDYCCCAAIANBDGogA0EIahC3EBogA0EQaiQACw0AIAAQnxAgARCfEEcLCgAQuhAgABC0EAsKACAAKAIAQXxqCxEAIAAgACgCAEF8ajYCACAACwQAIAALGAAgACABKAIANgIAIAAgAigCADYCBCAACwkAIAAgARCvEAsEACABCwIACwkAIAAgARC9EAsKACAAQQxqEL4QCzcBAn8CQANAIAAoAgggAUYNASAAEJkQIQIgACAAKAIIQXxqIgM2AgggAiADEPMPEIwQDAALAAsLBwAgABCJEAsHACAAELEIC2EBAX8jAEEQayICJAAgAiAANgIMAkAgACABRg0AA0AgAiABQXxqIgE2AgggACABTw0BIAJBDGogAkEIahDBECACIAIoAgxBBGoiADYCDCACKAIIIQEMAAsACyACQRBqJAALDwAgACgCACABKAIAEMIQCwkAIAAgARD4BQs0AQF/IwBBEGsiAyQAIAAgAhDbCyADQQA2AgwgASACQQJ0aiADQQxqENMLIANBEGokACAACwQAIAALBAAgAAsEACAACwQAIAALBAAgAAsQACAAQeiWBUEIajYCACAACxAAIABBjJcFQQhqNgIAIAALDAAgABCICTYCACAACwQAIAALDgAgACABKAIANgIAIAALCAAgABCUDRoLBAAgAAsJACAAIAEQ0hALBwAgABDTEAsLACAAIAE2AgAgAAsNACAAKAIAENQQENUQCwcAIAAQ1xALBwAgABDWEAs8AQJ/IAAoAgAgACgCCCIBQQF1aiECIAAoAgQhAAJAIAFBAXFFDQAgAigCACAAaigCACEACyACIAARBAALBwAgACgCAAsWACAAIAEQ2xAiAUEEaiACEI0HGiABCwcAIAAQ3BALCgAgAEEEahCOBwsOACAAIAEoAgA2AgAgAAsEACAACwoAIAEgAGtBDG0LCwAgACABIAIQvggLBQAQ4BALCABBgICAgHgLBQAQ4xALBQAQ5BALDQBCgICAgICAgICAfwsNAEL///////////8ACwsAIAAgASACELsICwUAEOcQCwYAQf//AwsFABDpEAsE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aiACQQhqENMLIAJBEGokAAsEACAACyoAAkADQCABRQ0BIAAgAi0AADoAACABQX9qIQEgAEEBaiEADAALAAsgAAsqAAJAA0AgAUUNASAAIAIoAgA2AgAgAUF/aiEBIABBBGohAAwACwALIAALCQAgACABEK4RC3IBAn8CQAJAIAEoAkwiAkEASA0AIAJFDQEgAkH/////A3EQwwQoAhhHDQELAkAgAEH/AXEiAiABKAJQRg0AIAEoAhQiAyABKAIQRg0AIAEgA0EBajYCFCADIAA6AAAgAg8LIAEgAhCiBw8LIAAgARCvEQt1AQN/AkAgAUHMAGoiAhCwEUUNACABEOsEGgsCQAJAIABB/wFxIgMgASgCUEYNACABKAIUIgQgASgCEEYNACABIARBAWo2AhQgBCAAOgAADAELIAEgAxCiByEDCwJAIAIQsRFBgICAgARxRQ0AIAIQshELIAMLGwEBfyAAIAAoAgAiAUH/////AyABGzYCACABCxQBAX8gACgCACEBIABBADYCACABCwoAIABBARDiBBoLPgECfyMAQRBrIgIkAEG3iwRBC0EBQQAoAoi+BCIDEPIEGiACIAE2AgwgAyAAIAEQowgaQQogAxCtERoQEQALBwAgACgCAAsJAEHI0gUQtBELBABBAAsPACAAQdAAahDNBEHQAGoLDABBmYsEQQAQsxEACwcAIAAQ7BELAgALAgALCgAgABC5ERCEEQsKACAAELkREIQRCwoAIAAQuREQhBELCgAgABC5ERCEEQsKACAAELkREIQRCwsAIAAgAUEAEMIRCzAAAkAgAg0AIAAoAgQgASgCBEYPCwJAIAAgAUcNAEEBDwsgABDDESABEMMREI0IRQsHACAAKAIEC60BAQJ/IwBBwABrIgMkAEEBIQQCQCAAIAFBABDCEQ0AQQAhBCABRQ0AQQAhBCABQYyYBUG8mAVBABDFESIBRQ0AIANBDGpBAEE0EK0EGiADQQE2AjggA0F/NgIUIAMgADYCECADIAE2AgggASADQQhqIAIoAgBBASABKAIAKAIcEQkAAkAgAygCICIEQQFHDQAgAiADKAIYNgIACyAEQQFGIQQLIANBwABqJAAgBAv+AwEDfyMAQfAAayIEJAAgACgCACIFQXxqKAIAIQYgBUF4aigCACEFIARB0ABqQgA3AgAgBEHYAGpCADcC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ZWNlbWJlcgB1bnNpZ25lZCBjaGFyAGlvc19iYXNlOjpjbGVhcgBNYXIAU2VwACVJOiVNOiVTICVwAFN1bgBKdW4Ac3RkOjpleGNlcHRpb24ATW9uAG5hbgBKYW4ASnVsAGJvb2wAc3RkOjpiYWRfZnVuY3Rpb25fY2FsbABBcHJpbABGcmkAYmFkX2FycmF5X25ld19sZW5ndGgATWFyY2gAQXVnAHVuc2lnbmVkIGxvbmcAc3RhcnRQbGF5aW5nAHN0b3BQbGF5aW5nAHN0ZDo6d3N0cmluZwBiYXNpY19zdHJpbmcAc3RkOjpzdHJpbmcAc3RkOjp1MTZzdHJpbmcAc3RkOjp1MzJzdHJpbmcAaXNSZWNvcmRpbmcAaW5mACUuMExmACVMZgB0cnVlAFR1ZQBmYWxzZQBDYXB0dXJlQmFzZQBDYXB0dXJlAEp1bmUAZG91YmxlAHJlY29yZAB2b2lkAFdlZABzdGQ6OmJhZF9hbGxvYwBEZWMARmViACVhICViICVkICVIOiVNOiVTICVZAFBPU0lYACVIOiVNOiVTAE5BTgBQTQBBTQBMQ19BTEwARklOSVNIAExBTkcASU5GAEMAZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8c2hvcnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIHNob3J0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8ZmxvYXQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQ4X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDhfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDE2X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDE2X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQ2NF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ2NF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8Y2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgY2hhcj4Ac3RkOjpiYXNpY19zdHJpbmc8dW5zaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8c2lnbmVkIGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGxvbmc+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGxvbmc+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGRvdWJsZT4AQy5VVEYtOAAuAChudWxsKQBQdXJlIHZpcnR1YWwgZnVuY3Rpb24gY2FsbGVkIQBsaWJjKythYmk6IAAxNENhcHR1cmVXcmFwcGVyADdDYXB0dXJlAAAAADBOAQDUBQEAWE4BAMMFAQDgBQEAUDE0Q2FwdHVyZVdyYXBwZXIAAAAQTwEA9AUBAAAAAADoBQEAUEsxNENhcHR1cmVXcmFwcGVyAAAQTwEAGAYBAAEAAADoBQEAaWkAdmkAAAAIBgEAAAAAAGwGAQAVAAAAOEdyYWluRW52ADRTaW5lADBOAQBeBgEAWE4BAFQGAQBkBgEAAAAAAGQGAQAWAAAAAAAAACgHAQAXAAAAGAAAABkAAAAaAAAAGwAAABwAAAAdAAAAHgAAAB8AAABOU3QzX18yMTBfX2Z1bmN0aW9uNl9fZnVuY0lOOEVudmVsb3BlN29uRW5kZWRNVWx2RV9FTlNfOWFsbG9jYXRvcklTNF9FRUZ2dkVFRQBOU3QzX18yMTBfX2Z1bmN0aW9uNl9fYmFzZUlGdnZFRUUAME4BAP4GAQBYTgEAsAYBACAHAQAAAAAAIAcBACAAAAAhAAAAIgAAACIAAAAiAAAAIgAAACIAAAAiAAAAIgAAAE44RW52ZWxvcGU3b25FbmRlZE1VbHZFX0UAAAAwTgEAYAcBAAAAAAAAAAAAAAAAAGxNAQAIBgEA8E0BAPBNAQDMTQEAdmlpaWlpAFA3Q2FwdHVyZQAAAAAQTwEAqwcBAAAAAADgBQEAUEs3Q2FwdHVyZQAAEE8BAMgHAQABAAAA4AUBAHYAAAAAAAAAAAAAAGxNAQC4BwEAzE0BAMxNAQAUTgEAdmlpaWlmAABsTQEAuAcBAMxNAQB2aWlpAAAAAIRNAQC4BwEAzE0BAGlpaWkAAAAAAAAAALQIAQAlAAAAJgAAACcAAAAoAAAAKQAAACoAAAArAAAALAAAAC0AAABOU3QzX18yMTBfX2Z1bmN0aW9uNl9fZnVuY0laTjVWb2ljZTRpbml0RWlpZlA1U3ludGhFMyRfME5TXzlhbGxvY2F0b3JJUzVfRUVGdnZFRUUAAABYTgEAYAgBACAHAQBaTjVWb2ljZTRpbml0RWlpZlA1U3ludGhFMyRfMAAAADBOAQDACAEATlN0M19fMjEyYmFzaWNfc3RyaW5nSWNOU18xMWNoYXJfdHJhaXRzSWNFRU5TXzlhbGxvY2F0b3JJY0VFRUUAADBOAQDoCAEATlN0M19fMjEyYmFzaWNfc3RyaW5nSWhOU18xMWNoYXJfdHJhaXRzSWhFRU5TXzlhbGxvY2F0b3JJaEVFRUUAADBOAQAwCQEATlN0M19fMjEyYmFzaWNfc3RyaW5nSXdOU18xMWNoYXJfdHJhaXRzSXdFRU5TXzlhbGxvY2F0b3JJd0VFRUUAADBOAQB4CQEATlN0M19fMjEyYmFzaWNfc3RyaW5nSURzTlNfMTFjaGFyX3RyYWl0c0lEc0VFTlNfOWFsbG9jYXRvcklEc0VFRUUAAAAwTgEAwAkBAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0lEaU5TXzExY2hhcl90cmFpdHNJRGlFRU5TXzlhbGxvY2F0b3JJRGlFRUVFAAAAME4BAAwKAQBOMTBlbXNjcmlwdGVuM3ZhbEUAADBOAQBYCgEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJY0VFAAAwTgEAdAoBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWFFRQAAME4BAJwKAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0loRUUAADBOAQDECgEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJc0VFAAAwTgEA7AoBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SXRFRQAAME4BABQLAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lpRUUAADBOAQA8CwEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJakVFAAAwTgEAZAsBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWxFRQAAME4BAIwLAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0ltRUUAADBOAQC0CwEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJeEVFAAAwTgEA3AsBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SXlFRQAAME4BAAQMAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lmRUUAADBOAQAsDAEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJZEVFAAAwTgEAVAwBAAAAAAADAAAABAAAAAQAAAAGAAAAg/miAERObgD8KRUA0VcnAN009QBi28AAPJmVAEGQQwBjUf4Au96rALdhxQA6biQA0k1CAEkG4AAJ6i4AHJLRAOsd/gApsRwA6D6nAPU1ggBEuy4AnOmEALQmcABBfl8A1pE5AFODOQCc9DkAi1+EACj5vQD4HzsA3v+XAA+YBQARL+8AClqLAG0fbQDPfjYACcsnAEZPtwCeZj8ALepfALondQDl68cAPXvxAPc5BwCSUooA+2vqAB+xXwAIXY0AMANWAHv8RgDwq2sAILzPADb0mgDjqR0AXmGRAAgb5gCFmWUAoBRfAI1AaACA2P8AJ3NNAAYGMQDKVhUAyahzAHviYABrjMAAGcRHAM1nwwAJ6NwAWYMqAIt2xACmHJYARK/dABlX0QClPgUABQf/ADN+PwDCMugAmE/eALt9MgAmPcMAHmvvAJ/4XgA1HzoAf/LKAPGHHQB8kCEAaiR8ANVu+gAwLXcAFTtDALUUxgDDGZ0ArcTCACxNQQAMAF0Ahn1GAONxLQCbxpoAM2IAALTSfAC0p5cAN1XVANc+9gCjEBgATXb8AGSdKgBw16sAY3z4AHqwVwAXFecAwElWADvW2QCnhDgAJCPLANaKdwBaVCMAAB+5APEKGwAZzt8AnzH/AGYeagCZV2EArPtHAH5/2AAiZbcAMuiJAOa/YADvxM0AbDYJAF0/1AAW3tcAWDveAN6bkgDSIigAKIboAOJYTQDGyjIACOMWAOB9ywAXwFAA8x2nABjgWwAuEzQAgxJiAINIAQD1jlsArbB/AB7p8gBISkMAEGfTAKrd2ACuX0IAamHOAAoopADTmbQABqbyAFx3fwCjwoMAYTyIAIpzeACvjFoAb9e9AC2mYwD0v8sAjYHvACbBZwBVykUAytk2ACio0gDCYY0AEsl3AAQmFAASRpsAxFnEAMjFRABNspEAABfzANRDrQApSeUA/dUQAAC+/AAelMwAcM7uABM+9QDs8YAAs+fDAMf4KACTBZQAwXE+AC4JswALRfMAiBKcAKsgewAutZ8AR5LCAHsyLwAMVW0AcqeQAGvnHwAxy5YAeRZKAEF54gD034kA6JSXAOLmhACZMZcAiO1rAF9fNgC7/Q4ASJq0AGekbABxckIAjV0yAJ8VuAC85QkAjTElAPd0OQAwBRwADQwBAEsIaAAs7lgAR6qQAHTnAgC91iQA932mAG5IcgCfFu8AjpSmALSR9gDRU1EAzwryACCYMwD1S34AsmNoAN0+XwBAXQMAhYl/AFVSKQA3ZMAAbdgQADJIMgBbTHUATnHUAEVUbgALCcEAKvVpABRm1QAnB50AXQRQALQ72wDqdsUAh/kXAElrfQAdJ7oAlmkpAMbMrACtFFQAkOJqAIjZiQAsclAABKS+AHcHlADzMHAAAPwnAOpxqABmwkkAZOA9AJfdgwCjP5cAQ5T9AA2GjAAxQd4AkjmdAN1wjAAXt+cACN87ABU3KwBcgKAAWoCTABARkgAP6NgAbICvANv/SwA4kA8AWRh2AGKlFQBhy7sAx4m5ABBAvQDS8gQASXUnAOu29gDbIrsAChSqAIkmLwBkg3YACTszAA6UGgBROqoAHaPCAK/trgBcJhIAbcJNAC16nADAVpcAAz+DAAnw9gArQIwAbTGZADm0BwAMIBUA2MNbAPWSxADGrUsATsqlAKc3zQDmqTYAq5KUAN1CaAAZY94AdozvAGiLUgD82zcArqGrAN8VMQAArqEADPvaAGRNZgDtBbcAKWUwAFdWvwBH/zoAavm5AHW+8wAok98Aq4AwAGaM9gAEyxUA+iIGANnkHQA9s6QAVxuPADbNCQBOQukAE76kADMjtQDwqhoAT2WoANLBpQALPw8AW3jNACP5dgB7iwQAiRdyAMamUwBvbuIA7+sAAJtKWADE2rcAqma6AHbPzwDRAh0AsfEtAIyZwQDDrXcAhkjaAPddoADGgPQArPAvAN3smgA/XLwA0N5tAJDHHwAq27YAoyU6AACvmgCtU5MAtlcEACkttABLgH4A2genAHaqDgB7WaEAFhIqANy3LQD65f0Aidv+AIm+/QDkdmwABqn8AD6AcACFbhUA/Yf/ACg+BwBhZzMAKhiGAE296gCz568Aj21uAJVnOQAxv1sAhNdIADDfFgDHLUMAJWE1AMlwzgAwy7gAv2z9AKQAogAFbOQAWt2gACFvRwBiEtIAuVyEAHBhSQBrVuAAmVIBAFBVNwAe1bcAM/HEABNuXwBdMOQAhS6pAB2ywwChMjYACLekAOqx1AAW9yEAj2nkACf/dwAMA4AAjUAtAE/NoAAgpZkAs6LTAC9dCgC0+UIAEdrLAH2+0ACb28EAqxe9AMqigQAIalwALlUXACcAVQB/FPAA4QeGABQLZACWQY0Ah77eANr9KgBrJbYAe4k0AAXz/gC5v54AaGpPAEoqqABPxFoALfi8ANdamAD0x5UADU2NACA6pgCkV18AFD+xAIA4lQDMIAEAcd2GAMnetgC/YPUATWURAAEHawCMsKwAssDQAFFVSAAe+w4AlXLDAKMGOwDAQDUABtx7AOBFzABOKfoA1srIAOjzQQB8ZN4Am2TYANm+MQCkl8MAd1jUAGnjxQDw2hMAujo8AEYYRgBVdV8A0r31AG6SxgCsLl0ADkTtABw+QgBhxIcAKf3pAOfW8wAifMoAb5E1AAjgxQD/140AbmriALD9xgCTCMEAfF10AGutsgDNbp0APnJ7AMYRagD3z6kAKXPfALXJugC3AFEA4rINAHS6JADlfWAAdNiKAA0VLACBGAwAfmaUAAEpFgCfenYA/f2+AFZF7wDZfjYA7NkTAIu6uQDEl/wAMagnAPFuwwCUxTYA2KhWALSotQDPzA4AEoktAG9XNAAsVokAmc7jANYguQBrXqoAPiqcABFfzAD9C0oA4fT7AI47bQDihiwA6dSEAPy0qQDv7tEALjXJAC85YQA4IUQAG9nIAIH8CgD7SmoALxzYAFO0hABOmYwAVCLMACpV3ADAxtYACxmWABpwuABplWQAJlpgAD9S7gB/EQ8A9LURAPzL9QA0vC0ANLzuAOhdzADdXmAAZ46bAJIz7wDJF7gAYVibAOFXvABRg8YA2D4QAN1xSAAtHN0ArxihACEsRgBZ89cA2XqYAJ5UwABPhvoAVgb8AOV5rgCJIjYAOK0iAGeT3ABV6KoAgiY4AMrnmwBRDaQAmTOxAKnXDgBpBUgAZbLwAH+IpwCITJcA+dE2ACGSswB7gkoAmM8hAECf3ADcR1UA4XQ6AGfrQgD+nd8AXtRfAHtnpAC6rHoAVfaiACuIIwBBulUAWW4IACEqhgA5R4MAiePmAOWe1ABJ+0AA/1bpABwPygDFWYoAlPorANPBxQAPxc8A21quAEfFhgCFQ2IAIYY7ACx5lAAQYYcAKkx7AIAsGgBDvxIAiCaQAHg8iQCoxOQA5dt7AMQ6wgAm9OoA92eKAA2SvwBloysAPZOxAL18CwCkUdwAJ91jAGnh3QCalBkAqCmVAGjOKAAJ7bQARJ8gAE6YygBwgmMAfnwjAA+5MgCn9Y4AFFbnACHxCAC1nSoAb35NAKUZUQC1+asAgt/WAJbdYQAWNgIAxDqfAIOioQBy7W0AOY16AIK4qQBrMlwARidbAAA07QDSAHcA/PRVAAFZTQDgcYAAAAAAAAAAAAAAAABA+yH5PwAAAAAtRHQ+AAAAgJhG+DwAAABgUcx4OwAAAICDG/A5AAAAQCAlejgAAACAIoLjNgAAAAAd82k1AAAAAAAA8D90hRXTsNnvPw+J+WxYte8/UVsS0AGT7z97UX08uHLvP6q5aDGHVO8/OGJ1bno47z/h3h/1nR7vPxW3MQr+Bu8/y6k6N6fx7j8iNBJMpt7uPy2JYWAIzu4/Jyo21dq/7j+CT51WK7TuPylUSN0Hq+4/hVU6sH6k7j/NO39mnqDuP3Rf7Oh1n+4/hwHrcxSh7j8TzkyZiaXuP9ugKkLlrO4/5cXNsDe37j+Q8KOCkcTuP10lPrID1e4/rdNamZ/o7j9HXvvydv/uP5xShd2bGe8/aZDv3CA37z+HpPvcGFjvP1+bezOXfO8/2pCkoq+k7z9ARW5bdtDvPwAAAAAAAOhClCORS/hqrD/zxPpQzr/OP9ZSDP9CLuY/AAAAAAAAOEP+gitlRxVHQJQjkUv4arw+88T6UM6/Lj/WUgz/Qi6WP77z+HnsYfY/3qqMgPd71b89iK9K7XH1P9ttwKfwvtK/sBDw8DmV9D9nOlF/rh7Qv4UDuLCVyfM/6SSCptgxy7+lZIgMGQ3zP1h3wApPV8a/oI4LeyJe8j8AgZzHK6rBvz80GkpKu/E/Xg6MznZOur+65YrwWCPxP8wcYVo8l7G/pwCZQT+V8D8eDOE49FKivwAAAAAAAPA/AAAAAAAAAACsR5r9jGDuP4RZ8l2qpao/oGoCH7Ok7D+0LjaqU168P+b8alc2IOs/CNsgd+UmxT8tqqFj0cLpP3BHIg2Gwss/7UF4A+aG6D/hfqDIiwXRP2JIU/XcZ+c/Ce62VzAE1D/vOfr+Qi7mPzSDuEijDtC/agvgC1tX1T8jQQry/v/fv77z+HnsYfY/GTCWW8b+3r89iK9K7XH1P6T81DJoC9u/sBDw8DmV9D97tx8Ki0HXv4UDuLCVyfM/e89tGumd07+lZIgMGQ3zPzG28vObHdC/oI4LeyJe8j/wejsbHXzJvz80GkpKu/E/nzyvk+P5wr+65YrwWCPxP1yNeL/LYLm/pwCZQT+V8D/OX0e2nW+qvwAAAAAAAPA/AAAAAAAAAACsR5r9jGDuPz31JJ/KOLM/oGoCH7Ok7D+6kThUqXbEP+b8alc2IOs/0uTESguEzj8tqqFj0cLpPxxlxvBFBtQ/7UF4A+aG6D/4nxssnI7YP2JIU/XcZ+c/zHuxTqTg3D8LbknJFnbSP3rGdaBpGde/3bqnbArH3j/I9r5IRxXnvyu4KmVHFfc/AAAAAGAbAQAkAAAAMAAAADEAAABOU3QzX18yMTdiYWRfZnVuY3Rpb25fY2FsbEUAWE4BAEQbAQBwTwEAAAAAACgdAQAyAAAAMwAAADQAAAA1AAAANgAAADcAAAA4AAAAOQAAADoAAAA7AAAAPAAAAD0AAAA+AAAAPwAAAAgAAAAAAAAAYB0BAEAAAABBAAAA+P////j///9gHQEAQgAAAEMAAAC4GwEAzBsBAAQAAAAAAAAAqB0BAEQAAABFAAAA/P////z///+oHQEARgAAAEcAAADoGwEA/BsBAAAAAAA8HgEASAAAAEkAAABKAAAASwAAAEwAAABNAAAATgAAAE8AAABQAAAAUQAAAFIAAABTAAAAVAAAAFUAAAAIAAAAAAAAAHQeAQBWAAAAVwAAAPj////4////dB4BAFgAAABZAAAAWBwBAGwcAQAEAAAAAAAAALweAQBaAAAAWwAAAPz////8////vB4BAFwAAABdAAAAiBwBAJwcAQAAAAAA6BwBAF4AAABfAAAATlN0M19fMjliYXNpY19pb3NJY05TXzExY2hhcl90cmFpdHNJY0VFRUUAAABYTgEAvBwBAPgeAQBOU3QzX18yMTViYXNpY19zdHJlYW1idWZJY05TXzExY2hhcl90cmFpdHNJY0VFRUUAAAAAME4BAPQcAQBOU3QzX18yMTNiYXNpY19pc3RyZWFtSWNOU18xMWNoYXJfdHJhaXRzSWNFRUVFAAC0TgEAMB0BAAAAAAABAAAA6BwBAAP0//9OU3QzX18yMTNiYXNpY19vc3RyZWFtSWNOU18xMWNoYXJfdHJhaXRzSWNFRUVFAAC0TgEAeB0BAAAAAAABAAAA6BwBAAP0//8AAAAA/B0BAGAAAABhAAAATlN0M19fMjliYXNpY19pb3NJd05TXzExY2hhcl90cmFpdHNJd0VFRUUAAABYTgEA0B0BAPgeAQBOU3QzX18yMTViYXNpY19zdHJlYW1idWZJd05TXzExY2hhcl90cmFpdHNJd0VFRUUAAAAAME4BAAgeAQBOU3QzX18yMTNiYXNpY19pc3RyZWFtSXdOU18xMWNoYXJfdHJhaXRzSXdFRUVFAAC0TgEARB4BAAAAAAABAAAA/B0BAAP0//9OU3QzX18yMTNiYXNpY19vc3RyZWFtSXdOU18xMWNoYXJfdHJhaXRzSXdFRUVFAAC0TgEAjB4BAAAAAAABAAAA/B0BAAP0//8AAAAA+B4BAGIAAABjAAAATlN0M19fMjhpb3NfYmFzZUUAAAAwTgEA5B4BAEBQAQDQUAEAaFEBAAAAAADeEgSVAAAAAP///////////////xAfAQAUAAAAQy5VVEYtOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACQfAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAwAMAAMAEAADABQAAwAYAAMAHAADACAAAwAkAAMAKAADACwAAwAwAAMANAADADgAAwA8AAMAQAADAEQAAwBIAAMATAADAFAAAwBUAAMAWAADAFwAAwBgAAMAZAADAGgAAwBsAAMAcAADAHQAAwB4AAMAfAADAAAAAswEAAMMCAADDAwAAwwQAAMMFAADDBgAAwwcAAMMIAADDCQAAwwoAAMMLAADDDAAAww0AANMOAADDDwAAwwAADLsBAAzDAgAMwwMADMMEAAzbAAAAAKQgAQAyAAAAbAAAAG0AAAA1AAAANgAAADcAAAA4AAAAOQAAADoAAABuAAAAbwAAAHAAAAA+AAAAPwAAAE5TdDNfXzIxMF9fc3RkaW5idWZJY0VFAFhOAQCMIAEAKB0BAAAAAAAMIQEAMgAAAHEAAAByAAAANQAAADYAAAA3AAAAcwAAADkAAAA6AAAAOwAAADwAAAA9AAAAdAAAAHUAAABOU3QzX18yMTFfX3N0ZG91dGJ1ZkljRUUAAAAAWE4BAPAgAQAoHQEAAAAAAHAhAQBIAAAAdgAAAHcAAABLAAAATAAAAE0AAABOAAAATwAAAFAAAAB4AAAAeQAAAHoAAABUAAAAVQAAAE5TdDNfXzIxMF9fc3RkaW5idWZJd0VFAFhOAQBYIQEAPB4BAAAAAADYIQEASAAAAHsAAAB8AAAASwAAAEwAAABNAAAAfQAAAE8AAABQAAAAUQAAAFIAAABTAAAAfgAAAH8AAABOU3QzX18yMTFfX3N0ZG91dGJ1Zkl3RUUAAAAAWE4BALwhAQA8HgEAAAAAAAAAAAAAAAAA0XSeAFedvSqAcFIP//8+JwoAAABkAAAA6AMAABAnAACghgEAQEIPAICWmAAA4fUFGAAAADUAAABxAAAAa////877//+Sv///AAAAAAAAAAD/////////////////////////////////////////////////////////////////AAECAwQFBgcICf////////8KCwwNDg8QERITFBUWFxgZGhscHR4fICEiI////////woLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIj/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wABAgQHAwYFAAAAAAAAAExDX0NUWVBFAAAAAExDX05VTUVSSUMAAExDX1RJTUUAAAAAAExDX0NPTExBVEUAAExDX01PTkVUQVJZAExDX01FU1NBR0VTAAAAAAAAAAAAGQAKABkZGQAAAAAFAAAAAAAACQAAAAALAAAAAAAAAAAZABEKGRkZAwoHAAEACQsYAAAJBgsAAAsABhkAAAAZGRkAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAGQAKDRkZGQANAAACAAkOAAAACQAOAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAABMAAAAAEwAAAAAJDAAAAAAADAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAPAAAABA8AAAAACRAAAAAAABAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgAAAAAAAAAAAAAAEQAAAAARAAAAAAkSAAAAAAASAAASAAAaAAAAGhoaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABoAAAAaGhoAAAAAAAAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAXAAAAABcAAAAACRQAAAAAABQAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFgAAAAAAAAAAAAAAFQAAAAAVAAAAAAkWAAAAAAAWAAAWAAAwMTIzNDU2Nzg5QUJDREVGkCcBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAACAAAAAwAAAAQAAAAFAAAABgAAAAcAAAAIAAAACQAAAAoAAAALAAAADAAAAA0AAAAO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AAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAADAgAAggAAAIIAAACCAAAAggAAAIIAAACCAAAAggAAAIIAAACCAAAAggAAAIIAAACCAAAAggAAAIIAAACCAAAAQgEAAEIBAABCAQAAQgEAAEIBAABCAQAAQgEAAEIBAABCAQAAQgEAAIIAAACCAAAAggAAAIIAAACCAAAAggAAAIIAAAAqAQAAKgEAACoBAAAqAQAAKgEAACoBAAAqAAAAKgAAACoAAAAqAAAAKgAAACoAAAAqAAAAKgAAACoAAAAqAAAAKgAAACoAAAAqAAAAKgAAACoAAAAqAAAAKgAAACoAAAAqAAAAKgAAAIIAAACCAAAAggAAAIIAAACCAAAAggAAADIBAAAyAQAAMgEAADIBAAAyAQAAMgEAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAMgAAADIAAAAyAAAAggAAAIIAAACCAAAAggAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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XzIxMG1vbmV5cHVuY3RJd0xiMEVFRQC0TgEA5EMBAAAAAAACAAAAtDcBAAIAAAAQQwEAAgAAAAAAAAB0RAEAugAAAGkBAACYAAAAagEAAGsBAABsAQAAbQEAAG4BAABvAQAAcAEAAHEBAAByAQAATlN0M19fMjEwbW9uZXlwdW5jdEl3TGIxRUVFALROAQBYRAEAAAAAAAIAAAC0NwEAAgAAABBDAQACAAAAAAAAABhFAQC6AAAAcwEAAJgAAAB0AQAAdQEAAE5TdDNfXzI5bW9uZXlfZ2V0SWNOU18xOWlzdHJlYW1idWZfaXRlcmF0b3JJY05TXzExY2hhcl90cmFpdHNJY0VFRUVFRQBOU3QzX18yMTFfX21vbmV5X2dldEljRUUAADBOAQD2RAEAtE4BALBEAQAAAAAAAgAAALQ3AQACAAAAEEUBAAAAAAAAAAAAvEUBALoAAAB2AQAAmAAAAHcBAAB4AQAATlN0M19fMjltb25leV9nZXRJd05TXzE5aXN0cmVhbWJ1Zl9pdGVyYXRvckl3TlNfMTFjaGFyX3RyYWl0c0l3RUVFRUVFAE5TdDNfXzIxMV9fbW9uZXlfZ2V0SXdFRQAAME4BAJpFAQC0TgEAVEUBAAAAAAACAAAAtDcBAAIAAAC0RQEAAAAAAAAAAABgRgEAugAAAHkBAACYAAAAegEAAHsBAABOU3QzX18yOW1vbmV5X3B1dEljTlNfMTlvc3RyZWFtYnVmX2l0ZXJhdG9ySWNOU18xMWNoYXJfdHJhaXRzSWNFRUVFRUUATlN0M19fMjExX19tb25leV9wdXRJY0VFAAAwTgEAPkYBALROAQD4RQEAAAAAAAIAAAC0NwEAAgAAAFhGAQAAAAAAAAAAAARHAQC6AAAAfAEAAJgAAAB9AQAAfgEAAE5TdDNfXzI5bW9uZXlfcHV0SXdOU18xOW9zdHJlYW1idWZfaXRlcmF0b3JJd05TXzExY2hhcl90cmFpdHNJd0VFRUVFRQBOU3QzX18yMTFfX21vbmV5X3B1dEl3RUUAADBOAQDiRgEAtE4BAJxGAQAAAAAAAgAAALQ3AQACAAAA/EYBAAAAAAAAAAAAfEcBALoAAAB/AQAAmAAAAIABAACBAQAAggEAAE5TdDNfXzI4bWVzc2FnZXNJY0VFAE5TdDNfXzIxM21lc3NhZ2VzX2Jhc2VFAAAAADBOAQBZRwEAtE4BAERHAQAAAAAAAgAAALQ3AQACAAAAdEcBAAIAAAAAAAAA1EcBALoAAACDAQAAmAAAAIQBAACFAQAAhgEAAE5TdDNfXzI4bWVzc2FnZXNJd0VFAAAAALROAQC8RwEAAAAAAAIAAAC0NwEAAgAAAHRHAQACAAAAUwAAAHUAAABuAAAAZAAAAGEAAAB5AAAAAAAAAE0AAABvAAAAbgAAAGQAAABhAAAAeQAAAAAAAABUAAAAdQAAAGUAAABzAAAAZAAAAGEAAAB5AAAAAAAAAFcAAABlAAAAZAAAAG4AAABlAAAAcwAAAGQAAABhAAAAeQAAAAAAAABUAAAAaAAAAHUAAAByAAAAcwAAAGQAAABhAAAAeQAAAAAAAABGAAAAcgAAAGkAAABkAAAAYQAAAHkAAAAAAAAAUwAAAGEAAAB0AAAAdQAAAHIAAABkAAAAYQAAAHkAAAAAAAAAUwAAAHUAAABuAAAAAAAAAE0AAABvAAAAbgAAAAAAAABUAAAAdQAAAGUAAAAAAAAAVwAAAGUAAABkAAAAAAAAAFQAAABoAAAAdQAAAAAAAABGAAAAcgAAAGkAAAAAAAAAUwAAAGEAAAB0AAAAAAAAAEoAAABhAAAAbgAAAHUAAABhAAAAcgAAAHkAAAAAAAAARgAAAGUAAABiAAAAcgAAAHUAAABhAAAAcgAAAHkAAAAAAAAATQAAAGEAAAByAAAAYwAAAGgAAAAAAAAAQQAAAHAAAAByAAAAaQAAAGwAAAAAAAAATQAAAGEAAAB5AAAAAAAAAEoAAAB1AAAAbgAAAGUAAAAAAAAASgAAAHUAAABsAAAAeQAAAAAAAABBAAAAdQAAAGcAAAB1AAAAcwAAAHQAAAAAAAAAUwAAAGUAAABwAAAAdAAAAGUAAABtAAAAYgAAAGUAAAByAAAAAAAAAE8AAABjAAAAdAAAAG8AAABiAAAAZQAAAHIAAAAAAAAATgAAAG8AAAB2AAAAZQAAAG0AAABiAAAAZQAAAHIAAAAAAAAARAAAAGUAAABjAAAAZQAAAG0AAABiAAAAZQAAAHIAAAAAAAAASgAAAGEAAABuAAAAAAAAAEYAAABlAAAAYgAAAAAAAABNAAAAYQAAAHIAAAAAAAAAQQAAAHAAAAByAAAAAAAAAEoAAAB1AAAAbgAAAAAAAABKAAAAdQAAAGwAAAAAAAAAQQAAAHUAAABnAAAAAAAAAFMAAABlAAAAcAAAAAAAAABPAAAAYwAAAHQAAAAAAAAATgAAAG8AAAB2AAAAAAAAAEQAAABlAAAAYwAAAAAAAABBAAAATQAAAAAAAABQAAAATQAAAAAAAAAAAAAAbEABAC4BAAAvAQAAMAEAADEBAAAyAQAAMwEAADQBAAAAAAAAWEEBAD4BAAA/AQAAQAEAAEEBAABCAQAAQwEAAEQBAAAAAAAA4EsBAIcBAACIAQAAIgAAAE5TdDNfXzIxNF9fc2hhcmVkX2NvdW50RQAAAAAwTgEAxEsBAE4xMF9fY3h4YWJpdjExNl9fc2hpbV90eXBlX2luZm9FAAAAAFhOAQDoSwEAMFABAE4xMF9fY3h4YWJpdjExN19fY2xhc3NfdHlwZV9pbmZvRQAAAFhOAQAYTAEADEwBAE4xMF9fY3h4YWJpdjExN19fcGJhc2VfdHlwZV9pbmZvRQAAAFhOAQBITAEADEwBAE4xMF9fY3h4YWJpdjExOV9fcG9pbnRlcl90eXBlX2luZm9FAFhOAQB4TAEAbEwBAE4xMF9fY3h4YWJpdjEyMF9fZnVuY3Rpb25fdHlwZV9pbmZvRQAAAABYTgEAqEwBAAxMAQBOMTBfX2N4eGFiaXYxMjlfX3BvaW50ZXJfdG9fbWVtYmVyX3R5cGVfaW5mb0UAAABYTgEA3EwBAGxMAQAAAAAAXE0BAIkBAACKAQAAiwEAAIwBAACNAQAATjEwX19jeHhhYml2MTIzX19mdW5kYW1lbnRhbF90eXBlX2luZm9FAFhOAQA0TQEADEwBAHYAAAAgTQEAaE0BAERuAAAgTQEAdE0BAGIAAAAgTQEAgE0BAGMAAAAgTQEAjE0BAGgAAAAgTQEAmE0BAGEAAAAgTQEApE0BAHMAAAAgTQEAsE0BAHQAAAAgTQEAvE0BAGkAAAAgTQEAyE0BAGoAAAAgTQEA1E0BAGwAAAAgTQEA4E0BAG0AAAAgTQEA7E0BAHgAAAAgTQEA+E0BAHkAAAAgTQEABE4BAGYAAAAgTQEAEE4BAGQAAAAgTQEAHE4BAAAAAAA8TAEAiQEAAI4BAACLAQAAjAEAAI8BAACQAQAAkQEAAJIBAAAAAAAAoE4BAIkBAACTAQAAiwEAAIwBAACPAQAAlAEAAJUBAACWAQAATjEwX19jeHhhYml2MTIwX19zaV9jbGFzc190eXBlX2luZm9FAAAAAFhOAQB4TgEAPEwBAAAAAAD8TgEAiQEAAJcBAACLAQAAjAEAAI8BAACYAQAAmQEAAJoBAABOMTBfX2N4eGFiaXYxMjFfX3ZtaV9jbGFzc190eXBlX2luZm9FAAAAWE4BANROAQA8TAEAAAAAAJxMAQCJAQAAmwEAAIsBAACMAQAAnAEAAAAAAACITwEAFAAAAJ0BAACeAQAAAAAAALBPAQAUAAAAnwEAAKABAAAAAAAAcE8BABQAAAChAQAAogEAAFN0OWV4Y2VwdGlvbgAAAAAwTgEAYE8BAFN0OWJhZF9hbGxvYwAAAABYTgEAeE8BAHBPAQBTdDIwYmFkX2FycmF5X25ld19sZW5ndGgAAAAAWE4BAJRPAQCITwEAAAAAAOBPAQAjAAAAowEAAKQBAABTdDExbG9naWNfZXJyb3IAWE4BANBPAQBwTwEAAAAAABRQAQAjAAAApQEAAKQBAABTdDEybGVuZ3RoX2Vycm9yAAAAAFhOAQAAUAEA4E8BAFN0OXR5cGVfaW5mbwAAAAAwTgEAIFABAABBuKAFC8QDUGkBAAAAAAAJAAAAAAAAAAAAAABkAAAAAAAAAAAAAAAAAAAAAAAAAGUAAAAAAAAAZgAAANhUAQAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAABnAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABoAAAAaQAAAOhYAQAABAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA/////woAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADQUAEAAAAAAAUAAAAAAAAAAAAAAGQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGgAAABmAAAA8FwBAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAD//////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGhRAQA=';
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

