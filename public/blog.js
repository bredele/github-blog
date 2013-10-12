
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("visionmedia-page.js/index.js", Function("exports, require, module",
"\n\
;(function(){\n\
\n\
  /**\n\
   * Perform initial dispatch.\n\
   */\n\
\n\
  var dispatch = true;\n\
\n\
  /**\n\
   * Base path.\n\
   */\n\
\n\
  var base = '';\n\
\n\
  /**\n\
   * Running flag.\n\
   */\n\
\n\
  var running;\n\
\n\
  /**\n\
   * Register `path` with callback `fn()`,\n\
   * or route `path`, or `page.start()`.\n\
   *\n\
   *   page(fn);\n\
   *   page('*', fn);\n\
   *   page('/user/:id', load, user);\n\
   *   page('/user/' + user.id, { some: 'thing' });\n\
   *   page('/user/' + user.id);\n\
   *   page();\n\
   *\n\
   * @param {String|Function} path\n\
   * @param {Function} fn...\n\
   * @api public\n\
   */\n\
\n\
  function page(path, fn) {\n\
    // <callback>\n\
    if ('function' == typeof path) {\n\
      return page('*', path);\n\
    }\n\
\n\
    // route <path> to <callback ...>\n\
    if ('function' == typeof fn) {\n\
      var route = new Route(path);\n\
      for (var i = 1; i < arguments.length; ++i) {\n\
        page.callbacks.push(route.middleware(arguments[i]));\n\
      }\n\
    // show <path> with [state]\n\
    } else if ('string' == typeof path) {\n\
      page.show(path, fn);\n\
    // start [options]\n\
    } else {\n\
      page.start(path);\n\
    }\n\
  }\n\
\n\
  /**\n\
   * Callback functions.\n\
   */\n\
\n\
  page.callbacks = [];\n\
\n\
  /**\n\
   * Get or set basepath to `path`.\n\
   *\n\
   * @param {String} path\n\
   * @api public\n\
   */\n\
\n\
  page.base = function(path){\n\
    if (0 == arguments.length) return base;\n\
    base = path;\n\
  };\n\
\n\
  /**\n\
   * Bind with the given `options`.\n\
   *\n\
   * Options:\n\
   *\n\
   *    - `click` bind to click events [true]\n\
   *    - `popstate` bind to popstate [true]\n\
   *    - `dispatch` perform initial dispatch [true]\n\
   *\n\
   * @param {Object} options\n\
   * @api public\n\
   */\n\
\n\
  page.start = function(options){\n\
    options = options || {};\n\
    if (running) return;\n\
    running = true;\n\
    if (false === options.dispatch) dispatch = false;\n\
    if (false !== options.popstate) window.addEventListener('popstate', onpopstate, false);\n\
    if (false !== options.click) window.addEventListener('click', onclick, false);\n\
    if (!dispatch) return;\n\
    var url = location.pathname + location.search + location.hash;\n\
    page.replace(url, null, true, dispatch);\n\
  };\n\
\n\
  /**\n\
   * Unbind click and popstate event handlers.\n\
   *\n\
   * @api public\n\
   */\n\
\n\
  page.stop = function(){\n\
    running = false;\n\
    removeEventListener('click', onclick, false);\n\
    removeEventListener('popstate', onpopstate, false);\n\
  };\n\
\n\
  /**\n\
   * Show `path` with optional `state` object.\n\
   *\n\
   * @param {String} path\n\
   * @param {Object} state\n\
   * @param {Boolean} dispatch\n\
   * @return {Context}\n\
   * @api public\n\
   */\n\
\n\
  page.show = function(path, state, dispatch){\n\
    var ctx = new Context(path, state);\n\
    if (false !== dispatch) page.dispatch(ctx);\n\
    if (!ctx.unhandled) ctx.pushState();\n\
    return ctx;\n\
  };\n\
\n\
  /**\n\
   * Replace `path` with optional `state` object.\n\
   *\n\
   * @param {String} path\n\
   * @param {Object} state\n\
   * @return {Context}\n\
   * @api public\n\
   */\n\
\n\
  page.replace = function(path, state, init, dispatch){\n\
    var ctx = new Context(path, state);\n\
    ctx.init = init;\n\
    if (null == dispatch) dispatch = true;\n\
    if (dispatch) page.dispatch(ctx);\n\
    ctx.save();\n\
    return ctx;\n\
  };\n\
\n\
  /**\n\
   * Dispatch the given `ctx`.\n\
   *\n\
   * @param {Object} ctx\n\
   * @api private\n\
   */\n\
\n\
  page.dispatch = function(ctx){\n\
    var i = 0;\n\
\n\
    function next() {\n\
      var fn = page.callbacks[i++];\n\
      if (!fn) return unhandled(ctx);\n\
      fn(ctx, next);\n\
    }\n\
\n\
    next();\n\
  };\n\
\n\
  /**\n\
   * Unhandled `ctx`. When it's not the initial\n\
   * popstate then redirect. If you wish to handle\n\
   * 404s on your own use `page('*', callback)`.\n\
   *\n\
   * @param {Context} ctx\n\
   * @api private\n\
   */\n\
\n\
  function unhandled(ctx) {\n\
    var current = window.location.pathname + window.location.search;\n\
    if (current == ctx.canonicalPath) return;\n\
    page.stop();\n\
    ctx.unhandled = true;\n\
    window.location = ctx.canonicalPath;\n\
  }\n\
\n\
  /**\n\
   * Initialize a new \"request\" `Context`\n\
   * with the given `path` and optional initial `state`.\n\
   *\n\
   * @param {String} path\n\
   * @param {Object} state\n\
   * @api public\n\
   */\n\
\n\
  function Context(path, state) {\n\
    if ('/' == path[0] && 0 != path.indexOf(base)) path = base + path;\n\
    var i = path.indexOf('?');\n\
\n\
    this.canonicalPath = path;\n\
    this.path = path.replace(base, '') || '/';\n\
\n\
    this.title = document.title;\n\
    this.state = state || {};\n\
    this.state.path = path;\n\
    this.querystring = ~i ? path.slice(i + 1) : '';\n\
    this.pathname = ~i ? path.slice(0, i) : path;\n\
    this.params = [];\n\
\n\
    // fragment\n\
    this.hash = '';\n\
    if (!~this.path.indexOf('#')) return;\n\
    var parts = this.path.split('#');\n\
    this.path = parts[0];\n\
    this.hash = parts[1] || '';\n\
    this.querystring = this.querystring.split('#')[0];\n\
  }\n\
\n\
  /**\n\
   * Expose `Context`.\n\
   */\n\
\n\
  page.Context = Context;\n\
\n\
  /**\n\
   * Push state.\n\
   *\n\
   * @api private\n\
   */\n\
\n\
  Context.prototype.pushState = function(){\n\
    history.pushState(this.state, this.title, this.canonicalPath);\n\
  };\n\
\n\
  /**\n\
   * Save the context state.\n\
   *\n\
   * @api public\n\
   */\n\
\n\
  Context.prototype.save = function(){\n\
    history.replaceState(this.state, this.title, this.canonicalPath);\n\
  };\n\
\n\
  /**\n\
   * Initialize `Route` with the given HTTP `path`,\n\
   * and an array of `callbacks` and `options`.\n\
   *\n\
   * Options:\n\
   *\n\
   *   - `sensitive`    enable case-sensitive routes\n\
   *   - `strict`       enable strict matching for trailing slashes\n\
   *\n\
   * @param {String} path\n\
   * @param {Object} options.\n\
   * @api private\n\
   */\n\
\n\
  function Route(path, options) {\n\
    options = options || {};\n\
    this.path = path;\n\
    this.method = 'GET';\n\
    this.regexp = pathtoRegexp(path\n\
      , this.keys = []\n\
      , options.sensitive\n\
      , options.strict);\n\
  }\n\
\n\
  /**\n\
   * Expose `Route`.\n\
   */\n\
\n\
  page.Route = Route;\n\
\n\
  /**\n\
   * Return route middleware with\n\
   * the given callback `fn()`.\n\
   *\n\
   * @param {Function} fn\n\
   * @return {Function}\n\
   * @api public\n\
   */\n\
\n\
  Route.prototype.middleware = function(fn){\n\
    var self = this;\n\
    return function(ctx, next){\n\
      if (self.match(ctx.path, ctx.params)) return fn(ctx, next);\n\
      next();\n\
    };\n\
  };\n\
\n\
  /**\n\
   * Check if this route matches `path`, if so\n\
   * populate `params`.\n\
   *\n\
   * @param {String} path\n\
   * @param {Array} params\n\
   * @return {Boolean}\n\
   * @api private\n\
   */\n\
\n\
  Route.prototype.match = function(path, params){\n\
    var keys = this.keys\n\
      , qsIndex = path.indexOf('?')\n\
      , pathname = ~qsIndex ? path.slice(0, qsIndex) : path\n\
      , m = this.regexp.exec(pathname);\n\
\n\
    if (!m) return false;\n\
\n\
    for (var i = 1, len = m.length; i < len; ++i) {\n\
      var key = keys[i - 1];\n\
\n\
      var val = 'string' == typeof m[i]\n\
        ? decodeURIComponent(m[i])\n\
        : m[i];\n\
\n\
      if (key) {\n\
        params[key.name] = undefined !== params[key.name]\n\
          ? params[key.name]\n\
          : val;\n\
      } else {\n\
        params.push(val);\n\
      }\n\
    }\n\
\n\
    return true;\n\
  };\n\
\n\
  /**\n\
   * Normalize the given path string,\n\
   * returning a regular expression.\n\
   *\n\
   * An empty array should be passed,\n\
   * which will contain the placeholder\n\
   * key names. For example \"/user/:id\" will\n\
   * then contain [\"id\"].\n\
   *\n\
   * @param  {String|RegExp|Array} path\n\
   * @param  {Array} keys\n\
   * @param  {Boolean} sensitive\n\
   * @param  {Boolean} strict\n\
   * @return {RegExp}\n\
   * @api private\n\
   */\n\
\n\
  function pathtoRegexp(path, keys, sensitive, strict) {\n\
    if (path instanceof RegExp) return path;\n\
    if (path instanceof Array) path = '(' + path.join('|') + ')';\n\
    path = path\n\
      .concat(strict ? '' : '/?')\n\
      .replace(/\\/\\(/g, '(?:/')\n\
      .replace(/(\\/)?(\\.)?:(\\w+)(?:(\\(.*?\\)))?(\\?)?/g, function(_, slash, format, key, capture, optional){\n\
        keys.push({ name: key, optional: !! optional });\n\
        slash = slash || '';\n\
        return ''\n\
          + (optional ? '' : slash)\n\
          + '(?:'\n\
          + (optional ? slash : '')\n\
          + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'\n\
          + (optional || '');\n\
      })\n\
      .replace(/([\\/.])/g, '\\\\$1')\n\
      .replace(/\\*/g, '(.*)');\n\
    return new RegExp('^' + path + '$', sensitive ? '' : 'i');\n\
  }\n\
\n\
  /**\n\
   * Handle \"populate\" events.\n\
   */\n\
\n\
  function onpopstate(e) {\n\
    if (e.state) {\n\
      var path = e.state.path;\n\
      page.replace(path, e.state);\n\
    }\n\
  }\n\
\n\
  /**\n\
   * Handle \"click\" events.\n\
   */\n\
\n\
  function onclick(e) {\n\
    if (1 != which(e)) return;\n\
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;\n\
    if (e.defaultPrevented) return;\n\
\n\
    // ensure link\n\
    var el = e.target;\n\
    while (el && 'A' != el.nodeName) el = el.parentNode;\n\
    if (!el || 'A' != el.nodeName) return;\n\
\n\
    // ensure non-hash for the same path\n\
    var link = el.getAttribute('href');\n\
    if (el.pathname == location.pathname && (el.hash || '#' == link)) return;\n\
\n\
    // check target\n\
    if (el.target) return;\n\
\n\
    // x-origin\n\
    if (!sameOrigin(el.href)) return;\n\
\n\
    // rebuild path\n\
    var path = el.pathname + el.search + (el.hash || '');\n\
\n\
    // same page\n\
    var orig = path + el.hash;\n\
\n\
    path = path.replace(base, '');\n\
    if (base && orig == path) return;\n\
\n\
    e.preventDefault();\n\
    page.show(orig);\n\
  }\n\
\n\
  /**\n\
   * Event button.\n\
   */\n\
\n\
  function which(e) {\n\
    e = e || window.event;\n\
    return null == e.which\n\
      ? e.button\n\
      : e.which;\n\
  }\n\
\n\
  /**\n\
   * Check if `href` is the same origin.\n\
   */\n\
\n\
  function sameOrigin(href) {\n\
    var origin = location.protocol + '//' + location.hostname;\n\
    if (location.port) origin += ':' + location.port;\n\
    return 0 == href.indexOf(origin);\n\
  }\n\
\n\
  /**\n\
   * Expose `page`.\n\
   */\n\
\n\
  if ('undefined' == typeof module) {\n\
    window.page = page;\n\
  } else {\n\
    module.exports = page;\n\
  }\n\
\n\
})();\n\
//@ sourceURL=visionmedia-page.js/index.js"
));
require.register("component-marked/lib/marked.js", Function("exports, require, module",
"/**\n\
 * marked - a markdown parser\n\
 * Copyright (c) 2011-2013, Christopher Jeffrey. (MIT Licensed)\n\
 * https://github.com/chjj/marked\n\
 */\n\
\n\
;(function() {\n\
\n\
/**\n\
 * Block-Level Grammar\n\
 */\n\
\n\
var block = {\n\
  newline: /^\\n\
+/,\n\
  code: /^( {4}[^\\n\
]+\\n\
*)+/,\n\
  fences: noop,\n\
  hr: /^( *[-*_]){3,} *(?:\\n\
+|$)/,\n\
  heading: /^ *(#{1,6}) *([^\\n\
]+?) *#* *(?:\\n\
+|$)/,\n\
  nptable: noop,\n\
  lheading: /^([^\\n\
]+)\\n\
 *(=|-){3,} *\\n\
*/,\n\
  blockquote: /^( *>[^\\n\
]+(\\n\
[^\\n\
]+)*\\n\
*)+/,\n\
  list: /^( *)(bull) [\\s\\S]+?(?:hr|\\n\
{2,}(?! )(?!\\1bull )\\n\
*|\\s*$)/,\n\
  html: /^ *(?:comment|closed|closing) *(?:\\n\
{2,}|\\s*$)/,\n\
  def: /^ *\\[([^\\]]+)\\]: *<?([^\\s>]+)>?(?: +[\"(]([^\\n\
]+)[\")])? *(?:\\n\
+|$)/,\n\
  table: noop,\n\
  paragraph: /^((?:[^\\n\
]+\\n\
?(?!hr|heading|lheading|blockquote|tag|def))+)\\n\
*/,\n\
  text: /^[^\\n\
]+/\n\
};\n\
\n\
block.bullet = /(?:[*+-]|\\d+\\.)/;\n\
block.item = /^( *)(bull) [^\\n\
]*(?:\\n\
(?!\\1bull )[^\\n\
]*)*/;\n\
block.item = replace(block.item, 'gm')\n\
  (/bull/g, block.bullet)\n\
  ();\n\
\n\
block.list = replace(block.list)\n\
  (/bull/g, block.bullet)\n\
  ('hr', /\\n\
+(?=(?: *[-*_]){3,} *(?:\\n\
+|$))/)\n\
  ();\n\
\n\
block._tag = '(?!(?:'\n\
  + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'\n\
  + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'\n\
  + '|span|br|wbr|ins|del|img)\\\\b)\\\\w+(?!:/|@)\\\\b';\n\
\n\
block.html = replace(block.html)\n\
  ('comment', /<!--[\\s\\S]*?-->/)\n\
  ('closed', /<(tag)[\\s\\S]+?<\\/\\1>/)\n\
  ('closing', /<tag(?:\"[^\"]*\"|'[^']*'|[^'\">])*?>/)\n\
  (/tag/g, block._tag)\n\
  ();\n\
\n\
block.paragraph = replace(block.paragraph)\n\
  ('hr', block.hr)\n\
  ('heading', block.heading)\n\
  ('lheading', block.lheading)\n\
  ('blockquote', block.blockquote)\n\
  ('tag', '<' + block._tag)\n\
  ('def', block.def)\n\
  ();\n\
\n\
/**\n\
 * Normal Block Grammar\n\
 */\n\
\n\
block.normal = merge({}, block);\n\
\n\
/**\n\
 * GFM Block Grammar\n\
 */\n\
\n\
block.gfm = merge({}, block.normal, {\n\
  fences: /^ *(`{3,}|~{3,}) *(\\S+)? *\\n\
([\\s\\S]+?)\\s*\\1 *(?:\\n\
+|$)/,\n\
  paragraph: /^/\n\
});\n\
\n\
block.gfm.paragraph = replace(block.paragraph)\n\
  ('(?!', '(?!' + block.gfm.fences.source.replace('\\\\1', '\\\\2') + '|')\n\
  ();\n\
\n\
/**\n\
 * GFM + Tables Block Grammar\n\
 */\n\
\n\
block.tables = merge({}, block.gfm, {\n\
  nptable: /^ *(\\S.*\\|.*)\\n\
 *([-:]+ *\\|[-| :]*)\\n\
((?:.*\\|.*(?:\\n\
|$))*)\\n\
*/,\n\
  table: /^ *\\|(.+)\\n\
 *\\|( *[-:]+[-| :]*)\\n\
((?: *\\|.*(?:\\n\
|$))*)\\n\
*/\n\
});\n\
\n\
/**\n\
 * Block Lexer\n\
 */\n\
\n\
function Lexer(options) {\n\
  this.tokens = [];\n\
  this.tokens.links = {};\n\
  this.options = options || marked.defaults;\n\
  this.rules = block.normal;\n\
\n\
  if (this.options.gfm) {\n\
    if (this.options.tables) {\n\
      this.rules = block.tables;\n\
    } else {\n\
      this.rules = block.gfm;\n\
    }\n\
  }\n\
}\n\
\n\
/**\n\
 * Expose Block Rules\n\
 */\n\
\n\
Lexer.rules = block;\n\
\n\
/**\n\
 * Static Lex Method\n\
 */\n\
\n\
Lexer.lex = function(src, options) {\n\
  var lexer = new Lexer(options);\n\
  return lexer.lex(src);\n\
};\n\
\n\
/**\n\
 * Preprocessing\n\
 */\n\
\n\
Lexer.prototype.lex = function(src) {\n\
  src = src\n\
    .replace(/\\r\\n\
|\\r/g, '\\n\
')\n\
    .replace(/\\t/g, '    ')\n\
    .replace(/\\u00a0/g, ' ')\n\
    .replace(/\\u2424/g, '\\n\
');\n\
\n\
  return this.token(src, true);\n\
};\n\
\n\
/**\n\
 * Lexing\n\
 */\n\
\n\
Lexer.prototype.token = function(src, top) {\n\
  var src = src.replace(/^ +$/gm, '')\n\
    , next\n\
    , loose\n\
    , cap\n\
    , bull\n\
    , b\n\
    , item\n\
    , space\n\
    , i\n\
    , l;\n\
\n\
  while (src) {\n\
    // newline\n\
    if (cap = this.rules.newline.exec(src)) {\n\
      src = src.substring(cap[0].length);\n\
      if (cap[0].length > 1) {\n\
        this.tokens.push({\n\
          type: 'space'\n\
        });\n\
      }\n\
    }\n\
\n\
    // code\n\
    if (cap = this.rules.code.exec(src)) {\n\
      src = src.substring(cap[0].length);\n\
      cap = cap[0].replace(/^ {4}/gm, '');\n\
      this.tokens.push({\n\
        type: 'code',\n\
        text: !this.options.pedantic\n\
          ? cap.replace(/\\n\
+$/, '')\n\
          : cap\n\
      });\n\
      continue;\n\
    }\n\
\n\
    // fences (gfm)\n\
    if (cap = this.rules.fences.exec(src)) {\n\
      src = src.substring(cap[0].length);\n\
      this.tokens.push({\n\
        type: 'code',\n\
        lang: cap[2],\n\
        text: cap[3]\n\
      });\n\
      continue;\n\
    }\n\
\n\
    // heading\n\
    if (cap = this.rules.heading.exec(src)) {\n\
      src = src.substring(cap[0].length);\n\
      this.tokens.push({\n\
        type: 'heading',\n\
        depth: cap[1].length,\n\
        text: cap[2]\n\
      });\n\
      continue;\n\
    }\n\
\n\
    // table no leading pipe (gfm)\n\
    if (top && (cap = this.rules.nptable.exec(src))) {\n\
      src = src.substring(cap[0].length);\n\
\n\
      item = {\n\
        type: 'table',\n\
        header: cap[1].replace(/^ *| *\\| *$/g, '').split(/ *\\| */),\n\
        align: cap[2].replace(/^ *|\\| *$/g, '').split(/ *\\| */),\n\
        cells: cap[3].replace(/\\n\
$/, '').split('\\n\
')\n\
      };\n\
\n\
      for (i = 0; i < item.align.length; i++) {\n\
        if (/^ *-+: *$/.test(item.align[i])) {\n\
          item.align[i] = 'right';\n\
        } else if (/^ *:-+: *$/.test(item.align[i])) {\n\
          item.align[i] = 'center';\n\
        } else if (/^ *:-+ *$/.test(item.align[i])) {\n\
          item.align[i] = 'left';\n\
        } else {\n\
          item.align[i] = null;\n\
        }\n\
      }\n\
\n\
      for (i = 0; i < item.cells.length; i++) {\n\
        item.cells[i] = item.cells[i].split(/ *\\| */);\n\
      }\n\
\n\
      this.tokens.push(item);\n\
\n\
      continue;\n\
    }\n\
\n\
    // lheading\n\
    if (cap = this.rules.lheading.exec(src)) {\n\
      src = src.substring(cap[0].length);\n\
      this.tokens.push({\n\
        type: 'heading',\n\
        depth: cap[2] === '=' ? 1 : 2,\n\
        text: cap[1]\n\
      });\n\
      continue;\n\
    }\n\
\n\
    // hr\n\
    if (cap = this.rules.hr.exec(src)) {\n\
      src = src.substring(cap[0].length);\n\
      this.tokens.push({\n\
        type: 'hr'\n\
      });\n\
      continue;\n\
    }\n\
\n\
    // blockquote\n\
    if (cap = this.rules.blockquote.exec(src)) {\n\
      src = src.substring(cap[0].length);\n\
\n\
      this.tokens.push({\n\
        type: 'blockquote_start'\n\
      });\n\
\n\
      cap = cap[0].replace(/^ *> ?/gm, '');\n\
\n\
      // Pass `top` to keep the current\n\
      // \"toplevel\" state. This is exactly\n\
      // how markdown.pl works.\n\
      this.token(cap, top);\n\
\n\
      this.tokens.push({\n\
        type: 'blockquote_end'\n\
      });\n\
\n\
      continue;\n\
    }\n\
\n\
    // list\n\
    if (cap = this.rules.list.exec(src)) {\n\
      src = src.substring(cap[0].length);\n\
      bull = cap[2];\n\
\n\
      this.tokens.push({\n\
        type: 'list_start',\n\
        ordered: bull.length > 1\n\
      });\n\
\n\
      // Get each top-level item.\n\
      cap = cap[0].match(this.rules.item);\n\
\n\
      next = false;\n\
      l = cap.length;\n\
      i = 0;\n\
\n\
      for (; i < l; i++) {\n\
        item = cap[i];\n\
\n\
        // Remove the list item's bullet\n\
        // so it is seen as the next token.\n\
        space = item.length;\n\
        item = item.replace(/^ *([*+-]|\\d+\\.) +/, '');\n\
\n\
        // Outdent whatever the\n\
        // list item contains. Hacky.\n\
        if (~item.indexOf('\\n\
 ')) {\n\
          space -= item.length;\n\
          item = !this.options.pedantic\n\
            ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')\n\
            : item.replace(/^ {1,4}/gm, '');\n\
        }\n\
\n\
        // Determine whether the next list item belongs here.\n\
        // Backpedal if it does not belong in this list.\n\
        if (this.options.smartLists && i !== l - 1) {\n\
          b = block.bullet.exec(cap[i+1])[0];\n\
          if (bull !== b && !(bull.length > 1 && b.length > 1)) {\n\
            src = cap.slice(i + 1).join('\\n\
') + src;\n\
            i = l - 1;\n\
          }\n\
        }\n\
\n\
        // Determine whether item is loose or not.\n\
        // Use: /(^|\\n\
)(?! )[^\\n\
]+\\n\
\\n\
(?!\\s*$)/\n\
        // for discount behavior.\n\
        loose = next || /\\n\
\\n\
(?!\\s*$)/.test(item);\n\
        if (i !== l - 1) {\n\
          next = item[item.length-1] === '\\n\
';\n\
          if (!loose) loose = next;\n\
        }\n\
\n\
        this.tokens.push({\n\
          type: loose\n\
            ? 'loose_item_start'\n\
            : 'list_item_start'\n\
        });\n\
\n\
        // Recurse.\n\
        this.token(item, false);\n\
\n\
        this.tokens.push({\n\
          type: 'list_item_end'\n\
        });\n\
      }\n\
\n\
      this.tokens.push({\n\
        type: 'list_end'\n\
      });\n\
\n\
      continue;\n\
    }\n\
\n\
    // html\n\
    if (cap = this.rules.html.exec(src)) {\n\
      src = src.substring(cap[0].length);\n\
      this.tokens.push({\n\
        type: this.options.sanitize\n\
          ? 'paragraph'\n\
          : 'html',\n\
        pre: cap[1] === 'pre' || cap[1] === 'script',\n\
        text: cap[0]\n\
      });\n\
      continue;\n\
    }\n\
\n\
    // def\n\
    if (top && (cap = this.rules.def.exec(src))) {\n\
      src = src.substring(cap[0].length);\n\
      this.tokens.links[cap[1].toLowerCase()] = {\n\
        href: cap[2],\n\
        title: cap[3]\n\
      };\n\
      continue;\n\
    }\n\
\n\
    // table (gfm)\n\
    if (top && (cap = this.rules.table.exec(src))) {\n\
      src = src.substring(cap[0].length);\n\
\n\
      item = {\n\
        type: 'table',\n\
        header: cap[1].replace(/^ *| *\\| *$/g, '').split(/ *\\| */),\n\
        align: cap[2].replace(/^ *|\\| *$/g, '').split(/ *\\| */),\n\
        cells: cap[3].replace(/(?: *\\| *)?\\n\
$/, '').split('\\n\
')\n\
      };\n\
\n\
      for (i = 0; i < item.align.length; i++) {\n\
        if (/^ *-+: *$/.test(item.align[i])) {\n\
          item.align[i] = 'right';\n\
        } else if (/^ *:-+: *$/.test(item.align[i])) {\n\
          item.align[i] = 'center';\n\
        } else if (/^ *:-+ *$/.test(item.align[i])) {\n\
          item.align[i] = 'left';\n\
        } else {\n\
          item.align[i] = null;\n\
        }\n\
      }\n\
\n\
      for (i = 0; i < item.cells.length; i++) {\n\
        item.cells[i] = item.cells[i]\n\
          .replace(/^ *\\| *| *\\| *$/g, '')\n\
          .split(/ *\\| */);\n\
      }\n\
\n\
      this.tokens.push(item);\n\
\n\
      continue;\n\
    }\n\
\n\
    // top-level paragraph\n\
    if (top && (cap = this.rules.paragraph.exec(src))) {\n\
      src = src.substring(cap[0].length);\n\
      this.tokens.push({\n\
        type: 'paragraph',\n\
        text: cap[1][cap[1].length-1] === '\\n\
'\n\
          ? cap[1].slice(0, -1)\n\
          : cap[1]\n\
      });\n\
      continue;\n\
    }\n\
\n\
    // text\n\
    if (cap = this.rules.text.exec(src)) {\n\
      // Top-level should never reach here.\n\
      src = src.substring(cap[0].length);\n\
      this.tokens.push({\n\
        type: 'text',\n\
        text: cap[0]\n\
      });\n\
      continue;\n\
    }\n\
\n\
    if (src) {\n\
      throw new\n\
        Error('Infinite loop on byte: ' + src.charCodeAt(0));\n\
    }\n\
  }\n\
\n\
  return this.tokens;\n\
};\n\
\n\
/**\n\
 * Inline-Level Grammar\n\
 */\n\
\n\
var inline = {\n\
  escape: /^\\\\([\\\\`*{}\\[\\]()#+\\-.!_>])/,\n\
  autolink: /^<([^ >]+(@|:\\/)[^ >]+)>/,\n\
  url: noop,\n\
  tag: /^<!--[\\s\\S]*?-->|^<\\/?\\w+(?:\"[^\"]*\"|'[^']*'|[^'\">])*?>/,\n\
  link: /^!?\\[(inside)\\]\\(href\\)/,\n\
  reflink: /^!?\\[(inside)\\]\\s*\\[([^\\]]*)\\]/,\n\
  nolink: /^!?\\[((?:\\[[^\\]]*\\]|[^\\[\\]])*)\\]/,\n\
  strong: /^__([\\s\\S]+?)__(?!_)|^\\*\\*([\\s\\S]+?)\\*\\*(?!\\*)/,\n\
  em: /^\\b_((?:__|[\\s\\S])+?)_\\b|^\\*((?:\\*\\*|[\\s\\S])+?)\\*(?!\\*)/,\n\
  code: /^(`+)\\s*([\\s\\S]*?[^`])\\s*\\1(?!`)/,\n\
  br: /^ {2,}\\n\
(?!\\s*$)/,\n\
  del: noop,\n\
  text: /^[\\s\\S]+?(?=[\\\\<!\\[_*`]| {2,}\\n\
|$)/\n\
};\n\
\n\
inline._inside = /(?:\\[[^\\]]*\\]|[^\\]]|\\](?=[^\\[]*\\]))*/;\n\
inline._href = /\\s*<?([^\\s]*?)>?(?:\\s+['\"]([\\s\\S]*?)['\"])?\\s*/;\n\
\n\
inline.link = replace(inline.link)\n\
  ('inside', inline._inside)\n\
  ('href', inline._href)\n\
  ();\n\
\n\
inline.reflink = replace(inline.reflink)\n\
  ('inside', inline._inside)\n\
  ();\n\
\n\
/**\n\
 * Normal Inline Grammar\n\
 */\n\
\n\
inline.normal = merge({}, inline);\n\
\n\
/**\n\
 * Pedantic Inline Grammar\n\
 */\n\
\n\
inline.pedantic = merge({}, inline.normal, {\n\
  strong: /^__(?=\\S)([\\s\\S]*?\\S)__(?!_)|^\\*\\*(?=\\S)([\\s\\S]*?\\S)\\*\\*(?!\\*)/,\n\
  em: /^_(?=\\S)([\\s\\S]*?\\S)_(?!_)|^\\*(?=\\S)([\\s\\S]*?\\S)\\*(?!\\*)/\n\
});\n\
\n\
/**\n\
 * GFM Inline Grammar\n\
 */\n\
\n\
inline.gfm = merge({}, inline.normal, {\n\
  escape: replace(inline.escape)('])', '~|])')(),\n\
  url: /^(https?:\\/\\/[^\\s<]+[^<.,:;\"')\\]\\s])/,\n\
  del: /^~~(?=\\S)([\\s\\S]*?\\S)~~/,\n\
  text: replace(inline.text)\n\
    (']|', '~]|')\n\
    ('|', '|https?://|')\n\
    ()\n\
});\n\
\n\
/**\n\
 * GFM + Line Breaks Inline Grammar\n\
 */\n\
\n\
inline.breaks = merge({}, inline.gfm, {\n\
  br: replace(inline.br)('{2,}', '*')(),\n\
  text: replace(inline.gfm.text)('{2,}', '*')()\n\
});\n\
\n\
/**\n\
 * Inline Lexer & Compiler\n\
 */\n\
\n\
function InlineLexer(links, options) {\n\
  this.options = options || marked.defaults;\n\
  this.links = links;\n\
  this.rules = inline.normal;\n\
\n\
  if (!this.links) {\n\
    throw new\n\
      Error('Tokens array requires a `links` property.');\n\
  }\n\
\n\
  if (this.options.gfm) {\n\
    if (this.options.breaks) {\n\
      this.rules = inline.breaks;\n\
    } else {\n\
      this.rules = inline.gfm;\n\
    }\n\
  } else if (this.options.pedantic) {\n\
    this.rules = inline.pedantic;\n\
  }\n\
}\n\
\n\
/**\n\
 * Expose Inline Rules\n\
 */\n\
\n\
InlineLexer.rules = inline;\n\
\n\
/**\n\
 * Static Lexing/Compiling Method\n\
 */\n\
\n\
InlineLexer.output = function(src, links, options) {\n\
  var inline = new InlineLexer(links, options);\n\
  return inline.output(src);\n\
};\n\
\n\
/**\n\
 * Lexing/Compiling\n\
 */\n\
\n\
InlineLexer.prototype.output = function(src) {\n\
  var out = ''\n\
    , link\n\
    , text\n\
    , href\n\
    , cap;\n\
\n\
  while (src) {\n\
    // escape\n\
    if (cap = this.rules.escape.exec(src)) {\n\
      src = src.substring(cap[0].length);\n\
      out += cap[1];\n\
      continue;\n\
    }\n\
\n\
    // autolink\n\
    if (cap = this.rules.autolink.exec(src)) {\n\
      src = src.substring(cap[0].length);\n\
      if (cap[2] === '@') {\n\
        text = cap[1][6] === ':'\n\
          ? this.mangle(cap[1].substring(7))\n\
          : this.mangle(cap[1]);\n\
        href = this.mangle('mailto:') + text;\n\
      } else {\n\
        text = escape(cap[1]);\n\
        href = text;\n\
      }\n\
      out += '<a href=\"'\n\
        + href\n\
        + '\">'\n\
        + text\n\
        + '</a>';\n\
      continue;\n\
    }\n\
\n\
    // url (gfm)\n\
    if (cap = this.rules.url.exec(src)) {\n\
      src = src.substring(cap[0].length);\n\
      text = escape(cap[1]);\n\
      href = text;\n\
      out += '<a href=\"'\n\
        + href\n\
        + '\">'\n\
        + text\n\
        + '</a>';\n\
      continue;\n\
    }\n\
\n\
    // tag\n\
    if (cap = this.rules.tag.exec(src)) {\n\
      src = src.substring(cap[0].length);\n\
      out += this.options.sanitize\n\
        ? escape(cap[0])\n\
        : cap[0];\n\
      continue;\n\
    }\n\
\n\
    // link\n\
    if (cap = this.rules.link.exec(src)) {\n\
      src = src.substring(cap[0].length);\n\
      out += this.outputLink(cap, {\n\
        href: cap[2],\n\
        title: cap[3]\n\
      });\n\
      continue;\n\
    }\n\
\n\
    // reflink, nolink\n\
    if ((cap = this.rules.reflink.exec(src))\n\
        || (cap = this.rules.nolink.exec(src))) {\n\
      src = src.substring(cap[0].length);\n\
      link = (cap[2] || cap[1]).replace(/\\s+/g, ' ');\n\
      link = this.links[link.toLowerCase()];\n\
      if (!link || !link.href) {\n\
        out += cap[0][0];\n\
        src = cap[0].substring(1) + src;\n\
        continue;\n\
      }\n\
      out += this.outputLink(cap, link);\n\
      continue;\n\
    }\n\
\n\
    // strong\n\
    if (cap = this.rules.strong.exec(src)) {\n\
      src = src.substring(cap[0].length);\n\
      out += '<strong>'\n\
        + this.output(cap[2] || cap[1])\n\
        + '</strong>';\n\
      continue;\n\
    }\n\
\n\
    // em\n\
    if (cap = this.rules.em.exec(src)) {\n\
      src = src.substring(cap[0].length);\n\
      out += '<em>'\n\
        + this.output(cap[2] || cap[1])\n\
        + '</em>';\n\
      continue;\n\
    }\n\
\n\
    // code\n\
    if (cap = this.rules.code.exec(src)) {\n\
      src = src.substring(cap[0].length);\n\
      out += '<code>'\n\
        + escape(cap[2], true)\n\
        + '</code>';\n\
      continue;\n\
    }\n\
\n\
    // br\n\
    if (cap = this.rules.br.exec(src)) {\n\
      src = src.substring(cap[0].length);\n\
      out += '<br>';\n\
      continue;\n\
    }\n\
\n\
    // del (gfm)\n\
    if (cap = this.rules.del.exec(src)) {\n\
      src = src.substring(cap[0].length);\n\
      out += '<del>'\n\
        + this.output(cap[1])\n\
        + '</del>';\n\
      continue;\n\
    }\n\
\n\
    // text\n\
    if (cap = this.rules.text.exec(src)) {\n\
      src = src.substring(cap[0].length);\n\
      out += escape(this.smartypants(cap[0]));\n\
      continue;\n\
    }\n\
\n\
    if (src) {\n\
      throw new\n\
        Error('Infinite loop on byte: ' + src.charCodeAt(0));\n\
    }\n\
  }\n\
\n\
  return out;\n\
};\n\
\n\
/**\n\
 * Compile Link\n\
 */\n\
\n\
InlineLexer.prototype.outputLink = function(cap, link) {\n\
  if (cap[0][0] !== '!') {\n\
    return '<a href=\"'\n\
      + escape(link.href)\n\
      + '\"'\n\
      + (link.title\n\
      ? ' title=\"'\n\
      + escape(link.title)\n\
      + '\"'\n\
      : '')\n\
      + '>'\n\
      + this.output(cap[1])\n\
      + '</a>';\n\
  } else {\n\
    return '<img src=\"'\n\
      + escape(link.href)\n\
      + '\" alt=\"'\n\
      + escape(cap[1])\n\
      + '\"'\n\
      + (link.title\n\
      ? ' title=\"'\n\
      + escape(link.title)\n\
      + '\"'\n\
      : '')\n\
      + '>';\n\
  }\n\
};\n\
\n\
/**\n\
 * Smartypants Transformations\n\
 */\n\
\n\
InlineLexer.prototype.smartypants = function(text) {\n\
  if (!this.options.smartypants) return text;\n\
  return text\n\
    .replace(/(^|[-\\u2014\\s(\\[\"])'/g, \"$1\\u2018\")       // opening singles\n\
    .replace(/'/g, \"\\u2019\")                            // closing singles & apostrophes\n\
    .replace(/(^|[-\\u2014/\\[(\\u2018\\s])\"/g, \"$1\\u201C\") // opening doubles\n\
    .replace(/\"/g, \"\\u201D\")                            // closing doubles\n\
    .replace(/--/g, \"\\u2014\")                           // em-dashes\n\
    .replace(/\\.{3}/g, '\\u2026');                       // ellipsis\n\
};\n\
\n\
/**\n\
 * Mangle Links\n\
 */\n\
\n\
InlineLexer.prototype.mangle = function(text) {\n\
  var out = ''\n\
    , l = text.length\n\
    , i = 0\n\
    , ch;\n\
\n\
  for (; i < l; i++) {\n\
    ch = text.charCodeAt(i);\n\
    if (Math.random() > 0.5) {\n\
      ch = 'x' + ch.toString(16);\n\
    }\n\
    out += '&#' + ch + ';';\n\
  }\n\
\n\
  return out;\n\
};\n\
\n\
/**\n\
 * Parsing & Compiling\n\
 */\n\
\n\
function Parser(options) {\n\
  this.tokens = [];\n\
  this.token = null;\n\
  this.options = options || marked.defaults;\n\
}\n\
\n\
/**\n\
 * Static Parse Method\n\
 */\n\
\n\
Parser.parse = function(src, options) {\n\
  var parser = new Parser(options);\n\
  return parser.parse(src);\n\
};\n\
\n\
/**\n\
 * Parse Loop\n\
 */\n\
\n\
Parser.prototype.parse = function(src) {\n\
  this.inline = new InlineLexer(src.links, this.options);\n\
  this.tokens = src.reverse();\n\
\n\
  var out = '';\n\
  while (this.next()) {\n\
    out += this.tok();\n\
  }\n\
\n\
  return out;\n\
};\n\
\n\
/**\n\
 * Next Token\n\
 */\n\
\n\
Parser.prototype.next = function() {\n\
  return this.token = this.tokens.pop();\n\
};\n\
\n\
/**\n\
 * Preview Next Token\n\
 */\n\
\n\
Parser.prototype.peek = function() {\n\
  return this.tokens[this.tokens.length-1] || 0;\n\
};\n\
\n\
/**\n\
 * Parse Text Tokens\n\
 */\n\
\n\
Parser.prototype.parseText = function() {\n\
  var body = this.token.text;\n\
\n\
  while (this.peek().type === 'text') {\n\
    body += '\\n\
' + this.next().text;\n\
  }\n\
\n\
  return this.inline.output(body);\n\
};\n\
\n\
/**\n\
 * Parse Current Token\n\
 */\n\
\n\
Parser.prototype.tok = function() {\n\
  switch (this.token.type) {\n\
    case 'space': {\n\
      return '';\n\
    }\n\
    case 'hr': {\n\
      return '<hr>\\n\
';\n\
    }\n\
    case 'heading': {\n\
      return '<h'\n\
        + this.token.depth\n\
        + '>'\n\
        + this.inline.output(this.token.text)\n\
        + '</h'\n\
        + this.token.depth\n\
        + '>\\n\
';\n\
    }\n\
    case 'code': {\n\
      if (this.options.highlight) {\n\
        var code = this.options.highlight(this.token.text, this.token.lang);\n\
        if (code != null && code !== this.token.text) {\n\
          this.token.escaped = true;\n\
          this.token.text = code;\n\
        }\n\
      }\n\
\n\
      if (!this.token.escaped) {\n\
        this.token.text = escape(this.token.text, true);\n\
      }\n\
\n\
      return '<pre><code'\n\
        + (this.token.lang\n\
        ? ' class=\"'\n\
        + this.options.langPrefix\n\
        + this.token.lang\n\
        + '\"'\n\
        : '')\n\
        + '>'\n\
        + this.token.text\n\
        + '</code></pre>\\n\
';\n\
    }\n\
    case 'table': {\n\
      var body = ''\n\
        , heading\n\
        , i\n\
        , row\n\
        , cell\n\
        , j;\n\
\n\
      // header\n\
      body += '<thead>\\n\
<tr>\\n\
';\n\
      for (i = 0; i < this.token.header.length; i++) {\n\
        heading = this.inline.output(this.token.header[i]);\n\
        body += this.token.align[i]\n\
          ? '<th align=\"' + this.token.align[i] + '\">' + heading + '</th>\\n\
'\n\
          : '<th>' + heading + '</th>\\n\
';\n\
      }\n\
      body += '</tr>\\n\
</thead>\\n\
';\n\
\n\
      // body\n\
      body += '<tbody>\\n\
'\n\
      for (i = 0; i < this.token.cells.length; i++) {\n\
        row = this.token.cells[i];\n\
        body += '<tr>\\n\
';\n\
        for (j = 0; j < row.length; j++) {\n\
          cell = this.inline.output(row[j]);\n\
          body += this.token.align[j]\n\
            ? '<td align=\"' + this.token.align[j] + '\">' + cell + '</td>\\n\
'\n\
            : '<td>' + cell + '</td>\\n\
';\n\
        }\n\
        body += '</tr>\\n\
';\n\
      }\n\
      body += '</tbody>\\n\
';\n\
\n\
      return '<table>\\n\
'\n\
        + body\n\
        + '</table>\\n\
';\n\
    }\n\
    case 'blockquote_start': {\n\
      var body = '';\n\
\n\
      while (this.next().type !== 'blockquote_end') {\n\
        body += this.tok();\n\
      }\n\
\n\
      return '<blockquote>\\n\
'\n\
        + body\n\
        + '</blockquote>\\n\
';\n\
    }\n\
    case 'list_start': {\n\
      var type = this.token.ordered ? 'ol' : 'ul'\n\
        , body = '';\n\
\n\
      while (this.next().type !== 'list_end') {\n\
        body += this.tok();\n\
      }\n\
\n\
      return '<'\n\
        + type\n\
        + '>\\n\
'\n\
        + body\n\
        + '</'\n\
        + type\n\
        + '>\\n\
';\n\
    }\n\
    case 'list_item_start': {\n\
      var body = '';\n\
\n\
      while (this.next().type !== 'list_item_end') {\n\
        body += this.token.type === 'text'\n\
          ? this.parseText()\n\
          : this.tok();\n\
      }\n\
\n\
      return '<li>'\n\
        + body\n\
        + '</li>\\n\
';\n\
    }\n\
    case 'loose_item_start': {\n\
      var body = '';\n\
\n\
      while (this.next().type !== 'list_item_end') {\n\
        body += this.tok();\n\
      }\n\
\n\
      return '<li>'\n\
        + body\n\
        + '</li>\\n\
';\n\
    }\n\
    case 'html': {\n\
      return !this.token.pre && !this.options.pedantic\n\
        ? this.inline.output(this.token.text)\n\
        : this.token.text;\n\
    }\n\
    case 'paragraph': {\n\
      return '<p>'\n\
        + this.inline.output(this.token.text)\n\
        + '</p>\\n\
';\n\
    }\n\
    case 'text': {\n\
      return '<p>'\n\
        + this.parseText()\n\
        + '</p>\\n\
';\n\
    }\n\
  }\n\
};\n\
\n\
/**\n\
 * Helpers\n\
 */\n\
\n\
function escape(html, encode) {\n\
  return html\n\
    .replace(!encode ? /&(?!#?\\w+;)/g : /&/g, '&amp;')\n\
    .replace(/</g, '&lt;')\n\
    .replace(/>/g, '&gt;')\n\
    .replace(/\"/g, '&quot;')\n\
    .replace(/'/g, '&#39;');\n\
}\n\
\n\
function replace(regex, opt) {\n\
  regex = regex.source;\n\
  opt = opt || '';\n\
  return function self(name, val) {\n\
    if (!name) return new RegExp(regex, opt);\n\
    val = val.source || val;\n\
    val = val.replace(/(^|[^\\[])\\^/g, '$1');\n\
    regex = regex.replace(name, val);\n\
    return self;\n\
  };\n\
}\n\
\n\
function noop() {}\n\
noop.exec = noop;\n\
\n\
function merge(obj) {\n\
  var i = 1\n\
    , target\n\
    , key;\n\
\n\
  for (; i < arguments.length; i++) {\n\
    target = arguments[i];\n\
    for (key in target) {\n\
      if (Object.prototype.hasOwnProperty.call(target, key)) {\n\
        obj[key] = target[key];\n\
      }\n\
    }\n\
  }\n\
\n\
  return obj;\n\
}\n\
\n\
/**\n\
 * Marked\n\
 */\n\
\n\
function marked(src, opt, callback) {\n\
  if (callback || typeof opt === 'function') {\n\
    if (!callback) {\n\
      callback = opt;\n\
      opt = null;\n\
    }\n\
\n\
    if (opt) opt = merge({}, marked.defaults, opt);\n\
\n\
    var highlight = opt.highlight\n\
      , tokens\n\
      , pending\n\
      , i = 0;\n\
\n\
    try {\n\
      tokens = Lexer.lex(src, opt)\n\
    } catch (e) {\n\
      return callback(e);\n\
    }\n\
\n\
    pending = tokens.length;\n\
\n\
    var done = function(hi) {\n\
      var out, err;\n\
\n\
      if (hi !== true) {\n\
        delete opt.highlight;\n\
      }\n\
\n\
      try {\n\
        out = Parser.parse(tokens, opt);\n\
      } catch (e) {\n\
        err = e;\n\
      }\n\
\n\
      opt.highlight = highlight;\n\
\n\
      return err\n\
        ? callback(err)\n\
        : callback(null, out);\n\
    };\n\
\n\
    if (!highlight || highlight.length < 3) {\n\
      return done(true);\n\
    }\n\
\n\
    if (!pending) return done();\n\
\n\
    for (; i < tokens.length; i++) {\n\
      (function(token) {\n\
        if (token.type !== 'code') {\n\
          return --pending || done();\n\
        }\n\
        return highlight(token.text, token.lang, function(err, code) {\n\
          if (code == null || code === token.text) {\n\
            return --pending || done();\n\
          }\n\
          token.text = code;\n\
          token.escaped = true;\n\
          --pending || done();\n\
        });\n\
      })(tokens[i]);\n\
    }\n\
\n\
    return;\n\
  }\n\
  try {\n\
    if (opt) opt = merge({}, marked.defaults, opt);\n\
    return Parser.parse(Lexer.lex(src, opt), opt);\n\
  } catch (e) {\n\
    e.message += '\\n\
Please report this to https://github.com/chjj/marked.';\n\
    if ((opt || marked.defaults).silent) {\n\
      return '<p>An error occured:</p><pre>'\n\
        + escape(e.message + '', true)\n\
        + '</pre>';\n\
    }\n\
    throw e;\n\
  }\n\
}\n\
\n\
/**\n\
 * Options\n\
 */\n\
\n\
marked.options =\n\
marked.setOptions = function(opt) {\n\
  merge(marked.defaults, opt);\n\
  return marked;\n\
};\n\
\n\
marked.defaults = {\n\
  gfm: true,\n\
  tables: true,\n\
  breaks: false,\n\
  pedantic: false,\n\
  sanitize: false,\n\
  smartLists: false,\n\
  silent: false,\n\
  highlight: null,\n\
  langPrefix: 'lang-',\n\
  smartypants: false\n\
};\n\
\n\
/**\n\
 * Expose\n\
 */\n\
\n\
marked.Parser = Parser;\n\
marked.parser = Parser.parse;\n\
\n\
marked.Lexer = Lexer;\n\
marked.lexer = Lexer.lex;\n\
\n\
marked.InlineLexer = InlineLexer;\n\
marked.inlineLexer = InlineLexer.output;\n\
\n\
marked.parse = marked;\n\
\n\
if (typeof exports === 'object') {\n\
  module.exports = marked;\n\
} else if (typeof define === 'function' && define.amd) {\n\
  define(function() { return marked; });\n\
} else {\n\
  this.marked = marked;\n\
}\n\
\n\
}).call(function() {\n\
  return this || (typeof window !== 'undefined' ? window : global);\n\
}());\n\
//@ sourceURL=component-marked/lib/marked.js"
));
require.register("component-indexof/index.js", Function("exports, require, module",
"module.exports = function(arr, obj){\n\
  if (arr.indexOf) return arr.indexOf(obj);\n\
  for (var i = 0; i < arr.length; ++i) {\n\
    if (arr[i] === obj) return i;\n\
  }\n\
  return -1;\n\
};//@ sourceURL=component-indexof/index.js"
));
require.register("component-emitter/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var index = require('indexof');\n\
\n\
/**\n\
 * Expose `Emitter`.\n\
 */\n\
\n\
module.exports = Emitter;\n\
\n\
/**\n\
 * Initialize a new `Emitter`.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
function Emitter(obj) {\n\
  if (obj) return mixin(obj);\n\
};\n\
\n\
/**\n\
 * Mixin the emitter properties.\n\
 *\n\
 * @param {Object} obj\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function mixin(obj) {\n\
  for (var key in Emitter.prototype) {\n\
    obj[key] = Emitter.prototype[key];\n\
  }\n\
  return obj;\n\
}\n\
\n\
/**\n\
 * Listen on the given `event` with `fn`.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.on = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
  (this._callbacks[event] = this._callbacks[event] || [])\n\
    .push(fn);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Adds an `event` listener that will be invoked a single\n\
 * time then automatically removed.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.once = function(event, fn){\n\
  var self = this;\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  function on() {\n\
    self.off(event, on);\n\
    fn.apply(this, arguments);\n\
  }\n\
\n\
  fn._off = on;\n\
  this.on(event, on);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove the given callback for `event` or all\n\
 * registered callbacks.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.off =\n\
Emitter.prototype.removeListener =\n\
Emitter.prototype.removeAllListeners = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  // all\n\
  if (0 == arguments.length) {\n\
    this._callbacks = {};\n\
    return this;\n\
  }\n\
\n\
  // specific event\n\
  var callbacks = this._callbacks[event];\n\
  if (!callbacks) return this;\n\
\n\
  // remove all handlers\n\
  if (1 == arguments.length) {\n\
    delete this._callbacks[event];\n\
    return this;\n\
  }\n\
\n\
  // remove specific handler\n\
  var i = index(callbacks, fn._off || fn);\n\
  if (~i) callbacks.splice(i, 1);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Emit `event` with the given args.\n\
 *\n\
 * @param {String} event\n\
 * @param {Mixed} ...\n\
 * @return {Emitter}\n\
 */\n\
\n\
Emitter.prototype.emit = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  var args = [].slice.call(arguments, 1)\n\
    , callbacks = this._callbacks[event];\n\
\n\
  if (callbacks) {\n\
    callbacks = callbacks.slice(0);\n\
    for (var i = 0, len = callbacks.length; i < len; ++i) {\n\
      callbacks[i].apply(this, args);\n\
    }\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return array of callbacks for `event`.\n\
 *\n\
 * @param {String} event\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.listeners = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  return this._callbacks[event] || [];\n\
};\n\
\n\
/**\n\
 * Check if this emitter has `event` handlers.\n\
 *\n\
 * @param {String} event\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.hasListeners = function(event){\n\
  return !! this.listeners(event).length;\n\
};\n\
//@ sourceURL=component-emitter/index.js"
));
require.register("RedVentures-reduce/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Reduce `arr` with `fn`.\n\
 *\n\
 * @param {Array} arr\n\
 * @param {Function} fn\n\
 * @param {Mixed} initial\n\
 *\n\
 * TODO: combatible error handling?\n\
 */\n\
\n\
module.exports = function(arr, fn, initial){  \n\
  var idx = 0;\n\
  var len = arr.length;\n\
  var curr = arguments.length == 3\n\
    ? initial\n\
    : arr[idx++];\n\
\n\
  while (idx < len) {\n\
    curr = fn.call(null, curr, arr[idx], ++idx, arr);\n\
  }\n\
  \n\
  return curr;\n\
};//@ sourceURL=RedVentures-reduce/index.js"
));
require.register("visionmedia-superagent/lib/client.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Emitter = require('emitter');\n\
var reduce = require('reduce');\n\
\n\
/**\n\
 * Root reference for iframes.\n\
 */\n\
\n\
var root = 'undefined' == typeof window\n\
  ? this\n\
  : window;\n\
\n\
/**\n\
 * Noop.\n\
 */\n\
\n\
function noop(){};\n\
\n\
/**\n\
 * Check if `obj` is a host object,\n\
 * we don't want to serialize these :)\n\
 *\n\
 * TODO: future proof, move to compoent land\n\
 *\n\
 * @param {Object} obj\n\
 * @return {Boolean}\n\
 * @api private\n\
 */\n\
\n\
function isHost(obj) {\n\
  var str = {}.toString.call(obj);\n\
\n\
  switch (str) {\n\
    case '[object File]':\n\
    case '[object Blob]':\n\
    case '[object FormData]':\n\
      return true;\n\
    default:\n\
      return false;\n\
  }\n\
}\n\
\n\
/**\n\
 * Determine XHR.\n\
 */\n\
\n\
function getXHR() {\n\
  if (root.XMLHttpRequest\n\
    && ('file:' != root.location.protocol || !root.ActiveXObject)) {\n\
    return new XMLHttpRequest;\n\
  } else {\n\
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}\n\
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}\n\
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}\n\
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}\n\
  }\n\
  return false;\n\
}\n\
\n\
/**\n\
 * Removes leading and trailing whitespace, added to support IE.\n\
 *\n\
 * @param {String} s\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
var trim = ''.trim\n\
  ? function(s) { return s.trim(); }\n\
  : function(s) { return s.replace(/(^\\s*|\\s*$)/g, ''); };\n\
\n\
/**\n\
 * Check if `obj` is an object.\n\
 *\n\
 * @param {Object} obj\n\
 * @return {Boolean}\n\
 * @api private\n\
 */\n\
\n\
function isObject(obj) {\n\
  return obj === Object(obj);\n\
}\n\
\n\
/**\n\
 * Serialize the given `obj`.\n\
 *\n\
 * @param {Object} obj\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function serialize(obj) {\n\
  if (!isObject(obj)) return obj;\n\
  var pairs = [];\n\
  for (var key in obj) {\n\
    pairs.push(encodeURIComponent(key)\n\
      + '=' + encodeURIComponent(obj[key]));\n\
  }\n\
  return pairs.join('&');\n\
}\n\
\n\
/**\n\
 * Expose serialization method.\n\
 */\n\
\n\
 request.serializeObject = serialize;\n\
\n\
 /**\n\
  * Parse the given x-www-form-urlencoded `str`.\n\
  *\n\
  * @param {String} str\n\
  * @return {Object}\n\
  * @api private\n\
  */\n\
\n\
function parseString(str) {\n\
  var obj = {};\n\
  var pairs = str.split('&');\n\
  var parts;\n\
  var pair;\n\
\n\
  for (var i = 0, len = pairs.length; i < len; ++i) {\n\
    pair = pairs[i];\n\
    parts = pair.split('=');\n\
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);\n\
  }\n\
\n\
  return obj;\n\
}\n\
\n\
/**\n\
 * Expose parser.\n\
 */\n\
