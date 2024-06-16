// include: shell.js
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(moduleArg) => Promise<Module>
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

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = true;

if (Module['ENVIRONMENT']) {
  throw new Error('Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)');
}

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
function createExportWrapper(name, nargs) {
  return (...args) => {
    assert(runtimeInitialized, `native function \`${name}\` called before runtime initialization`);
    var f = wasmExports[name];
    assert(f, `exported native function \`${name}\` not found`);
    // Only assert for too many arguments. Too few can be valid since the missing arguments will be zero filled.
    assert(args.length <= nargs, `native function \`${name}\` called with ${args.length} args but expects ${nargs}`);
    return f(...args);
  };
}

// include: runtime_exceptions.js
// end include: runtime_exceptions.js
function findWasmBinary() {
    var f = 'data:application/octet-stream;base64,AGFzbQEAAAABxgVaYAF/AX9gAn9/AX9gAn9/AGADf39/AX9gAX8AYAABf2ADf39/AGAGf39/f39/AX9gAABgBH9/f38AYAV/f39/fwF/YAZ/f39/f38AYAR/f39/AX9gCH9/f39/f39/AX9gBX9/f39/AGACf30AYAd/f39/f39/AGABfQF9YAd/f39/f39/AX9gA399fwBgAX8BfWAFf35+fn4AYAABfmADf35/AX5gBX9/f39+AX9gBH9/f38BfmAGf39/f35/AX9gCn9/f39/f39/f38AYAd/f39/f35+AX9gBH9/f30AYAN/f30AYAF8AXxgBX9/fn9/AGAEf35+fwBgCn9/f39/f39/f38Bf2AGf39/f35+AX9gAn19AX1gBX9/f31/AGABfwF8YAJ/fABgAnx/AXxgBH5+fn4Bf2AEf39/fgF+YAZ/fH9/f38Bf2ACfn8Bf2ADf39/AX5gAn9/AX1gAn9/AXxgA39/fwF9YAN/f38BfGAMf39/f39/f39/f39/AX9gBX9/f398AX9gBn9/f398fwF/YAd/f39/fn5/AX9gC39/f39/f39/f39/AX9gD39/f39/f39/f39/f39/fwBgCH9/f39/f39/AGANf39/f39/f39/f39/fwBgCX9/f39/f39/fwBgBX9/f399AGAEf399fwBgBH99fX8AYAV/f319fQF9YAZ/fX19fX8AYAR/f319AX1gA399fQBgA399fwF9YAJ8fAF8YAJ8fwF/YAN8fH8BfGACf30BfWABfQF/YAJ8fwF9YAJ/fgF/YAJ/fgBgAn5+AX9gA39+fgBgAn9/AX5gAn5+AX1gAn5+AXxgA39/fgBgA35/fwF/YAF8AX5gBn9/f35/fwBgBH9/fn8BfmAGf39/f39+AX9gCH9/f39/f35+AX9gCX9/f39/f39/fwF/YAV/f39+fgBgBH9+f38BfwLaBRgDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfY2xhc3MAOQNlbnYLX19jeGFfdGhyb3cABgNlbnYVX2VtYmluZF9yZWdpc3Rlcl92b2lkAAIDZW52FV9lbWJpbmRfcmVnaXN0ZXJfYm9vbAAJA2VudhhfZW1iaW5kX3JlZ2lzdGVyX2ludGVnZXIADgNlbnYWX2VtYmluZF9yZWdpc3Rlcl9mbG9hdAAGA2VudhtfZW1iaW5kX3JlZ2lzdGVyX3N0ZF9zdHJpbmcAAgNlbnYcX2VtYmluZF9yZWdpc3Rlcl9zdGRfd3N0cmluZwAGA2VudhZfZW1iaW5kX3JlZ2lzdGVyX2VtdmFsAAQDZW52HF9lbWJpbmRfcmVnaXN0ZXJfbWVtb3J5X3ZpZXcABgNlbnYiX2VtYmluZF9yZWdpc3Rlcl9jbGFzc19jb25zdHJ1Y3RvcgALA2Vudh9fZW1iaW5kX3JlZ2lzdGVyX2NsYXNzX2Z1bmN0aW9uADoDZW52FV9lbXNjcmlwdGVuX21lbWNweV9qcwAGA2VudhZlbXNjcmlwdGVuX3Jlc2l6ZV9oZWFwAAAWd2FzaV9zbmFwc2hvdF9wcmV2aWV3MQhmZF93cml0ZQAMFndhc2lfc25hcHNob3RfcHJldmlldzEHZmRfcmVhZAAMFndhc2lfc25hcHNob3RfcHJldmlldzEIZmRfY2xvc2UAAANlbnYJX2Fib3J0X2pzAAgWd2FzaV9zbmFwc2hvdF9wcmV2aWV3MRFlbnZpcm9uX3NpemVzX2dldAABFndhc2lfc25hcHNob3RfcHJldmlldzELZW52aXJvbl9nZXQAAQNlbnYKc3RyZnRpbWVfbAAKA2Vudg1fX2Fzc2VydF9mYWlsAAkDZW52F19lbWJpbmRfcmVnaXN0ZXJfYmlnaW50ABAWd2FzaV9zbmFwc2hvdF9wcmV2aWV3MQdmZF9zZWVrAAoDmBKWEggABAgICAAIAQgABQUEBQUFBQUFBQQJAggABQUEBQUFBQUCAgICAAAAAAUFBQAAAAAAAAEEBAQAAAYCBgAAAAICBgAGAgYCAAAAAAAABQAAAAAABQAAAAAAAAAAAAAAAwEAAAAAAAAEBAEAAwAAAQEDAAADAAADAAAEAAABAwMAAAMAAAIDBAQEBgQEAQAEAQEBAQEBAQEAAAAAAAAIAQMAAAMAAgAAAQABAQAAAAMBAQEBAAAAAAIABgMAAwEBAQEAAAAEBAAEAAAADgAABQAAAAAFAAUFOwAABQAAEQUGAAAFAAUDAAAFAAAFPAAABQAFCA8PDxERDw8PAiQEBAQAJQE9HgEBAgQEAj4UAD8AFAJAQQQmARQBAgECAAIECAAAAQAAQgMAABEAAwAAAQEDAAMAAAMABAAAAQMDAAADAAACAwQEBAYEBAEAAQEBAQEBAQEAAAAAAAADAAADAAIAAAEBAAAAAwEBAQEAAAAAAgAGAwADAQEBAQAAAAQEAAQCHgICAg8AAgEMAgIAAgADAgAABAEDAAYAAwABDAACAgQAAAIAAAUBBAEBAAAFAwABAQEAAAADCQkJBgAOAQEGAQAAAAADAQgCAAIADw8PDw8PDw8EHgABAAECAAMBJQICAgABAAAHAAIAAAMDAAEABQECAwAAAAAAAAAAAAAAAAAAAAABExMTExMTExMdDwIdAgICAgEJBAQEDw8PJxQUFEMKREUfA0YRFBQRRx8UERERJAAAESZIBQUFCCgfAwAABQUAAAMEAQEBAwIABAAFBQEAFxcDAwAAAQAAAQAEBAUIAAQAAwAIAAMMAAQABAACAyBJCQAAAwEDAgABAwAFAAABAwEBAAAEBAAAAAAAAQADAAIAAAAAAQAAAgEBAAUFAQAABAQBAAEAAAEAAQMABAAEAAIDIAkAAAMDAgADAAUAAAEDAQEAAAQEAAAAAAEAAwACAAAAAQAAAQEBAAAEBAEAAAEAAwADAgABAgAAAgIABAAAAAwAAwYCAAIAAAACAAAAAAAAAQ0IAQ0ACgMDCQkJBgAOAQEGBgkAAwEBAAMAAAMGAwEBAwkJCQYADgEBBgYJAAMBAQADAAADBgMAAQEAAAAAAAAAAAAGAgICBgACBgAGAgYCAAAAAAEBCQEAAAAGAgICAgQABQQBAAUIAQEAAAAAAAMAAQABAQMAAgIBAgEABAQCAAEAABcDAQAAAAAAAAQBAwwAAAAAAwEBAQEBCAAAAwEDAQEAAwEDAQEAAgECAAIAAAAEBAIAAQABAwEBAQMABAIAAwEBBAIAAAEAAQMNAQ0EAgAKAwEBAAhKACEPAiEVBQUVJykpFQIVIRUVSxVMCQALEE0qAE5PAAMAAVADAwMBCAMAAQMAAwMAAAEoChIGAAlRLCwOAysCUgwDAAEAAQMMAwYAAQQABAAEAAUFCgwKBQMAAy0qAC0uCS8GMDEJAAAECgkDBgMABAoJAwMGAwcAAAICEgEBAwIBAQAABwcAAwYBIgwJBwcZBwcMBwcMBwcMBwcZBwcOMjAHBzEHBwkHDAUMAwEABwACAhIBAQABAAcHAwYiBwcHBwcHBwcHBwcHDjIHBwcHBwwDAAACAwwDDAAAAgMMAwwKAAABAAABAQoHCQoDEAcYGgoHGBozNAMAAwwCEAAjNQoAAwEKAAABAAAAAQEKBxAHGBoKBxgaMzQDAhAAIzUKAwACAgICDQMABwcHCwcLBwsKDQsLCwsLCw4LCwsLDg0DAAcHAAAAAAAHCwcLBwsKDQsLCwsLCw4LCwsLDhILAwIBCRILAwEKCQAFBQACAgICAAICAAACAgICAAICAAUFAAICAAMCAgIAAgIAAAICAgIAAgIBBAMBAAQDAAAAEgQ2AAADAwAbBgABAQAAAQEDBgYAAAAAEgQDARACAwAAAgICAAACAgAAAgICAAACAgADAAEAAwEAAAEAAAECAhI2AAADGwYAAQEBAAABAQMGABIEAwACAgACAgABARACAgAMAAICAQIAAAICAAACAgIAAAICAAMAAQADAQAAAQIcARs3AAICAAEAAwUHHAEbNwAAAAICAAEAAwcJAQUBCQEBAwsCAwsCAAEBAQQIAggCCAIIAggCCAIIAggCCAIIAggCCAIIAggCCAIIAggCCAIIAggCCAIIAggCCAIIAggCCAIIAggCCAIBAwECAgIEAAQCAAYBAQwBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEFAQQFAwQAAAEBAAECAAAEAAAABAQCAgABAQgEAAEAAQAFAQQAAQQEAAIEBAABAQQEAwwMDAEFAwEFAwEMAwoAAAQBAwEDAQwDCgQNDQoAAAoAAAQNBwwNBwoKAAwAAAoMAAQNDQ0NCgAACgoABA0NCgAACgAEDQ0NDQoAAAoKAAQNDQoAAAoAAAQABAAAAAACAgICAQACAgEBAgAIBAAIBAEACAQACAQACAQACAQABAAEAAQABAAEAAQABAAEAAEEBAQEAAAEAAAEBAAEAAQEBAQEBAQEBAQBCQEAAAEJAAABAAAABgICAgQAAAEAAAAAAAACAxAEBgYAAAMDAwMBAQICAgICAgIAAAkJBgAOAQEGBgADAQEDCQkGAA4BAQYGAAMBAQMAAQEDAwAMAwAAAAABEAEDAwYDAQkADAMAAAAAAQICCQkGAQYGAwEAAAAAAAEBAQkJBgEGBgMBAAAAAAABAQEBAAEABAAGAAIDAAACAAAAAwAAAAAAAAEAAAAAAAACAgQAAQAEBgAABgYMAgIAAwAAAwABDAACBAABAAAAAwkJCQYADgEBBgYBAAAAAAMBAQgCAAIAAAICAgAAAAAAAAAAAAEE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ApwBIAIpApwBIdoBIAIg2gE3A+gEIAIoAugEIZYBIAIoAuwEIZcBIAIgjwE2AoQFQaqABCGYASACIJgBNgKABSACIJcBNgL8BCACIJYBNgL4BCACKAKEBSGZASACKAKABSGaASACKAL4BCGbASACKAL8BCGcASACIJwBNgL0BCACIJsBNgLwBCACKQLwBCHbASACINsBNwMgQSAhnQEgAiCdAWohngEgmgEgngEQPSACICE2ApgBQRIhnwEgAiCfATYClAEgAikClAEh3AEgAiDcATcDyAQgAigCyAQhoAEgAigCzAQhoQEgAiCZATYC5ARBroYEIaIBIAIgogE2AuAEIAIgoQE2AtwEIAIgoAE2AtgEIAIoAuQEIaMBIAIoAuAEIaQBIAIoAtgEIaUBIAIoAtwEIaYBIAIgpgE2AtQEIAIgpQE2AtAEIAIpAtAEId0BIAIg3QE3AxhBGCGnASACIKcBaiGoASCkASCoARA9IAIgITYCkAFBEyGpASACIKkBNgKMASACKQKMASHeASACIN4BNwOoBCACKAKoBCGqASACKAKsBCGrASACIKMBNgLEBEHRgQQhrAEgAiCsATYCwAQgAiCrATYCvAQgAiCqATYCuAQgAigCxAQhrQEgAigCwAQhrgEgAigCuAQhrwEgAigCvAQhsAEgAiCwATYCtAQgAiCvATYCsAQgAikCsAQh3wEgAiDfATcDEEEQIbEBIAIgsQFqIbIBIK4BILIBED0gAiAhNgKIAUEUIbMBIAIgswE2AoQBIAIpAoQBIeABIAIg4AE3A4gEIAIoAogEIbQBIAIoAowEIbUBIAIgrQE2AqQEQZeEBCG2ASACILYBNgKgBCACILUBNgKcBCACILQBNgKYBCACKAKkBCG3ASACKAKgBCG4ASACKAKYBCG5ASACKAKcBCG6ASACILoBNgKUBCACILkBNgKQBCACKQKQBCHhASACIOEBNwMIQQghuwEgAiC7AWohvAEguAEgvAEQPSACICE2AoABQRUhvQEgAiC9ATYCfCACKQJ8IeIBIAIg4gE3A+gDIAIoAugDIb4BIAIoAuwDIb8BIAIgtwE2AoQEQciDBCHAASACIMABNgKABCACIL8BNgL8AyACIL4BNgL4AyACKAKABCHBASACKAL4AyHCASACKAL8AyHDASACIMMBNgL0AyACIMIBNgLw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ACABELcGCwwAIAAgASACELUGGgs4AQF/IwBBEGsiAyQAIAMgARC4BjYCDCADIAIQuAY2AgggACADQQxqIANBCGoQuQYaIANBEGokAAtDAQF/IwBBEGsiBCQAIAQgAjYCDCADIAEgAiABayICELwGGiAEIAMgAmo2AgggACAEQQxqIARBCGoQvQYgBEEQaiQACwcAIAAQhwYLGAAgACABKAIANgIAIAAgAigCADYCBCAACwkAIAAgARC/BgsNACAAIAEgABCHBmtqCwcAIAAQugYLGAAgACABKAIANgIAIAAgAigCADYCBCAACwcAIAAQuwYLBAAgAAsWAAJAIAJFDQAgACABIAIQ/gQaCyAACwwAIAAgASACEL4GGgsYACAAIAEoAgA2AgAgACACKAIANgIEIAALCQAgACABEMAGCw0AIAAgASAAELsGa2oLKwEBfyMAQRBrIgMkACADQQhqIAAgASACEMIGIAMoAgwhAiADQRBqJAAgAgsNACAAIAEgAiADEMMGCw0AIAAgASACIAMQxAYLaQEBfyMAQSBrIgQkACAEQRhqIAEgAhDFBiAEQRBqIARBDGogBCgCGCAEKAIcIAMQxgYQxwYgBCABIAQoAhAQyAY2AgwgBCADIAQoAhQQyQY2AgggACAEQQxqIARBCGoQygYgBEEgaiQACwsAIAAgASACEMsGCwcAIAAQzQYLDQAgACACIAMgBBDMBgsJACAAIAEQzwYLCQAgACABENAGCwwAIAAgASACEM4GGgs4AQF/IwBBEGsiAyQAIAMgARDRBjYCDCADIAIQ0QY2AgggACADQQxqIANBCGoQ0gYaIANBEGokAAtGAQF/IwBBEGsiBCQAIAQgAjYCDCADIAEgAiABayICQQJ1ENUGGiAEIAMgAmo2AgggACAEQQxqIARBCGoQ1gYgBEEQaiQACwcAIAAQ2AYLGAAgACABKAIANgIAIAAgAigCADYCBCAACwkAIAAgARDZBgsNACAAIAEgABDYBmtqCwcAIAAQ0wYLGAAgACABKAIANgIAIAAgAigCADYCBCAACwcAIAAQ1AYLBAAgAAsZAAJAIAJFDQAgACABIAJBAnQQ/gQaCyAACwwAIAAgASACENcGGgsYACAAIAEoAgA2AgAgACACKAIANgIEIAALBAAgAAsJACAAIAEQ2gYLDQAgACABIAAQ1AZr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AkF/Sg0BIAAoAgQhASAAKAIsIQILIABCfzcDcCAAIAE2AmggACAEIAIgAWusfDcDeEF/DwsgBEIBfCEEIAAoAgQhASAAKAIIIQMCQCAAKQNwIgVCAFENACAFIAR9IgUgAyABa6xZDQAgASAFp2ohAwsgACADNgJoIAAgBCAAKAIsIgMgAWusfDcDeAJAIAEgA0sNACABQX9qIAI6AAALIAILUwEBfgJAAkAgA0HAAHFFDQAgASADQUBqrYYhAkIAIQEMAQsgA0UNACABQcAAIANrrYggAiADrSIEhoQhAiABIASGIQELIAAgATcDACAAIAI3AwgL3gECBX8CfiMAQRBrIgIkACABvCIDQf///wNxIQQCQAJAIANBF3YiBUH/AXEiBkUNAAJAIAZB/wFGDQAgBK1CGYYhByAFQf8BcUGA/wBqIQRCACEIDAILIAStQhmGIQdCACEIQf//ASEEDAELAkAgBA0AQgAhCEEAIQRCACEHDAELIAIgBK1CACAEZyIEQdEAahD8B0GJ/wAgBGshBCACQQhqKQMAQoCAgICAgMAAhSEHIAIpAwAhCAsgACAINwMAIAAgBK1CMIYgA0Efdq1CP4aEIAeENwMIIAJBEGokAAuNAQICfwJ+IwBBEGsiAiQAAkACQCABDQBCACEEQgAhBQwBCyACIAEgAUEfdSIDcyADayIDrUIAIANnIgNB0QBqEPwHIAJBCGopAwBCgICAgICAwACFQZ6AASADa61CMIZ8IAFBgICAgHhxrUIghoQhBSACKQMAIQQLIAAgBDcDACAAIAU3AwggAkEQaiQAC1MBAX4CQAJAIANBwABxRQ0AIAIgA0FAaq2IIQFCACECDAELIANFDQAgAkHAACADa62GIAEgA60iBIiEIQEgAiAEiCECCyAAIAE3AwAgACACNwMIC5oLAgV/D34jAEHgAGsiBSQAIARC////////P4MhCiAEIAKFQoCAgICAgICAgH+DIQsgAkL///////8/gyIMQiCIIQ0gBEIwiKdB//8BcSEGAkACQAJAIAJCMIinQf//AXEiB0GBgH5qQYKAfkkNAEEAIQggBkGBgH5qQYGAfksNAQsCQCABUCACQv///////////wCDIg5CgICAgICAwP//AFQgDkKAgICAgIDA//8AURsNACACQoCAgICAgCCEIQsMAgsCQCADUCAEQv///////////wCDIgJCgICAgICAwP//AFQgAkKAgICAgIDA//8AURsNACAEQoCAgICAgCCEIQsgAyEBDAILAkAgASAOQoCAgICAgMD//wCFhEIAUg0AAkAgAyAChFBFDQBCgICAgICA4P//ACELQgAhAQwDCyALQoCAgICAgMD//wCEIQtCACEBDAILAkAgAyACQoCAgICAgMD//wCFhEIAUg0AIAEgDoQhAkIAIQECQCACUEUNAEKAgICAgIDg//8AIQsMAwsgC0KAgICAgIDA//8AhCELDAILAkAgASAOhEIAUg0AQgAhAQwCCwJAIAMgAoRCAFINAEIAIQEMAgtBACEIAkAgDkL///////8/Vg0AIAVB0ABqIAEgDCABIAwgDFAiCBt5IAhBBnStfKciCEFxahD8B0EQIAhrIQggBUHYAGopAwAiDEIgiCENIAUpA1AhAQsgAkL///////8/Vg0AIAVBwABqIAMgCiADIAogClAiCRt5IAlBBnStfKciCUFxahD8ByAIIAlrQRBqIQggBUHIAGopAwAhCiAFKQNAIQMLIANCD4YiDkKAgP7/D4MiAiABQiCIIgR+Ig8gDkIgiCIOIAFC/////w+DIgF+fCIQQiCGIhEgAiABfnwiEiARVK0gAiAMQv////8PgyIMfiITIA4gBH58IhEgA0IxiCAKQg+GIhSEQv////8PgyIDIAF+fCIVIBBCIIggECAPVK1CIIaEfCIQIAIgDUKAgASEIgp+IhYgDiAMfnwiDSAUQiCIQoCAgIAIhCICIAF+fCIPIAMgBH58IhRCIIZ8Ihd8IQEgByAGaiAIakGBgH9qIQYCQAJAIAIgBH4iGCAOIAp+fCIEIBhUrSAEIAMgDH58Ig4gBFStfCACIAp+fCAOIBEgE1StIBUgEVStfHwiBCAOVK18IAMgCn4iAyACIAx+fCICIANUrUIghiACQiCIhHwgBCACQiCGfCICIARUrXwgAiAUQiCIIA0gFlStIA8gDVStfCAUIA9UrXxCIIaEfCIEIAJUrXwgBCAQIBVUrSAXIBBUrXx8IgIgBFStfCIEQoCAgICAgMAAg1ANACAGQQFqIQYMAQsgEkI/iCEDIARCAYYgAkI/iIQhBCACQgGGIAFCP4iEIQIgEkIBhiESIAMgAUIBhoQhAQsCQCAGQf//AUgNACALQoCAgICAgMD//wCEIQtCACEBDAELAkACQCAGQQBKDQACQEEBIAZrIgdB/wBLDQAgBUEwaiASIAEgBkH/AGoiBhD8ByAFQSBqIAIgBCAGEPwHIAVBEGogEiABIAcQ/wcgBSACIAQgBxD/ByAFKQMgIAUpAxCEIAUpAzAgBUEwakEIaikDAIRCAFKthCESIAVBIGpBCGopAwAgBUEQakEIaikDAIQhASAFQQhqKQMAIQQgBSkDACECDAILQgAhAQwCCyAGrUIwhiAEQv///////z+DhCEECyAEIAuEIQsCQCASUCABQn9VIAFCgICAgICAgICAf1EbDQAgCyACQgF8IgFQrXwhCwwBCwJAIBIgAUKAgICAgICAgIB/hYRCAFENACACIQEMAQsgCyACIAJCAYN8IgEgAlStfCELCyAAIAE3AwAgACALNwMIIAVB4ABqJAALBABBAAsEAEEAC+oKAgR/BH4jAEHwAGsiBSQAIARC////////////AIMhCQJAAkACQCABUCIGIAJC////////////AIMiCkKAgICAgIDAgIB/fEKAgICAgIDAgIB/VCAKUBsNACADQgBSIAlCgICAgICAwICAf3wiC0KAgICAgIDAgIB/ViALQoCAgICAgMCAgH9RGw0BCwJAIAYgCkKAgICAgIDA//8AVCAKQoCAgICAgMD//wBRGw0AIAJCgICAgICAIIQhBCABIQMMAgsCQCADUCAJQoCAgICAgMD//wBUIAlCgICAgICAwP//AFEbDQAgBEKAgICAgIAghCEEDAILAkAgASAKQoCAgICAgMD//wCFhEIAUg0AQoCAgICAgOD//wAgAiADIAGFIAQgAoVCgICAgICAgICAf4WEUCIGGyEEQgAgASAGGyEDDAILIAMgCUKAgICAgIDA//8AhYRQDQECQCABIAqEQgBSDQAgAyAJhEIAUg0CIAMgAYMhAyAEIAKDIQQMAgsgAyAJhFBFDQAgASEDIAIhBAwBCyADIAEgAyABViAJIApWIAkgClEbIgcbIQkgBCACIAcbIgtC////////P4MhCiACIAQgBxsiDEIwiKdB//8BcSEIAkAgC0IwiKdB//8BcSIGDQAgBUHgAGogCSAKIAkgCiAKUCIGG3kgBkEGdK18pyIGQXFqEPwHQRAgBmshBiAFQegAaikDACEKIAUpA2AhCQsgASADIAcbIQMgDEL///////8/gyEBAkAgCA0AIAVB0ABqIAMgASADIAEgAVAiBxt5IAdBBnStfKciB0FxahD8B0EQIAdrIQggBUHYAGopAwAhASAFKQNQIQMLIAFCA4YgA0I9iIRCgICAgICAgASEIQEgCkIDhiAJQj2IhCEMIANCA4YhCiAEIAKFIQMCQCAGIAhGDQACQCAGIAhrIgdB/wBNDQBCACEBQgEhCgwBCyAFQcAAaiAKIAFBgAEgB2sQ/AcgBUEwaiAKIAEgBxD/ByAFKQMwIAUpA0AgBUHAAGpBCGopAwCEQgBSrYQhCiAFQTBqQQhqKQMAIQELIAxCgICAgICAgASEIQwgCUIDhiEJAkACQCADQn9VDQBCACEDQgAhBCAJIAqFIAwgAYWEUA0CIAkgCn0hAiAMIAF9IAkgClStfSIEQv////////8DVg0BIAVBIGogAiAEIAIgBCAEUCIHG3kgB0EGdK18p0F0aiIHEPwHIAYgB2shBiAFQShqKQMAIQQgBSkDICECDAELIAEgDHwgCiAJfCICIApUrXwiBEKAgICAgICACINQDQAgAkIBiCAEQj+GhCAKQgGDhCECIAZBAWohBiAEQgGIIQQLIAtCgICAgICAgICAf4MhCgJAIAZB//8BSA0AIApCgICAgICAwP//AIQhBEIAIQMMAQtBACEHAkACQCAGQQBMDQAgBiEHDAELIAVBEGogAiAEIAZB/wBqEPwHIAUgAiAEQQEgBmsQ/wcgBSkDACAFKQMQIAVBEGpBCGopAwCEQgBSrYQhAiAFQQhqKQMAIQQLIAJCA4ggBEI9hoQhAyAHrUIwhiAEQgOIQv///////z+DhCAKhCEEIAKnQQdxIQYCQAJAAkACQAJAEIEIDgMAAQIDCwJAIAZBBEYNACAEIAMgBkEES618IgogA1StfCEEIAohAwwDCyAEIAMgA0IBg3wiCiADVK18IQQgCiEDDAMLIAQgAyAKQgBSIAZBAEdxrXwiCiADVK18IQQgCiEDDAELIAQgAyAKUCAGQQBHca18IgogA1StfCEEIAohAwsgBkUNAQsQgggaCyAAIAM3AwAgACAENwMIIAVB8ABqJAAL+gECAn8EfiMAQRBrIgIkACABvSIEQv////////8HgyEFAkACQCAEQjSIQv8PgyIGUA0AAkAgBkL/D1ENACAFQgSIIQcgBUI8hiEFIAZCgPgAfCEGDAILIAVCBIghByAFQjyGIQVC//8BIQYMAQsCQCAFUEUNAEIAIQVCACEHQgAhBgwBCyACIAVCACAEp2dBIGogBUIgiKdnIAVCgICAgBBUGyIDQTFqEPwHQYz4ACADa60hBiACQQhqKQMAQoCAgICAgMAAhSEHIAIpAwAhBQsgACAFNwMAIAAgBkIwhiAEQoCAgICAgICAgH+DhCAHhDcDCCACQRBqJAAL4AECAX8CfkEBIQQCQCAAQgBSIAFC////////////AIMiBUKAgICAgIDA//8AViAFQoCAgICAgMD//wBRGw0AIAJCAFIgA0L///////////8AgyIGQoCAgICAgMD//wBWIAZCgICAgICAwP//AFEbDQACQCACIACEIAYgBYSEUEUNAEEADwsCQCADIAGDQgBTDQBBfyEEIAAgAlQgASADUyABIANRGw0BIAAgAoUgASADhYRCAFIPC0F/IQQgACACViABIANVIAEgA1EbDQAgACAChSABIAOFhEIAUiEECyAEC9gBAgF/An5BfyEEAkAgAEIAUiABQv///////////wCDIgVCgICAgICAwP//AFYgBUKAgICAgIDA//8AURsNACACQgBSIANC////////////AIMiBkKAgICAgIDA//8AViAGQoCAgICAgMD//wBRGw0AAkAgAiAAhCAGIAWEhFBFDQBBAA8LAkAgAyABg0IAUw0AIAAgAlQgASADUyABIANRGw0BIAAgAoUgASADhYRCAFIPCyAAIAJWIAEgA1UgASADURsNACAAIAKFIAEgA4WEQgBSIQQLIAQLPAAgACABNwMAIAAgBEIwiKdBgIACcSACQoCAgICAgMD//wCDQjCIp3KtQjCGIAJC////////P4OENwMIC3UCAX8CfiMAQRBrIgIkAAJAAkAgAQ0AQgAhA0IAIQQMAQsgAiABrUIAQfAAIAFnIgFBH3NrEPwHIAJBCGopAwBCgICAgICAwACFQZ6AASABa61CMIZ8IQQgAikDACEDCyAAIAM3AwAgACAENwMIIAJBEGokAAtIAQF/IwBBEGsiBSQAIAUgASACIAMgBEKAgICAgICAgIB/hRCDCCAFKQMAIQQgACAFQQhqKQMANwMIIAAgBDcDACAFQRBqJAAL5wIBAX8jAEHQAGsiBCQAAkACQCADQYCAAUgNACAEQSBqIAEgAkIAQoCAgICAgID//wAQgAggBEEgakEIaikDACECIAQpAyAhAQJAIANB//8BTw0AIANBgYB/aiEDDAILIARBEGogASACQgBCgICAgICAgP//ABCACCADQf3/AiADQf3/AkkbQYKAfmohAyAEQRBqQQhqKQMAIQIgBCkDECEBDAELIANBgYB/Sg0AIARBwABqIAEgAkIAQoCAgICAgIA5EIAIIARBwABqQQhqKQMAIQIgBCkDQCEBAkAgA0H0gH5NDQAgA0GN/wBqIQMMAQsgBEEwaiABIAJCAEKAgICAgICAORCACCADQeiBfSADQeiBfUsbQZr+AWohAyAEQTBqQQhqKQMAIQIgBCkDMCEBCyAEIAEgAkIAIANB//8Aaq1CMIYQgAggACAEQQhqKQMANwMIIAAgBCkDADcDACAEQdAAaiQAC3UBAX4gACAEIAF+IAIgA358IANCIIgiAiABQiCIIgR+fCADQv////8PgyIDIAFC/////w+DIgF+IgVCIIggAyAEfnwiA0IgiHwgA0L/////D4MgAiABfnwiAUIgiHw3AwggACABQiCGIAVC/////w+DhDcDAAvnEAIFfw9+IwBB0AJrIgUkACAEQv///////z+DIQogAkL///////8/gyELIAQgAoVCgICAgICAgICAf4MhDCAEQjCIp0H//wFxIQYCQAJAAkAgAkIwiKdB//8BcSIHQYGAfmpBgoB+SQ0AQQAhCCAGQYGAfmpBgYB+Sw0BCwJAIAFQIAJC////////////AIMiDUKAgICAgIDA//8AVCANQoCAgICAgMD//wBRGw0AIAJCgICAgICAIIQhDAwCCwJAIANQIARC////////////AIMiAkKAgICAgIDA//8AVCACQoCAgICAgMD//wBRGw0AIARCgICAgICAIIQhDCADIQEMAgsCQCABIA1CgICAgICAwP//AIWEQgBSDQACQCADIAJCgICAgICAwP//AIWEUEUNAEIAIQFCgICAgICA4P//ACEMDAMLIAxCgICAgICAwP//AIQhDEIAIQEMAgsCQCADIAJCgICAgICAwP//AIWEQgBSDQBCACEBDAILAkAgASANhEIAUg0AQoCAgICAgOD//wAgDCADIAKEUBshDEIAIQEMAgsCQCADIAKEQgBSDQAgDEKAgICAgIDA//8AhCEMQgAhAQwCC0EAIQgCQCANQv///////z9WDQAgBUHAAmogASALIAEgCyALUCIIG3kgCEEGdK18pyIIQXFqEPwHQRAgCGshCCAFQcgCaikDACELIAUpA8ACIQELIAJC////////P1YNACAFQbACaiADIAogAyAKIApQIgkbeSAJQQZ0rXynIglBcWoQ/AcgCSAIakFwaiEIIAVBuAJqKQMAIQogBSkDsAIhAwsgBUGgAmogA0IxiCAKQoCAgICAgMAAhCIOQg+GhCICQgBCgICAgLDmvIL1ACACfSIEQgAQiwggBUGQAmpCACAFQaACakEIaikDAH1CACAEQgAQiwggBUGAAmogBSkDkAJCP4ggBUGQAmpBCGopAwBCAYaEIgRCACACQgAQiwggBUHwAWogBEIAQgAgBUGAAmpBCGopAwB9QgAQiwggBUHgAWogBSkD8AFCP4ggBUHwAWpBCGopAwBCAYaEIgRCACACQgAQiwggBUHQAWogBEIAQgAgBUHgAWpBCGopAwB9QgAQiwggBUHAAWogBSkD0AFCP4ggBUHQAWpBCGopAwBCAYaEIgRCACACQgAQiwggBUGwAWogBEIAQgAgBUHAAWpBCGopAwB9QgAQiwggBUGgAWogAkIAIAUpA7ABQj+IIAVBsAFqQQhqKQMAQgGGhEJ/fCIEQgAQiwggBUGQAWogA0IPhkIAIARCABCLCCAFQfAAaiAEQgBCACAFQaABakEIaikDACAFKQOgASIKIAVBkAFqQQhqKQMAfCICIApUrXwgAkIBVq18fUIAEIsIIAVBgAFqQgEgAn1CACAEQgAQiwggCCAHIAZraiEGAkACQCAFKQNwIg9CAYYiECAFKQOAAUI/iCAFQYABakEIaikDACIRQgGGhHwiDUKZk398IhJCIIgiAiALQoCAgICAgMAAhCITQgGGIhRCIIgiBH4iFSABQgGGIhZCIIgiCiAFQfAAakEIaikDAEIBhiAPQj+IhCARQj+IfCANIBBUrXwgEiANVK18Qn98Ig9CIIgiDX58IhAgFVStIBAgD0L/////D4MiDyABQj+IIhcgC0IBhoRC/////w+DIgt+fCIRIBBUrXwgDSAEfnwgDyAEfiIVIAsgDX58IhAgFVStQiCGIBBCIIiEfCARIBBCIIZ8IhAgEVStfCAQIBJC/////w+DIhIgC34iFSACIAp+fCIRIBVUrSARIA8gFkL+////D4MiFX58IhggEVStfHwiESAQVK18IBEgEiAEfiIQIBUgDX58IgQgAiALfnwiCyAPIAp+fCINQiCIIAQgEFStIAsgBFStfCANIAtUrXxCIIaEfCIEIBFUrXwgBCAYIAIgFX4iAiASIAp+fCILQiCIIAsgAlStQiCGhHwiAiAYVK0gAiANQiCGfCACVK18fCICIARUrXwiBEL/////////AFYNACAUIBeEIRMgBUHQAGogAiAEIAMgDhCLCCABQjGGIAVB0ABqQQhqKQMAfSAFKQNQIgFCAFKtfSEKIAZB/v8AaiEGQgAgAX0hCwwBCyAFQeAAaiACQgGIIARCP4aEIgIgBEIBiCIEIAMgDhCLCCABQjCGIAVB4ABqQQhqKQMAfSAFKQNgIgtCAFKtfSEKIAZB//8AaiEGQgAgC30hCyABIRYLAkAgBkH//wFIDQAgDEKAgICAgIDA//8AhCEMQgAhAQwBCwJAAkAgBkEBSA0AIApCAYYgC0I/iIQhASAGrUIwhiAEQv///////z+DhCEKIAtCAYYhBAwBCwJAIAZBj39KDQBCACEBDAILIAVBwABqIAIgBEEBIAZrEP8HIAVBMGogFiATIAZB8ABqEPwHIAVBIGogAyAOIAUpA0AiAiAFQcAAakEIaikDACIKEIsIIAVBMGpBCGopAwAgBUEgakEIaikDAEIBhiAFKQMgIgFCP4iEfSAFKQMwIgQgAUIBhiILVK19IQEgBCALfSEECyAFQRBqIAMgDkIDQgAQiwggBSADIA5CBUIAEIsIIAogAiACQgGDIgsgBHwiBCADViABIAQgC1StfCIBIA5WIAEgDlEbrXwiAyACVK18IgIgAyACQoCAgICAgMD//wBUIAQgBSkDEFYgASAFQRBqQQhqKQMAIgJWIAEgAlEbca18IgIgA1StfCIDIAIgA0KAgICAgIDA//8AVCAEIAUpAwBWIAEgBUEIaikDACIEViABIARRG3GtfCIBIAJUrXwgDIQhDAsgACABNwMAIAAgDDcDCCAFQdACaiQAC0sCAX4CfyABQv///////z+DIQICQAJAIAFCMIinQf//AXEiA0H//wFGDQBBBCEEIAMNAUECQQMgAiAAhFAbDwsgAiAAhFAhBAsgBAvSBgIEfwN+IwBBgAFrIgUkAAJAAkACQCADIARCAEIAEIUIRQ0AIAMgBBCNCEUNACACQjCIpyIGQf//AXEiB0H//wFHDQELIAVBEGogASACIAMgBBCACCAFIAUpAxAiBCAFQRBqQQhqKQMAIgMgBCADEIwIIAVBCGopAwAhAiAFKQMAIQQMAQsCQCABIAJC////////////AIMiCSADIARC////////////AIMiChCFCEEASg0AAkAgASAJIAMgChCFCEUNACABIQQMAgsgBUHwAGogASACQgBCABCACCAFQfgAaikDACECIAUpA3AhBAwBCyAEQjCIp0H//wFxIQgCQAJAIAdFDQAgASEEDAELIAVB4ABqIAEgCUIAQoCAgICAgMC7wAAQgAggBUHoAGopAwAiCUIwiKdBiH9qIQcgBSkDYCEECwJAIAgNACAFQdAAaiADIApCAEKAgICAgIDAu8AAEIAIIAVB2ABqKQMAIgpCMIinQYh/aiEIIAUpA1AhAwsgCkL///////8/g0KAgICAgIDAAIQhCyAJQv///////z+DQoCAgICAgMAAhCEJAkAgByAITA0AA0ACQAJAIAkgC30gBCADVK19IgpCAFMNAAJAIAogBCADfSIEhEIAUg0AIAVBIGogASACQgBCABCACCAFQShqKQMAIQIgBSkDICEEDAULIApCAYYgBEI/iIQhCQwBCyAJQgGGIARCP4iEIQkLIARCAYYhBCAHQX9qIgcgCEoNAAsgCCEHCwJAAkAgCSALfSAEIANUrX0iCkIAWQ0AIAkhCgwBCyAKIAQgA30iBIRCAFINACAFQTBqIAEgAkIAQgAQgAggBUE4aikDACECIAUpAzAhBAwBCwJAIApC////////P1YNAANAIARCP4ghAyAHQX9qIQcgBEIBhiEEIAMgCkIBhoQiCkKAgICAgIDAAFQNAAsLIAZBgIACcSEIAkAgB0EASg0AIAVBwABqIAQgCkL///////8/gyAHQfgAaiAIcq1CMIaEQgBCgICAgICAwMM/EIAIIAVByABqKQMAIQIgBSkDQCEEDAELIApC////////P4MgByAIcq1CMIaEIQILIAAgBDcDACAAIAI3AwggBUGAAWokAAscACAAIAJC////////////AIM3AwggACABNwMAC5UJAgZ/A34jAEEwayIEJABCACEKAkACQCACQQJLDQAg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CyAHIBk8ACdBASEUIAghDSAJIRYgFyERDAELIAkhFgsgFCAWIA1rIgEgFCABShsiEiAQQf////8Hc0oNA0E9IRYgEyAQIBJqIg8gEyAPShsiDCAOSg0EIABBICAMIA8gERC2CCAAIBggEBCwCCAAQTAgDCAPIBFBgIAEcxC2CCAAQTAgEiABQQAQtgggACANIAEQsAggAEEgIAwgDyARQYDAAHMQtgggBygCPCEBDAELCwtBACELDAMLQT0hFgsQ2wQgFjYCAAtBfyELCyAHQcAAaiQAIAsLGQACQCAALQAAQSBxDQAgASACIAAQggUaCwt7AQV/QQAhAQJAIAAoAgAiAiwAAEFQaiIDQQlNDQBBAA8LA0BBfyEEAkAgAUHMmbPmAEsNAEF/IAMgAUEKbCIBaiADIAFB/////wdzSxshBAsgACACQQFqIgM2AgAgAiwAASEFIAQhASADIQIgBUFQaiIDQQpJDQALIAQLtgQAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgAUF3ag4SAAECBQMEBgcICQoLDA0ODxAREgsgAiACKAIAIgFBBGo2AgAgACABKAIANgIADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABMgEANwMADwsgAiACKAIAIgFBBGo2AgAgACABMwEANwMADwsgAiACKAIAIgFBBGo2AgAgACABMAAANwMADwsgAiACKAIAIgFBBGo2AgAgACABMQAANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKwMAOQMADwsgACACIAMRAgALCz4BAX8CQCAAUA0AA0AgAUF/aiIBIACnQQ9xQfDMBGotAAAgAnI6AAAgAEIPViEDIABCBIghACADDQALCyABCzYBAX8CQCAAUA0AA0AgAUF/aiIBIACnQQdxQTByOgAAIABCB1YhAiAAQgOIIQAgAg0ACwsgAQuKAQIBfgN/AkACQCAAQoCAgIAQWg0AIAAhAgwBCwNAIAFBf2oiASAAIABCCoAiAkIKfn2nQTByOgAAIABC/////58BViEDIAIhACADDQALCwJAIAJQDQAgAqchAwNAIAFBf2oiASADIANBCm4iBEEKbGtBMHI6AAAgA0EJSyEFIAQhAyAFDQALCyABC28BAX8jAEGAAmsiBSQAAkAgAiADTA0AIARBgMAEcQ0AIAUgASACIANrIgNBgAIgA0GAAkkiAhsQvwQaAkAgAg0AA0AgACAFQYACELAIIANBgH5qIgNB/wFLDQALCyAAIAUgAxCwCAsgBUGAAmokAAsRACAAIAEgAkGJAUGKARCuCAuTGQMSfwN+AXwjAEGwBGsiBiQAQQAhByAGQQA2AiwCQAJAIAEQuggiGEJ/VQ0AQQEhCEH6gAQhCSABmiIBELoIIRgMAQsCQCAEQYAQcUUNAEEBIQhB/YAEIQkMAQtBgIEEQfuABCAEQQFxIggbIQkgCEUhBwsCQAJAIBhCgICAgICAgPj/AINCgICAgICAgPj/AFINACAAQSAgAiAIQQNqIgogBEH//3txELYIIAAgCSAIELAIIABB0IMEQeqGBCAFQSBxIgsbQb+FBEGHhwQgCxsgASABYhtBAxCwCCAAQSAgAiAKIARBgMAAcxC2CCAKIAIgCiACShshDAwBCyAGQRBqIQ0CQAJAAkACQCABIAZBLGoQrQgiASABoCIBRAAAAAAAAAAAYQ0AIAYgBigCLCIKQX9qNgIsIAVBIHIiDkHhAEcNAQwDCyAFQSByIg5B4QBGDQJBBiADIANBAEgbIQ8gBigCLCEQDAELIAYgCkFjaiIQNgIsQQYgAyADQQBIGyEPIAFEAAAAAAAAsEGiIQELIAZBMGpBAEGgAiAQQQBIG2oiESELA0ACQAJAIAFEAAAAAAAA8EFjIAFEAAAAAAAAAABmcUUNACABqyEKDAELQQAhCgsgCyAKNgIAIAtBBGohCyABIAq4oUQAAAAAZc3NQaIiAUQAAAAAAAAAAGINAAsCQAJAIBBBAU4NACAQIQMgCyEKIBEhEgwBCyARIRIgECEDA0AgA0EdIANBHUkbIQMCQCALQXxqIgogEkkNACADrSEZQgAhGANAIAogCjUCACAZhiAYQv////8Pg3wiGiAaQoCU69wDgCIYQoCU69wDfn0+AgAgCkF8aiIKIBJPDQALIBpCgJTr3ANUDQAgEkF8aiISIBg+AgALAkADQCALIgogEk0NASAKQXxqIgsoAgBFDQALCyAGIAYoAiwgA2siAzYCLCAKIQsgA0EASg0ACwsCQCADQX9KDQAgD0EZakEJbkEBaiETIA5B5gBGIRQDQEEAIANrIgtBCSALQQlJGyEVAkACQCASIApJDQAgEigCAEVBAnQhCwwBC0GAlOvcAyAVdiEWQX8gFXRBf3MhF0EAIQMgEiELA0AgCyALKAIAIgwgFXYgA2o2AgAgDCAXcSAWbCEDIAtBBGoiCyAKSQ0ACyASKAIARUECdCELIANFDQAgCiADNgIAIApBBGohCgsgBiAGKAIsIBVqIgM2AiwgESASIAtqIhIgFBsiCyATQQJ0aiAKIAogC2tBAnUgE0obIQogA0EASA0ACwtBACEDAkAgEiAKTw0AIBEgEmtBAnVBCWwhA0EKIQsgEigCACIMQQpJDQADQCADQQFqIQMgDCALQQpsIgtPDQALCwJAIA9BACADIA5B5gBGG2sgD0EARyAOQecARnFrIgsgCiARa0ECdUEJbEF3ak4NACAGQTBqQYRgQaRiIBBBAEgbaiALQYDIAGoiDEEJbSIWQQJ0aiEVQQohCwJAIAwgFkEJbGsiDEEHSg0AA0AgC0EKbCELIAxBAWoiDEEIRw0ACwsgFUEEaiEXAkACQCAVKAIAIgwgDCALbiITIAtsayIWDQAgFyAKRg0BCwJAAkAgE0EBcQ0ARAAAAAAAAEBDIQEgC0GAlOvcA0cNASAVIBJNDQEgFUF8ai0AAEEBcUUNAQtEAQAAAAAAQEMhAQtEAAAAAAAA4D9EAAAAAAAA8D9EAAAAAAAA+D8gFyAKRhtEAAAAAAAA+D8gFiALQQF2IhdGGyAWIBdJGyEbAkAgBw0AIAktAABBLUcNACAbmiEbIAGaIQELIBUgDCAWayIMNgIAIAEgG6AgAWENACAVIAwgC2oiCzYCAAJAIAtBgJTr3ANJDQADQCAVQQA2AgACQCAVQXxqIhUgEk8NACASQXxqIhJBADYCAAsgFSAVKAIAQQFqIgs2AgAgC0H/k+vcA0sNAAsLIBEgEmtBAnVBCWwhA0EKIQsgEigCACIMQQpJDQADQCADQQFqIQMgDCALQQpsIgtPDQALCyAVQQRqIgsgCiAKIAtLGyEKCwJAA0AgCiILIBJNIgwNASALQXxqIgooAgBFDQALCwJAAkAgDkHnAEYNACAEQQhxIRUMAQsgA0F/c0F/IA9BASAPGyIKIANKIANBe0pxIhUbIApqIQ9Bf0F+IBUbIAVqIQUgBEEIcSIVDQBBdyEKAkAgDA0AIAtBfGooAgAiFUUNAEEKIQxBACEKIBVBCnANAANAIAoiFkEBaiEKIBUgDEEKbCIMcEUNAAsgFkF/cyEKCyALIBFrQQJ1QQlsIQwCQCAFQV9xQcYARw0AQQAhFSAPIAwgCmpBd2oiCkEAIApBAEobIgogDyAKSBshDwwBC0EAIRUgDyADIAxqIApqQXdqIgpBACAKQQBKGyIKIA8gCkgbIQ8LQX8hDCAPQf3///8HQf7///8HIA8gFXIiFhtKDQEgDyAWQQBHakEBaiEXAkACQCAFQV9xIhRBxgBHDQAgAyAXQf////8Hc0oNAyADQQAgA0EAShshCgwBCwJAIA0gAyADQR91IgpzIAprrSANELUIIgprQQFKDQADQCAKQX9qIgpBMDoAACANIAprQQJIDQALCyAKQX5qIhMgBToAAEF/IQwgCkF/akEtQSsgA0EASBs6AAAgDSATayIKIBdB/////wdzSg0CC0F/IQwgCiAXaiIKIAhB/////wdzSg0BIABBICACIAogCGoiFyAEELYIIAAgCSAIELAIIABBMCACIBcgBEGAgARzELYIAkACQAJAAkAgFEHGAEcNACAGQRBqQQlyIQMgESASIBIgEUsbIgwhEgNAIBI1AgAgAxC1CCEKAkACQCASIAxGDQAgCiAGQRBqTQ0BA0AgCkF/aiIKQTA6AAAgCiAGQRBqSw0ADAILAAsgCiADRw0AIApBf2oiCkEwOgAACyAAIAogAyAKaxCwCCASQQRqIhIgEU0NAAsCQCAWRQ0AIABBw4wEQQEQsAgLIBIgC08NASAPQQFIDQEDQAJAIBI1AgAgAxC1CCIKIAZBEGpNDQADQCAKQX9qIgpBMDoAACAKIAZBEGpLDQALCyAAIAogD0EJIA9BCUgbELAIIA9Bd2ohCiASQQRqIhIgC08NAyAPQQlKIQwgCiEPIAwNAAwDCwALAkAgD0EASA0AIAsgEkEEaiALIBJLGyEWIAZBEGpBCXIhAyASIQsDQAJAIAs1AgAgAxC1CCIKIANHDQAgCkF/aiIKQTA6AAALAkACQCALIBJGDQAgCiAGQRBqTQ0BA0AgCkF/aiIKQTA6AAAgCiAGQRBqSw0ADAILAAsgACAKQQEQsAggCkEBaiEKIA8gFXJFDQAgAEHDjARBARCwCAsgACAKIAMgCmsiDCAPIA8gDEobELAIIA8gDGshDyALQQRqIgsgFk8NASAPQX9KDQALCyAAQTAgD0ESakESQQAQtgggACATIA0gE2sQsAgMAgsgDyEKCyAAQTAgCkEJakEJQQAQtggLIABBICACIBcgBEGAwABzELYIIBcgAiAXIAJKGyEMDAELIAkgBUEadEEfdUEJcWohFwJAIANBC0sNAEEMIANrIQpEAAAAAAAAMEAhGwNAIBtEAAAAAAAAMECiIRsgCkF/aiIKDQALAkAgFy0AAEEtRw0AIBsgAZogG6GgmiEBDAELIAEgG6AgG6EhAQsCQCAGKAIsIgogCkEfdSIKcyAKa60gDRC1CCIKIA1HDQAgCkF/aiIKQTA6AAALIAhBAnIhFSAFQSBxIRIgBigCLCELIApBfmoiFiAFQQ9qOgAAIApBf2pBLUErIAtBAEgbOgAAIARBCHEhDCAGQRBqIQsDQCALIQoCQAJAIAGZRAAAAAAAAOBBY0UNACABqiELDAELQYCAgIB4IQsLIAogC0HwzARqLQAAIBJyOgAAIAEgC7ehRAAAAAAAADBAoiEBAkAgCkEBaiILIAZBEGprQQFHDQACQCAMDQAgA0EASg0AIAFEAAAAAAAAAABhDQELIApBLjoAASAKQQJqIQsLIAFEAAAAAAAAAABiDQALQX8hDEH9////ByAVIA0gFmsiEmoiE2sgA0gNACAAQSAgAiATIANBAmogCyAGQRBqayIKIApBfmogA0gbIAogAxsiA2oiCyAEELYIIAAgFyAVELAIIABBMCACIAsgBEGAgARzELYIIAAgBkEQaiAKELAIIABBMCADIAprQQBBABC2CCAAIBYgEhCwCCAAQSAgAiALIARBgMAAcxC2CCALIAIgCyACShshDAsgBkGwBGokACAMCy4BAX8gASABKAIAQQdqQXhxIgJBEGo2AgAgACACKQMAIAJBCGopAwAQmAg5AwALBQAgAL0LiAEBAn8jAEGgAWsiBCQAIAQgACAEQZ4BaiABGyIANgKUASAEQQAgAUF/aiIFIAUgAUsbNgKYASAEQQBBkAEQvwQiBEF/NgJMIARBiwE2AiQgBEF/NgJQIAQgBEGfAWo2AiwgBCAEQZQBajYCVCAAQQA6AAAgBCACIAMQtwghASAEQaABaiQAIAELsAEBBX8gACgCVCIDKAIAIQQCQCADKAIEIgUgACgCFCAAKAIcIgZrIgcgBSAHSRsiB0UNACAEIAYgBxDXBBogAyADKAIAIAdqIgQ2AgAgAyADKAIEIAdrIgU2AgQLAkAgBSACIAUgAkkbIgVFDQAgBCABIAUQ1wQaIAMgAygCACAFaiIENgIAIAMgAygCBCAFazYCBAsgBEEAOgAAIAAgACgCLCIDNgIcIAAgAzYCFCACCxcAIABBUGpBCkkgAEEgckGff2pBBklyCwcAIAAQvQgLCgAgAEFQakEKSQsHACAAEL8ICygBAX8jAEEQayIDJAAgAyACNgIMIAAgASACEJ8IIQIgA0EQaiQAIAILKgEBfyMAQRBrIgQkACAEIAM2AgwgACABIAIgAxC7CCEDIARBEGokACADC2MBA38jAEEQayIDJAAgAyACNgIMIAMgAjYCCEF/IQQCQEEAQQAgASACELsIIgJBAEgNACAAIAJBAWoiBRDdBCICNgIAIAJFDQAgAiAFIAEgAygCDBC7CCEECyADQRBqJAAgBAttAEG0xgUQxQgaAkADQCAAKAIAQQFHDQFBzMYFQbTGBRDGCBoMAAsACwJAIAAoAgANACAAEMcIQbTGBRDICBogASACEQQAQbTGBRDFCBogABDJCEG0xgUQyAgaQczGBRDKCBoPC0G0xgUQyAgaCwcAIAAQ8wQLCQAgACABEPUECwkAIABBATYCAAsHACAAEPQECwkAIABBfzYCAAsHACAAEPYECxIAAkAgABCnCEUNACAAEN8ECwsjAQJ/IAAhAQNAIAEiAkEEaiEBIAIoAgANAAsgAiAAa0ECdQsGAEGAzQQLBgBBkNkEC9UBAQR/IwBBEGsiBSQAQQAhBgJAIAEoAgAiB0UNACACRQ0AIANBACAAGyEIQQAhBgNAAkAgBUEMaiAAIAhBBEkbIAcoAgBBABC2ByIDQX9HDQBBfyEGDAILAkACQCAADQBBACEADAELAkAgCEEDSw0AIAggA0kNAyAAIAVBDGogAxDXBBoLIAggA2shCCAAIANqIQALAkAgBygCAA0AQQAhBwwCCyADIAZqIQYgB0EEaiEHIAJBf2oiAg0ACwsCQCAARQ0AIAEgBzYCAAsgBUEQaiQAIAYLgwkBBn8gASgCACEEAkACQAJAAkACQAJAAkACQAJAAkACQAJAIANFDQAgAygCACIFRQ0AAkAgAA0AIAIhAwwDCyADQQA2AgAgAiEDDAELAkACQBDTBCgCYCgCAA0AIABFDQEgAkUNDCACIQUCQANAIAQsAAAiA0UNASAAIANB/78DcTYCACAAQQRqIQAgBEEBaiEEIAVBf2oiBQ0ADA4LAAsgAEEANgIAIAFBADYCACACIAVrDwsgAiEDIABFDQMgAiEDQQAhBgwFCyAEENkEDwtBASEGDAMLQQAhBgwBC0EBIQYLA0ACQAJAIAYOAgABAQsgBC0AAEEDdiIGQXBqIAVBGnUgBmpyQQdLDQMgBEEBaiEGAkACQCAFQYCAgBBxDQAgBiEEDAELAkAgBi0AAEHAAXFBgAFGDQAgBEF/aiEEDAcLIARBAmohBgJAIAVBgIAgcQ0AIAYhBAwBCwJAIAYtAABBwAFxQYABRg0AIARBf2ohBAwHCyAEQQNqIQQLIANBf2ohA0EBIQYMAQsDQCAELQAAIQUCQCAEQQNxDQAgBUF/akH+AEsNACAEKAIAIgVB//37d2ogBXJBgIGChHhxDQADQCADQXxqIQMgBCgCBCEFIARBBGoiBiEEIAUgBUH//ft3anJBgIGChHhxRQ0ACyAGIQQLAkAgBUH/AXEiBkF/akH+AEsNACADQX9qIQMgBEEBaiEEDAELCyAGQb5+aiIGQTJLDQMgBEEBaiEEIAZBAnRBgMEEaigCACEFQQAhBgwACwALA0ACQAJAIAYOAgABAQsgA0UNBwJAA0ACQAJAAkAgBC0AACIGQX9qIgdB/gBNDQAgBiEFDAELIANBBUkNASAEQQNxDQECQANAIAQoAgAiBUH//ft3aiAFckGAgYKEeHENASAAIAVB/wFxNgIAIAAgBC0AATYCBCAAIAQtAAI2AgggACAELQADNgIMIABBEGohACAEQQRqIQQgA0F8aiIDQQRLDQALIAQtAAAhBQsgBUH/AXEiBkF/aiEHCyAHQf4ASw0CCyAAIAY2AgAgAEEEaiEAIARBAWohBCADQX9qIgNFDQkMAAsACyAGQb5+aiIGQTJLDQMgBEEBaiEEIAZBAnRBgMEEaigCACEFQQEhBgwBCyAELQAAIgdBA3YiBkFwaiAGIAVBGnVqckEHSw0BIARBAWohCAJAAkACQAJAIAdBgH9qIAVBBnRyIgZBf0wNACAIIQQMAQsgCC0AAEGAf2oiB0E/Sw0BIARBAmohCCAHIAZBBnQiCXIhBgJAIAlBf0wNACAIIQQMAQsgCC0AAEGAf2oiB0E/Sw0BIARBA2ohBCAHIAZBBnRyIQYLIAAgBjYCACADQX9qIQMgAEEEaiEADAELENsEQRk2AgAgBEF/aiEEDAULQQAhBgwACwALIARBf2ohBCAFDQEgBC0AACEFCyAFQf8BcQ0AAkAgAEUNACAAQQA2AgAgAUEANgIACyACIANrDwsQ2wRBGTYCACAARQ0BCyABIAQ2AgALQX8PCyABIAQ2AgAgAguUAwEHfyMAQZAIayIFJAAgBSABKAIAIgY2AgwgA0GAAiAAGyEDIAAgBUEQaiAAGyEHQQAhCAJAAkACQAJAIAZFDQAgA0UNAANAIAJBAnYhCQJAIAJBgwFLDQAgCSADTw0AIAYhCQwECyAHIAVBDGogCSADIAkgA0kbIAQQ0AghCiAFKAIMIQkCQCAKQX9HDQBBACEDQX8hCAwDCyADQQAgCiAHIAVBEGpGGyILayEDIAcgC0ECdGohByACIAZqIAlrQQAgCRshAiAKIAhqIQggCUUNAiAJIQYgAw0ADAILAAsgBiEJCyAJRQ0BCyADRQ0AIAJFDQAgCCEKA0ACQAJAAkAgByAJIAIgBBCxByIIQQJqQQJLDQACQAJAIAhBAWoOAgYAAQsgBUEANgIMDAILIARBADYCAAwBCyAFIAUoAgwgCGoiCTYCDCAKQQFqIQogA0F/aiIDDQELIAohCAwCCyAHQQRqIQcgAiAIayECIAohCCACDQALCwJAIABFDQAgASAFKAIMNgIACyAFQZAIaiQAIAgLEABBBEEBENMEKAJgKAIAGwsUAEEAIAAgASACQfzGBSACGxCxBwszAQJ/ENMEIgEoAmAhAgJAIABFDQAgAUGkqAUgACAAQX9GGzYCYAtBfyACIAJBpKgFRhsLLwACQCACRQ0AA0ACQCAAKAIAIAFHDQAgAA8LIABBBGohACACQX9qIgINAAsLQQALDQAgACABIAJCfxDXCAvABAIHfwR+IwBBEGsiBCQAAkACQAJAAkAgAkEkSg0AQQAhBSAALQAAIgYNASAAIQcMAgsQ2wRBHDYCAEIAIQMMAgsgACEHAkADQCAGwBDYCEUNASAHLQABIQYgB0EBaiIIIQcgBg0ACyAIIQcMAQsCQCAGQf8BcSIGQVVqDgMAAQABC0F/QQAgBkEtRhshBSAHQQFqIQcLAkACQCACQRByQRBHDQAgBy0AAEEwRw0AQQEhCQJAIActAAFB3wFxQdgARw0AIAdBAmohB0EQIQoMAgsgB0EBaiEHIAJBCCACGyEKDAELIAJBCiACGyEKQQAhCQsgCq0hC0EAIQJCACEMAkADQAJAIActAAAiCEFQaiIGQf8BcUEKSQ0AAkAgCEGff2pB/wFxQRlLDQAgCEGpf2ohBgwBCyAIQb9/akH/AXFBGUsNAiAIQUlqIQYLIAogBkH/AXFMDQEgBCALQgAgDEIAEIsIQQEhCAJAIAQpAwhCAFINACAMIAt+Ig0gBq1C/wGDIg5Cf4VWDQAgDSAOfCEMQQEhCSACIQgLIAdBAWohByAIIQIMAAsACwJAIAFFDQAgASAHIAAgCRs2AgALAkACQAJAIAJFDQAQ2wRBxAA2AgAgBUEAIANCAYMiC1AbIQUgAyEMDAELIAwgA1QNASADQgGDIQsLAkAgC6cNACAFDQAQ2wRBxAA2AgAgA0J/fCEDDAILIAwgA1gNABDbBEHEADYCAAwBCyAMIAWsIguFIAt9IQMLIARBEGokACADCxAAIABBIEYgAEF3akEFSXILFgAgACABIAJCgICAgICAgICAfxDXCAs1AgF/AX0jAEEQayICJAAgAiAAIAFBABDbCCACKQMAIAJBCGopAwAQlwghAyACQRBqJAAgAwuGAQIBfwJ+IwBBoAFrIgQkACAEIAE2AjwgBCABNgIUIARBfzYCGCAEQRBqQgAQ+gcgBCAEQRBqIANBARCQCCAEQQhqKQMAIQUgBCkDACEGAkAgAkUNACACIAEgBCgCFCAEKAI8a2ogBCgCiAFqNgIACyAAIAU3AwggACAGNwMAIARBoAFqJAALNQIBfwF8IwBBEGsiAiQAIAIgACABQQEQ2wggAikDACACQQhqKQMAEJgIIQMgAkEQaiQAIAMLPAIBfwF+IwBBEGsiAyQAIAMgASACQQIQ2wggAykDACEEIAAgA0EIaikDADcDCCAAIAQ3AwAgA0EQaiQACwkAIAAgARDaCAsJACAAIAEQ3AgLOgIBfwF+IwBBEGsiBCQAIAQgASACEN0IIAQpAwAhBSAAIARBCGopAwA3AwggACAFNwMAIARBEGokAAsHACAAEOIICwcAIAAQohELDwAgABDhCBogAEEIEKkRC2EBBH8gASAEIANraiEFAkACQANAIAMgBEYNAUF/IQYgASACRg0CIAEsAAAiByADLAAAIghIDQICQCAIIAdODQBBAQ8LIANBAWohAyABQQFqIQEMAAsACyAFIAJHIQYLIAYLDAAgACACIAMQ5ggaCy4BAX8jAEEQayIDJAAgACADQQ9qIANBDmoQlgciACABIAIQ5wggA0EQaiQAIAALEgAgACABIAIgASACEIQPEIUPC0IBAn9BACEDA38CQCABIAJHDQAgAw8LIANBBHQgASwAAGoiA0GAgICAf3EiBEEYdiAEciADcyEDIAFBAWohAQwACwsHACAAEOIICw8AIAAQ6QgaIABBCBCpEQtXAQN/AkACQANAIAMgBEYNAUF/IQUgASACRg0CIAEoAgAiBiADKAIAIgdIDQICQCAHIAZODQBBAQ8LIANBBGohAyABQQRqIQEMAAsACyABIAJHIQULIAULDAAgACACIAMQ7QgaCy4BAX8jAEEQayIDJAAgACADQQ9qIANBDmoQ7ggiACABIAIQ7wggA0EQaiQAIAALCgAgABCHDxCIDwsSACAAIAEgAiABIAIQiQ8Qig8LQgECf0EAIQMDfwJAIAEgAkcNACADDwsgASgCACADQQR0aiIDQYCAgIB/cSIEQRh2IARyIANzIQMgAUEEaiEBDAALC/UBAQF/IwBBIGsiBiQAIAYgATYCHAJAAkAgAxCmBUEBcQ0AIAZBfzYCACAAIAEgAiADIAQgBiAAKAIAKAIQEQcAIQECQAJAAkAgBigCAA4CAAECCyAFQQA6AAAMAwsgBUEBOgAADAILIAVBAToAACAEQQQ2AgAMAQsgBiADEJkHIAYQpwUhASAGEPIIGiAGIAMQmQcgBhDzCCEDIAYQ8ggaIAYgAxD0CCAGQQxyIAMQ9QggBSAGQRxqIAIgBiAGQRhqIgMgASAEQQEQ9gggBkY6AAAgBigCHCEBA0AgA0F0ahC6ESIDIAZHDQALCyAGQSBqJAAgAQsMACAAKAIAENMNIAALCwAgAEGYygUQ9wgLEQAgACABIAEoAgAoAhgRAgALEQAgACABIAEoAgAoAhwRAgALzgQBC38jAEGAAWsiByQAIAcgATYCfCACIAMQ+AghCCAHQYwBNgIQQQAhCSAHQQhqQQAgB0EQahD5CCEKIAdBEGohCwJAAkACQAJAIAhB5QBJDQAgCBDdBCILRQ0BIAogCxD6CAsgCyEMIAIhAQNAAkAgASADRw0AQQAhDQNAAkACQCAAIAdB/ABqEKgFDQAgCA0BCwJAIAAgB0H8AGoQqAVFDQAgBSAFKAIAQQJyNgIACwNAIAIgA0YNBiALLQAAQQJGDQcgC0EBaiELIAJBDGohAgwACwALIAAQqQUhDgJAIAYNACAEIA4Q+wghDgsgDUEBaiEPQQAhECALIQwgAiEBA0ACQCABIANHDQAgDyENIBBBAXFFDQIgABCrBRogDyENIAshDCACIQEgCSAIakECSQ0CA0ACQCABIANHDQAgDyENDAQLAkAgDC0AAEECRw0AIAEQlwYgD0YNACAMQQA6AAAgCUF/aiEJCyAMQQFqIQwgAUEMaiEBDAALAAsCQCAMLQAAQQFHDQAgASANEPwILAAAIRECQCAGDQAgBCAREPsIIRELAkACQCAOIBFHDQBBASEQIAEQlwYgD0cNAiAMQQI6AABBASEQIAlBAWohCQwBCyAMQQA6AAALIAhBf2ohCAsgDEEBaiEMIAFBDGohAQwACwALAAsgDEECQQEgARD9CCIRGzoAACAMQQFqIQwgAUEMaiEBIAkgEWohCSAIIBFrIQgMAAsACxCxEQALIAUgBSgCAEEEcjYCAAsgChD+CBogB0GAAWokACACCw8AIAAoAgAgARCMDRC0DQsJACAAIAEQhRELKwEBfyMAQRBrIgMkACADIAE2AgwgACADQQxqIAIQ/xAhASADQRBqJAAgAQstAQF/IAAQgBEoAgAhAiAAEIARIAE2AgACQCACRQ0AIAIgABCBESgCABEEAAsLEQAgACABIAAoAgAoAgwRAQALCgAgABCWBiABagsIACAAEJcGRQsLACAAQQAQ+gggAAsRACAAIAEgAiADIAQgBRCACQu6AwECfyMAQYACayIGJAAgBiACNgL4ASAGIAE2AvwBIAMQgQkhASAAIAMgBkHQAWoQggkhACAGQcQBaiADIAZB9wFqEIMJIAZBuAFqEIAGIQMgAyADEJgGEJkGIAYgA0EAEIQJIgI2ArQBIAYgBkEQajYCDCAGQQA2AggCQANAIAZB/AFqIAZB+AFqEKgFDQECQCAGKAK0ASACIAMQlwZqRw0AIAMQlwYhByADIAMQlwZBAXQQmQYgAyADEJgGEJkGIAYgByADQQAQhAkiAmo2ArQBCyAGQfwBahCpBSABIAIgBkG0AWogBkEIaiAGLAD3ASAGQcQBaiAGQRBqIAZBDGogABCFCQ0BIAZB/AFqEKsFGgwACwALAkAgBkHEAWoQlwZFDQAgBigCDCIAIAZBEGprQZ8BSg0AIAYgAEEEajYCDCAAIAYoAgg2AgALIAUgAiAGKAK0ASAEIAEQhgk2AgAgBkHEAWogBkEQaiAGKAIMIAQQhwkCQCAGQfwBaiAGQfgBahCoBUUNACAEIAQoAgBBAnI2AgALIAYoAvwBIQIgAxC6ERogBkHEAWoQuhEaIAZBgAJqJAAgAgszAAJAAkAgABCmBUHKAHEiAEUNAAJAIABBwABHDQBBCA8LIABBCEcNAUEQDwtBAA8LQQoLCwAgACABIAIQ0gkLQAEBfyMAQRBrIgMkACADQQxqIAEQmQcgAiADQQxqEPMIIgEQzgk6AAAgACABEM8JIANBDGoQ8ggaIANBEGokAAsKACAAEIYGIAFqC/sCAQR/IwBBEGsiCiQAIAogADoADwJAAkACQCADKAIAIgsgAkcNAEErIQwCQCAJLQAYIABB/wFxIg1GDQBBLSEMIAktABkgDUcNAQsgAyALQQFqNgIAIAsgDDoAAAwBCwJAIAYQlwZFDQAgACAFRw0AQQAhACAIKAIAIgkgB2tBnwFKDQIgBCgCACEAIAggCUEEajYCACAJIAA2AgAMAQtBfyEAIAkgCUEaaiAKQQ9qEKYJIAlrIglBF0oNAQJAAkACQCABQXhqDgMAAgABCyAJIAFIDQEMAwsgAUEQRw0AIAlBFkgNACADKAIAIgYgAkYNAiAGIAJrQQJKDQJBfyEAIAZBf2otAABBMEcNAkEAIQAgBEEANgIAIAMgBkEBajYCACAGIAlBoOUEai0AADoAAAwCCyADIAMoAgAiAEEBajYCACAAIAlBoOUEai0AADoAACAEIAQoAgBBAWo2AgBBACEADAELQQAhACAEQQA2AgALIApBEGokACAAC9EBAgN/AX4jAEEQayIEJAACQAJAAkACQAJAIAAgAUYNABDbBCIFKAIAIQYgBUEANgIAIAAgBEEMaiADEKQJEIYRIQcCQAJAIAUoAgAiAEUNACAEKAIMIAFHDQEgAEHEAEYNBQwECyAFIAY2AgAgBCgCDCABRg0DCyACQQQ2AgAMAQsgAkEENgIAC0EAIQEMAgsgBxCHEaxTDQAgBxC4BaxVDQAgB6chAQwBCyACQQQ2AgACQCAHQgFTDQAQuAUhAQwBCxCHESEBCyAEQRBqJAAgAQutAQECfyAAEJcGIQQCQCACIAFrQQVIDQAgBEUNACABIAIQ1wsgAkF8aiEEIAAQlgYiAiAAEJcGaiEFAkACQANAIAIsAAAhACABIARPDQECQCAAQQFIDQAgABDlCk4NACABKAIAIAIsAABHDQMLIAFBBGohASACIAUgAmtBAUpqIQIMAAsACyAAQQFIDQEgABDlCk4NASAEKAIAQX9qIAIsAABJDQELIANBBDYCAAsLEQAgACABIAIgAyAEIAUQiQkLugMBAn8jAEGAAmsiBiQAIAYgAjYC+AEgBiABNgL8ASADEIEJIQEgACADIAZB0AFqEIIJIQAgBkHEAWogAyAGQfcBahCDCSAGQbgBahCABiEDIAMgAxCYBhCZBiAGIANBABCECSICNgK0ASAGIAZBEGo2AgwgBkEANgIIAkADQCAGQfwBaiAGQfgBahCoBQ0BAkAgBigCtAEgAiADEJcGakcNACADEJcGIQcgAyADEJcGQQF0EJkGIAMgAxCYBhCZBiAGIAcgA0EAEIQJIgJqNgK0AQsgBkH8AWoQqQUgASACIAZBtAFqIAZBCGogBiwA9wEgBkHEAWogBkEQaiAGQQxqIAAQhQkNASAGQfwBahCrBRoMAAsACwJAIAZBxAFqEJcGRQ0AIAYoAgwiACAGQRBqa0GfAUoNACAGIABBBGo2AgwgACAGKAIINgIACyAFIAIgBigCtAEgBCABEIoJNwMAIAZBxAFqIAZBEGogBigCDCAEEIcJAkAgBkH8AWogBkH4AWoQqAVFDQAgBCAEKAIAQQJyNgIACyAGKAL8ASECIAMQuhEaIAZBxAFqELoRGiAGQYACaiQAIAILyAECA38BfiMAQRBrIgQkAAJAAkACQAJAAkAgACABRg0AENsEIgUoAgAhBiAFQQA2AgAgACAEQQxqIAMQpAkQhhEhBwJAAkAgBSgCACIARQ0AIAQoAgwgAUcNASAAQcQARg0FDAQLIAUgBjYCACAEKAIMIAFGDQMLIAJBBDYCAAwBCyACQQQ2AgALQgAhBwwCCyAHEIkRUw0AEIoRIAdZDQELIAJBBDYCAAJAIAdCAVMNABCKESEHDAELEIkRIQcLIARBEGokACAHCxEAIAAgASACIAMgBCAFEIwJC7oDAQJ/IwBBgAJrIgYkACAGIAI2AvgBIAYgATYC/AEgAxCBCSEBIAAgAyAGQdABahCCCSEAIAZBxAFqIAMgBkH3AWoQgwkgBkG4AWoQgAYhAyADIAMQmAYQmQYgBiADQQAQhAkiAjYCtAEgBiAGQRBqNgIMIAZBADYCCAJAA0AgBkH8AWogBkH4AWoQqAUNAQJAIAYoArQBIAIgAxCXBmpHDQAgAxCXBiEHIAMgAxCXBkEBdBCZBiADIAMQmAYQmQYgBiAHIANBABCECSICajYCtAELIAZB/AFqEKkFIAEgAiAGQbQBaiAGQQhqIAYsAPcBIAZBxAFqIAZBEGogBkEMaiAAEIUJDQEgBkH8AWoQqwUaDAALAAsCQCAGQcQBahCXBkUNACAGKAIMIgAgBkEQamtBnwFKDQAgBiAAQQRqNgIMIAAgBigCCDYCAAsgBSACIAYoArQBIAQgARCNCTsBACAGQcQBaiAGQRBqIAYoAgwgBBCHCQJAIAZB/AFqIAZB+AFqEKgFRQ0AIAQgBCgCAEECcjYCAAsgBigC/AEhAiADELoRGiAGQcQBahC6ERogBkGAAmokACACC/ABAgR/AX4jAEEQayIEJAACQAJAAkACQAJAAkAgACABRg0AAkAgAC0AACIFQS1HDQAgAEEBaiIAIAFHDQAgAkEENgIADAILENsEIgYoAgAhByAGQQA2AgAgACAEQQxqIAMQpAkQjREhCAJAAkAgBigCACIARQ0AIAQoAgwgAUcNASAAQcQARg0FDAQLIAYgBzYCACAEKAIMIAFGDQMLIAJBBDYCAAwBCyACQQQ2AgALQQAhAAwDCyAIEI4RrVgNAQsgAkEENgIAEI4RIQAMAQtBACAIpyIAayAAIAVBLUYbIQALIARBEGokACAAQf//A3ELEQAgACABIAIgAyAEIAUQjwkLugMBAn8jAEGAAmsiBiQAIAYgAjYC+AEgBiABNgL8ASADEIEJIQEgACADIAZB0AFqEIIJIQAgBkHEAWogAyAGQfcBahCDCSAGQbgBahCABiEDIAMgAxCYBhCZBiAGIANBABCECSICNgK0ASAGIAZBEGo2AgwgBkEANgIIAkADQCAGQfwBaiAGQfgBahCoBQ0BAkAgBigCtAEgAiADEJcGakcNACADEJcGIQcgAyADEJcGQQF0EJkGIAMgAxCYBhCZBiAGIAcgA0EAEIQJIgJqNgK0AQsgBkH8AWoQqQUgASACIAZBtAFqIAZBCGogBiwA9wEgBkHEAWogBkEQaiAGQQxqIAAQhQkNASAGQfwBahCrBRoMAAsACwJAIAZBxAFqEJcGRQ0AIAYoAgwiACAGQRBqa0GfAUoNACAGIABBBGo2AgwgACAGKAIINgIACyAFIAIgBigCtAEgBCABEJAJNgIAIAZBxAFqIAZBEGogBigCDCAEEIcJAkAgBkH8AWogBkH4AWoQqAVFDQAgBCAEKAIAQQJyNgIACyAGKAL8ASECIAMQuhEaIAZBxAFqELoRGiAGQYACaiQAIAIL6wECBH8BfiMAQRBrIgQkAAJAAkACQAJAAkACQCAAIAFGDQACQCAALQAAIgVBLUcNACAAQQFqIgAgAUcNACACQQQ2AgAMAgsQ2wQiBigCACEHIAZBADYCACAAIARBDGogAxCkCRCNESEIAkACQCAGKAIAIgBFDQAgBCgCDCABRw0BIABBxABGDQUMBAsgBiAHNgIAIAQoAgwgAUYNAwsgAkEENgIADAELIAJBBDYCAAtBACEADAMLIAgQpAytWA0BCyACQQQ2AgAQpAwhAAwBC0EAIAinIgBrIAAgBUEtRhshAAsgBEEQaiQAIAALEQAgACABIAIgAyAEIAUQkgkLugMBAn8jAEGAAmsiBiQAIAYgAjYC+AEgBiABNgL8ASADEIEJIQEgACADIAZB0AFqEIIJIQAgBkHEAWogAyAGQfcBahCDCSAGQbgBahCABiEDIAMgAxCYBhCZBiAGIANBABCECSICNgK0ASAGIAZBEGo2AgwgBkEANgIIAkADQCAGQfwBaiAGQfgBahCoBQ0BAkAgBigCtAEgAiADEJcGakcNACADEJcGIQcgAyADEJcGQQF0EJkGIAMgAxCYBhCZBiAGIAcgA0EAEIQJIgJqNgK0AQsgBkH8AWoQqQUgASACIAZBtAFqIAZBCGogBiwA9wEgBkHEAWogBkEQaiAGQQxqIAAQhQkNASAGQfwBahCrBRoMAAsACwJAIAZBxAFqEJcGRQ0AIAYoAgwiACAGQRBqa0GfAUoNACAGIABBBGo2AgwgACAGKAIINgIACyAFIAIgBigCtAEgBCABEJMJNgIAIAZBxAFqIAZBEGogBigCDCAEEIcJAkAgBkH8AWogBkH4AWoQqAVFDQAgBCAEKAIAQQJyNgIACyAGKAL8ASECIAMQuhEaIAZBxAFqELoRGiAGQYACaiQAIAIL6wECBH8BfiMAQRBrIgQkAAJAAkACQAJAAkACQCAAIAFGDQACQCAALQAAIgVBLUcNACAAQQFqIgAgAUcNACACQQQ2AgAMAgsQ2wQiBigCACEHIAZBADYCACAAIARBDGogAxCkCRCNESEIAkACQCAGKAIAIgBFDQAgBCgCDCABRw0BIABBxABGDQUMBAsgBiAHNgIAIAQoAgwgAUYNAwsgAkEENgIADAELIAJBBDYCAAtBACEADAMLIAgQgwetWA0BCyACQQQ2AgAQgwchAAwBC0EAIAinIgBrIAAgBUEtRhshAAsgBEEQaiQAIAALEQAgACABIAIgAyAEIAUQlQkLugMBAn8jAEGAAmsiBiQAIAYgAjYC+AEgBiABNgL8ASADEIEJIQEgACADIAZB0AFqEIIJIQAgBkHEAWogAyAGQfcBahCDCSAGQbgBahCABiEDIAMgAxCYBhCZBiAGIANBABCECSICNgK0ASAGIAZBEGo2AgwgBkEANgIIAkADQCAGQfwBaiAGQfgBahCoBQ0BAkAgBigCtAEgAiADEJcGakcNACADEJcGIQcgAyADEJcGQQF0EJkGIAMgAxCYBhCZBiAGIAcgA0EAEIQJIgJqNgK0AQsgBkH8AWoQqQUgASACIAZBtAFqIAZBCGogBiwA9wEgBkHEAWogBkEQaiAGQQxqIAAQhQkNASAGQfwBahCrBRoMAAsACwJAIAZBxAFqEJcGRQ0AIAYoAgwiACAGQRBqa0GfAUoNACAGIABBBGo2AgwgACAGKAIINgIACyAFIAIgBigCtAEgBCABEJYJNwMAIAZBxAFqIAZBEGogBigCDCAEEIcJAkAgBkH8AWogBkH4AWoQqAVFDQAgBCAEKAIAQQJyNgIACyAGKAL8ASECIAMQuhEaIAZBxAFqELoRGiAGQYACaiQAIAIL5wECBH8BfiMAQRBrIgQkAAJAAkACQAJAAkACQCAAIAFGDQACQCAALQAAIgVBLUcNACAAQQFqIgAgAUcNACACQQQ2AgAMAgsQ2wQiBigCACEHIAZBADYCACAAIARBDGogAxCkCRCNESEIAkACQCAGKAIAIgBFDQAgBCgCDCABRw0BIABBxABGDQUMBAsgBiAHNgIAIAQoAgwgAUYNAwsgAkEENgIADAELIAJBBDYCAAtCACEIDAMLEJARIAhaDQELIAJBBDYCABCQESEIDAELQgAgCH0gCCAFQS1GGyEICyAEQRBqJAAgCAsRACAAIAEgAiADIAQgBRCYCQvZAwEBfyMAQYACayIGJAAgBiACNgL4ASAGIAE2AvwBIAZBwAFqIAMgBkHQAWogBkHPAWogBkHOAWoQmQkgBkG0AWoQgAYhAiACIAIQmAYQmQYgBiACQQAQhAkiATYCsAEgBiAGQRBqNgIMIAZBADYCCCAGQQE6AAcgBkHFADoABgJAA0AgBkH8AWogBkH4AWoQqAUNAQJAIAYoArABIAEgAhCXBmpHDQAgAhCXBiEDIAIgAhCXBkEBdBCZBiACIAIQmAYQmQYgBiADIAJBABCECSIBajYCsAELIAZB/AFqEKkFIAZBB2ogBkEGaiABIAZBsAFqIAYsAM8BIAYsAM4BIAZBwAFqIAZBEGogBkEMaiAGQQhqIAZB0AFqEJoJDQEgBkH8AWoQqwUaDAALAAsCQCAGQcABahCXBkUNACAGLQAHQQFHDQAgBigCDCIDIAZBEGprQZ8BSg0AIAYgA0EEajYCDCADIAYoAgg2AgALIAUgASAGKAKwASAEEJsJOAIAIAZBwAFqIAZBEGogBigCDCAEEIcJAkAgBkH8AWogBkH4AWoQqAVFDQAgBCAEKAIAQQJyNgIACyAGKAL8ASEBIAIQuhEaIAZBwAFqELoRGiAGQYACaiQAIAELYAEBfyMAQRBrIgUkACAFQQxqIAEQmQcgBUEMahCnBUGg5QRBwOUEIAIQowkaIAMgBUEMahDzCCIBEM0JOgAAIAQgARDOCToAACAAIAEQzwkgBUEMahDyCBogBUEQaiQAC/kDAQF/IwBBEGsiDCQAIAwgADoADwJAAkAgACAFRw0AQX8hACABLQAAQQFHDQFBACEAIAFBADoAACAEIAQoAgAiC0EBajYCACALQS46AAAgBxCXBkUNASAJKAIAIgsgCGtBnwFKDQEgCigCACEFIAkgC0EEajYCACALIAU2AgAMAQsCQCAAIAZHDQAgBxCXBkUNAEF/IQAgAS0AAEEBRw0BQQAhACAJKAIAIgsgCGtBnwFKDQEgCigCACEAIAkgC0EEajYCACALIAA2AgBBACEAIApBADYCAAwBC0F/IQAgCyALQSBqIAxBD2oQ0AkgC2siC0EfSg0AIAtBoOUEaiwAACEFAkACQAJAAkAgC0F+cUFqag4DAQIAAgsCQCAEKAIAIgsgA0YNAEF/IQAgC0F/aiwAABCqCCACLAAAEKoIRw0ECyAEIAtBAWo2AgAgCyAFOgAAQQAhAAwDCyACQdAAOgAADAELIAUQqggiACACLAAARw0AIAIgABCrCDoAACABLQAAQQFHDQAgAUEAOgAAIAcQlwZFDQAgCSgCACIAIAhrQZ8BSg0AIAooAgAhASAJIABBBGo2AgAgACABNgIACyAEIAQoAgAiAEEBajYCACAAIAU6AABBACEAIAtBFUoNACAKIAooAgBBAWo2AgALIAxBEGokACAAC6QBAgN/An0jAEEQayIDJAACQAJAAkACQCAAIAFGDQAQ2wQiBCgCACEFIARBADYCACAAIANBDGoQkhEhBiAEKAIAIgBFDQFDAAAAACEHIAMoAgwgAUcNAiAGIQcgAEHEAEcNAwwCCyACQQQ2AgBDAAAAACEGDAILIAQgBTYCAEMAAAAAIQcgAygCDCABRg0BCyACQQQ2AgAgByEGCyADQRBqJAAgBgsRACAAIAEgAiADIAQgBRCdCQvZAwEBfyMAQYACayIGJAAgBiACNgL4ASAGIAE2AvwBIAZBwAFqIAMgBkHQAWogBkHPAWogBkHOAWoQmQkgBkG0AWoQgAYhAiACIAIQmAYQmQYgBiACQQAQhAkiATYCsAEgBiAGQRBqNgIMIAZBADYCCCAGQQE6AAcgBkHFADoABgJAA0AgBkH8AWogBkH4AWoQqAUNAQJAIAYoArABIAEgAhCXBmpHDQAgAhCXBiEDIAIgAhCXBkEBdBCZBiACIAIQmAYQmQYgBiADIAJBABCECSIBajYCsAELIAZB/AFqEKkFIAZBB2ogBkEGaiABIAZBsAFqIAYsAM8BIAYsAM4BIAZBwAFqIAZBEGogBkEMaiAGQQhqIAZB0AFqEJoJDQEgBkH8AWoQqwUaDAALAAsCQCAGQcABahCXBkUNACAGLQAHQQFHDQAgBigCDCIDIAZBEGprQZ8BSg0AIAYgA0EEajYCDCADIAYoAgg2AgALIAUgASAGKAKwASAEEJ4JOQMAIAZBwAFqIAZBEGogBigCDCAEEIcJAkAgBkH8AWogBkH4AWoQqAVFDQAgBCAEKAIAQQJyNgIACyAGKAL8ASEBIAIQuhEaIAZBwAFqELoRGiAGQYACaiQAIAELsAECA38CfCMAQRBrIgMkAAJAAkACQAJAIAAgAUYNABDbBCIEKAIAIQUgBEEANgIAIAAgA0EMahCTESEGIAQoAgAiAEUNAUQAAAAAAAAAACEHIAMoAgwgAUcNAiAGIQcgAEHEAEcNAwwCCyACQQQ2AgBEAAAAAAAAAAAhBgwCCyAEIAU2AgBEAAAAAAAAAAAhByADKAIMIAFGDQELIAJBBDYCACAHIQYLIANBEGokACAGCxEAIAAgASACIAMgBCAFEKAJC/MDAgF/AX4jAEGQAmsiBiQAIAYgAjYCiAIgBiABNgKMAiAGQdABaiADIAZB4AFqIAZB3wFqIAZB3gFqEJkJIAZBxAFqEIAGIQIgAiACEJgGEJkGIAYgAkEAEIQJIgE2AsABIAYgBkEgajYCHCAGQQA2AhggBkEBOgAXIAZBxQA6ABYCQANAIAZBjAJqIAZBiAJqEKgFDQECQCAGKALAASABIAIQlwZqRw0AIAIQlwYhAyACIAIQlwZBAXQQmQYgAiACEJgGEJkGIAYgAyACQQAQhAkiAWo2AsABCyAGQYwCahCpBSAGQRdqIAZBFmogASAGQcABaiAGLADfASAGLADeASAGQdABaiAGQSBqIAZBHGogBkEYaiAGQeABahCaCQ0BIAZBjAJqEKsFGgwACwALAkAgBkHQAWoQlwZFDQAgBi0AF0EBRw0AIAYoAhwiAyAGQSBqa0GfAUoNACAGIANBBGo2AhwgAyAGKAIYNgIACyAGIAEgBigCwAEgBBChCSAGKQMAIQcgBSAGQQhqKQMANwMIIAUgBzcDACAGQdABaiAGQSBqIAYoAhwgBBCHCQJAIAZBjAJqIAZBiAJqEKgFRQ0AIAQgBCgCAEECcjYCAAsgBigCjAIhASACELoRGiAGQdABahC6ERogBkGQAmokACABC88BAgN/BH4jAEEgayIEJAACQAJAAkACQCABIAJGDQAQ2wQiBSgCACEGIAVBADYCACAEQQhqIAEgBEEcahCUESAEQRBqKQMAIQcgBCkDCCEIIAUoAgAiAUUNAUIAIQlCACEKIAQoAhwgAkcNAiAIIQkgByEKIAFBxABHDQMMAgsgA0EENgIAQgAhCEIAIQcMAgsgBSAGNgIAQgAhCUIAIQogBCgCHCACRg0BCyADQQQ2AgAgCSEIIAohBwsgACAINwMAIAAgBzcDCCAEQSBqJAALoQMBAn8jAEGAAmsiBiQAIAYgAjYC+AEgBiABNgL8ASAGQcQBahCABiEHIAZBEGogAxCZByAGQRBqEKcFQaDlBEG65QQgBkHQAWoQowkaIAZBEGoQ8ggaIAZBuAFqEIAGIQIgAiACEJgGEJkGIAYgAkEAEIQJIgE2ArQBIAYgBkEQajYCDCAGQQA2AggCQANAIAZB/AFqIAZB+AFqEKgFDQECQCAGKAK0ASABIAIQlwZqRw0AIAIQlwYhAyACIAIQlwZBAXQQmQYgAiACEJgGEJkGIAYgAyACQQAQhAkiAWo2ArQBCyAGQfwBahCpBUEQIAEgBkG0AWogBkEIakEAIAcgBkEQaiAGQQxqIAZB0AFqEIUJDQEgBkH8AWoQqwUaDAALAAsgAiAGKAK0ASABaxCZBiACEJ0GIQEQpAkhAyAGIAU2AgACQCABIANBqoMEIAYQpQlBAUYNACAEQQQ2AgALAkAgBkH8AWogBkH4AWoQqAVFDQAgBCAEKAIAQQJyNgIACyAGKAL8ASEBIAIQuhEaIAcQuhEaIAZBgAJqJAAgAQsVACAAIAEgAiADIAAoAgAoAiARDAALPgEBfwJAQQAtAKTIBUUNAEEAKAKgyAUPC0H/////B0GLhwRBABCoCCEAQQBBAToApMgFQQAgADYCoMgFIAALRwEBfyMAQRBrIgQkACAEIAE2AgwgBCADNgIIIARBBGogBEEMahCnCSEDIAAgAiAEKAIIEJ8IIQEgAxCoCRogBEEQaiQAIAELMQEBfyMAQRBrIgMkACAAIAAQuAYgARC4BiACIANBD2oQ0wkQvwYhACADQRBqJAAgAAsRACAAIAEoAgAQ1Ag2AgAgAAsZAQF/AkAgACgCACIBRQ0AIAEQ1AgaCyAAC/UBAQF/IwBBIGsiBiQAIAYgATYCHAJAAkAgAxCmBUEBcQ0AIAZBfzYCACAAIAEgAiADIAQgBiAAKAIAKAIQEQcAIQECQAJAAkAgBigCAA4CAAECCyAFQQA6AAAMAwsgBUEBOgAADAILIAVBAToAACAEQQQ2AgAMAQsgBiADEJkHIAYQ5wUhASAGEPIIGiAGIAMQmQcgBhCqCSEDIAYQ8ggaIAYgAxCrCSAGQQxyIAMQrAkgBSAGQRxqIAIgBiAGQRhqIgMgASAEQQEQrQkgBkY6AAAgBigCHCEBA0AgA0F0ahDIESIDIAZHDQALCyAGQSBqJAAgAQsLACAAQaDKBRD3CAsRACAAIAEgASgCACgCGBECAAsRACAAIAEgASgCACgCHBECAAvOBAELfyMAQYABayIHJAAgByABNgJ8IAIgAxCuCSEIIAdBjAE2AhBBACEJIAdBCGpBACAHQRBqEPkIIQogB0EQaiELAkACQAJAAkAgCEHlAEkNACAIEN0EIgtFDQEgCiALEPoICyALIQwgAiEBA0ACQCABIANHDQBBACENA0ACQAJAIAAgB0H8AGoQ6AUNACAIDQELAkAgACAHQfwAahDoBUUNACAFIAUoAgBBAnI2AgALA0AgAiADRg0GIAstAABBAkYNByALQQFqIQsgAkEMaiECDAALAAsgABDpBSEOAkAgBg0AIAQgDhCvCSEOCyANQQFqIQ9BACEQIAshDCACIQEDQAJAIAEgA0cNACAPIQ0gEEEBcUUNAiAAEOsFGiAPIQ0gCyEMIAIhASAJIAhqQQJJDQIDQAJAIAEgA0cNACAPIQ0MBAsCQCAMLQAAQQJHDQAgARCwCSAPRg0AIAxBADoAACAJQX9qIQkLIAxBAWohDCABQQxqIQEMAAsACwJAIAwtAABBAUcNACABIA0QsQkoAgAhEQJAIAYNACAEIBEQrwkhEQsCQAJAIA4gEUcNAEEBIRAgARCwCSAPRw0CIAxBAjoAAEEBIRAgCUEBaiEJDAELIAxBADoAAAsgCEF/aiEICyAMQQFqIQwgAUEMaiEBDAALAAsACyAMQQJBASABELIJIhEbOgAAIAxBAWohDCABQQxqIQEgCSARaiEJIAggEWshCAwACwALELERAAsgBSAFKAIAQQRyNgIACyAKEP4IGiAHQYABaiQAIAILCQAgACABEJURCxEAIAAgASAAKAIAKAIcEQEACxgAAkAgABDBCkUNACAAEMIKDwsgABDDCgsNACAAEL8KIAFBAnRqCwgAIAAQsAlFCxEAIAAgASACIAMgBCAFELQJC7oDAQJ/IwBB0AJrIgYkACAGIAI2AsgCIAYgATYCzAIgAxCBCSEBIAAgAyAGQdABahC1CSEAIAZBxAFqIAMgBkHEAmoQtgkgBkG4AWoQgAYhAyADIAMQmAYQmQYgBiADQQAQhAkiAjYCtAEgBiAGQRBqNgIMIAZBADYCCAJAA0AgBkHMAmogBkHIAmoQ6AUNAQJAIAYoArQBIAIgAxCXBmpHDQAgAxCXBiEHIAMgAxCXBkEBdBCZBiADIAMQmAYQmQYgBiAHIANBABCECSICajYCtAELIAZBzAJqEOkFIAEgAiAGQbQBaiAGQQhqIAYoAsQCIAZBxAFqIAZBEGogBkEMaiAAELcJDQEgBkHMAmoQ6wUaDAALAAsCQCAGQcQBahCXBkUNACAGKAIMIgAgBkEQamtBnwFKDQAgBiAAQQRqNgIMIAAgBigCCDYCAAsgBSACIAYoArQBIAQgARCGCTYCACAGQcQBaiAGQRBqIAYoAgwgBBCHCQJAIAZBzAJqIAZByAJqEOgFRQ0AIAQgBCgCAEECcjYCAAsgBigCzAIhAiADELoRGiAGQcQBahC6ERogBkHQAmokACACCwsAIAAgASACENkJC0ABAX8jAEEQayIDJAAgA0EMaiABEJkHIAIgA0EMahCqCSIBENUJNgIAIAAgARDWCSADQQxqEPIIGiADQRBqJAAL+QIBA38jAEEQayIKJAAgCiAANgIMAkACQAJAIAMoAgAiCyACRw0AQSshDAJAIAkoAmAgAEYNAEEtIQwgCSgCZCAARw0BCyADIAtBAWo2AgAgCyAMOgAADAELAkAgBhCXBkUNACAAIAVHDQBBACEAIAgoAgAiCSAHa0GfAUoNAiAEKAIAIQAgCCAJQQRqNgIAIAkgADYCAAwBC0F/IQAgCSAJQegAaiAKQQxqEMwJIAlrQQJ1IglBF0oNAQJAAkACQCABQXhqDgMAAgABCyAJIAFIDQEMAwsgAUEQRw0AIAlBFkgNACADKAIAIgYgAkYNAiAGIAJrQQJKDQJBfyEAIAZBf2otAABBMEcNAkEAIQAgBEEANgIAIAMgBkEBajYCACAGIAlBoOUEai0AADoAAAwCCyADIAMoAgAiAEEBajYCACAAIAlBoOUEai0AADoAACAEIAQoAgBBAWo2AgBBACEADAELQQAhACAEQQA2AgALIApBEGokACAACxEAIAAgASACIAMgBCAFELkJC7oDAQJ/IwBB0AJrIgYkACAGIAI2AsgCIAYgATYCzAIgAxCBCSEBIAAgAyAGQdABahC1CSEAIAZBxAFqIAMgBkHEAmoQtgkgBkG4AWoQgAYhAyADIAMQmAYQmQYgBiADQQAQhAkiAjYCtAEgBiAGQRBqNgIMIAZBADYCCAJAA0AgBkHMAmogBkHIAmoQ6AUNAQJAIAYoArQBIAIgAxCXBmpHDQAgAxCXBiEHIAMgAxCXBkEBdBCZBiADIAMQmAYQmQYgBiAHIANBABCECSICajYCtAELIAZBzAJqEOkFIAEgAiAGQbQBaiAGQQhqIAYoAsQCIAZBxAFqIAZBEGogBkEMaiAAELcJDQEgBkHMAmoQ6wUaDAALAAsCQCAGQcQBahCXBkUNACAGKAIMIgAgBkEQamtBnwFKDQAgBiAAQQRqNgIMIAAgBigCCDYCAAsgBSACIAYoArQBIAQgARCKCTcDACAGQcQBaiAGQRBqIAYoAgwgBBCHCQJAIAZBzAJqIAZByAJqEOgFRQ0AIAQgBCgCAEECcjYCAAsgBigCzAIhAiADELoRGiAGQcQBahC6ERogBkHQAmokACACCxEAIAAgASACIAMgBCAFELsJC7oDAQJ/IwBB0AJrIgYkACAGIAI2AsgCIAYgATYCzAIgAxCBCSEBIAAgAyAGQdABahC1CSEAIAZBxAFqIAMgBkHEAmoQtgkgBkG4AWoQgAYhAyADIAMQmAYQmQYgBiADQQAQhAkiAjYCtAEgBiAGQRBqNgIMIAZBADYCCAJAA0AgBkHMAmogBkHIAmoQ6AUNAQJAIAYoArQBIAIgAxCXBmpHDQAgAxCXBiEHIAMgAxCXBkEBdBCZBiADIAMQmAYQmQYgBiAHIANBABCECSICajYCtAELIAZBzAJqEOkFIAEgAiAGQbQBaiAGQQhqIAYoAsQCIAZBxAFqIAZBEGogBkEMaiAAELcJDQEgBkHMAmoQ6wUaDAALAAsCQCAGQcQBahCXBkUNACAGKAIMIgAgBkEQamtBnwFKDQAgBiAAQQRqNgIMIAAgBigCCDYCAAsgBSACIAYoArQBIAQgARCNCTsBACAGQcQBaiAGQRBqIAYoAgwgBBCHCQJAIAZBzAJqIAZByAJqEOgFRQ0AIAQgBCgCAEECcjYCAAsgBigCzAIhAiADELoRGiAGQcQBahC6ERogBkHQAmokACACCxEAIAAgASACIAMgBCAFEL0JC7oDAQJ/IwBB0AJrIgYkACAGIAI2AsgCIAYgATYCzAIgAxCBCSEBIAAgAyAGQdABahC1CSEAIAZBxAFqIAMgBkHEAmoQtgkgBkG4AWoQgAYhAyADIAMQmAYQmQYgBiADQQAQhAkiAjYCtAEgBiAGQRBqNgIMIAZBADYCCAJAA0AgBkHMAmogBkHIAmoQ6AUNAQJAIAYoArQBIAIgAxCXBmpHDQAgAxCXBiEHIAMgAxCXBkEBdBCZBiADIAMQmAYQmQYgBiAHIANBABCECSICajYCtAELIAZBzAJqEOkFIAEgAiAGQbQBaiAGQQhqIAYoAsQCIAZBxAFqIAZBEGogBkEMaiAAELcJDQEgBkHMAmoQ6wUaDAALAAsCQCAGQcQBahCXBkUNACAGKAIMIgAgBkEQamtBnwFKDQAgBiAAQQRqNgIMIAAgBigCCDYCAAsgBSACIAYoArQBIAQgARCQCTYCACAGQcQBaiAGQRBqIAYoAgwgBBCHCQJAIAZBzAJqIAZByAJqEOgFRQ0AIAQgBCgCAEECcjYCAAsgBigCzAIhAiADELoRGiAGQcQBahC6ERogBkHQAmokACACCxEAIAAgASACIAMgBCAFEL8JC7oDAQJ/IwBB0AJrIgYkACAGIAI2AsgCIAYgATYCzAIgAxCBCSEBIAAgAyAGQdABahC1CSEAIAZBxAFqIAMgBkHEAmoQtgkgBkG4AWoQgAYhAyADIAMQmAYQmQYgBiADQQAQhAkiAjYCtAEgBiAGQRBqNgIMIAZBADYCCAJAA0AgBkHMAmogBkHIAmoQ6AUNAQJAIAYoArQBIAIgAxCXBmpHDQAgAxCXBiEHIAMgAxCXBkEBdBCZBiADIAMQmAYQmQYgBiAHIANBABCECSICajYCtAELIAZBzAJqEOkFIAEgAiAGQbQBaiAGQQhqIAYoAsQCIAZBxAFqIAZBEGogBkEMaiAAELcJDQEgBkHMAmoQ6wUaDAALAAsCQCAGQcQBahCXBkUNACAGKAIMIgAgBkEQamtBnwFKDQAgBiAAQQRqNgIMIAAgBigCCDYCAAsgBSACIAYoArQBIAQgARCTCTYCACAGQcQBaiAGQRBqIAYoAgwgBBCHCQJAIAZBzAJqIAZByAJqEOgFRQ0AIAQgBCgCAEECcjYCAAsgBigCzAIhAiADELoRGiAGQcQBahC6ERogBkHQAmokACACCxEAIAAgASACIAMgBCAFEMEJC7oDAQJ/IwBB0AJrIgYkACAGIAI2AsgCIAYgATYCzAIgAxCBCSEBIAAgAyAGQdABahC1CSEAIAZBxAFqIAMgBkHEAmoQtgkgBkG4AWoQgAYhAyADIAMQmAYQmQYgBiADQQAQhAkiAjYCtAEgBiAGQRBqNgIMIAZBADYCCAJAA0AgBkHMAmogBkHIAmoQ6AUNAQJAIAYoArQBIAIgAxCXBmpHDQAgAxCXBiEHIAMgAxCXBkEBdBCZBiADIAMQmAYQmQYgBiAHIANBABCECSICajYCtAELIAZBzAJqEOkFIAEgAiAGQbQBaiAGQQhqIAYoAsQCIAZBxAFqIAZBEGogBkEMaiAAELcJDQEgBkHMAmoQ6wUaDAALAAsCQCAGQcQBahCXBkUNACAGKAIMIgAgBkEQamtBnwFKDQAgBiAAQQRqNgIMIAAgBigCCDYCAAsgBSACIAYoArQBIAQgARCWCTcDACAGQcQBaiAGQRBqIAYoAgwgBBCHCQJAIAZBzAJqIAZByAJqEOgFRQ0AIAQgBCgCAEECcjYCAAsgBigCzAIhAiADELoRGiAGQcQBahC6ERogBkHQAmokACACCxEAIAAgASACIAMgBCAFEMMJC9kDAQF/IwBB8AJrIgYkACAGIAI2AugCIAYgATYC7AIgBkHMAWogAyAGQeABaiAGQdwBaiAGQdgBahDECSAGQcABahCABiECIAIgAhCYBhCZBiAGIAJBABCECSIBNgK8ASAGIAZBEGo2AgwgBkEANgIIIAZBAToAByAGQcUAOgAGAkADQCAGQewCaiAGQegCahDoBQ0BAkAgBigCvAEgASACEJcGakcNACACEJcGIQMgAiACEJcGQQF0EJkGIAIgAhCYBhCZBiAGIAMgAkEAEIQJIgFqNgK8AQsgBkHsAmoQ6QUgBkEHaiAGQQZqIAEgBkG8AWogBigC3AEgBigC2AEgBkHMAWogBkEQaiAGQQxqIAZBCGogBkHgAWoQxQkNASAGQewCahDrBRoMAAsACwJAIAZBzAFqEJcGRQ0AIAYtAAdBAUcNACAGKAIMIgMgBkEQamtBnwFKDQAgBiADQQRqNgIMIAMgBigCCDYCAAsgBSABIAYoArwBIAQQmwk4AgAgBkHMAWogBkEQaiAGKAIMIAQQhwkCQCAGQewCaiAGQegCahDoBUUNACAEIAQoAgBBAnI2AgALIAYoAuwCIQEgAhC6ERogBkHMAWoQuhEaIAZB8AJqJAAgAQtgAQF/IwBBEGsiBSQAIAVBDGogARCZByAFQQxqEOcFQaDlBEHA5QQgAhDLCRogAyAFQQxqEKoJIgEQ1Ak2AgAgBCABENUJNgIAIAAgARDWCSAFQQxqEPIIGiAFQRBqJAALgwQBAX8jAEEQayIMJAAgDCAANgIMAkACQCAAIAVHDQBBfyEAIAEtAABBAUcNAUEAIQAgAUEAOgAAIAQgBCgCACILQQFqNgIAIAtBLjoAACAHEJcGRQ0BIAkoAgAiCyAIa0GfAUoNASAKKAIAIQUgCSALQQRqNgIAIAsgBTYCAAwBCwJAIAAgBkcNACAHEJcGRQ0AQX8hACABLQAAQQFHDQFBACEAIAkoAgAiCyAIa0GfAUoNASAKKAIAIQAgCSALQQRqNgIAIAsgADYCAEEAIQAgCkEANgIADAELQX8hACALIAtBgAFqIAxBDGoQ1wkgC2siBUECdSILQR9KDQAgC0Gg5QRqLAAAIQYCQAJAAkAgBUF7cSIAQdgARg0AIABB4ABHDQECQCAEKAIAIgsgA0YNAEF/IQAgC0F/aiwAABCqCCACLAAAEKoIRw0ECyAEIAtBAWo2AgAgCyAGOgAAQQAhAAwDCyACQdAAOgAADAELIAYQqggiACACLAAARw0AIAIgABCrCDoAACABLQAAQQFHDQAgAUEAOgAAIAcQlwZFDQAgCSgCACIAIAhrQZ8BSg0AIAooAgAhBSAJIABBBGo2AgAgACAFNgIACyAEIAQoAgAiAEEBajYCACAAIAY6AABBACEAIAtBFUoNACAKIAooAgBBAWo2AgALIAxBEGokACAACxEAIAAgASACIAMgBCAFEMcJC9kDAQF/IwBB8AJrIgYkACAGIAI2AugCIAYgATYC7AIgBkHMAWogAyAGQeABaiAGQdwBaiAGQdgBahDECSAGQcABahCABiECIAIgAhCYBhCZBiAGIAJBABCECSIBNgK8ASAGIAZBEGo2AgwgBkEANgIIIAZBAToAByAGQcUAOgAGAkADQCAGQewCaiAGQegCahDoBQ0BAkAgBigCvAEgASACEJcGakcNACACEJcGIQMgAiACEJcGQQF0EJkGIAIgAhCYBhCZBiAGIAMgAkEAEIQJIgFqNgK8AQsgBkHsAmoQ6QUgBkEHaiAGQQZqIAEgBkG8AWogBigC3AEgBigC2AEgBkHMAWogBkEQaiAGQQxqIAZBCGogBkHgAWoQxQkNASAGQewCahDrBRoMAAsACwJAIAZBzAFqEJcGRQ0AIAYtAAdBAUcNACAGKAIMIgMgBkEQamtBnwFKDQAgBiADQQRqNgIMIAMgBigCCDYCAAsgBSABIAYoArwBIAQQngk5AwAgBkHMAWogBkEQaiAGKAIMIAQQhwkCQCAGQewCaiAGQegCahDoBUUNACAEIAQoAgBBAnI2AgALIAYoAuwCIQEgAhC6ERogBkHMAWoQuhEaIAZB8AJqJAAgAQsRACAAIAEgAiADIAQgBRDJCQvzAwIBfwF+IwBBgANrIgYkACAGIAI2AvgCIAYgATYC/AIgBkHcAWogAyAGQfABaiAGQewBaiAGQegBahDECSAGQdABahCABiECIAIgAhCYBhCZBiAGIAJBABCECSIBNgLMASAGIAZBIGo2AhwgBkEANgIYIAZBAToAFyAGQcUAOgAWAkADQCAGQfwCaiAGQfgCahDoBQ0BAkAgBigCzAEgASACEJcGakcNACACEJcGIQMgAiACEJcGQQF0EJkGIAIgAhCYBhCZBiAGIAMgAkEAEIQJIgFqNgLMAQsgBkH8AmoQ6QUgBkEXaiAGQRZqIAEgBkHMAWogBigC7AEgBigC6AEgBkHcAWogBkEgaiAGQRxqIAZBGGogBkHwAWoQxQkNASAGQfwCahDrBRoMAAsACwJAIAZB3AFqEJcGRQ0AIAYtABdBAUcNACAGKAIcIgMgBkEgamtBnwFKDQAgBiADQQRqNgIcIAMgBigCGDYCAAsgBiABIAYoAswBIAQQoQkgBikDACEHIAUgBkEIaikDADcDCCAFIAc3AwAgBkHcAWogBkEgaiAGKAIcIAQQhwkCQCAGQfwCaiAGQfgCahDoBUUNACAEIAQoAgBBAnI2AgALIAYoAvwCIQEgAhC6ERogBkHcAWoQuhEaIAZBgANqJAAgAQuhAwECfyMAQcACayIGJAAgBiACNgK4AiAGIAE2ArwCIAZBxAFqEIAGIQcgBkEQaiADEJkHIAZBEGoQ5wVBoOUEQbrlBCAGQdABahDLCRogBkEQahDyCBogBkG4AWoQgAYhAiACIAIQmAYQmQYgBiACQQAQhAkiATYCtAEgBiAGQRBqNgIMIAZBADYCCAJAA0AgBkG8AmogBkG4AmoQ6AUNAQJAIAYoArQBIAEgAhCXBmpHDQAgAhCXBiEDIAIgAhCXBkEBdBCZBiACIAIQmAYQmQYgBiADIAJBABCECSIBajYCtAELIAZBvAJqEOkFQRAgASAGQbQBaiAGQQhqQQAgByAGQRBqIAZBDGogBkHQAWoQtwkNASAGQbwCahDrBRoMAAsACyACIAYoArQBIAFrEJkGIAIQnQYhARCkCSEDIAYgBTYCAAJAIAEgA0GqgwQgBhClCUEBRg0AIARBBDYCAAsCQCAGQbwCaiAGQbgCahDoBUUNACAEIAQoAgBBAnI2AgALIAYoArwCIQEgAhC6ERogBxC6ERogBkHAAmokACABCxUAIAAgASACIAMgACgCACgCMBEMAAsxAQF/IwBBEGsiAyQAIAAgABDRBiABENEGIAIgA0EPahDaCRDZBiEAIANBEGokACAACw8AIAAgACgCACgCDBEAAAsPACAAIAAoAgAoAhARAAALEQAgACABIAEoAgAoAhQRAgALMQEBfyMAQRBrIgMkACAAIAAQrQYgARCtBiACIANBD2oQ0QkQsAYhACADQRBqJAAgAAsYACAAIAIsAAAgASAAaxCnDyIAIAEgABsLBgBBoOUECxgAIAAgAiwAACABIABrEKgPIgAgASAAGwsPACAAIAAoAgAoAgwRAAALDwAgACAAKAIAKAIQEQAACxEAIAAgASABKAIAKAIUEQIACzEBAX8jAEEQayIDJAAgACAAEMYGIAEQxgYgAiADQQ9qENgJEMkGIQAgA0EQaiQAIAALGwAgACACKAIAIAEgAGtBAnUQqQ8iACABIAAbCz8BAX8jAEEQayIDJAAgA0EMaiABEJkHIANBDGoQ5wVBoOUEQbrlBCACEMsJGiADQQxqEPIIGiADQRBqJAAgAgsbACAAIAIoAgAgASAAa0ECdRCqDyIAIAEgABsL9QEBAX8jAEEgayIFJAAgBSABNgIcAkACQCACEKYFQQFxDQAgACABIAIgAyAEIAAoAgAoAhgRCgAhAgwBCyAFQRBqIAIQmQcgBUEQahDzCCECIAVBEGoQ8ggaAkACQCAERQ0AIAVBEGogAhD0CAwBCyAFQRBqIAIQ9QgLIAUgBUEQahDcCTYCDANAIAUgBUEQahDdCTYCCAJAIAVBDGogBUEIahDeCQ0AIAUoAhwhAiAFQRBqELoRGgwCCyAFQQxqEN8JLAAAIQIgBUEcahDDBSACEMQFGiAFQQxqEOAJGiAFQRxqEMUFGgwACwALIAVBIGokACACCwwAIAAgABCGBhDhCQsSACAAIAAQhgYgABCXBmoQ4QkLDAAgACABEOIJQQFzCwcAIAAoAgALEQAgACAAKAIAQQFqNgIAIAALJQEBfyMAQRBrIgIkACACQQxqIAEQqw8oAgAhASACQRBqJAAgAQsNACAAEMwLIAEQzAtGCxMAIAAgASACIAMgBEH8gwQQ5AkLswEBAX8jAEHAAGsiBiQAIAZCJTcDOCAGQThqQQFyIAVBASACEKYFEOUJEKQJIQUgBiAENgIAIAZBK2ogBkEraiAGQStqQQ0gBSAGQThqIAYQ5glqIgUgAhDnCSEEIAZBBGogAhCZByAGQStqIAQgBSAGQRBqIAZBDGogBkEIaiAGQQRqEOgJIAZBBGoQ8ggaIAEgBkEQaiAGKAIMIAYoAgggAiADEOkJIQIgBkHAAGokACACC8MBAQF/AkAgA0GAEHFFDQAgA0HKAHEiBEEIRg0AIARBwABGDQAgAkUNACAAQSs6AAAgAEEBaiEACwJAIANBgARxRQ0AIABBIzoAACAAQQFqIQALAkADQCABLQAAIgRFDQEgACAEOgAAIABBAWohACABQQFqIQEMAAsACwJAAkAgA0HKAHEiAUHAAEcNAEHvACEBDAELAkAgAUEIRw0AQdgAQfgAIANBgIABcRshAQwBC0HkAEH1ACACGyEBCyAAIAE6AAALSQEBfyMAQRBrIgUkACAFIAI2AgwgBSAENgIIIAVBBGogBUEMahCnCSEEIAAgASADIAUoAggQuwghAiAEEKgJGiAFQRBqJAAgAgtmAAJAIAIQpgVBsAFxIgJBIEcNACABDwsCQCACQRBHDQACQAJAIAAtAAAiAkFVag4DAAEAAQsgAEEBag8LIAEgAGtBAkgNACACQTBHDQAgAC0AAUEgckH4AEcNACAAQQJqIQALIAAL8AMBCH8jAEEQayIHJAAgBhCnBSEIIAdBBGogBhDzCCIGEM8JAkACQCAHQQRqEP0IRQ0AIAggACACIAMQowkaIAUgAyACIABraiIGNgIADAELIAUgAzYCACAAIQkCQAJAIAAtAAAiCkFVag4DAAEAAQsgCCAKwBCSByEKIAUgBSgCACILQQFqNgIAIAsgCjoAACAAQQFqIQkLAkAgAiAJa0ECSA0AIAktAABBMEcNACAJLQABQSByQfgARw0AIAhBMBCSByEKIAUgBSgCACILQQFqNgIAIAsgCjoAACAIIAksAAEQkgchCiAFIAUoAgAiC0EBajYCACALIAo6AAAgCUECaiEJCyAJIAIQnQpBACEKIAYQzgkhDEEAIQsgCSEGA0ACQCAGIAJJDQAgAyAJIABraiAFKAIAEJ0KIAUoAgAhBgwCCwJAIAdBBGogCxCECS0AAEUNACAKIAdBBGogCxCECSwAAEcNACAFIAUoAgAiCkEBajYCACAKIAw6AAAgCyALIAdBBGoQlwZBf2pJaiELQQAhCgsgCCAGLAAAEJIHIQ0gBSAFKAIAIg5BAWo2AgAgDiANOgAAIAZBAWohBiAKQQFqIQoMAAsACyAEIAYgAyABIABraiABIAJGGzYCACAHQQRqELoRGiAHQRBqJAALwgEBBH8jAEEQayIGJAACQAJAIAANAEEAIQcMAQsgBBD8CSEIQQAhBwJAIAIgAWsiCUEBSA0AIAAgASAJEMcFIAlHDQELAkAgCCADIAFrIgdrQQAgCCAHShsiAUEBSA0AIAAgBkEEaiABIAUQ/QkiBxCDBiABEMcFIQggBxC6ERpBACEHIAggAUcNAQsCQCADIAJrIgFBAUgNAEEAIQcgACACIAEQxwUgAUcNAQsgBEEAEP4JGiAAIQcLIAZBEGokACAHCxMAIAAgASACIAMgBEH1gwQQ6wkLuQEBAn8jAEHwAGsiBiQAIAZCJTcDaCAGQegAakEBciAFQQEgAhCmBRDlCRCkCSEFIAYgBDcDACAGQdAAaiAGQdAAaiAGQdAAakEYIAUgBkHoAGogBhDmCWoiBSACEOcJIQcgBkEUaiACEJkHIAZB0ABqIAcgBSAGQSBqIAZBHGogBkEYaiAGQRRqEOgJIAZBFGoQ8ggaIAEgBkEgaiAGKAIcIAYoAhggAiADEOkJIQIgBkHwAGokACACCxMAIAAgASACIAMgBEH8gwQQ7QkLswEBAX8jAEHAAGsiBiQAIAZCJTcDOCAGQThqQQFyIAVBACACEKYFEOUJEKQJIQUgBiAENgIAIAZBK2ogBkEraiAGQStqQQ0gBSAGQThqIAYQ5glqIgUgAhDnCSEEIAZBBGogAhCZByAGQStqIAQgBSAGQRBqIAZBDGogBkEIaiAGQQRqEOgJIAZBBGoQ8ggaIAEgBkEQaiAGKAIMIAYoAgggAiADEOkJIQIgBkHAAGokACACCxMAIAAgASACIAMgBEH1gwQQ7wkLuQEBAn8jAEHwAGsiBiQAIAZCJTcDaCAGQegAakEBciAFQQAgAhCmBRDlCRCkCSEFIAYgBDcDACAGQdAAaiAGQdAAaiAGQdAAakEYIAUgBkHoAGogBhDmCWoiBSACEOcJIQcgBkEUaiACEJkHIAZB0ABqIAcgBSAGQSBqIAZBHGogBkEYaiAGQRRqEOgJIAZBFGoQ8ggaIAEgBkEgaiAGKAIcIAYoAhggAiADEOkJIQIgBkHwAGokACACCxMAIAAgASACIAMgBEGqjQQQ8QkLhwQBBn8jAEHQAWsiBiQAIAZCJTcDyAEgBkHIAWpBAXIgBSACEKYFEPIJIQcgBiAGQaABajYCnAEQpAkhBQJAAkAgB0UNACACEPMJIQggBiAEOQMoIAYgCDYCICAGQaABakEeIAUgBkHIAWogBkEgahDmCSEFDAELIAYgBDkDMCAGQaABakEeIAUgBkHIAWogBkEwahDmCSEFCyAGQYwBNgJQIAZBlAFqQQAgBkHQAGoQ9AkhCSAGQaABaiEIAkACQCAFQR5IDQAQpAkhBQJAAkAgB0UNACACEPMJIQggBiAEOQMIIAYgCDYCACAGQZwBaiAFIAZByAFqIAYQ9QkhBQwBCyAGIAQ5AxAgBkGcAWogBSAGQcgBaiAGQRBqEPUJIQULIAVBf0YNASAJIAYoApwBEPYJIAYoApwBIQgLIAggCCAFaiIKIAIQ5wkhCyAGQYwBNgJQIAZByABqQQAgBkHQAGoQ9AkhCAJAAkAgBigCnAEiByAGQaABakcNACAGQdAAaiEFDAELIAVBAXQQ3QQiBUUNASAIIAUQ9gkgBigCnAEhBwsgBkE8aiACEJkHIAcgCyAKIAUgBkHEAGogBkHAAGogBkE8ahD3CSAGQTxqEPIIGiABIAUgBigCRCAGKAJAIAIgAxDpCSECIAgQ+AkaIAkQ+AkaIAZB0AFqJAAgAg8LELERAAvsAQECfwJAIAJBgBBxRQ0AIABBKzoAACAAQQFqIQALAkAgAkGACHFFDQAgAEEjOgAAIABBAWohAAsCQCACQYQCcSIDQYQCRg0AIABBrtQAOwAAIABBAmohAAsgAkGAgAFxIQQCQANAIAEtAAAiAkUNASAAIAI6AAAgAEEBaiEAIAFBAWohAQwACwALAkACQAJAIANBgAJGDQAgA0EERw0BQcYAQeYAIAQbIQEMAgtBxQBB5QAgBBshAQwBCwJAIANBhAJHDQBBwQBB4QAgBBshAQwBC0HHAEHnACAEGyEBCyAAIAE6AAAgA0GEAkcLBwAgACgCCAsrAQF/IwBBEGsiAyQAIAMgATYCDCAAIANBDGogAhCeCyEBIANBEGokACABC0cBAX8jAEEQayIEJAAgBCABNgIMIAQgAzYCCCAEQQRqIARBDGoQpwkhAyAAIAIgBCgCCBDDCCEBIAMQqAkaIARBEGokACABCy0BAX8gABCvCygCACECIAAQrwsgATYCAAJAIAJFDQAgAiAAELALKAIAEQQACwvVBQEKfyMAQRBrIgckACAGEKcFIQggB0EEaiAGEPMIIgkQzwkgBSADNgIAIAAhCgJAAkAgAC0AACIGQVVqDgMAAQABCyAIIAbAEJIHIQYgBSAFKAIAIgtBAWo2AgAgCyAGOgAAIABBAWohCgsgCiEGAkACQCACIAprQQFMDQAgCiEGIAotAABBMEcNACAKIQYgCi0AAUEgckH4AEcNACAIQTAQkgchBiAFIAUoAgAiC0EBajYCACALIAY6AAAgCCAKLAABEJIHIQYgBSAFKAIAIgtBAWo2AgAgCyAGOgAAIApBAmoiCiEGA0AgBiACTw0CIAYsAAAQpAkQvghFDQIgBkEBaiEGDAALAAsDQCAGIAJPDQEgBiwAABCkCRDACEUNASAGQQFqIQYMAAsACwJAAkAgB0EEahD9CEUNACAIIAogBiAFKAIAEKMJGiAFIAUoAgAgBiAKa2o2AgAMAQsgCiAGEJ0KQQAhDCAJEM4JIQ1BACEOIAohCwNAAkAgCyAGSQ0AIAMgCiAAa2ogBSgCABCdCgwCCwJAIAdBBGogDhCECSwAAEEBSA0AIAwgB0EEaiAOEIQJLAAARw0AIAUgBSgCACIMQQFqNgIAIAwgDToAACAOIA4gB0EEahCXBkF/aklqIQ5BACEMCyAIIAssAAAQkgchDyAFIAUoAgAiEEEBajYCACAQIA86AAAgC0EBaiELIAxBAWohDAwACwALA0ACQAJAAkAgBiACSQ0AIAYhCwwBCyAGQQFqIQsgBiwAACIGQS5HDQEgCRDNCSEGIAUgBSgCACIMQQFqNgIAIAwgBjoAAAsgCCALIAIgBSgCABCjCRogBSAFKAIAIAIgC2tqIgY2AgAgBCAGIAMgASAAa2ogASACRhs2AgAgB0EEahC6ERogB0EQaiQADwsgCCAGEJIHIQYgBSAFKAIAIgxBAWo2AgAgDCAGOgAAIAshBgwACwALCwAgAEEAEPYJIAALFQAgACABIAIgAyAEIAVB+YYEEPoJC7AEAQZ/IwBBgAJrIgckACAHQiU3A/gBIAdB+AFqQQFyIAYgAhCmBRDyCSEIIAcgB0HQAWo2AswBEKQJIQYCQAJAIAhFDQAgAhDzCSEJIAdBwABqIAU3AwAgByAENwM4IAcgCTYCMCAHQdABakEeIAYgB0H4AWogB0EwahDmCSEGDAELIAcgBDcDUCAHIAU3A1ggB0HQAWpBHiAGIAdB+AFqIAdB0ABqEOYJIQYLIAdBjAE2AoABIAdBxAFqQQAgB0GAAWoQ9AkhCiAHQdABaiEJAkACQCAGQR5IDQAQpAkhBgJAAkAgCEUNACACEPMJIQkgB0EQaiAFNwMAIAcgBDcDCCAHIAk2AgAgB0HMAWogBiAHQfgBaiAHEPUJIQYMAQsgByAENwMgIAcgBTcDKCAHQcwBaiAGIAdB+AFqIAdBIGoQ9QkhBgsgBkF/Rg0BIAogBygCzAEQ9gkgBygCzAEhCQsgCSAJIAZqIgsgAhDnCSEMIAdBjAE2AoABIAdB+ABqQQAgB0GAAWoQ9AkhCQJAAkAgBygCzAEiCCAHQdABakcNACAHQYABaiEGDAELIAZBAXQQ3QQiBkUNASAJIAYQ9gkgBygCzAEhCAsgB0HsAGogAhCZByAIIAwgCyAGIAdB9ABqIAdB8ABqIAdB7ABqEPcJIAdB7ABqEPIIGiABIAYgBygCdCAHKAJwIAIgAxDpCSECIAkQ+AkaIAoQ+AkaIAdBgAJqJAAgAg8LELERAAuwAQEEfyMAQeAAayIFJAAQpAkhBiAFIAQ2AgAgBUHAAGogBUHAAGogBUHAAGpBFCAGQaqDBCAFEOYJIgdqIgQgAhDnCSEGIAVBEGogAhCZByAFQRBqEKcFIQggBUEQahDyCBogCCAFQcAAaiAEIAVBEGoQowkaIAEgBUEQaiAHIAVBEGpqIgcgBUEQaiAGIAVBwABqa2ogBiAERhsgByACIAMQ6QkhAiAFQeAAaiQAIAILBwAgACgCDAsuAQF/IwBBEGsiAyQAIAAgA0EPaiADQQ5qEJYHIgAgASACEMIRIANBEGokACAACxQBAX8gACgCDCECIAAgATYCDCACC/UBAQF/IwBBIGsiBSQAIAUgATYCHAJAAkAgAhCmBUEBcQ0AIAAgASACIAMgBCAAKAIAKAIYEQoAIQIMAQsgBUEQaiACEJkHIAVBEGoQqgkhAiAFQRBqEPIIGgJAAkAgBEUNACAFQRBqIAIQqwkMAQsgBUEQaiACEKwJCyAFIAVBEGoQgAo2AgwDQCAFIAVBEGoQgQo2AggCQCAFQQxqIAVBCGoQggoNACAFKAIcIQIgBUEQahDIERoMAgsgBUEMahCDCigCACECIAVBHGoQ/AUgAhD9BRogBUEMahCEChogBUEcahD+BRoMAAsACyAFQSBqJAAgAgsMACAAIAAQhQoQhgoLFQAgACAAEIUKIAAQsAlBAnRqEIYKCwwAIAAgARCHCkEBcwsHACAAKAIACxEAIAAgACgCAEEEajYCACAACxgAAkAgABDBCkUNACAAEO4LDwsgABDxCwslAQF/IwBBEGsiAiQAIAJBDGogARCsDygCACEBIAJBEGokACABCw0AIAAQkAwgARCQDEYLEwAgACABIAIgAyAEQfyDBBCJCgu6AQEBfyMAQZABayIGJAAgBkIlNwOIASAGQYgBakEBciAFQQEgAhCmBRDlCRCkCSEFIAYgBDYCACAGQfsAaiAGQfsAaiAGQfsAakENIAUgBkGIAWogBhDmCWoiBSACEOcJIQQgBkEEaiACEJkHIAZB+wBqIAQgBSAGQRBqIAZBDGogBkEIaiAGQQRqEIoKIAZBBGoQ8ggaIAEgBkEQaiAGKAIMIAYoAgggAiADEIsKIQIgBkGQAWokACACC/kDAQh/IwBBEGsiByQAIAYQ5wUhCCAHQQRqIAYQqgkiBhDWCQJAAkAgB0EEahD9CEUNACAIIAAgAiADEMsJGiAFIAMgAiAAa0ECdGoiBjYCAAwBCyAFIAM2AgAgACEJAkACQCAALQAAIgpBVWoOAwABAAELIAggCsAQlAchCiAFIAUoAgAiC0EEajYCACALIAo2AgAgAEEBaiEJCwJAIAIgCWtBAkgNACAJLQAAQTBHDQAgCS0AAUEgckH4AEcNACAIQTAQlAchCiAFIAUoAgAiC0EEajYCACALIAo2AgAgCCAJLAABEJQHIQogBSAFKAIAIgtBBGo2AgAgCyAKNgIAIAlBAmohCQsgCSACEJ0KQQAhCiAGENUJIQxBACELIAkhBgNAAkAgBiACSQ0AIAMgCSAAa0ECdGogBSgCABCfCiAFKAIAIQYMAgsCQCAHQQRqIAsQhAktAABFDQAgCiAHQQRqIAsQhAksAABHDQAgBSAFKAIAIgpBBGo2AgAgCiAMNgIAIAsgCyAHQQRqEJcGQX9qSWohC0EAIQoLIAggBiwAABCUByENIAUgBSgCACIOQQRqNgIAIA4gDTYCACAGQQFqIQYgCkEBaiEKDAALAAsgBCAGIAMgASAAa0ECdGogASACRhs2AgAgB0EEahC6ERogB0EQaiQAC8sBAQR/IwBBEGsiBiQAAkACQCAADQBBACEHDAELIAQQ/AkhCEEAIQcCQCACIAFrQQJ1IglBAUgNACAAIAEgCRD/BSAJRw0BCwJAIAggAyABa0ECdSIHa0EAIAggB0obIgFBAUgNACAAIAZBBGogASAFEJsKIgcQnAogARD/BSEIIAcQyBEaQQAhByAIIAFHDQELAkAgAyACa0ECdSIBQQFIDQBBACEHIAAgAiABEP8FIAFHDQELIARBABD+CRogACEHCyAGQRBqJAAgBwsTACAAIAEgAiADIARB9YMEEI0KC7oBAQJ/IwBBgAJrIgYkACAGQiU3A/gBIAZB+AFqQQFyIAVBASACEKYFEOUJEKQJIQUgBiAENwMAIAZB4AFqIAZB4AFqIAZB4AFqQRggBSAGQfgBaiAGEOYJaiIFIAIQ5wkhByAGQRRqIAIQmQcgBkHgAWogByAFIAZBIGogBkEcaiAGQRhqIAZBFGoQigogBkEUahDyCBogASAGQSBqIAYoAhwgBigCGCACIAMQiwohAiAGQYACaiQAIAILEwAgACABIAIgAyAEQfyDBBCPCgu6AQEBfyMAQZABayIGJAAgBkIlNwOIASAGQYgBakEBciAFQQAgAhCmBRDlCRCkCSEFIAYgBDYCACAGQfsAaiAGQfsAaiAGQfsAakENIAUgBkGIAWogBhDmCWoiBSACEOcJIQQgBkEEaiACEJkHIAZB+wBqIAQgBSAGQRBqIAZBDGogBkEIaiAGQQRqEIoKIAZBBGoQ8ggaIAEgBkEQaiAGKAIMIAYoAgggAiADEIsKIQIgBkGQAWokACACCxMAIAAgASACIAMgBEH1gwQQkQoLugEBAn8jAEGAAmsiBiQAIAZCJTcD+AEgBkH4AWpBAXIgBUEAIAIQpgUQ5QkQpAkhBSAGIAQ3AwAgBkHgAWogBkHgAWogBkHgAWpBGCAFIAZB+AFqIAYQ5glqIgUgAhDnCSEHIAZBFGogAhCZByAGQeABaiAHIAUgBkEgaiAGQRxqIAZBGGogBkEUahCKCiAGQRRqEPIIGiABIAZBIGogBigCHCAGKAIYIAIgAxCLCiECIAZBgAJqJAAgAgsTACAAIAEgAiADIARBqo0EEJMKC4cEAQZ/IwBB8AJrIgYkACAGQiU3A+gCIAZB6AJqQQFyIAUgAhCmBRDyCSEHIAYgBkHAAmo2ArwCEKQJIQUCQAJAIAdFDQAgAhDzCSEIIAYgBDkDKCAGIAg2AiAgBkHAAmpBHiAFIAZB6AJqIAZBIGoQ5gkhBQwBCyAGIAQ5AzAgBkHAAmpBHiAFIAZB6AJqIAZBMGoQ5gkhBQsgBkGMATYCUCAGQbQCakEAIAZB0ABqEPQJIQkgBkHAAmohCAJAAkAgBUEeSA0AEKQJIQUCQAJAIAdFDQAgAhDzCSEIIAYgBDkDCCAGIAg2AgAgBkG8AmogBSAGQegCaiAGEPUJIQUMAQsgBiAEOQMQIAZBvAJqIAUgBkHoAmogBkEQahD1CSEFCyAFQX9GDQEgCSAGKAK8AhD2CSAGKAK8AiEICyAIIAggBWoiCiACEOcJIQsgBkGMATYCUCAGQcgAakEAIAZB0ABqEJQKIQgCQAJAIAYoArwCIgcgBkHAAmpHDQAgBkHQAGohBQwBCyAFQQN0EN0EIgVFDQEgCCAFEJUKIAYoArwCIQcLIAZBPGogAhCZByAHIAsgCiAFIAZBxABqIAZBwABqIAZBPGoQlgogBkE8ahDyCBogASAFIAYoAkQgBigCQCACIAMQiwohAiAIEJcKGiAJEPgJGiAGQfACaiQAIAIPCxCxEQALKwEBfyMAQRBrIgMkACADIAE2AgwgACADQQxqIAIQ3QshASADQRBqJAAgAQstAQF/IAAQqgwoAgAhAiAAEKoMIAE2AgACQCACRQ0AIAIgABCrDCgCABEEAAsL5QUBCn8jAEEQayIHJAAgBhDnBSEIIAdBBGogBhCqCSIJENYJIAUgAzYCACAAIQoCQAJAIAAtAAAiBkFVag4DAAEAAQsgCCAGwBCUByEGIAUgBSgCACILQQRqNgIAIAsgBjYCACAAQQFqIQoLIAohBgJAAkAgAiAKa0EBTA0AIAohBiAKLQAAQTBHDQAgCiEGIAotAAFBIHJB+ABHDQAgCEEwEJQHIQYgBSAFKAIAIgtBBGo2AgAgCyAGNgIAIAggCiwAARCUByEGIAUgBSgCACILQQRqNgIAIAsgBjYCACAKQQJqIgohBgNAIAYgAk8NAiAGLAAAEKQJEL4IRQ0CIAZBAWohBgwACwALA0AgBiACTw0BIAYsAAAQpAkQwAhFDQEgBkEBaiEGDAALAAsCQAJAIAdBBGoQ/QhFDQAgCCAKIAYgBSgCABDLCRogBSAFKAIAIAYgCmtBAnRqNgIADAELIAogBhCdCkEAIQwgCRDVCSENQQAhDiAKIQsDQAJAIAsgBkkNACADIAogAGtBAnRqIAUoAgAQnwoMAgsCQCAHQQRqIA4QhAksAABBAUgNACAMIAdBBGogDhCECSwAAEcNACAFIAUoAgAiDEEEajYCACAMIA02AgAgDiAOIAdBBGoQlwZBf2pJaiEOQQAhDAsgCCALLAAAEJQHIQ8gBSAFKAIAIhBBBGo2AgAgECAPNgIAIAtBAWohCyAMQQFqIQwMAAsACwJAAkADQCAGIAJPDQEgBkEBaiELAkAgBiwAACIGQS5GDQAgCCAGEJQHIQYgBSAFKAIAIgxBBGo2AgAgDCAGNgIAIAshBgwBCwsgCRDUCSEGIAUgBSgCACIOQQRqIgw2AgAgDiAGNgIADAELIAUoAgAhDCAGIQsLIAggCyACIAwQywkaIAUgBSgCACACIAtrQQJ0aiIGNgIAIAQgBiADIAEgAGtBAnRqIAEgAkYbNgIAIAdBBGoQuhEaIAdBEGokAAsLACAAQQAQlQogAAsVACAAIAEgAiADIAQgBUH5hgQQmQoLsAQBBn8jAEGgA2siByQAIAdCJTcDmAMgB0GYA2pBAXIgBiACEKYFEPIJIQggByAHQfACajYC7AIQpAkhBgJAAkAgCEUNACACEPMJIQkgB0HAAGogBTcDACAHIAQ3AzggByAJNgIwIAdB8AJqQR4gBiAHQZgDaiAHQTBqEOYJIQYMAQsgByAENwNQIAcgBTcDWCAHQfACakEeIAYgB0GYA2ogB0HQAGoQ5gkhBgsgB0GMATYCgAEgB0HkAmpBACAHQYABahD0CSEKIAdB8AJqIQkCQAJAIAZBHkgNABCkCSEGAkACQCAIRQ0AIAIQ8wkhCSAHQRBqIAU3AwAgByAENwMIIAcgCTYCACAHQewCaiAGIAdBmANqIAcQ9QkhBgwBCyAHIAQ3AyAgByAFNwMoIAdB7AJqIAYgB0GYA2ogB0EgahD1CSEGCyAGQX9GDQEgCiAHKALsAhD2CSAHKALsAiEJCyAJIAkgBmoiCyACEOcJIQwgB0GMATYCgAEgB0H4AGpBACAHQYABahCUCiEJAkACQCAHKALsAiIIIAdB8AJqRw0AIAdBgAFqIQYMAQsgBkEDdBDdBCIGRQ0BIAkgBhCVCiAHKALsAiEICyAHQewAaiACEJkHIAggDCALIAYgB0H0AGogB0HwAGogB0HsAGoQlgogB0HsAGoQ8ggaIAEgBiAHKAJ0IAcoAnAgAiADEIsKIQIgCRCXChogChD4CRogB0GgA2okACACDwsQsREAC7YBAQR/IwBB0AFrIgUkABCkCSEGIAUgBDYCACAFQbABaiAFQbABaiAFQbABakEUIAZBqoMEIAUQ5gkiB2oiBCACEOcJIQYgBUEQaiACEJkHIAVBEGoQ5wUhCCAFQRBqEPIIGiAIIAVBsAFqIAQgBUEQahDLCRogASAFQRBqIAVBEGogB0ECdGoiByAFQRBqIAYgBUGwAWprQQJ0aiAGIARGGyAHIAIgAxCLCiECIAVB0AFqJAAgAgsuAQF/IwBBEGsiAyQAIAAgA0EPaiADQQ5qEO4IIgAgASACENARIANBEGokACAACwoAIAAQhQoQ2AYLCQAgACABEJ4KCwkAIAAgARCtDwsJACAAIAEQoAoLCQAgACABELAPC+gDAQR/IwBBEGsiCCQAIAggAjYCCCAIIAE2AgwgCEEEaiADEJkHIAhBBGoQpwUhAiAIQQRqEPIIGiAEQQA2AgBBACEBAkADQCAGIAdGDQEgAQ0BAkAgCEEMaiAIQQhqEKgFDQACQAJAIAIgBiwAAEEAEKIKQSVHDQAgBkEBaiIBIAdGDQJBACEJAkACQCACIAEsAABBABCiCiIBQcUARg0AQQEhCiABQf8BcUEwRg0AIAEhCwwBCyAGQQJqIgkgB0YNA0ECIQogAiAJLAAAQQAQogohCyABIQkLIAggACAIKAIMIAgoAgggAyAEIAUgCyAJIAAoAgAoAiQRDQA2AgwgBiAKakEBaiEGDAELAkAgAkEBIAYsAAAQqgVFDQACQANAIAZBAWoiBiAHRg0BIAJBASAGLAAAEKoFDQALCwNAIAhBDGogCEEIahCoBQ0CIAJBASAIQQxqEKkFEKoFRQ0CIAhBDGoQqwUaDAALAAsCQCACIAhBDGoQqQUQ+wggAiAGLAAAEPsIRw0AIAZBAWohBiAIQQxqEKsFGgwBCyAEQQQ2AgALIAQoAgAhAQwBCwsgBEEENgIACwJAIAhBDGogCEEIahCoBUUNACAEIAQoAgBBAnI2AgALIAgoAgwhBiAIQRBqJAAgBgsTACAAIAEgAiAAKAIAKAIkEQMACwQAQQILQQEBfyMAQRBrIgYkACAGQqWQ6anSyc6S0wA3AwggACABIAIgAyAEIAUgBkEIaiAGQRBqEKEKIQUgBkEQaiQAIAULMwEBfyAAIAEgAiADIAQgBSAAQQhqIAAoAggoAhQRAAAiBhCWBiAGEJYGIAYQlwZqEKEKC1YBAX8jAEEQayIGJAAgBiABNgIMIAZBCGogAxCZByAGQQhqEKcFIQEgBkEIahDyCBogACAFQRhqIAZBDGogAiAEIAEQpwogBigCDCEBIAZBEGokACABC0IAAkAgAiADIABBCGogACgCCCgCABEAACIAIABBqAFqIAUgBEEAEPYIIABrIgBBpwFKDQAgASAAQQxtQQdvNgIACwtWAQF/IwBBEGsiBiQAIAYgATYCDCAGQQhqIAMQmQcgBkEIahCnBSEBIAZBCGoQ8ggaIAAgBUEQaiAGQQxqIAIgBCABEKkKIAYoAgwhASAGQRBqJAAgAQtCAAJAIAIgAyAAQQhqIAAoAggoAgQRAAAiACAAQaACaiAFIARBABD2CCAAayIAQZ8CSg0AIAEgAEEMbUEMbzYCAAsLVgEBfyMAQRBrIgYkACAGIAE2AgwgBkEIaiADEJkHIAZBCGoQpwUhASAGQQhqEPIIGiAAIAVBFGogBkEMaiACIAQgARCrCiAGKAIMIQEgBkEQaiQAIAELQwAgAiADIAQgBUEEEKwKIQUCQCAELQAAQQRxDQAgASAFQdAPaiAFQewOaiAFIAVB5ABJGyAFQcUASBtBlHFqNgIACwvJAQEDfyMAQRBrIgUkACAFIAE2AgxBACEBQQYhBgJAAkAgACAFQQxqEKgFDQBBBCEGIANBwAAgABCpBSIHEKoFRQ0AIAMgB0EAEKIKIQECQANAIAAQqwUaIAFBUGohASAAIAVBDGoQqAUNASAEQQJIDQEgA0HAACAAEKkFIgYQqgVFDQMgBEF/aiEEIAFBCmwgAyAGQQAQogpqIQEMAAsAC0ECIQYgACAFQQxqEKgFRQ0BCyACIAIoAgAgBnI2AgALIAVBEGokACABC7cHAQJ/IwBBEGsiCCQAIAggATYCDCAEQQA2AgAgCCADEJkHIAgQpwUhCSAIEPIIGgJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQCAGQb9/ag45AAEXBBcFFwYHFxcXChcXFxcODxAXFxcTFRcXFxcXFxcAAQIDAxcXARcIFxcJCxcMFw0XCxcXERIUFgsgACAFQRhqIAhBDGogAiAEIAkQpwoMGAsgACAFQRBqIAhBDGogAiAEIAkQqQoMFwsgAEEIaiAAKAIIKAIMEQAAIQEgCCAAIAgoAgwgAiADIAQgBSABEJYGIAEQlgYgARCXBmoQoQo2AgwMFgsgACAFQQxqIAhBDGogAiAEIAkQrgoMFQsgCEKl2r2pwuzLkvkANwMAIAggACABIAIgAyAEIAUgCCAIQQhqEKEKNgIMDBQLIAhCpbK1qdKty5LkADcDACAIIAAgASACIAMgBCAFIAggCEEIahChCjYCDAwTCyAAIAVBCGogCEEMaiACIAQgCRCvCgwSCyAAIAVBCGogCEEMaiACIAQgCRCwCgwRCyAAIAVBHGogCEEMaiACIAQgCRCxCgwQCyAAIAVBEGogCEEMaiACIAQgCRCyCgwPCyAAIAVBBGogCEEMaiACIAQgCRCzCgwOCyAAIAhBDGogAiAEIAkQtAoMDQsgACAFQQhqIAhBDGogAiAEIAkQtQoMDAsgCEEAKADI5QQ2AAcgCEEAKQDB5QQ3AwAgCCAAIAEgAiADIAQgBSAIIAhBC2oQoQo2AgwMCwsgCEEEakEALQDQ5QQ6AAAgCEEAKADM5QQ2AgAgCCAAIAEgAiADIAQgBSAIIAhBBWoQoQo2AgwMCgsgACAFIAhBDGogAiAEIAkQtgoMCQsgCEKlkOmp0snOktMANwMAIAggACABIAIgAyAEIAUgCCAIQQhqEKEKNgIMDAgLIAAgBUEYaiAIQQxqIAIgBCAJELcKDAcLIAAgASACIAMgBCAFIAAoAgAoAhQRBwAhBAwHCyAAQQhqIAAoAggoAhgRAAAhASAIIAAgCCgCDCACIAMgBCAFIAEQlgYgARCWBiABEJcGahChCjYCDAwFCyAAIAVBFGogCEEMaiACIAQgCRCrCgwECyAAIAVBFGogCEEMaiACIAQgCRC4CgwDCyAGQSVGDQELIAQgBCgCAEEEcjYCAAwBCyAAIAhBDGogAiAEIAkQuQoLIAgoAgwhBAsgCEEQaiQAIAQLPgAgAiADIAQgBUECEKwKIQUgBCgCACEDAkAgBUF/akEeSw0AIANBBHENACABIAU2AgAPCyAEIANBBHI2AgALOwAgAiADIAQgBUECEKwKIQUgBCgCACEDAkAgBUEXSg0AIANBBHENACABIAU2AgAPCyAEIANBBHI2AgALPgAgAiADIAQgBUECEKwKIQUgBCgCACEDAkAgBUF/akELSw0AIANBBHENACABIAU2AgAPCyAEIANBBHI2AgALPAAgAiADIAQgBUEDEKwKIQUgBCgCACEDAkAgBUHtAkoNACADQQRxDQAgASAFNgIADwsgBCADQQRyNgIAC0AAIAIgAyAEIAVBAhCsCiEDIAQoAgAhBQJAIANBf2oiA0ELSw0AIAVBBHENACABIAM2AgAPCyAEIAVBBHI2AgALOwAgAiADIAQgBUECEKwKIQUgBCgCACEDAkAgBUE7Sg0AIANBBHENACABIAU2AgAPCyAEIANBBHI2AgALYgEBfyMAQRBrIgUkACAFIAI2AgwCQANAIAEgBUEMahCoBQ0BIARBASABEKkFEKoFRQ0BIAEQqwUaDAALAAsCQCABIAVBDGoQqAVFDQAgAyADKAIAQQJyNgIACyAFQRBqJAALigEAAkAgAEEIaiAAKAIIKAIIEQAAIgAQlwZBACAAQQxqEJcGa0cNACAEIAQoAgBBBHI2AgAPCyACIAMgACAAQRhqIAUgBEEAEPYIIQQgASgCACEFAkAgBCAARw0AIAVBDEcNACABQQA2AgAPCwJAIAQgAGtBDEcNACAFQQtKDQAgASAFQQxqNgIACws7ACACIAMgBCAFQQIQrAohBSAEKAIAIQMCQCAFQTxKDQAgA0EEcQ0AIAEgBTYCAA8LIAQgA0EEcjYCAAs7ACACIAMgBCAFQQEQrAohBSAEKAIAIQMCQCAFQQZKDQAgA0EEcQ0AIAEgBTYCAA8LIAQgA0EEcjYCAAspACACIAMgBCAFQQQQrAohBQJAIAQtAABBBHENACABIAVBlHFqNgIACwtnAQF/IwBBEGsiBSQAIAUgAjYCDEEGIQICQAJAIAEgBUEMahCoBQ0AQQQhAiAEIAEQqQVBABCiCkElRw0AQQIhAiABEKsFIAVBDGoQqAVFDQELIAMgAygCACACcjYCAAsgBUEQaiQAC+gDAQR/IwBBEGsiCCQAIAggAjYCCCAIIAE2AgwgCEEEaiADEJkHIAhBBGoQ5wUhAiAIQQRqEPIIGiAEQQA2AgBBACEBAkADQCAGIAdGDQEgAQ0BAkAgCEEMaiAIQQhqEOgFDQACQAJAIAIgBigCAEEAELsKQSVHDQAgBkEEaiIBIAdGDQJBACEJAkACQCACIAEoAgBBABC7CiIBQcUARg0AQQQhCiABQf8BcUEwRg0AIAEhCwwBCyAGQQhqIgkgB0YNA0EIIQogAiAJKAIAQQAQuwohCyABIQkLIAggACAIKAIMIAgoAgggAyAEIAUgCyAJIAAoAgAoAiQRDQA2AgwgBiAKakEEaiEGDAELAkAgAkEBIAYoAgAQ6gVFDQACQANAIAZBBGoiBiAHRg0BIAJBASAGKAIAEOoFDQALCwNAIAhBDGogCEEIahDoBQ0CIAJBASAIQQxqEOkFEOoFRQ0CIAhBDGoQ6wUaDAALAAsCQCACIAhBDGoQ6QUQrwkgAiAGKAIAEK8JRw0AIAZBBGohBiAIQQxqEOsFGgwBCyAEQQQ2AgALIAQoAgAhAQwBCwsgBEEENgIACwJAIAhBDGogCEEIahDoBUUNACAEIAQoAgBBAnI2AgALIAgoAgwhBiAIQRBqJAAgBgsTACAAIAEgAiAAKAIAKAI0EQMACwQAQQILZAEBfyMAQSBrIgYkACAGQRhqQQApA4jnBDcDACAGQRBqQQApA4DnBDcDACAGQQApA/jmBDcDCCAGQQApA/DmBDcDACAAIAEgAiADIAQgBSAGIAZBIGoQugohBSAGQSBqJAAgBQs2AQF/IAAgASACIAMgBCAFIABBCGogACgCCCgCFBEAACIGEL8KIAYQvwogBhCwCUECdGoQugoLCgAgABDAChDUBgsYAAJAIAAQwQpFDQAgABCYCw8LIAAQtA8LDQAgABCWCy0AC0EHdgsKACAAEJYLKAIECw4AIAAQlgstAAtB/wBxC1YBAX8jAEEQayIGJAAgBiABNgIMIAZBCGogAxCZByAGQQhqEOcFIQEgBkEIahDyCBogACAFQRhqIAZBDGogAiAEIAEQxQogBigCDCEBIAZBEGokACABC0IAAkAgAiADIABBCGogACgCCCgCABEAACIAIABBqAFqIAUgBEEAEK0JIABrIgBBpwFKDQAgASAAQQxtQQdvNgIACwtWAQF/IwBBEGsiBiQAIAYgATYCDCAGQQhqIAMQmQcgBkEIahDnBSEBIAZBCGoQ8ggaIAAgBUEQaiAGQQxqIAIgBCABEMcKIAYoAgwhASAGQRBqJAAgAQtCAAJAIAIgAyAAQQhqIAAoAggoAgQRAAAiACAAQaACaiAFIARBABCtCSAAayIAQZ8CSg0AIAEgAEEMbUEMbzYCAAsLVgEBfyMAQRBrIgYkACAGIAE2AgwgBkEIaiADEJkHIAZBCGoQ5wUhASAGQQhqEPIIGiAAIAVBFGogBkEMaiACIAQgARDJCiAGKAIMIQEgBkEQaiQAIAELQwAgAiADIAQgBUEEEMoKIQUCQCAELQAAQQRxDQAgASAFQdAPaiAFQewOaiAFIAVB5ABJGyAFQcUASBtBlHFqNgIACwvJAQEDfyMAQRBrIgUkACAFIAE2AgxBACEBQQYhBgJAAkAgACAFQQxqEOgFDQBBBCEGIANBwAAgABDpBSIHEOoFRQ0AIAMgB0EAELsKIQECQANAIAAQ6wUaIAFBUGohASAAIAVBDGoQ6AUNASAEQQJIDQEgA0HAACAAEOkFIgYQ6gVFDQMgBEF/aiEEIAFBCmwgAyAGQQAQuwpqIQEMAAsAC0ECIQYgACAFQQxqEOgFRQ0BCyACIAIoAgAgBnI2AgALIAVBEGokACABC7AIAQJ/IwBBMGsiCCQAIAggATYCLCAEQQA2AgAgCCADEJkHIAgQ5wUhCSAIEPIIGgJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQCAGQb9/ag45AAEXBBcFFwYHFxcXChcXFxcODxAXFxcTFRcXFxcXFxcAAQIDAxcXARcIFxcJCxcMFw0XCxcXERIUFgsgACAFQRhqIAhBLGogAiAEIAkQxQoMGAsgACAFQRBqIAhBLGogAiAEIAkQxwoMFwsgAEEIaiAAKAIIKAIMEQAAIQEgCCAAIAgoAiwgAiADIAQgBSABEL8KIAEQvwogARCwCUECdGoQugo2AiwMFgsgACAFQQxqIAhBLGogAiAEIAkQzAoMFQsgCEEYakEAKQP45QQ3AwAgCEEQakEAKQPw5QQ3AwAgCEEAKQPo5QQ3AwggCEEAKQPg5QQ3AwAgCCAAIAEgAiADIAQgBSAIIAhBIGoQugo2AiwMFAsgCEEYakEAKQOY5gQ3AwAgCEEQakEAKQOQ5gQ3AwAgCEEAKQOI5gQ3AwggCEEAKQOA5gQ3AwAgCCAAIAEgAiADIAQgBSAIIAhBIGoQugo2AiwMEwsgACAFQQhqIAhBLGogAiAEIAkQzQoMEgsgACAFQQhqIAhBLGogAiAEIAkQzgoMEQsgACAFQRxqIAhBLGogAiAEIAkQzwoMEAsgACAFQRBqIAhBLGogAiAEIAkQ0AoMDwsgACAFQQRqIAhBLGogAiAEIAkQ0QoMDgsgACAIQSxqIAIgBCAJENIKDA0LIAAgBUEIaiAIQSxqIAIgBCAJENMKDAwLIAhBoOYEQSwQ1wQhBiAGIAAgASACIAMgBCAFIAYgBkEsahC6CjYCLAwLCyAIQRBqQQAoAuDmBDYCACAIQQApA9jmBDcDCCAIQQApA9DmBDcDACAIIAAgASACIAMgBCAFIAggCEEUahC6CjYCLAwKCyAAIAUgCEEsaiACIAQgCRDUCgwJCyAIQRhqQQApA4jnBDcDACAIQRBqQQApA4DnBDcDACAIQQApA/jmBDcDCCAIQQApA/DmBDcDACAIIAAgASACIAMgBCAFIAggCEEgahC6CjYCLAwICyAAIAVBGGogCEEsaiACIAQgCRDVCgwHCyAAIAEgAiADIAQgBSAAKAIAKAIUEQcAIQQMBwsgAEEIaiAAKAIIKAIYEQAAIQEgCCAAIAgoAiwgAiADIAQgBSABEL8KIAEQvwogARCwCUECdGoQugo2AiwMBQsgACAFQRRqIAhBLGogAiAEIAkQyQoMBAsgACAFQRRqIAhBLGogAiAEIAkQ1goMAwsgBkElRg0BCyAEIAQoAgBBBHI2AgAMAQsgACAIQSxqIAIgBCAJENcKCyAIKAIsIQQLIAhBMGokACAECz4AIAIgAyAEIAVBAhDKCiEFIAQoAgAhAwJAIAVBf2pBHksNACADQQRxDQAgASAFNgIADwsgBCADQQRyNgIACzsAIAIgAyAEIAVBAhDKCiEFIAQoAgAhAwJAIAVBF0oNACADQQRxDQAgASAFNgIADwsgBCADQQRyNgIACz4AIAIgAyAEIAVBAhDKCiEFIAQoAgAhAwJAIAVBf2pBC0sNACADQQRxDQAgASAFNgIADwsgBCADQQRyNgIACzwAIAIgAyAEIAVBAxDKCiEFIAQoAgAhAwJAIAVB7QJKDQAgA0EEcQ0AIAEgBTYCAA8LIAQgA0EEcjYCAAtAACACIAMgBCAFQQIQygohAyAEKAIAIQUCQCADQX9qIgNBC0sNACAFQQRxDQAgASADNgIADwsgBCAFQQRyNgIACzsAIAIgAyAEIAVBAhDKCiEFIAQoAgAhAwJAIAVBO0oNACADQQRxDQAgASAFNgIADwsgBCADQQRyNgIAC2IBAX8jAEEQayIFJAAgBSACNgIMAkADQCABIAVBDGoQ6AUNASAEQQEgARDpBRDqBUUNASABEOsFGgwACwALAkAgASAFQQxqEOgFRQ0AIAMgAygCAEECcjYCAAsgBUEQaiQAC4oBAAJAIABBCGogACgCCCgCCBEAACIAELAJQQAgAEEMahCwCWtHDQAgBCAEKAIAQQRyNgIADwsgAiADIAAgAEEYaiAFIARBABCtCSEEIAEoAgAhBQJAIAQgAEcNACAFQQxHDQAgAUEANgIADwsCQCAEIABrQQxHDQAgBUELSg0AIAEgBUEMajYCAAsLOwAgAiADIAQgBUECEMoKIQUgBCgCACEDAkAgBUE8Sg0AIANBBHENACABIAU2AgAPCyAEIANBBHI2AgALOwAgAiADIAQgBUEBEMoKIQUgBCgCACEDAkAgBUEGSg0AIANBBHENACABIAU2AgAPCyAEIANBBHI2AgALKQAgAiADIAQgBUEEEMoKIQUCQCAELQAAQQRxDQAgASAFQZRxajYCAAsLZwEBfyMAQRBrIgUkACAFIAI2AgxBBiECAkACQCABIAVBDGoQ6AUNAEEEIQIgBCABEOkFQQAQuwpBJUcNAEECIQIgARDrBSAFQQxqEOgFRQ0BCyADIAMoAgAgAnI2AgALIAVBEGokAAtMAQF/IwBBgAFrIgckACAHIAdB9ABqNgIMIABBCGogB0EQaiAHQQxqIAQgBSAGENkKIAdBEGogBygCDCABENoKIQAgB0GAAWokACAAC2cBAX8jAEEQayIGJAAgBkEAOgAPIAYgBToADiAGIAQ6AA0gBkElOgAMAkAgBUUNACAGQQ1qIAZBDmoQ2woLIAIgASABIAEgAigCABDcCiAGQQxqIAMgACgCABAUajYCACAGQRBqJAALKwEBfyMAQRBrIgMkACADQQhqIAAgASACEN0KIAMoAgwhAiADQRBqJAAgAgscAQF/IAAtAAAhAiAAIAEtAAA6AAAgASACOgAACwcAIAEgAGsLDQAgACABIAIgAxC2DwtMAQF/IwBBoANrIgckACAHIAdBoANqNgIMIABBCGogB0EQaiAHQQxqIAQgBSAGEN8KIAdBEGogBygCDCABEOAKIQAgB0GgA2okACAAC4QBAQF/IwBBkAFrIgYkACAGIAZBhAFqNgIcIAAgBkEgaiAGQRxqIAMgBCAFENkKIAZCADcDECAGIAZBIGo2AgwCQCABIAZBDGogASACKAIAEOEKIAZBEGogACgCABDiCiIAQX9HDQBBiIYEELcRAAsgAiABIABBAnRqNgIAIAZBkAFqJAALKwEBfyMAQRBrIgMkACADQQhqIAAgASACEOMKIAMoAgwhAiADQRBqJAAgAgsKACABIABrQQJ1Cz8BAX8jAEEQayIFJAAgBSAENgIMIAVBCGogBUEMahCnCSEEIAAgASACIAMQ0AghAyAEEKgJGiAFQRBqJAAgAwsNACAAIAEgAiADEMQPCwUAEOUKCwUAEOYKCwUAQf8ACwUAEOUKCwgAIAAQgAYaCwgAIAAQgAYaCwgAIAAQgAYaCwwAIABBAUEtEP0JGgsEAEEACwwAIABBgoaAIDYAAAsMACAAQYKGgCA2AAALBQAQ5QoLBQAQ5QoLCAAgABCABhoLCAAgABCABhoLCAAgABCABhoLDAAgAEEBQS0Q/QkaCwQAQQALDAAgAEGChoAgNgAACwwAIABBgoaAIDYAAAsFABD5CgsFABD6CgsIAEH/////BwsFABD5CgsIACAAEIAGGgsIACAAEP4KGgssAQF/IwBBEGsiASQAIAAgAUEPaiABQQ5qEP8KIgBBABCACyABQRBqJAAgAAsKACAAENIPEIgPCwIACwgAIAAQ/goaCwwAIABBAUEtEJsKGgsEAEEACwwAIABBgoaAIDYAAAsMACAAQYKGgCA2AAALBQAQ+QoLBQAQ+QoLCAAgABCABhoLCAAgABD+ChoLCAAgABD+ChoLDAAgAEEBQS0QmwoaCwQAQQALDAAgAEGChoAgNgAACwwAIABBgoaAIDYAAAuAAQECfyMAQRBrIgIkACABEJAGEJALIAAgAkEPaiACQQ5qEJELIQACQAJAIAEQigYNACABEJQGIQEgABCMBiIDQQhqIAFBCGooAgA2AgAgAyABKQIANwIAIAAgABCOBhCCBgwBCyAAIAEQjQcQuwYgARCcBhC+EQsgAkEQaiQAIAALAgALDAAgABD0BiACENMPC4ABAQJ/IwBBEGsiAiQAIAEQkwsQlAsgACACQQ9qIAJBDmoQlQshAAJAAkAgARDBCg0AIAEQlgshASAAEJcLIgNBCGogAUEIaigCADYCACADIAEpAgA3AgAgACAAEMMKEIALDAELIAAgARCYCxDUBiABEMIKEMwRCyACQRBqJAAgAAsHACAAEJsPCwIACwwAIAAQhw8gAhDUDwsHACAAEKYPCwcAIAAQnQ8LCgAgABCWCygCAAuLBAECfyMAQZACayIHJAAgByACNgKIAiAHIAE2AowCIAdBjQE2AhAgB0GYAWogB0GgAWogB0EQahD0CSEBIAdBkAFqIAQQmQcgB0GQAWoQpwUhCCAHQQA6AI8BAkAgB0GMAmogAiADIAdBkAFqIAQQpgUgBSAHQY8BaiAIIAEgB0GUAWogB0GEAmoQmwtFDQAgB0EAKAC3jAQ2AIcBIAdBACkAsIwENwOAASAIIAdBgAFqIAdBigFqIAdB9gBqEKMJGiAHQYwBNgIQIAdBCGpBACAHQRBqEPQJIQggB0EQaiEEAkACQCAHKAKUASABEJwLa0HjAEgNACAIIAcoApQBIAEQnAtrQQJqEN0EEPYJIAgQnAtFDQEgCBCcCyEECwJAIActAI8BQQFHDQAgBEEtOgAAIARBAWohBAsgARCcCyECAkADQAJAIAIgBygClAFJDQAgBEEAOgAAIAcgBjYCACAHQRBqQcmFBCAHEMEIQQFHDQIgCBD4CRoMBAsgBCAHQYABaiAHQfYAaiAHQfYAahCdCyACENAJIAdB9gBqa2otAAA6AAAgBEEBaiEEIAJBAWohAgwACwALQZKCBBC3EQALELERAAsCQCAHQYwCaiAHQYgCahCoBUUNACAFIAUoAgBBAnI2AgALIAcoAowCIQIgB0GQAWoQ8ggaIAEQ+AkaIAdBkAJqJAAgAgsCAAujDgEIfyMAQZAEayILJAAgCyAKNgKIBCALIAE2AowEAkACQCAAIAtBjARqEKgFRQ0AIAUgBSgCAEEEcjYCAEEAIQAMAQsgC0GNATYCTCALIAtB6ABqIAtB8ABqIAtBzABqEJ8LIgwQoAsiCjYCZCALIApBkANqNgJgIAtBzABqEIAGIQ0gC0HAAGoQgAYhDiALQTRqEIAGIQ8gC0EoahCABiEQIAtBHGoQgAYhESACIAMgC0HcAGogC0HbAGogC0HaAGogDSAOIA8gECALQRhqEKELIAkgCBCcCzYCACAEQYAEcSESQQAhA0EAIQEDQCABIQICQAJAAkACQCADQQRGDQAgACALQYwEahCoBQ0AQQAhCiACIQECQAJAAkACQAJAAkAgC0HcAGogA2otAAAOBQEABAMFCQsgA0EDRg0HAkAgB0EBIAAQqQUQqgVFDQAgC0EQaiAAQQAQogsgESALQRBqEKMLEMMRDAILIAUgBSgCAEEEcjYCAEEAIQAMBgsgA0EDRg0GCwNAIAAgC0GMBGoQqAUNBiAHQQEgABCpBRCqBUUNBiALQRBqIABBABCiCyARIAtBEGoQowsQwxEMAAsACwJAIA8QlwZFDQAgABCpBUH/AXEgD0EAEIQJLQAARw0AIAAQqwUaIAZBADoAACAPIAIgDxCXBkEBSxshAQwGCwJAIBAQlwZFDQAgABCpBUH/AXEgEEEAEIQJLQAARw0AIAAQqwUaIAZBAToAACAQIAIgEBCXBkEBSxshAQwGCwJAIA8QlwZFDQAgEBCXBkUNACAFIAUoAgBBBHI2AgBBACEADAQLAkAgDxCXBg0AIBAQlwZFDQULIAYgEBCXBkU6AAAMBAsCQCADQQJJDQAgAg0AIBINAEEAIQEgA0ECRiALLQBfQQBHcUUNBQsgCyAOENwJNgIMIAtBEGogC0EMahCkCyEKAkAgA0UNACADIAtB3ABqakF/ai0AAEEBSw0AAkADQCALIA4Q3Qk2AgwgCiALQQxqEKULRQ0BIAdBASAKEKYLLAAAEKoFRQ0BIAoQpwsaDAALAAsgCyAOENwJNgIMAkAgCiALQQxqEKgLIgEgERCXBksNACALIBEQ3Qk2AgwgC0EMaiABEKkLIBEQ3QkgDhDcCRCqCw0BCyALIA4Q3Ak2AgggCiALQQxqIAtBCGoQpAsoAgA2AgALIAsgCigCADYCDAJAA0AgCyAOEN0JNgIIIAtBDGogC0EIahClC0UNASAAIAtBjARqEKgFDQEgABCpBUH/AXEgC0EMahCmCy0AAEcNASAAEKsFGiALQQxqEKcLGgwACwALIBJFDQMgCyAOEN0JNgIIIAtBDGogC0EIahClC0UNAyAFIAUoAgBBBHI2AgBBACEADAILAkADQCAAIAtBjARqEKgFDQECQAJAIAdBwAAgABCpBSIBEKoFRQ0AAkAgCSgCACIEIAsoAogERw0AIAggCSALQYgEahCrCyAJKAIAIQQLIAkgBEEBajYCACAEIAE6AAAgCkEBaiEKDAELIA0QlwZFDQIgCkUNAiABQf8BcSALLQBaQf8BcUcNAgJAIAsoAmQiASALKAJgRw0AIAwgC0HkAGogC0HgAGoQrAsgCygCZCEBCyALIAFBBGo2AmQgASAKNgIAQQAhCgsgABCrBRoMAAsACwJAIAwQoAsgCygCZCIBRg0AIApFDQACQCABIAsoAmBHDQAgDCALQeQAaiALQeAAahCsCyALKAJkIQELIAsgAUEEajYCZCABIAo2AgALAkAgCygCGEEBSA0AAkACQCAAIAtBjARqEKgFDQAgABCpBUH/AXEgCy0AW0YNAQsgBSAFKAIAQQRyNgIAQQAhAAwDCwNAIAAQqwUaIAsoAhhBAUgNAQJAAkAgACALQYwEahCoBQ0AIAdBwAAgABCpBRCqBQ0BCyAFIAUoAgBBBHI2AgBBACEADAQLAkAgCSgCACALKAKIBEcNACAIIAkgC0GIBGoQqwsLIAAQqQUhCiAJIAkoAgAiAUEBajYCACABIAo6AAAgCyALKAIYQX9qNgIYDAALAAsgAiEBIAkoAgAgCBCcC0cNAyAFIAUoAgBBBHI2AgBBACEADAELAkAgAkUNAEEBIQoDQCAKIAIQlwZPDQECQAJAIAAgC0GMBGoQqAUNACAAEKkFQf8BcSACIAoQ/AgtAABGDQELIAUgBSgCAEEEcjYCAEEAIQAMAwsgABCrBRogCkEBaiEKDAALAAtBASEAIAwQoAsgCygCZEYNAEEAIQAgC0EANgIQIA0gDBCgCyALKAJkIAtBEGoQhwkCQCALKAIQRQ0AIAUgBSgCAEEEcjYCAAwBC0EBIQALIBEQuhEaIBAQuhEaIA8QuhEaIA4QuhEaIA0QuhEaIAwQrQsaDAMLIAIhAQsgA0EBaiEDDAALAAsgC0GQBGokACAACwoAIAAQrgsoAgALBwAgAEEKagsWACAAIAEQlhEiAUEEaiACEKIHGiABCysBAX8jAEEQayIDJAAgAyABNgIMIAAgA0EMaiACELcLIQEgA0EQaiQAIAELCgAgABC4CygCAAuAAwEBfyMAQRBrIgokAAJAAkAgAEUNACAKQQRqIAEQuQsiARC6CyACIAooAgQ2AAAgCkEEaiABELsLIAggCkEEahCEBhogCkEEahC6ERogCkEEaiABELwLIAcgCkEEahCEBhogCkEEahC6ERogAyABEL0LOgAAIAQgARC+CzoAACAKQQRqIAEQvwsgBSAKQQRqEIQGGiAKQQRqELoRGiAKQQRqIAEQwAsgBiAKQQRqEIQGGiAKQQRqELoRGiABEMELIQEMAQsgCkEEaiABEMILIgEQwwsgAiAKKAIENgAAIApBBGogARDECyAIIApBBGoQhAYaIApBBGoQuhEaIApBBGogARDFCyAHIApBBGoQhAYaIApBBGoQuhEaIAMgARDGCzoAACAEIAEQxws6AAAgCkEEaiABEMgLIAUgCkEEahCEBhogCkEEahC6ERogCkEEaiABEMkLIAYgCkEEahCEBhogCkEEahC6ERogARDKCyEBCyAJIAE2AgAgCkEQaiQACxYAIAAgASgCABCzBcAgASgCABDLCxoLBwAgACwAAAsOACAAIAEQzAs2AgAgAAsMACAAIAEQzQtBAXMLBwAgACgCAAsRACAAIAAoAgBBAWo2AgAgAAsNACAAEM4LIAEQzAtrCwwAIABBACABaxDQCwsLACAAIAEgAhDPCwvkAQEGfyMAQRBrIgMkACAAENELKAIAIQQCQAJAIAIoAgAgABCcC2siBRCDB0EBdk8NACAFQQF0IQUMAQsQgwchBQsgBUEBIAVBAUsbIQUgASgCACEGIAAQnAshBwJAAkAgBEGNAUcNAEEAIQgMAQsgABCcCyEICwJAIAggBRDgBCIIRQ0AAkAgBEGNAUYNACAAENILGgsgA0GMATYCBCAAIANBCGogCCADQQRqEPQJIgQQ0wsaIAQQ+AkaIAEgABCcCyAGIAdrajYCACACIAAQnAsgBWo2AgAgA0EQaiQADwsQsREAC+QBAQZ/IwBBEGsiAyQAIAAQ1AsoAgAhBAJAAkAgAigCACAAEKALayIFEIMHQQF2Tw0AIAVBAXQhBQwBCxCDByEFCyAFQQQgBRshBSABKAIAIQYgABCgCyEHAkACQCAEQY0BRw0AQQAhCAwBCyAAEKALIQgLAkAgCCAFEOAEIghFDQACQCAEQY0BRg0AIAAQ1QsaCyADQYwBNgIEIAAgA0EIaiAIIANBBGoQnwsiBBDWCxogBBCtCxogASAAEKALIAYgB2tqNgIAIAIgABCgCyAFQXxxajYCACADQRBqJAAPCxCxEQALCwAgAEEAENgLIAALBwAgABCXEQsHACAAEJgRCwoAIABBBGoQowcLuAIBAn8jAEGQAWsiByQAIAcgAjYCiAEgByABNgKMASAHQY0BNgIUIAdBGGogB0EgaiAHQRRqEPQJIQggB0EQaiAEEJkHIAdBEGoQpwUhASAHQQA6AA8CQCAHQYwBaiACIAMgB0EQaiAEEKYFIAUgB0EPaiABIAggB0EUaiAHQYQBahCbC0UNACAGELILAkAgBy0AD0EBRw0AIAYgAUEtEJIHEMMRCyABQTAQkgchASAIEJwLIQIgBygCFCIDQX9qIQQgAUH/AXEhAQJAA0AgAiAETw0BIAItAAAgAUcNASACQQFqIQIMAAsACyAGIAIgAxCzCxoLAkAgB0GMAWogB0GIAWoQqAVFDQAgBSAFKAIAQQJyNgIACyAHKAKMASECIAdBEGoQ8ggaIAgQ+AkaIAdBkAFqJAAgAgtwAQN/IwBBEGsiASQAIAAQlwYhAgJAAkAgABCKBkUNACAAEN8GIQMgAUEAOgAPIAMgAUEPahDnBiAAQQAQgAcMAQsgABDgBiEDIAFBADoADiADIAFBDmoQ5wYgAEEAEOYGCyAAIAIQlQYgAUEQaiQAC9oBAQR/IwBBEGsiAyQAIAAQlwYhBCAAEJgGIQUCQCABIAIQ9gYiBkUNAAJAIAAgARC0Cw0AAkAgBSAEayAGTw0AIAAgBSAEIAVrIAZqIAQgBEEAQQAQtQsLIAAgBhCTBiAAEIYGIARqIQUCQANAIAEgAkYNASAFIAEQ5wYgAUEBaiEBIAVBAWohBQwACwALIANBADoADyAFIANBD2oQ5wYgACAGIARqELYLDAELIAAgAyABIAIgABCNBhCPBiIBEJYGIAEQlwYQwREaIAEQuhEaCyADQRBqJAAgAAsaACAAEJYGIAAQlgYgABCXBmpBAWogARDVDwspACAAIAEgAiADIAQgBSAGEKEPIAAgAyAFayAGaiIGEIAHIAAgBhCCBgscAAJAIAAQigZFDQAgACABEIAHDwsgACABEOYGCxYAIAAgARCZESIBQQRqIAIQogcaIAELBwAgABCdEQsLACAAQdjHBRD3CAsRACAAIAEgASgCACgCLBECAAsRACAAIAEgASgCACgCIBECAAsRACAAIAEgASgCACgCHBECAAsPACAAIAAoAgAoAgwRAAALDwAgACAAKAIAKAIQEQAACxEAIAAgASABKAIAKAIUEQIACxEAIAAgASABKAIAKAIYEQIACw8AIAAgACgCACgCJBEAAAsLACAAQdDHBRD3CAsRACAAIAEgASgCACgCLBECAAsRACAAIAEgASgCACgCIBECAAsRACAAIAEgASgCACgCHBECAAsPACAAIAAoAgAoAgwRAAALDwAgACAAKAIAKAIQEQAACxEAIAAgASABKAIAKAIUEQIACxEAIAAgASABKAIAKAIYEQIACw8AIAAgACgCACgCJBEAAAsSACAAIAI2AgQgACABOgAAIAALBwAgACgCAAsNACAAEM4LIAEQzAtGCwcAIAAoAgALLwEBfyMAQRBrIgMkACAAENcPIAEQ1w8gAhDXDyADQQ9qENgPIQIgA0EQaiQAIAILMgEBfyMAQRBrIgIkACACIAAoAgA2AgwgAkEMaiABEN4PGiACKAIMIQAgAkEQaiQAIAALBwAgABCwCwsaAQF/IAAQrwsoAgAhASAAEK8LQQA2AgAgAQsiACAAIAEQ0gsQ9gkgARDRCygCACEBIAAQsAsgATYCACAACwcAIAAQmxELGgEBfyAAEJoRKAIAIQEgABCaEUEANgIAIAELIgAgACABENULENgLIAEQ1AsoAgAhASAAEJsRIAE2AgAgAAsJACAAIAEQxg4LLQEBfyAAEJoRKAIAIQIgABCaESABNgIAAkAgAkUNACACIAAQmxEoAgARBAALC5EEAQJ/IwBB8ARrIgckACAHIAI2AugEIAcgATYC7AQgB0GNATYCECAHQcgBaiAHQdABaiAHQRBqEJQKIQEgB0HAAWogBBCZByAHQcABahDnBSEIIAdBADoAvwECQCAHQewEaiACIAMgB0HAAWogBBCmBSAFIAdBvwFqIAggASAHQcQBaiAHQeAEahDaC0UNACAHQQAoALeMBDYAtwEgB0EAKQCwjAQ3A7ABIAggB0GwAWogB0G6AWogB0GAAWoQywkaIAdBjAE2AhAgB0EIakEAIAdBEGoQ9AkhCCAHQRBqIQQCQAJAIAcoAsQBIAEQ2wtrQYkDSA0AIAggBygCxAEgARDbC2tBAnVBAmoQ3QQQ9gkgCBCcC0UNASAIEJwLIQQLAkAgBy0AvwFBAUcNACAEQS06AAAgBEEBaiEECyABENsLIQICQANAAkAgAiAHKALEAUkNACAEQQA6AAAgByAGNgIAIAdBEGpByYUEIAcQwQhBAUcNAiAIEPgJGgwECyAEIAdBsAFqIAdBgAFqIAdBgAFqENwLIAIQ1wkgB0GAAWprQQJ1ai0AADoAACAEQQFqIQQgAkEEaiECDAALAAtBkoIEELcRAAsQsREACwJAIAdB7ARqIAdB6ARqEOgFRQ0AIAUgBSgCAEECcjYCAAsgBygC7AQhAiAHQcABahDyCBogARCXChogB0HwBGokACACC4YOAQh/IwBBkARrIgskACALIAo2AogEIAsgATYCjAQCQAJAIAAgC0GMBGoQ6AVFDQAgBSAFKAIAQQRyNgIAQQAhAAwBCyALQY0BNgJIIAsgC0HoAGogC0HwAGogC0HIAGoQnwsiDBCgCyIKNgJkIAsgCkGQA2o2AmAgC0HIAGoQgAYhDSALQTxqEP4KIQ4gC0EwahD+CiEPIAtBJGoQ/gohECALQRhqEP4KIREgAiADIAtB3ABqIAtB2ABqIAtB1ABqIA0gDiAPIBAgC0EUahDeCyAJIAgQ2ws2AgAgBEGABHEhEkEAIQNBACEBA0AgASECAkACQAJAAkAgA0EERg0AIAAgC0GMBGoQ6AUNAEEAIQogAiEBAkACQAJAAkACQAJAIAtB3ABqIANqLQAADgUBAAQDBQkLIANBA0YNBwJAIAdBASAAEOkFEOoFRQ0AIAtBDGogAEEAEN8LIBEgC0EMahDgCxDREQwCCyAFIAUoAgBBBHI2AgBBACEADAYLIANBA0YNBgsDQCAAIAtBjARqEOgFDQYgB0EBIAAQ6QUQ6gVFDQYgC0EMaiAAQQAQ3wsgESALQQxqEOALENERDAALAAsCQCAPELAJRQ0AIAAQ6QUgD0EAEOELKAIARw0AIAAQ6wUaIAZBADoAACAPIAIgDxCwCUEBSxshAQwGCwJAIBAQsAlFDQAgABDpBSAQQQAQ4QsoAgBHDQAgABDrBRogBkEBOgAAIBAgAiAQELAJQQFLGyEBDAYLAkAgDxCwCUUNACAQELAJRQ0AIAUgBSgCAEEEcjYCAEEAIQAMBAsCQCAPELAJDQAgEBCwCUUNBQsgBiAQELAJRToAAAwECwJAIANBAkkNACACDQAgEg0AQQAhASADQQJGIAstAF9BAEdxRQ0FCyALIA4QgAo2AgggC0EMaiALQQhqEOILIQoCQCADRQ0AIAMgC0HcAGpqQX9qLQAAQQFLDQACQANAIAsgDhCBCjYCCCAKIAtBCGoQ4wtFDQEgB0EBIAoQ5AsoAgAQ6gVFDQEgChDlCxoMAAsACyALIA4QgAo2AggCQCAKIAtBCGoQ5gsiASARELAJSw0AIAsgERCBCjYCCCALQQhqIAEQ5wsgERCBCiAOEIAKEOgLDQELIAsgDhCACjYCBCAKIAtBCGogC0EEahDiCygCADYCAAsgCyAKKAIANgIIAkADQCALIA4QgQo2AgQgC0EIaiALQQRqEOMLRQ0BIAAgC0GMBGoQ6AUNASAAEOkFIAtBCGoQ5AsoAgBHDQEgABDrBRogC0EIahDlCxoMAAsACyASRQ0DIAsgDhCBCjYCBCALQQhqIAtBBGoQ4wtFDQMgBSAFKAIAQQRyNgIAQQAhAAwCCwJAA0AgACALQYwEahDoBQ0BAkACQCAHQcAAIAAQ6QUiARDqBUUNAAJAIAkoAgAiBCALKAKIBEcNACAIIAkgC0GIBGoQ6QsgCSgCACEECyAJIARBBGo2AgAgBCABNgIAIApBAWohCgwBCyANEJcGRQ0CIApFDQIgASALKAJURw0CAkAgCygCZCIBIAsoAmBHDQAgDCALQeQAaiALQeAAahCsCyALKAJkIQELIAsgAUEEajYCZCABIAo2AgBBACEKCyAAEOsFGgwACwALAkAgDBCgCyALKAJkIgFGDQAgCkUNAAJAIAEgCygCYEcNACAMIAtB5ABqIAtB4ABqEKwLIAsoAmQhAQsgCyABQQRqNgJkIAEgCjYCAAsCQCALKAIUQQFIDQACQAJAIAAgC0GMBGoQ6AUNACAAEOkFIAsoAlhGDQELIAUgBSgCAEEEcjYCAEEAIQAMAwsDQCAAEOsFGiALKAIUQQFIDQECQAJAIAAgC0GMBGoQ6AUNACAHQcAAIAAQ6QUQ6gUNAQsgBSAFKAIAQQRyNgIAQQAhAAwECwJAIAkoAgAgCygCiARHDQAgCCAJIAtBiARqEOkLCyAAEOkFIQogCSAJKAIAIgFBBGo2AgAgASAKNgIAIAsgCygCFEF/ajYCFAwACwALIAIhASAJKAIAIAgQ2wtHDQMgBSAFKAIAQQRyNgIAQQAhAAwBCwJAIAJFDQBBASEKA0AgCiACELAJTw0BAkACQCAAIAtBjARqEOgFDQAgABDpBSACIAoQsQkoAgBGDQELIAUgBSgCAEEEcjYCAEEAIQAMAwsgABDrBRogCkEBaiEKDAALAAtBASEAIAwQoAsgCygCZEYNAEEAIQAgC0EANgIMIA0gDBCgCyALKAJkIAtBDGoQhwkCQCALKAIMRQ0AIAUgBSgCAEEEcjYCAAwBC0EBIQALIBEQyBEaIBAQyBEaIA8QyBEaIA4QyBEaIA0QuhEaIAwQrQsaDAMLIAIhAQsgA0EBaiEDDAALAAsgC0GQBGokACAACwoAIAAQ6gsoAgALBwAgAEEoagsWACAAIAEQnhEiAUEEaiACEKIHGiABC4ADAQF/IwBBEGsiCiQAAkACQCAARQ0AIApBBGogARD8CyIBEP0LIAIgCigCBDYAACAKQQRqIAEQ/gsgCCAKQQRqEP8LGiAKQQRqEMgRGiAKQQRqIAEQgAwgByAKQQRqEP8LGiAKQQRqEMgRGiADIAEQgQw2AgAgBCABEIIMNgIAIApBBGogARCDDCAFIApBBGoQhAYaIApBBGoQuhEaIApBBGogARCEDCAGIApBBGoQ/wsaIApBBGoQyBEaIAEQhQwhAQwBCyAKQQRqIAEQhgwiARCHDCACIAooAgQ2AAAgCkEEaiABEIgMIAggCkEEahD/CxogCkEEahDIERogCkEEaiABEIkMIAcgCkEEahD/CxogCkEEahDIERogAyABEIoMNgIAIAQgARCLDDYCACAKQQRqIAEQjAwgBSAKQQRqEIQGGiAKQQRqELoRGiAKQQRqIAEQjQwgBiAKQQRqEP8LGiAKQQRqEMgRGiABEI4MIQELIAkgATYCACAKQRBqJAALFQAgACABKAIAEPIFIAEoAgAQjwwaCwcAIAAoAgALDQAgABCFCiABQQJ0agsOACAAIAEQkAw2AgAgAAsMACAAIAEQkQxBAXMLBwAgACgCAAsRACAAIAAoAgBBBGo2AgAgAAsQACAAEJIMIAEQkAxrQQJ1CwwAIABBACABaxCUDAsLACAAIAEgAhCTDAvkAQEGfyMAQRBrIgMkACAAEJUMKAIAIQQCQAJAIAIoAgAgABDbC2siBRCDB0EBdk8NACAFQQF0IQUMAQsQgwchBQsgBUEEIAUbIQUgASgCACEGIAAQ2wshBwJAAkAgBEGNAUcNAEEAIQgMAQsgABDbCyEICwJAIAggBRDgBCIIRQ0AAkAgBEGNAUYNACAAEJYMGgsgA0GMATYCBCAAIANBCGogCCADQQRqEJQKIgQQlwwaIAQQlwoaIAEgABDbCyAGIAdrajYCACACIAAQ2wsgBUF8cWo2AgAgA0EQaiQADwsQsREACwcAIAAQnxELsAIBAn8jAEHAA2siByQAIAcgAjYCuAMgByABNgK8AyAHQY0BNgIUIAdBGGogB0EgaiAHQRRqEJQKIQggB0EQaiAEEJkHIAdBEGoQ5wUhASAHQQA6AA8CQCAHQbwDaiACIAMgB0EQaiAEEKYFIAUgB0EPaiABIAggB0EUaiAHQbADahDaC0UNACAGEOwLAkAgBy0AD0EBRw0AIAYgAUEtEJQHENERCyABQTAQlAchASAIENsLIQIgBygCFCIDQXxqIQQCQANAIAIgBE8NASACKAIAIAFHDQEgAkEEaiECDAALAAsgBiACIAMQ7QsaCwJAIAdBvANqIAdBuANqEOgFRQ0AIAUgBSgCAEECcjYCAAsgBygCvAMhAiAHQRBqEPIIGiAIEJcKGiAHQcADaiQAIAILcAEDfyMAQRBrIgEkACAAELAJIQICQAJAIAAQwQpFDQAgABDuCyEDIAFBADYCDCADIAFBDGoQ7wsgAEEAEPALDAELIAAQ8QshAyABQQA2AgggAyABQQhqEO8LIABBABDyCwsgACACEPMLIAFBEGokAAvgAQEEfyMAQRBrIgMkACAAELAJIQQgABD0CyEFAkAgASACEPULIgZFDQACQCAAIAEQ9gsNAAJAIAUgBGsgBk8NACAAIAUgBCAFayAGaiAEIARBAEEAEPcLCyAAIAYQ+AsgABCFCiAEQQJ0aiEFAkADQCABIAJGDQEgBSABEO8LIAFBBGohASAFQQRqIQUMAAsACyADQQA2AgQgBSADQQRqEO8LIAAgBiAEahD5CwwBCyAAIANBBGogASACIAAQ+gsQ+wsiARC/CiABELAJEM8RGiABEMgRGgsgA0EQaiQAIAALCgAgABCXCygCAAsMACAAIAEoAgA2AgALDAAgABCXCyABNgIECwoAIAAQlwsQlw8LMQEBfyAAEJcLIgIgAi0AC0GAAXEgAUH/AHFyOgALIAAQlwsiACAALQALQf8AcToACwsCAAsfAQF/QQEhAQJAIAAQwQpFDQAgABClD0F/aiEBCyABCwkAIAAgARDgDwsdACAAEL8KIAAQvwogABCwCUECdGpBBGogARDhDwspACAAIAEgAiADIAQgBSAGEN8PIAAgAyAFayAGaiIGEPALIAAgBhCACwsCAAscAAJAIAAQwQpFDQAgACABEPALDwsgACABEPILCwcAIAAQmQ8LKwEBfyMAQRBrIgQkACAAIARBD2ogAxDiDyIDIAEgAhDjDyAEQRBqJAAgAwsLACAAQejHBRD3CAsRACAAIAEgASgCACgCLBECAAsRACAAIAEgASgCACgCIBECAAsLACAAIAEQmAwgAAsRACAAIAEgASgCACgCHBECAAsPACAAIAAoAgAoAgwRAAALDwAgACAAKAIAKAIQEQAACxEAIAAgASABKAIAKAIUEQIACxEAIAAgASABKAIAKAIYEQIACw8AIAAgACgCACgCJBEAAAsLACAAQeDHBRD3CAsRACAAIAEgASgCACgCLBECAAsRACAAIAEgASgCACgCIBECAAsRACAAIAEgASgCACgCHBECAAsPACAAIAAoAgAoAgwRAAALDwAgACAAKAIAKAIQEQAACxEAIAAgASABKAIAKAIUEQIACxEAIAAgASABKAIAKAIYEQIACw8AIAAgACgCACgCJBEAAAsSACAAIAI2AgQgACABNgIAIAALBwAgACgCAAsNACAAEJIMIAEQkAxGCwcAIAAoAgALLwEBfyMAQRBrIgMkACAAEOcPIAEQ5w8gAhDnDyADQQ9qEOgPIQIgA0EQaiQAIAILMgEBfyMAQRBrIgIkACACIAAoAgA2AgwgAkEMaiABEO4PGiACKAIMIQAgAkEQaiQAIAALBwAgABCrDAsaAQF/IAAQqgwoAgAhASAAEKoMQQA2AgAgAQsiACAAIAEQlgwQlQogARCVDCgCACEBIAAQqwwgATYCACAAC88BAQV/IwBBEGsiAiQAIAAQog8CQCAAEMEKRQ0AIAAQ+gsgABDuCyAAEKUPEKMPCyABELAJIQMgARDBCiEEIAAgARDvDyABEJcLIQUgABCXCyIGQQhqIAVBCGooAgA2AgAgBiAFKQIANwIAIAFBABDyCyABEPELIQUgAkEANgIMIAUgAkEMahDvCwJAAkAgACABRiIFDQAgBA0AIAEgAxDzCwwBCyABQQAQgAsLIAAQwQohAQJAIAUNACABDQAgACAAEMMKEIALCyACQRBqJAALhAUBDH8jAEHAA2siByQAIAcgBTcDECAHIAY3AxggByAHQdACajYCzAIgB0HQAmpB5ABBw4UEIAdBEGoQwgghCCAHQYwBNgLgAUEAIQkgB0HYAWpBACAHQeABahD0CSEKIAdBjAE2AuABIAdB0AFqQQAgB0HgAWoQ9AkhCyAHQeABaiEMAkACQCAIQeQASQ0AEKQJIQggByAFNwMAIAcgBjcDCCAHQcwCaiAIQcOFBCAHEPUJIghBf0YNASAKIAcoAswCEPYJIAsgCBDdBBD2CSALQQAQmgwNASALEJwLIQwLIAdBzAFqIAMQmQcgB0HMAWoQpwUiDSAHKALMAiIOIA4gCGogDBCjCRoCQCAIQQFIDQAgBygCzAItAABBLUYhCQsgAiAJIAdBzAFqIAdByAFqIAdBxwFqIAdBxgFqIAdBuAFqEIAGIg8gB0GsAWoQgAYiDiAHQaABahCABiIQIAdBnAFqEJsMIAdBjAE2AjAgB0EoakEAIAdBMGoQ9AkhEQJAAkAgCCAHKAKcASICTA0AIBAQlwYgCCACa0EBdGogDhCXBmogBygCnAFqQQFqIRIMAQsgEBCXBiAOEJcGaiAHKAKcAWpBAmohEgsgB0EwaiECAkAgEkHlAEkNACARIBIQ3QQQ9gkgERCcCyICRQ0BCyACIAdBJGogB0EgaiADEKYFIAwgDCAIaiANIAkgB0HIAWogBywAxwEgBywAxgEgDyAOIBAgBygCnAEQnAwgASACIAcoAiQgBygCICADIAQQ6QkhCCAREPgJGiAQELoRGiAOELoRGiAPELoRGiAHQcwBahDyCBogCxD4CRogChD4CRogB0HAA2okACAIDwsQsREACwoAIAAQnQxBAXMLxgMBAX8jAEEQayIKJAACQAJAIABFDQAgAhC5CyECAkACQCABRQ0AIApBBGogAhC6CyADIAooAgQ2AAAgCkEEaiACELsLIAggCkEEahCEBhogCkEEahC6ERoMAQsgCkEEaiACEJ4MIAMgCigCBDYAACAKQQRqIAIQvAsgCCAKQQRqEIQGGiAKQQRqELoRGgsgBCACEL0LOgAAIAUgAhC+CzoAACAKQQRqIAIQvwsgBiAKQQRqEIQGGiAKQQRqELoRGiAKQQRqIAIQwAsgByAKQQRqEIQGGiAKQQRqELoRGiACEMELIQIMAQsgAhDCCyECAkACQCABRQ0AIApBBGogAhDDCyADIAooAgQ2AAAgCkEEaiACEMQLIAggCkEEahCEBhogCkEEahC6ERoMAQsgCkEEaiACEJ8MIAMgCigCBDYAACAKQQRqIAIQxQsgCCAKQQRqEIQGGiAKQQRqELoRGgsgBCACEMYLOgAAIAUgAhDHCzoAACAKQQRqIAIQyAsgBiAKQQRqEIQGGiAKQQRqELoRGiAKQQRqIAIQyQsgByAKQQRqEIQGGiAKQQRqELoRGiACEMoLIQILIAkgAjYCACAKQRBqJAALnwYBCn8jAEEQayIPJAAgAiAANgIAIANBgARxIRBBACERA0ACQCARQQRHDQACQCANEJcGQQFNDQAgDyANEKAMNgIMIAIgD0EMakEBEKEMIA0QogwgAigCABCjDDYCAAsCQCADQbABcSISQRBGDQACQCASQSBHDQAgAigCACEACyABIAA2AgALIA9BEGokAA8LAkACQAJAAkACQAJAIAggEWotAAAOBQABAwIEBQsgASACKAIANgIADAQLIAEg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ACAAIAEgAhCeCAsLACAAIAEgAhDVCAsLACAAIAEgAhDVCAsLACAAIAE2AgAgAAsLACAAIAE2AgAgAAthAQF/IwBBEGsiAiQAIAIgADYCDAJAIAAgAUYNAANAIAIgAUF/aiIBNgIIIAAgAU8NASACQQxqIAJBCGoQrg8gAiACKAIMQQFqIgA2AgwgAigCCCEBDAALAAsgAkEQaiQACw8AIAAoAgAgASgCABCvDwsJACAAIAEQ2woLYQEBfyMAQRBrIgIkACACIAA2AgwCQCAAIAFGDQADQCACIAFBfGoiATYCCCAAIAFPDQEgAkEMaiACQQhqELEPIAIgAigCDEEEaiIANgIMIAIoAgghAQwACwALIAJBEGokAAsPACAAKAIAIAEoAgAQsg8LCQAgACABELMPCxwBAX8gACgCACECIAAgASgCADYCACABIAI2AgALCgAgABCWCxC1DwsEACAACw0AIAAgASACIAMQtw8LaQEBfyMAQSBrIgQkACAEQRhqIAEgAhC4DyAEQRBqIARBDGogBCgCGCAEKAIcIAMQuQ8Qug8gBCABIAQoAhAQuw82AgwgBCADIAQoAhQQvA82AgggACAEQQxqIARBCGoQvQ8gBEEgaiQACwsAIAAgASACEL4PCwcAIAAQvw8LawEBfyMAQRBrIgUkACAFIAI2AgggBSAENgIMAkADQCACIANGDQEgAiwAACEEIAVBDGoQwwUgBBDEBRogBSACQQFqIgI2AgggBUEMahDFBRoMAAsACyAAIAVBCGogBUEMahC9DyAFQRBqJAALCQAgACABEMEPCwkAIAAgARDCDwsMACAAIAEgAhDADxoLOAEBfyMAQRBrIgMkACADIAEQrQY2AgwgAyACEK0GNgIIIAAgA0EMaiADQQhqEMMPGiADQRBqJAALBAAgAAsYACAAIAEoAgA2AgAgACACKAIANgIEIAALCQAgACABELAGCwQAIAELGAAgACABKAIANgIAIAAgAigCADYCBCAACw0AIAAgASACIAMQxQ8LaQEBfyMAQSBrIgQkACAEQRhqIAEgAhDGDyAEQRBqIARBDGogBCgCGCAEKAIcIAMQxw8QyA8gBCABIAQoAhAQyQ82AgwgBCADIAQoAhQQyg82AgggACAEQQxqIARBCGoQyw8gBEEgaiQACwsAIAAgASACEMwPCwcAIAAQzQ8LawEBfyMAQRBrIgUkACAFIAI2AgggBSAENgIMAkADQCACIANGDQEgAigCACEEIAVBDGoQ/AUgBBD9BRogBSACQQRqIgI2AgggBUEMahD+BRoMAAsACyAAIAVBCGogBUEMahDLDyAFQRBqJAALCQAgACABEM8PCwkAIAAgARDQDwsMACAAIAEgAhDODxoLOAEBfyMAQRBrIgMkACADIAEQxgY2AgwgAyACEMYGNgIIIAAgA0EMaiADQQhqENEPGiADQRBqJAALBAAgAAsYACAAIAEoAgA2AgAgACACKAIANgIEIAALCQAgACABEMkGCwQAIAELGAAgACABKAIANgIAIAAgAigCADYCBCAACxUAIABCADcCACAAQQhqQQA2AgAgAAsEACAACwQAIAALWgEBfyMAQRBrIgMkACADIAE2AgggAyAANgIMIAMgAjYCBEEAIQECQCADQQNqIANBBGogA0EMahDWDw0AIANBAmogA0EEaiADQQhqENYPIQELIANBEGokACABCw0AIAEoAgAgAigCAEkLBwAgABDaDwsOACAAIAIgASAAaxDZDwsMACAAIAEgAhCmCEULJwEBfyMAQRBrIgEkACABIAA2AgwgAUEMahDbDyEAIAFBEGokACAACwcAIAAQ3A8LCgAgACgCABDdDwsqAQF/IwBBEGsiASQAIAEgADYCDCABQQxqEMwLEIcGIQAgAUEQaiQAIAALEQAgACAAKAIAIAFqNgIAIAALkAIBA38jAEEQayIHJAACQCAAEI4PIgggAWsgAkkNACAAEIUKIQkCQCAIQQF2QXhqIAFNDQAgByABQQF0NgIMIAcgAiABajYCBCAHQQRqIAdBDGoQmgcoAgAQkA9BAWohCAsgABCiDyAHQQRqIAAQ+gsgCBCRDyAHKAIEIgggBygCCBCSDwJAIARFDQAgCBDYBiAJENgGIAQQ1AUaCwJAIAMgBSAEaiICRg0AIAgQ2AYgBEECdCIEaiAGQQJ0aiAJENgGIARqIAVBAnRqIAMgAmsQ1AUaCwJAIAFBAWoiAUECRg0AIAAQ+gsgCSABEKMPCyAAIAgQkw8gACAHKAIIEJQPIAdBEGokAA8LIAAQlQ8ACwoAIAEgAGtBAnULWgEBfyMAQRBrIgMkACADIAE2AgggAyAANgIMIAMgAjYCBEEAIQECQCADQQNqIANBBGogA0EM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CwkAIAAgARD4EAsHACAAEPkQCwsAIAAgATYCACAACw0AIAAoAgAQ+hAQ+xALBwAgABD9EAsHACAAEPwQCw0AIAAoAgAQ/hA2AgQLBwAgACgCAAsZAQF/QQBBACgC1MkFQQFqIgA2AtTJBSAACxYAIAAgARCCESIBQQRqIAIQogcaIAELBwAgABCDEQsKACAAQQRqEKMHCw4AIAAgASgCADYCACAACwQAIAALXgECfyMAQRBrIgMkAAJAIAIgABCwCSIETQ0AIAAgAiAEaxD4CwsgACACEPkLIANBADYCDCABIAJBAnRqIANBDGoQ7wsCQCACIARPDQAgACAEEPMLCyADQRBqJAAgAAsKACABIABrQQxtCwsAIAAgASACENkICwUAEIgRCwgAQYCAgIB4CwUAEIsRCwUAEIwRCw0AQoCAgICAgICAgH8LDQBC////////////AAsLACAAIAEgAhDWCAsFABCPEQsGAEH//wMLBQAQkRELBABCfwsMACAAIAEQpAkQ3ggLDAAgACABEKQJEN8ICz0CAX8BfiMAQRBrIgMkACADIAEgAhCkCRDgCCADKQMAIQQgACADQQhqKQMANwMIIAAgBDcDACADQRBqJAALCgAgASAAa0EMbQsOACAAIAEoAgA2AgAgAAsEACAACwQAIAALDgAgACABKAIANgIAIAALBwAgABCcEQsKACAAQQRqEKMHCwQAIAALBAAgAAsOACAAIAEoAgA2AgAgAAsEACAACwQAIAALBQAQxg0LBAAgAAsDAAALRQECfyMAQRBrIgIkAEEAIQMCQCAAQQNxDQAgASAAcA0AIAJBDGogACABEOMEIQBBACACKAIMIAAbIQMLIAJBEGokACADCxMAAkAgABCmESIADQAQpxELIAALMQECfyAAQQEgAEEBSxshAQJAA0AgARDdBCICDQEQ3REiAEUNASAAEQgADAALAAsgAgsGABCxEQALBwAgABDfBAsHACAAEKgRCwcAIAAQqBELFQACQCAAIAEQrBEiAQ0AEKcRCyABCz8BAn8gAUEEIAFBBEsbIQIgAEEBIABBAUsbIQACQANAIAIgABCtESIDDQEQ3REiAUUNASABEQgADAALAAsgAwshAQF/IAAgACABakF/akEAIABrcSICIAEgAiABSxsQpBELBwAgABCvEQsHACAAEN8ECwkAIAAg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dW5zaWduZWQgY2hhcgBpb3NfYmFzZTo6Y2xlYXIATWFyAHN5c3RlbS9saWIvbGliY3h4YWJpL3NyYy9wcml2YXRlX3R5cGVpbmZvLmNwcABTZXAAJUk6JU06JVMgJXAAU3VuAEp1bgBzdGQ6OmV4Y2VwdGlvbgBNb24Ac2V0R2FpbgBuYW4ASmFuAEp1bABib29sAHN0ZDo6YmFkX2Z1bmN0aW9uX2NhbGwAQXByaWwARnJpAGJhZF9hcnJheV9uZXdfbGVuZ3RoAHNldExvb3BMZW5ndGgAc2V0R3JhaW5MZW5ndGgAY2FuX2NhdGNoAE1hcmNoAEF1ZwB1bnNpZ25lZCBsb25nAHN0YXJ0UGxheWluZwBzdG9wUGxheWluZwBzdGQ6OndzdHJpbmcAYmFzaWNfc3RyaW5nAHN0ZDo6c3RyaW5nAHN0ZDo6dTE2c3RyaW5nAHN0ZDo6dTMyc3RyaW5nAGlzUmVjb3JkaW5nAGluZgAlLjBMZgAlTGYAdHJ1ZQBUdWUAZmFsc2UAQ2FwdHVyZUJhc2UAQ2FwdHVyZQBKdW5lAGRvdWJsZQByZWNvcmQAdm9pZABsb2NhbGUgbm90IHN1cHBvcnRlZABzZXRQbGF5U3BlZWQAV2VkAHNldFNwcmVhZABzdGQ6OmJhZF9hbGxvYwBEZWMARmViACVhICViICVkICVIOiVNOiVTICVZAFBPU0lYAE5BTgBQTQBBTQBMQ19BTEwARklOSVNIAExBTkcASU5GAEMAZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8c2hvcnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIHNob3J0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8ZmxvYXQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQ4X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDhfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDE2X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDE2X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQ2NF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ2NF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8Y2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgY2hhcj4Ac3RkOjpiYXNpY19zdHJpbmc8dW5zaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8c2lnbmVkIGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGxvbmc+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGxvbmc+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGRvdWJsZT4AMDEyMzQ1Njc4OQBDLlVURi04AC4AKG51bGwpAGFkanVzdGVkUHRyICYmICJjYXRjaGluZyBhIGNsYXNzIHdpdGhvdXQgYW4gb2JqZWN0PyIAUHVyZSB2aXJ0dWFsIGZ1bmN0aW9uIGNhbGxlZCEAbGliYysrYWJpOiAATlN0M19fMjEyYmFzaWNfc3RyaW5nSWNOU18xMWNoYXJfdHJhaXRzSWNFRU5TXzlhbGxvY2F0b3JJY0VFRUUAAAAAUAEAqwYBAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0loTlNfMTFjaGFyX3RyYWl0c0loRUVOU185YWxsb2NhdG9ySWhFRUVFAAAAUAEA9AYBAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0l3TlNfMTFjaGFyX3RyYWl0c0l3RUVOU185YWxsb2NhdG9ySXdFRUVFAAAAUAEAPAcBAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0lEc05TXzExY2hhcl90cmFpdHNJRHNFRU5TXzlhbGxvY2F0b3JJRHNFRUVFAAAAAFABAIQHAQBOU3QzX18yMTJiYXNpY19zdHJpbmdJRGlOU18xMWNoYXJfdHJhaXRzSURpRUVOU185YWxsb2NhdG9ySURpRUVFRQAAAABQAQDQBwEATjEwZW1zY3JpcHRlbjN2YWxFAAAAUAEAHAgBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWNFRQAAAFABADgIAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lhRUUAAABQAQBgCAEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJaEVFAAAAUAEAiAgBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SXNFRQAAAFABALAIAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0l0RUUAAABQAQDYCAEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJaUVFAAAAUAEAAAkBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWpFRQAAAFABACgJAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lsRUUAAABQAQBQCQEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJbUVFAAAAUAEAeAkBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SXhFRQAAAFABAKAJAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0l5RUUAAABQAQDICQEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJZkVFAAAAUAEA8AkBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWRFRQAAAFABABgKAQAxNENhcHR1cmVXcmFwcGVyADdDYXB0dXJlAAAAAFABAFEKAQAoUAEAQAoBAFwKAQBQMTRDYXB0dXJlV3JhcHBlcgAAAOBQAQBwCgEAAAAAAGQKAQBQSzE0Q2FwdHVyZVdyYXBwZXIAAOBQAQCUCgEAAQAAAGQKAQBwcAB2cAAAAIQKAQAAAAAA6AoBAB8AAAA4R3JhaW5FbnYANFNpbmUAAFABANoKAQAoUAEA0AoBAOAKAQAAAAAA4AoBACAAAAAAAAAApAsBACEAAAAiAAAAIwAAACQAAAAlAAAAJgAAACcAAAAoAAAAKQAAAE5TdDNfXzIxMF9fZnVuY3Rpb242X19mdW5jSU44RW52ZWxvcGU3b25FbmRlZE1VbHZFX0VOU185YWxsb2NhdG9ySVM0X0VFRnZ2RUVFAE5TdDNfXzIxMF9fZnVuY3Rpb242X19iYXNlSUZ2dkVFRQAAUAEAegsBAChQAQAsCwEAnAsBAAAAAACcCwEAKgAAACsAAAAsAAAALAAAACwAAAAsAAAALAAAACwAAAAsAAAATjhFbnZlbG9wZTdvbkVuZGVkTVVsdkVfRQAAAABQAQDcCwEAPE8BAIQKAQDATwEAwE8BAJxPAQB2cHBwcGkAUDdDYXB0dXJlAAAAAOBQAQAbDAEAAAAAAFwKAQBQSzdDYXB0dXJlAADgUAEAOAwBAAEAAABcCgEAdgAAAAAAAAAAAAAAPE8BACgMAQCcTwEAnE8BAORPAQB2cHBpaWYAADxPAQAoDAEAnE8BAHZwcGkAAAAAVE8BACgMAQCcTwEAaXBwaQAAAAAAAAAAAAAAAAAAAAA8TwEAKAwBAORPAQCcTwEAdnBwZmkAAAAAAAAASA0BAC4AAAAvAAAAMAAAADEAAAAyAAAAMwAAADQAAAA1AAAANgAAAE5TdDNfXzIxMF9fZnVuY3Rpb242X19mdW5jSVpONVZvaWNlNGluaXRFaWlmUDVTeW50aEUzJF8wTlNfOWFsbG9jYXRvcklTNV9FRUZ2dkVFRQAAAChQAQD0DAEAnAsBAFpONVZvaWNlNGluaXRFaWlmUDVTeW50aEUzJF8wAAAAAFABAFQNAQAAAAAAAwAAAAQAAAAEAAAABgAAAIP5ogBETm4A/CkVANFXJwDdNPUAYtvAADyZlQBBkEMAY1H+ALveqwC3YcUAOm4kANJNQgBJBuAACeouAByS0QDrHf4AKbEcAOg+pwD1NYIARLsuAJzphAC0JnAAQX5fANaROQBTgzkAnPQ5AItfhAAo+b0A+B87AN7/lwAPmAUAES/vAApaiwBtH20Az342AAnLJwBGT7cAnmY/AC3qXwC6J3UA5evHAD178QD3OQcAklKKAPtr6gAfsV8ACF2NADADVgB7/EYA8KtrACC8zwA29JoA46kdAF5hkQAIG+YAhZllAKAUXwCNQGgAgNj/ACdzTQAGBjEAylYVAMmocwB74mAAa4zAABnERwDNZ8MACejcAFmDKgCLdsQAphyWAESv3QAZV9EApT4FAAUH/wAzfj8AwjLoAJhP3gC7fTIAJj3DAB5r7wCf+F4ANR86AH/yygDxhx0AfJAhAGokfADVbvoAMC13ABU7QwC1FMYAwxmdAK3EwgAsTUEADABdAIZ9RgDjcS0Am8aaADNiAAC00nwAtKeXADdV1QDXPvYAoxAYAE12/ABknSoAcNerAGN8+AB6sFcAFxXnAMBJVgA71tkAp4Q4ACQjywDWincAWlQjAAAfuQDxChsAGc7fAJ8x/wBmHmoAmVdhAKz7RwB+f9gAImW3ADLoiQDmv2AA78TNAGw2CQBdP9QAFt7XAFg73gDem5IA0iIoACiG6ADiWE0AxsoyAAjjFgDgfcsAF8BQAPMdpwAY4FsALhM0AIMSYgCDSAEA9Y5bAK2wfwAe6fIASEpDABBn0wCq3dgArl9CAGphzgAKKKQA05m0AAam8gBcd38Ao8KDAGE8iACKc3gAr4xaAG/XvQAtpmMA9L/LAI2B7wAmwWcAVcpFAMrZNgAoqNIAwmGNABLJdwAEJhQAEkabAMRZxADIxUQATbKRAAAX8wDUQ60AKUnlAP3VEAAAvvwAHpTMAHDO7gATPvUA7PGAALPnwwDH+CgAkwWUAMFxPgAuCbMAC0XzAIgSnACrIHsALrWfAEeSwgB7Mi8ADFVtAHKnkABr5x8AMcuWAHkWSgBBeeIA9N+JAOiUlwDi5oQAmTGXAIjtawBfXzYAu/0OAEiatABnpGwAcXJCAI1dMgCfFbgAvOUJAI0xJQD3dDkAMAUcAA0MAQBLCGgALO5YAEeqkAB05wIAvdYkAPd9pgBuSHIAnxbvAI6UpgC0kfYA0VNRAM8K8gAgmDMA9Ut+ALJjaADdPl8AQF0DAIWJfwBVUikAN2TAAG3YEAAySDIAW0x1AE5x1ABFVG4ACwnBACr1aQAUZtUAJwedAF0EUAC0O9sA6nbFAIf5FwBJa30AHSe6AJZpKQDGzKwArRRUAJDiagCI2YkALHJQAASkvgB3B5QA8zBwAAD8JwDqcagAZsJJAGTgPQCX3YMAoz+XAEOU/QANhowAMUHeAJI5nQDdcIwAF7fnAAjfOwAVNysAXICgAFqAkwAQEZIAD+jYAGyArwDb/0sAOJAPAFkYdgBipRUAYcu7AMeJuQAQQL0A0vIEAEl1JwDrtvYA2yK7AAoUqgCJJi8AZIN2AAk7MwAOlBoAUTqqAB2jwgCv7a4AXCYSAG3CTQAtepwAwFaXAAM/gwAJ8PYAK0CMAG0xmQA5tAcADCAVANjDWwD1ksQAxq1LAE7KpQCnN80A5qk2AKuSlADdQmgAGWPeAHaM7wBoi1IA/Ns3AK6hqwDfFTEAAK6hAAz72gBkTWYA7QW3ACllMABXVr8AR/86AGr5uQB1vvMAKJPfAKuAMABmjPYABMsVAPoiBgDZ5B0APbOkAFcbjwA2zQkATkLpABO+pAAzI7UA8KoaAE9lqADSwaUACz8PAFt4zQAj+XYAe4sEAIkXcgDGplMAb27iAO/rAACbSlgAxNq3AKpmugB2z88A0QIdALHxLQCMmcEAw613AIZI2gD3XaAAxoD0AKzwLwDd7JoAP1y8ANDebQCQxx8AKtu2AKMlOgAAr5oArVOTALZXBAApLbQAS4B+ANoHpwB2qg4Ae1mhABYSKgDcty0A+uX9AInb/gCJvv0A5HZsAAap/AA+gHAAhW4VAP2H/wAoPgcAYWczACoYhgBNveoAs+evAI9tbgCVZzkAMb9bAITXSAAw3xYAxy1DACVhNQDJcM4AMMu4AL9s/QCkAKIABWzkAFrdoAAhb0cAYhLSALlchABwYUkAa1bgAJlSAQBQVTcAHtW3ADPxxAATbl8AXTDkAIUuqQAdssMAoTI2AAi3pADqsdQAFvchAI9p5AAn/3cADAOAAI1ALQBPzaAAIKWZALOi0wAvXQoAtPlCABHaywB9vtAAm9vBAKsXvQDKooEACGpcAC5VFwAnAFUAfxTwAOEHhgAUC2QAlkGNAIe+3gDa/SoAayW2AHuJNAAF8/4Aub+eAGhqTwBKKqgAT8RaAC34vADXWpgA9MeVAA1NjQAgOqYApFdfABQ/sQCAOJUAzCABAHHdhgDJ3rYAv2D1AE1lEQABB2sAjLCsALLA0ABRVUgAHvsOAJVywwCjBjsAwEA1AAbcewDgRcwATin6ANbKyADo80EAfGTeAJtk2ADZvjEApJfDAHdY1ABp48UA8NoTALo6PABGGEYAVXVfANK99QBuksYArC5dAA5E7QAcPkIAYcSHACn96QDn1vMAInzKAG+RNQAI4MUA/9eNAG5q4gCw/cYAkwjBAHxddABrrbIAzW6dAD5yewDGEWoA98+pAClz3wC1yboAtwBRAOKyDQB0uiQA5X1gAHTYigANFSwAgRgMAH5mlAABKRYAn3p2AP39vgBWRe8A2X42AOzZEwCLurkAxJf8ADGoJwDxbsMAlMU2ANioVgC0qLUAz8wOABKJLQBvVzQALFaJAJnO4wDWILkAa16qAD4qnAARX8wA/QtKAOH0+wCOO20A4oYsAOnUhAD8tKkA7+7RAC41yQAvOWEAOCFEABvZyACB/AoA+0pqAC8c2ABTtIQATpmMAFQizAAqVdwAwMbWAAsZlgAacLgAaZVkACZaYAA/Uu4AfxEPAPS1EQD8y/UANLwtADS87gDoXcwA3V5gAGeOmwCSM+8AyRe4AGFYmwDhV7wAUYPGANg+EADdcUgALRzdAK8YoQAhLEYAWfPXANl6mACeVMAAT4b6AFYG/ADlea4AiSI2ADitIgBnk9wAVeiqAIImOADK55sAUQ2kAJkzsQCp1w4AaQVIAGWy8AB/iKcAiEyXAPnRNgAhkrMAe4JKAJjPIQBAn9wA3EdVAOF0OgBn60IA/p3fAF7UXwB7Z6QAuqx6AFX2ogAriCMAQbpVAFluCAAhKoYAOUeDAInj5gDlntQASftAAP9W6QAcD8oAxVmKAJT6KwDTwcUAD8XPANtargBHxYYAhUNiACGGOwAseZQAEGGHACpMewCALBoAQ78SAIgmkAB4PIkAqMTkAOXbewDEOsIAJvTqAPdnigANkr8AZaMrAD2TsQC9fAsApFHcACfdYwBp4d0AmpQZAKgplQBozigACe20AESfIABOmMoAcIJjAH58IwAPuTIAp/WOABRW5wAh8QgAtZ0qAG9+TQClGVEAtfmrAILf1gCW3WEAFjYCAMQ6nwCDoqEAcu1tADmNegCCuKkAazJcAEYnWwAANO0A0gB3APz0VQABWU0A4HGAAAAAAAAAAAAAAAAAQPsh+T8AAAAALUR0PgAAAICYRvg8AAAAYFHMeDsAAACAgxvwOQAAAEAgJXo4AAAAgCKC4zYAAAAAHfNpNQAAAAAAAPA/dIUV07DZ7z8PiflsWLXvP1FbEtABk+8/e1F9PLhy7z+quWgxh1TvPzhidW56OO8/4d4f9Z0e7z8VtzEK/gbvP8upOjen8e4/IjQSTKbe7j8tiWFgCM7uPycqNtXav+4/gk+dViu07j8pVEjdB6vuP4VVOrB+pO4/zTt/Zp6g7j90X+zodZ/uP4cB63MUoe4/E85MmYml7j/boCpC5azuP+XFzbA3t+4/kPCjgpHE7j9dJT6yA9XuP63TWpmf6O4/R1778nb/7j+cUoXdmxnvP2mQ79wgN+8/h6T73BhY7z9fm3szl3zvP9qQpKKvpO8/QEVuW3bQ7z8AAAAAAADoQpQjkUv4aqw/88T6UM6/zj/WUgz/Qi7mPwAAAAAAADhD/oIrZUcVR0CUI5FL+Gq8PvPE+lDOvy4/1lIM/0Iulj++8/h57GH2P96qjID3e9W/PYivSu1x9T/bbcCn8L7Sv7AQ8PA5lfQ/ZzpRf64e0L+FA7iwlcnzP+kkgqbYMcu/pWSIDBkN8z9Yd8AKT1fGv6COC3siXvI/AIGcxyuqwb8/NBpKSrvxP14OjM52Trq/uuWK8Fgj8T/MHGFaPJexv6cAmUE/lfA/HgzhOPRSor8AAAAAAADwPwAAAAAAAAAArEea/Yxg7j+EWfJdqqWqP6BqAh+zpOw/tC42qlNevD/m/GpXNiDrPwjbIHflJsU/LaqhY9HC6T9wRyINhsLLP+1BeAPmhug/4X6gyIsF0T9iSFP13GfnPwnutlcwBNQ/7zn6/kIu5j80g7hIow7Qv2oL4AtbV9U/I0EK8v7/37++8/h57GH2PxkwllvG/t6/PYivSu1x9T+k/NQyaAvbv7AQ8PA5lfQ/e7cfCotB17+FA7iwlcnzP3vPbRrpndO/pWSIDBkN8z8xtvLzmx3Qv6COC3siXvI/8Ho7Gx18yb8/NBpKSrvxP588r5Pj+cK/uuWK8Fgj8T9cjXi/y2C5v6cAmUE/lfA/zl9Htp1vqr8AAAAAAADwPwAAAAAAAAAArEea/Yxg7j899SSfyjizP6BqAh+zpOw/upE4VKl2xD/m/GpXNiDrP9LkxEoLhM4/LaqhY9HC6T8cZcbwRQbUP+1BeAPmhug/+J8bLJyO2D9iSFP13GfnP8x7sU6k4Nw/C25JyRZ20j96xnWgaRnXv926p2wKx94/yPa+SEcV578ruCplRxX3PwAAAABgHAEALQAAADkAAAA6AAAATlN0M19fMjE3YmFkX2Z1bmN0aW9uX2NhbGxFAChQAQBEHAEAQFEBAAAAAAAoHgEAOwAAADwAAAA9AAAAPgAAAD8AAABAAAAAQQAAAEIAAABDAAAARAAAAEUAAABGAAAARwAAAEgAAAAIAAAAAAAAAGAeAQBJAAAASgAAAPj////4////YB4BAEsAAABMAAAAuBwBAMwcAQAEAAAAAAAAAKgeAQBNAAAATgAAAPz////8////qB4BAE8AAABQAAAA6BwBAPwcAQAAAAAAPB8BAFEAAABSAAAAUwAAAFQAAABVAAAAVgAAAFcAAABYAAAAWQAAAFoAAABbAAAAXAAAAF0AAABeAAAACAAAAAAAAAB0HwEAXwAAAGAAAAD4////+P///3QfAQBhAAAAYgAAAFgdAQBsHQEABAAAAAAAAAC8HwEAYwAAAGQAAAD8/////P///7wfAQBlAAAAZgAAAIgdAQCcHQEAAAAAAOgdAQBnAAAAaAAAAE5TdDNfXzI5YmFzaWNfaW9zSWNOU18xMWNoYXJfdHJhaXRzSWNFRUVFAAAAKFABALwdAQD4HwEATlN0M19fMjE1YmFzaWNfc3RyZWFtYnVmSWNOU18xMWNoYXJfdHJhaXRzSWNFRUVFAAAAAABQAQD0HQEATlN0M19fMjEzYmFzaWNfaXN0cmVhbUljTlNfMTFjaGFyX3RyYWl0c0ljRUVFRQAAhFABADAeAQAAAAAAAQAAAOgdAQAD9P//TlN0M19fMjEzYmFzaWNfb3N0cmVhbUljTlNfMTFjaGFyX3RyYWl0c0ljRUVFRQAAhFABAHgeAQAAAAAAAQAAAOgdAQAD9P//AAAAAPweAQBpAAAAagAAAE5TdDNfXzI5YmFzaWNfaW9zSXdOU18xMWNoYXJfdHJhaXRzSXdFRUVFAAAAKFABANAeAQD4HwEATlN0M19fMjE1YmFzaWNfc3RyZWFtYnVmSXdOU18xMWNoYXJfdHJhaXRzSXdFRUVFAAAAAABQAQAIHwEATlN0M19fMjEzYmFzaWNfaXN0cmVhbUl3TlNfMTFjaGFyX3RyYWl0c0l3RUVFRQAAhFABAEQfAQAAAAAAAQAAAPweAQAD9P//TlN0M19fMjEzYmFzaWNfb3N0cmVhbUl3TlNfMTFjaGFyX3RyYWl0c0l3RUVFRQAAhFABAIwfAQAAAAAAAQAAAPweAQAD9P//AAAAAPgfAQBrAAAAbAAAAE5TdDNfXzI4aW9zX2Jhc2VFAAAAAFABAOQfAQAQUgEAoFIBADhTAQAAAAAA3hIElQAAAAD///////////////8QIAEAFAAAAEMuVVRGLTgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAkIAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAMADAADABAAAwAUAAMAGAADABwAAwAgAAMAJAADACgAAwAsAAMAMAADADQAAwA4AAMAPAADAEAAAwBEAAMASAADAEwAAwBQAAMAVAADAFgAAwBcAAMAYAADAGQAAwBoAAMAbAADAHAAAwB0AAMAeAADAHwAAwAAAALMBAADDAgAAwwMAAMMEAADDBQAAwwYAAMMHAADDCAAAwwkAAMMKAADDCwAAwwwAAMMNAADTDgAAww8AAMMAAAy7AQAMwwIADMMDAAzDBAAM2wAAAACkIQEAOwAAAHQAAAB1AAAAPgAAAD8AAABAAAAAQQAAAEIAAABDAAAAdgAAAHcAAAB4AAAARwAAAEgAAABOU3QzX18yMTBfX3N0ZGluYnVmSWNFRQAoUAEAjCEBACgeAQAAAAAADCIBADsAAAB5AAAAegAAAD4AAAA/AAAAQAAAAHsAAABCAAAAQwAAAEQAAABFAAAARgAAAHwAAAB9AAAATlN0M19fMjExX19zdGRvdXRidWZJY0VFAAAAAChQAQDwIQEAKB4BAAAAAABwIgEAUQAAAH4AAAB/AAAAVAAAAFUAAABWAAAAVwAAAFgAAABZAAAAgAAAAIEAAACCAAAAXQAAAF4AAABOU3QzX18yMTBfX3N0ZGluYnVmSXdFRQAoUAEAWCIBADwfAQAAAAAA2CIBAFEAAACDAAAAhAAAAFQAAABVAAAAVgAAAIUAAABYAAAAWQAAAFoAAABbAAAAXAAAAIYAAACHAAAATlN0M19fMjExX19zdGRvdXRidWZJd0VFAAAAAChQAQC8IgEAPB8BAAAAAAAAAAAAAAAAANF0ngBXnb0qgHBSD///PicKAAAAZAAAAOgDAAAQJwAAoIYBAEBCDwCAlpgAAOH1BRgAAAA1AAAAcQAAAGv////O+///kr///wAAAAAAAAAA/////////////////////////////////////////////////////////////////wABAgMEBQYHCAn/////////CgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiP///////8KCwwNDg8QERITFBUWFxgZGhscHR4fICEiI/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AAQIEBwMGBQAAAAAAAABMQ19DVFlQRQAAAABMQ19OVU1FUklDAABMQ19USU1FAAAAAABM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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgLgEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAIAAAADAAAABAAAAAUAAAAGAAAABwAAAAgAAAAJAAAACgAAAAsAAAAMAAAADQAAAA4AAAAPAAAAEAAAABEAAAASAAAAEwAAABQAAAAVAAAAFgAAABcAAAAY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AAAAAAAAAAAAAAAAAAAAbgAAAAAAAABvAAAAyFYBAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHEAAAByAAAA2FoBAAAEAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAD/////CgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKBSAQAAAAAABQAAAAAAAAAAAAAAbQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcQAAAG8AAADgXgEAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAP//////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOFMBACVtLyVkLyV5AAAACCVIOiVNOiVTAAAACA==';
    return f;
}