\n\
request.parseString = parseString;\n\
\n\
/**\n\
 * Default MIME type map.\n\
 *\n\
 *     superagent.types.xml = 'application/xml';\n\
 *\n\
 */\n\
\n\
request.types = {\n\
  html: 'text/html',\n\
  json: 'application/json',\n\
  urlencoded: 'application/x-www-form-urlencoded',\n\
  'form': 'application/x-www-form-urlencoded',\n\
  'form-data': 'application/x-www-form-urlencoded'\n\
};\n\
\n\
/**\n\
 * Default serialization map.\n\
 *\n\
 *     superagent.serialize['application/xml'] = function(obj){\n\
 *       return 'generated xml here';\n\
 *     };\n\
 *\n\
 */\n\
\n\
 request.serialize = {\n\
   'application/x-www-form-urlencoded': serialize,\n\
   'application/json': JSON.stringify\n\
 };\n\
\n\
 /**\n\
  * Default parsers.\n\
  *\n\
  *     superagent.parse['application/xml'] = function(str){\n\
  *       return { object parsed from str };\n\
  *     };\n\
  *\n\
  */\n\
\n\
request.parse = {\n\
  'application/x-www-form-urlencoded': parseString,\n\
  'application/json': JSON.parse\n\
};\n\
\n\
/**\n\
 * Parse the given header `str` into\n\
 * an object containing the mapped fields.\n\
 *\n\
 * @param {String} str\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function parseHeader(str) {\n\
  var lines = str.split(/\\r?\\n\
/);\n\
  var fields = {};\n\
  var index;\n\
  var line;\n\
  var field;\n\
  var val;\n\
\n\
  lines.pop(); // trailing CRLF\n\
\n\
  for (var i = 0, len = lines.length; i < len; ++i) {\n\
    line = lines[i];\n\
    index = line.indexOf(':');\n\
    field = line.slice(0, index).toLowerCase();\n\
    val = trim(line.slice(index + 1));\n\
    fields[field] = val;\n\
  }\n\
\n\
  return fields;\n\
}\n\
\n\
/**\n\
 * Return the mime type for the given `str`.\n\
 *\n\
 * @param {String} str\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function type(str){\n\
  return str.split(/ *; */).shift();\n\
};\n\
\n\
/**\n\
 * Return header field parameters.\n\
 *\n\
 * @param {String} str\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function params(str){\n\
  return reduce(str.split(/ *; */), function(obj, str){\n\
    var parts = str.split(/ *= */)\n\
      , key = parts.shift()\n\
      , val = parts.shift();\n\
\n\
    if (key && val) obj[key] = val;\n\
    return obj;\n\
  }, {});\n\
};\n\
\n\
/**\n\
 * Initialize a new `Response` with the given `xhr`.\n\
 *\n\
 *  - set flags (.ok, .error, etc)\n\
 *  - parse header\n\
 *\n\
 * Examples:\n\
 *\n\
 *  Aliasing `superagent` as `request` is nice:\n\
 *\n\
 *      request = superagent;\n\
 *\n\
 *  We can use the promise-like API, or pass callbacks:\n\
 *\n\
 *      request.get('/').end(function(res){});\n\
 *      request.get('/', function(res){});\n\
 *\n\
 *  Sending data can be chained:\n\
 *\n\
 *      request\n\
 *        .post('/user')\n\
 *        .send({ name: 'tj' })\n\
 *        .end(function(res){});\n\
 *\n\
 *  Or passed to `.send()`:\n\
 *\n\
 *      request\n\
 *        .post('/user')\n\
 *        .send({ name: 'tj' }, function(res){});\n\
 *\n\
 *  Or passed to `.post()`:\n\
 *\n\
 *      request\n\
 *        .post('/user', { name: 'tj' })\n\
 *        .end(function(res){});\n\
 *\n\
 * Or further reduced to a single call for simple cases:\n\
 *\n\
 *      request\n\
 *        .post('/user', { name: 'tj' }, function(res){});\n\
 *\n\
 * @param {XMLHTTPRequest} xhr\n\
 * @param {Object} options\n\
 * @api private\n\
 */\n\
\n\
function Response(req, options) {\n\
  options = options || {};\n\
  this.req = req;\n\
  this.xhr = this.req.xhr;\n\
  this.text = this.xhr.responseText;\n\
  this.setStatusProperties(this.xhr.status);\n\
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());\n\
  // getAllResponseHeaders sometimes falsely returns \"\" for CORS requests, but\n\
  // getResponseHeader still works. so we get content-type even if getting\n\
  // other headers fails.\n\
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');\n\
  this.setHeaderProperties(this.header);\n\
  this.body = this.parseBody(this.text);\n\
}\n\
\n\
/**\n\
 * Get case-insensitive `field` value.\n\
 *\n\
 * @param {String} field\n\
 * @return {String}\n\
 * @api public\n\
 */\n\
\n\
Response.prototype.get = function(field){\n\
  return this.header[field.toLowerCase()];\n\
};\n\
\n\
/**\n\
 * Set header related properties:\n\
 *\n\
 *   - `.type` the content type without params\n\
 *\n\
 * A response of \"Content-Type: text/plain; charset=utf-8\"\n\
 * will provide you with a `.type` of \"text/plain\".\n\
 *\n\
 * @param {Object} header\n\
 * @api private\n\
 */\n\
\n\
Response.prototype.setHeaderProperties = function(header){\n\
  // content-type\n\
  var ct = this.header['content-type'] || '';\n\
  this.type = type(ct);\n\
\n\
  // params\n\
  var obj = params(ct);\n\
  for (var key in obj) this[key] = obj[key];\n\
};\n\
\n\
/**\n\
 * Parse the given body `str`.\n\
 *\n\
 * Used for auto-parsing of bodies. Parsers\n\
 * are defined on the `superagent.parse` object.\n\
 *\n\
 * @param {String} str\n\
 * @return {Mixed}\n\
 * @api private\n\
 */\n\
\n\
Response.prototype.parseBody = function(str){\n\
  var parse = request.parse[this.type];\n\
  return parse\n\
    ? parse(str)\n\
    : null;\n\
};\n\
\n\
/**\n\
 * Set flags such as `.ok` based on `status`.\n\
 *\n\
 * For example a 2xx response will give you a `.ok` of __true__\n\
 * whereas 5xx will be __false__ and `.error` will be __true__. The\n\
 * `.clientError` and `.serverError` are also available to be more\n\
 * specific, and `.statusType` is the class of error ranging from 1..5\n\
 * sometimes useful for mapping respond colors etc.\n\
 *\n\
 * \"sugar\" properties are also defined for common cases. Currently providing:\n\
 *\n\
 *   - .noContent\n\
 *   - .badRequest\n\
 *   - .unauthorized\n\
 *   - .notAcceptable\n\
 *   - .notFound\n\
 *\n\
 * @param {Number} status\n\
 * @api private\n\
 */\n\
\n\
Response.prototype.setStatusProperties = function(status){\n\
  var type = status / 100 | 0;\n\
\n\
  // status / class\n\
  this.status = status;\n\
  this.statusType = type;\n\
\n\
  // basics\n\
  this.info = 1 == type;\n\
  this.ok = 2 == type;\n\
  this.clientError = 4 == type;\n\
  this.serverError = 5 == type;\n\
  this.error = (4 == type || 5 == type)\n\
    ? this.toError()\n\
    : false;\n\
\n\
  // sugar\n\
  this.accepted = 202 == status;\n\
  this.noContent = 204 == status || 1223 == status;\n\
  this.badRequest = 400 == status;\n\
  this.unauthorized = 401 == status;\n\
  this.notAcceptable = 406 == status;\n\
  this.notFound = 404 == status;\n\
  this.forbidden = 403 == status;\n\
};\n\
\n\
/**\n\
 * Return an `Error` representative of this response.\n\
 *\n\
 * @return {Error}\n\
 * @api public\n\
 */\n\
\n\
Response.prototype.toError = function(){\n\
  var req = this.req;\n\
  var method = req.method;\n\
  var path = req.path;\n\
\n\
  var msg = 'cannot ' + method + ' ' + path + ' (' + this.status + ')';\n\
  var err = new Error(msg);\n\
  err.status = this.status;\n\
  err.method = method;\n\
  err.path = path;\n\
\n\
  return err;\n\
};\n\
\n\
/**\n\
 * Expose `Response`.\n\
 */\n\
\n\
request.Response = Response;\n\
\n\
/**\n\
 * Initialize a new `Request` with the given `method` and `url`.\n\
 *\n\
 * @param {String} method\n\
 * @param {String} url\n\
 * @api public\n\
 */\n\
\n\
function Request(method, url) {\n\
  var self = this;\n\
  Emitter.call(this);\n\
  this._query = this._query || [];\n\
  this.method = method;\n\
  this.url = url;\n\
  this.header = {};\n\
  this._header = {};\n\
  this.on('end', function(){\n\
    var res = new Response(self);\n\
    if ('HEAD' == method) res.text = null;\n\
    self.callback(null, res);\n\
  });\n\
}\n\
\n\
/**\n\
 * Mixin `Emitter`.\n\
 */\n\
\n\
Emitter(Request.prototype);\n\
\n\
/**\n\
 * Set timeout to `ms`.\n\
 *\n\
 * @param {Number} ms\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.timeout = function(ms){\n\
  this._timeout = ms;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Clear previous timeout.\n\
 *\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.clearTimeout = function(){\n\
  this._timeout = 0;\n\
  clearTimeout(this._timer);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Abort the request, and clear potential timeout.\n\
 *\n\
 * @return {Request}\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.abort = function(){\n\
  if (this.aborted) return;\n\
  this.aborted = true;\n\
  this.xhr.abort();\n\
  this.clearTimeout();\n\
  this.emit('abort');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set header `field` to `val`, or multiple fields with one object.\n\
 *\n\
 * Examples:\n\
 *\n\
 *      req.get('/')\n\
 *        .set('Accept', 'application/json')\n\
 *        .set('X-API-Key', 'foobar')\n\
 *        .end(callback);\n\
 *\n\
 *      req.get('/')\n\
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })\n\
 *        .end(callback);\n\
 *\n\
 * @param {String|Object} field\n\
 * @param {String} val\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.set = function(field, val){\n\
  if (isObject(field)) {\n\
    for (var key in field) {\n\
      this.set(key, field[key]);\n\
    }\n\
    return this;\n\
  }\n\
  this._header[field.toLowerCase()] = val;\n\
  this.header[field] = val;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Get case-insensitive header `field` value.\n\
 *\n\
 * @param {String} field\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