var wasmBinaryFile;

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

function getWasmImports() {
  // prepare imports
  return {
    'env': wasmImports,
    'wasi_snapshot_preview1': wasmImports,
  }
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
function createWasm() {
  var info = getWasmImports();
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

  if (!wasmBinaryFile) wasmBinaryFile = findWasmBinary();

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
  if (typeof globalThis != 'undefined') {
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
  if (typeof globalThis != 'undefined' && !Object.getOwnPropertyDescriptor(globalThis, sym)) {
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

  var stackRestore = (val) => __emscripten_stack_restore(val);

  var stackSave = () => _emscripten_stack_get_current();

  var warnOnce = (text) => {
      warnOnce.shown ||= {};
      if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text);
      }
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
  var ___assert_fail = (condition, filename, line, func) => {
      abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [filename ? UTF8ToString(filename) : 'unknown filename', line, func ? UTF8ToString(func) : 'unknown function']);
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

  var __abort_js = () => {
      abort('native code called abort()');
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
      sig = sig.replace(/p/g, 'i')
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
  
  /** @type {WebAssembly.Table} */
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

  var __emscripten_memcpy_js = (dest, src, num) => HEAPU8.copyWithin(dest, src, src + num);

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
        if (typeof readline == 'function') {
          // Command line.
          result = readline();
          if (result) {
            result += '\n';
          }
        } else
        {}
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
          // update old node (we do this here to avoid each backend 
          // needing to)
          old_node.parent = new_dir;
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
        if ((flags & 64)) {
          mode = typeof mode == 'undefined' ? 438 /* 0666 */ : mode;
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
  getStreamFromFD(fd) {
        var stream = FS.getStreamChecked(fd);
        return stream;
      },
  varargs:undefined,
  getStr(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
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
        if (typeof offset != 'undefined') {
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
        if (typeof offset != 'undefined') {
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
  __assert_fail: ___assert_fail,
  /** @export */
  __cxa_throw: ___cxa_throw,
  /** @export */
  _abort_js: __abort_js,
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
  _emscripten_memcpy_js: __emscripten_memcpy_js,
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
var ___wasm_call_ctors = createExportWrapper('__wasm_call_ctors', 0);
var ___getTypeName = createExportWrapper('__getTypeName', 1);
var _fflush = createExportWrapper('fflush', 1);
var _malloc = Module['_malloc'] = createExportWrapper('malloc', 1);
var _free = createExportWrapper('free', 1);
var _emscripten_stack_init = wasmExports['emscripten_stack_init']
var _emscripten_stack_get_free = wasmExports['emscripten_stack_get_free']
var _emscripten_stack_get_base = wasmExports['emscripten_stack_get_base']
var _emscripten_stack_get_end = wasmExports['emscripten_stack_get_end']
var __emscripten_stack_restore = wasmExports['_emscripten_stack_restore']
var __emscripten_stack_alloc = wasmExports['_emscripten_stack_alloc']
var _emscripten_stack_get_current = wasmExports['emscripten_stack_get_current']
var ___cxa_is_pointer_type = createExportWrapper('__cxa_is_pointer_type', 1);
var dynCall_viijii = Module['dynCall_viijii'] = createExportWrapper('dynCall_viijii', 7);
var dynCall_jiji = Module['dynCall_jiji'] = createExportWrapper('dynCall_jiji', 5);
var dynCall_iiiiij = Module['dynCall_iiiiij'] = createExportWrapper('dynCall_iiiiij', 7);
var dynCall_iiiiijj = Module['dynCall_iiiiijj'] = createExportWrapper('dynCall_iiiiijj', 9);
var dynCall_iiiiiijj = Module['dynCall_iiiiiijj'] = createExportWrapper('dynCall_iiiiiijj', 10);


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
  'stackAlloc',
  'getTempRet0',
  'setTempRet0',
  'exitJS',
  'growMemory',
  'ydayFromDate',
  'inetPton4',
  'inetNtop4',
  'inetPton6',
  'inetNtop6',
  'readSockaddr',
  'writeSockaddr',
  'emscriptenLog',
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
  'getCallstack',
  'convertPCtoSourceLocation',
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
  'stackTrace',
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
  'out',
  'err',
  'callMain',
  'abort',
  'wasmMemory',
  'wasmExports',
  'writeStackCookie',
  'checkStackCookie',
  'intArrayFromBase64',
  'tryParseAsDataURI',
  'convertI32PairToI53Checked',
  'stackSave',
  'stackRestore',
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
  'UNWIND_CACHE',
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
  'FS_createPath',
  'FS_createDevice',
  'FS_readFile',
  'FS',
  'FS_createDataFile',
  'FS_createLazyFile',
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
  'print',
  'printErr',
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

// include: /home/christian/dev/Capture/capture_core/em-es6-module.js
export default Module;// end include: /home/christian/dev/Capture/capture_core/em-es6-module.js