Request.prototype.getHeader = function(field){\n\
  return this._header[field.toLowerCase()];\n\
};\n\
\n\
/**\n\
 * Set Content-Type to `type`, mapping values from `request.types`.\n\
 *\n\
 * Examples:\n\
 *\n\
 *      superagent.types.xml = 'application/xml';\n\
 *\n\
 *      request.post('/')\n\
 *        .type('xml')\n\
 *        .send(xmlstring)\n\
 *        .end(callback);\n\
 *\n\
 *      request.post('/')\n\
 *        .type('application/xml')\n\
 *        .send(xmlstring)\n\
 *        .end(callback);\n\
 *\n\
 * @param {String} type\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.type = function(type){\n\
  this.set('Content-Type', request.types[type] || type);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set Authorization field value with `user` and `pass`.\n\
 *\n\
 * @param {String} user\n\
 * @param {String} pass\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.auth = function(user, pass){\n\
  var str = btoa(user + ':' + pass);\n\
  this.set('Authorization', 'Basic ' + str);\n\
  return this;\n\
};\n\
\n\
/**\n\
* Add query-string `val`.\n\
*\n\
* Examples:\n\
*\n\
*   request.get('/shoes')\n\
*     .query('size=10')\n\
*     .query({ color: 'blue' })\n\
*\n\
* @param {Object|String} val\n\
* @return {Request} for chaining\n\
* @api public\n\
*/\n\
\n\
Request.prototype.query = function(val){\n\
  if ('string' != typeof val) val = serialize(val);\n\
  if (val) this._query.push(val);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Send `data`, defaulting the `.type()` to \"json\" when\n\
 * an object is given.\n\
 *\n\
 * Examples:\n\
 *\n\
 *       // querystring\n\
 *       request.get('/search')\n\
 *         .end(callback)\n\
 *\n\
 *       // multiple data \"writes\"\n\
 *       request.get('/search')\n\
 *         .send({ search: 'query' })\n\
 *         .send({ range: '1..5' })\n\
 *         .send({ order: 'desc' })\n\
 *         .end(callback)\n\
 *\n\
 *       // manual json\n\
 *       request.post('/user')\n\
 *         .type('json')\n\
 *         .send('{\"name\":\"tj\"})\n\
 *         .end(callback)\n\
 *\n\
 *       // auto json\n\
 *       request.post('/user')\n\
 *         .send({ name: 'tj' })\n\
 *         .end(callback)\n\
 *\n\
 *       // manual x-www-form-urlencoded\n\
 *       request.post('/user')\n\
 *         .type('form')\n\
 *         .send('name=tj')\n\
 *         .end(callback)\n\
 *\n\
 *       // auto x-www-form-urlencoded\n\
 *       request.post('/user')\n\
 *         .type('form')\n\
 *         .send({ name: 'tj' })\n\
 *         .end(callback)\n\
 *\n\
 *       // defaults to x-www-form-urlencoded\n\
  *      request.post('/user')\n\
  *        .send('name=tobi')\n\
  *        .send('species=ferret')\n\
  *        .end(callback)\n\
 *\n\
 * @param {String|Object} data\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.send = function(data){\n\
  var obj = isObject(data);\n\
  var type = this.getHeader('Content-Type');\n\
\n\
  // merge\n\
  if (obj && isObject(this._data)) {\n\
    for (var key in data) {\n\
      this._data[key] = data[key];\n\
    }\n\
  } else if ('string' == typeof data) {\n\
    if (!type) this.type('form');\n\
    type = this.getHeader('Content-Type');\n\
    if ('application/x-www-form-urlencoded' == type) {\n\
      this._data = this._data\n\
        ? this._data + '&' + data\n\
        : data;\n\
    } else {\n\
      this._data = (this._data || '') + data;\n\
    }\n\
  } else {\n\
    this._data = data;\n\
  }\n\
\n\
  if (!obj) return this;\n\
  if (!type) this.type('json');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Invoke the callback with `err` and `res`\n\
 * and handle arity check.\n\
 *\n\
 * @param {Error} err\n\
 * @param {Response} res\n\
 * @api private\n\
 */\n\
\n\
Request.prototype.callback = function(err, res){\n\
  var fn = this._callback;\n\
  if (2 == fn.length) return fn(err, res);\n\
  if (err) return this.emit('error', err);\n\
  fn(res);\n\
};\n\
\n\
/**\n\
 * Invoke callback with x-domain error.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Request.prototype.crossDomainError = function(){\n\
  var err = new Error('Origin is not allowed by Access-Control-Allow-Origin');\n\
  err.crossDomain = true;\n\
  this.callback(err);\n\
};\n\
\n\
/**\n\
 * Invoke callback with timeout error.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Request.prototype.timeoutError = function(){\n\
  var timeout = this._timeout;\n\
  var err = new Error('timeout of ' + timeout + 'ms exceeded');\n\
  err.timeout = timeout;\n\
  this.callback(err);\n\
};\n\
\n\
/**\n\
 * Enable transmission of cookies with x-domain requests.\n\
 *\n\
 * Note that for this to work the origin must not be\n\
 * using \"Access-Control-Allow-Origin\" with a wildcard,\n\
 * and also must set \"Access-Control-Allow-Credentials\"\n\
 * to \"true\".\n\
 *\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.withCredentials = function(){\n\
  this._withCredentials = true;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Initiate request, invoking callback `fn(res)`\n\
 * with an instanceof `Response`.\n\
 *\n\
 * @param {Function} fn\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.end = function(fn){\n\
  var self = this;\n\
  var xhr = this.xhr = getXHR();\n\
  var query = this._query.join('&');\n\
  var timeout = this._timeout;\n\
  var data = this._data;\n\
\n\
  // store callback\n\
  this._callback = fn || noop;\n\
\n\
  // CORS\n\
  if (this._withCredentials) xhr.withCredentials = true;\n\
\n\
  // state change\n\
  xhr.onreadystatechange = function(){\n\
    if (4 != xhr.readyState) return;\n\
    if (0 == xhr.status) {\n\
      if (self.aborted) return self.timeoutError();\n\
      return self.crossDomainError();\n\
    }\n\
    self.emit('end');\n\
  };\n\
\n\
  // progress\n\
  if (xhr.upload) {\n\
    xhr.upload.onprogress = function(e){\n\
      e.percent = e.loaded / e.total * 100;\n\
      self.emit('progress', e);\n\
    };\n\
  }\n\
\n\
  // timeout\n\
  if (timeout && !this._timer) {\n\
    this._timer = setTimeout(function(){\n\
      self.abort();\n\
    }, timeout);\n\
  }\n\
\n\
  // querystring\n\
  if (query) {\n\
    query = request.serializeObject(query);\n\
    this.url += ~this.url.indexOf('?')\n\
      ? '&' + query\n\
      : '?' + query;\n\
  }\n\
\n\
  // initiate request\n\
  xhr.open(this.method, this.url, true);\n\
\n\
  // body\n\
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {\n\
    // serialize stuff\n\
    var serialize = request.serialize[this.getHeader('Content-Type')];\n\
    if (serialize) data = serialize(data);\n\
  }\n\
\n\
  // set header fields\n\
  for (var field in this.header) {\n\
    if (null == this.header[field]) continue;\n\
    xhr.setRequestHeader(field, this.header[field]);\n\
  }\n\
\n\
  // send stuff\n\
  xhr.send(data);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Expose `Request`.\n\
 */\n\
\n\
request.Request = Request;\n\
\n\
/**\n\
 * Issue a request:\n\
 *\n\
 * Examples:\n\
 *\n\
 *    request('GET', '/users').end(callback)\n\
 *    request('/users').end(callback)\n\
 *    request('/users', callback)\n\
 *\n\
 * @param {String} method\n\
 * @param {String|Function} url or callback\n\
 * @return {Request}\n\
 * @api public\n\
 */\n\
\n\
function request(method, url) {\n\
  // callback\n\
  if ('function' == typeof url) {\n\
    return new Request('GET', method).end(url);\n\
  }\n\
\n\
  // url first\n\
  if (1 == arguments.length) {\n\
    return new Request('GET', method);\n\
  }\n\
\n\
  return new Request(method, url);\n\
}\n\
\n\
/**\n\
 * GET `url` with optional callback `fn(res)`.\n\
 *\n\
 * @param {String} url\n\
 * @param {Mixed|Function} data or fn\n\
 * @param {Function} fn\n\
 * @return {Request}\n\
 * @api public\n\
 */\n\
\n\
request.get = function(url, data, fn){\n\
  var req = request('GET', url);\n\
  if ('function' == typeof data) fn = data, data = null;\n\
  if (data) req.query(data);\n\
  if (fn) req.end(fn);\n\
  return req;\n\
};\n\
\n\
/**\n\
 * GET `url` with optional callback `fn(res)`.\n\
 *\n\
 * @param {String} url\n\
 * @param {Mixed|Function} data or fn\n\
 * @param {Function} fn\n\
 * @return {Request}\n\
 * @api public\n\
 */\n\
\n\
request.head = function(url, data, fn){\n\
  var req = request('HEAD', url);\n\
  if ('function' == typeof data) fn = data, data = null;\n\
  if (data) req.send(data);\n\
  if (fn) req.end(fn);\n\
  return req;\n\
};\n\
\n\
/**\n\
 * DELETE `url` with optional callback `fn(res)`.\n\
 *\n\
 * @param {String} url\n\
 * @param {Function} fn\n\
 * @return {Request}\n\
 * @api public\n\
 */\n\
\n\
request.del = function(url, fn){\n\
  var req = request('DELETE', url);\n\
  if (fn) req.end(fn);\n\
  return req;\n\
};\n\
\n\
/**\n\
 * PATCH `url` with optional `data` and callback `fn(res)`.\n\
 *\n\
 * @param {String} url\n\
 * @param {Mixed} data\n\
 * @param {Function} fn\n\
 * @return {Request}\n\
 * @api public\n\
 */\n\
\n\
request.patch = function(url, data, fn){\n\
  var req = request('PATCH', url);\n\
  if ('function' == typeof data) fn = data, data = null;\n\
  if (data) req.send(data);\n\
  if (fn) req.end(fn);\n\
  return req;\n\
};\n\
\n\
/**\n\
 * POST `url` with optional `data` and callback `fn(res)`.\n\
 *\n\
 * @param {String} url\n\
 * @param {Mixed} data\n\
 * @param {Function} fn\n\
 * @return {Request}\n\
 * @api public\n\
 */\n\
\n\
request.post = function(url, data, fn){\n\
  var req = request('POST', url);\n\
  if ('function' == typeof data) fn = data, data = null;\n\
  if (data) req.send(data);\n\
  if (fn) req.end(fn);\n\
  return req;\n\
};\n\
\n\
/**\n\
 * PUT `url` with optional `data` and callback `fn(res)`.\n\
 *\n\
 * @param {String} url\n\
 * @param {Mixed|Function} data or fn\n\
 * @param {Function} fn\n\
 * @return {Request}\n\
 * @api public\n\
 */\n\
\n\
request.put = function(url, data, fn){\n\
  var req = request('PUT', url);\n\
  if ('function' == typeof data) fn = data, data = null;\n\
  if (data) req.send(data);\n\
  if (fn) req.end(fn);\n\
  return req;\n\
};\n\
\n\
/**\n\
 * Expose `request`.\n\
 */\n\
\n\
module.exports = request;\n\
//@ sourceURL=visionmedia-superagent/lib/client.js"
));
require.register("ForbesLindesay-utf8-decode/index.js", Function("exports, require, module",
"module.exports = decode;\n\
\n\
function decode(utftext) {\n\
    var string = \"\";\n\
    var i = 0;\n\
    var c, c1, c2, c3;\n\
    c = c1 = c2 = 0;\n\
\n\
    while (i < utftext.length) {\n\
\n\
        c = utftext.charCodeAt(i);\n\
\n\
        if (c < 128) {\n\
            string += String.fromCharCode(c);\n\
            i++;\n\
        }\n\
        else if ((c > 191) && (c < 224)) {\n\
            c2 = utftext.charCodeAt(i + 1);\n\
            string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));\n\
            i += 2;\n\
        }\n\
        else {\n\
            c2 = utftext.charCodeAt(i + 1);\n\
            c3 = utftext.charCodeAt(i + 2);\n\
            string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));\n\
            i += 3;\n\
        }\n\
\n\
    }\n\
\n\
    return string;\n\
}//@ sourceURL=ForbesLindesay-utf8-decode/index.js"
));
require.register("ForbesLindesay-base64-decode/index.js", Function("exports, require, module",
"var utf8Decode = require('utf8-decode');\n\
var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';\n\
\n\
module.exports = decode;\n\
function decode(input) {\n\
    var output = '';\n\
    var chr1, chr2, chr3;\n\
    var enc1, enc2, enc3, enc4;\n\
    var i = 0;\n\
\n\
    input = input.replace(/[^A-Za-z0-9\\+\\/\\=]/g, '');\n\
\n\
    while (i < input.length) {\n\
\n\
        enc1 = keyStr.indexOf(input.charAt(i++));\n\
        enc2 = keyStr.indexOf(input.charAt(i++));\n\
        enc3 = keyStr.indexOf(input.charAt(i++));\n\
        enc4 = keyStr.indexOf(input.charAt(i++));\n\
\n\
        chr1 = (enc1 << 2) | (enc2 >> 4);\n\
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);\n\
        chr3 = ((enc3 & 3) << 6) | enc4;\n\
\n\
        output = output + String.fromCharCode(chr1);\n\
\n\
        if (enc3 != 64) {\n\
            output = output + String.fromCharCode(chr2);\n\
        }\n\
        if (enc4 != 64) {\n\
            output = output + String.fromCharCode(chr3);\n\
        }\n\
\n\
    }\n\
\n\
    output = utf8Decode(output);\n\
\n\
    return output;\n\
\n\
}//@ sourceURL=ForbesLindesay-base64-decode/index.js"
));
require.register("proxy/index.js", Function("exports, require, module",
"var request = require('superagent');\n\
var decode = require('base64-decode');\n\
\n\
module.exports.load = function(){\n\
\trequest.get('https://api.github.com/repos/bredele/store/contents/test/store.js', function(error, res){\n\
\t\tvar json = JSON.parse(res.text);\n\
\t\tdocument.body.innerText = decode(json.content);\n\
\t});\n\
};//@ sourceURL=proxy/index.js"
));
require.register("router/index.js", Function("exports, require, module",
"var page = require('page');\n\
var proxy = require('proxy');\n\
\n\
// page('/', user.list);\n\
// page('/blog/:repo', proxy.load, user.show);\n\
// page('/blog/:repo/:id', proxy.load, user.edit);\n\
// page('*', notfound);\n\
\n\
page('/', proxy.load);\n\
page();\n\
//@ sourceURL=router/index.js"
));





require.alias("router/index.js", "github-blog/deps/router/index.js");
require.alias("router/index.js", "github-blog/deps/router/index.js");
require.alias("router/index.js", "router/index.js");
require.alias("visionmedia-page.js/index.js", "router/deps/page/index.js");

require.alias("proxy/index.js", "router/deps/proxy/index.js");
require.alias("proxy/index.js", "router/deps/proxy/index.js");
require.alias("component-marked/lib/marked.js", "proxy/deps/marked/lib/marked.js");
require.alias("component-marked/lib/marked.js", "proxy/deps/marked/index.js");
require.alias("component-marked/lib/marked.js", "component-marked/index.js");
require.alias("visionmedia-superagent/lib/client.js", "proxy/deps/superagent/lib/client.js");
require.alias("visionmedia-superagent/lib/client.js", "proxy/deps/superagent/index.js");
require.alias("component-emitter/index.js", "visionmedia-superagent/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("RedVentures-reduce/index.js", "visionmedia-superagent/deps/reduce/index.js");

require.alias("visionmedia-superagent/lib/client.js", "visionmedia-superagent/index.js");
require.alias("ForbesLindesay-base64-decode/index.js", "proxy/deps/base64-decode/index.js");
require.alias("ForbesLindesay-utf8-decode/index.js", "ForbesLindesay-base64-decode/deps/utf8-decode/index.js");

require.alias("proxy/index.js", "proxy/index.js");
require.alias("router/index.js", "router/index.js");