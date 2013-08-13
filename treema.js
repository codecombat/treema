(function() {
  var WebSocket = window.WebSocket || window.MozWebSocket;
  var br = window.brunch = (window.brunch || {});
  var ar = br['auto-reload'] = (br['auto-reload'] || {});
  if (!WebSocket || ar.disabled) return;

  var cacheBuster = function(url){
    var date = Math.round(Date.now() / 1000).toString();
    url = url.replace(/(\&|\\?)cacheBuster=\d*/, '');
    return url + (url.indexOf('?') >= 0 ? '&' : '?') +'cacheBuster=' + date;
  };

  var reloaders = {
    page: function(){
      window.location.reload(true);
    },

    stylesheet: function(){
      [].slice
        .call(document.querySelectorAll('link[rel="stylesheet"]'))
        .filter(function(link){
          return (link != null && link.href != null);
        })
        .forEach(function(link) {
          link.href = cacheBuster(link.href);
        });
    }
  };
  var port = ar.port || 9485;
  var host = (!br['server']) ? window.location.hostname : br['server'];
  var connection = new WebSocket('ws://' + host + ':' + port);
  connection.onmessage = function(event) {
    var message = event.data;
    if (ar.disabled) return;
    if (reloaders[message] != null) {
      reloaders[message]();
    } else {
      reloaders.page();
    }
  };
})();

;
jade = (function(exports){
/*!
 * Jade - runtime
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Lame Array.isArray() polyfill for now.
 */

if (!Array.isArray) {
  Array.isArray = function(arr){
    return '[object Array]' == Object.prototype.toString.call(arr);
  };
}

/**
 * Lame Object.keys() polyfill for now.
 */

if (!Object.keys) {
  Object.keys = function(obj){
    var arr = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        arr.push(key);
      }
    }
    return arr;
  }
}

/**
 * Merge two attribute objects giving precedence
 * to values in object `b`. Classes are special-cased
 * allowing for arrays and merging/joining appropriately
 * resulting in a string.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api private
 */

exports.merge = function merge(a, b) {
  var ac = a['class'];
  var bc = b['class'];

  if (ac || bc) {
    ac = ac || [];
    bc = bc || [];
    if (!Array.isArray(ac)) ac = [ac];
    if (!Array.isArray(bc)) bc = [bc];
    ac = ac.filter(nulls);
    bc = bc.filter(nulls);
    a['class'] = ac.concat(bc).join(' ');
  }

  for (var key in b) {
    if (key != 'class') {
      a[key] = b[key];
    }
  }

  return a;
};

/**
 * Filter null `val`s.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function nulls(val) {
  return val != null;
}

/**
 * Render the given attributes object.
 *
 * @param {Object} obj
 * @param {Object} escaped
 * @return {String}
 * @api private
 */

exports.attrs = function attrs(obj, escaped){
  var buf = []
    , terse = obj.terse;

  delete obj.terse;
  var keys = Object.keys(obj)
    , len = keys.length;

  if (len) {
    buf.push('');
    for (var i = 0; i < len; ++i) {
      var key = keys[i]
        , val = obj[key];

      if ('boolean' == typeof val || null == val) {
        if (val) {
          terse
            ? buf.push(key)
            : buf.push(key + '="' + key + '"');
        }
      } else if (0 == key.indexOf('data') && 'string' != typeof val) {
        buf.push(key + "='" + JSON.stringify(val) + "'");
      } else if ('class' == key && Array.isArray(val)) {
        buf.push(key + '="' + exports.escape(val.join(' ')) + '"');
      } else if (escaped && escaped[key]) {
        buf.push(key + '="' + exports.escape(val) + '"');
      } else {
        buf.push(key + '="' + val + '"');
      }
    }
  }

  return buf.join(' ');
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

exports.escape = function escape(html){
  return String(html)
    .replace(/&(?!(\w+|\#\d+);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

/**
 * Re-throw the given `err` in context to the
 * the jade in `filename` at the given `lineno`.
 *
 * @param {Error} err
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */

exports.rethrow = function rethrow(err, filename, lineno){
  if (!filename) throw err;

  var context = 3
    , str = require('fs').readFileSync(filename, 'utf8')
    , lines = str.split('\n')
    , start = Math.max(lineno - context, 0)
    , end = Math.min(lines.length, lineno + context);

  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? '  > ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'Jade') + ':' + lineno
    + '\n' + context + '\n\n' + err.message;
  throw err;
};

  return exports;

})({});

;var AnyTreemaNode, ArrayTreemaNode, BooleanTreemaNode, NullTreemaNode, NumberTreemaNode, ObjectTreemaNode, StringTreemaNode, TreemaNode, TreemaNodeMap, makeTreema, _ref, _ref1, _ref2, _ref3, _ref4, _ref5,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

TreemaNode = (function() {
  TreemaNode.prototype.schema = {};

  TreemaNode.prototype.data = null;

  TreemaNode.prototype.options = null;

  TreemaNode.prototype.isChild = false;

  TreemaNode.prototype.nodeTemplate = '<div class="treema-node treema-clearfix"><div class="treema-value"></div></div>';

  TreemaNode.prototype.childrenTemplate = '<div class="treema-children"></div>';

  TreemaNode.prototype.addChildTemplate = '<div class="treema-add-child">+</div>';

  TreemaNode.prototype.newPropertyTemplate = '<input class="treema-new-prop" />';

  TreemaNode.prototype.grabberTemplate = '<span class="treema-grabber"> G </span>';

  TreemaNode.prototype.toggleTemplate = '<span class="treema-toggle"> T </span>';

  TreemaNode.prototype.keyTemplate = '<span class="treema-key"></span>';

  TreemaNode.prototype.templateString = '<div class="treema-error"></div>';

  TreemaNode.prototype.collection = false;

  TreemaNode.prototype.ordered = false;

  TreemaNode.prototype.keyed = false;

  TreemaNode.prototype.editable = true;

  TreemaNode.prototype.skipTab = false;

  TreemaNode.prototype.isValid = function() {
    return tv4.validate(this.data, this.schema);
  };

  TreemaNode.prototype.getErrors = function() {
    return tv4.validateMultiple(this.data, this.schema)['errors'];
  };

  TreemaNode.prototype.getMissing = function() {
    return tv4.validateMultiple(this.data, this.schema)['missing'];
  };

  TreemaNode.prototype.setValueForReading = function(valEl) {
    return console.error('"setValueForReading" has not been overridden.');
  };

  TreemaNode.prototype.setValueForEditing = function(valEl) {
    return console.error('"setValueForEditing" has not been overridden.');
  };

  TreemaNode.prototype.saveChanges = function(valEl) {
    return console.error('"saveChanges" has not been overridden.');
  };

  TreemaNode.prototype.getChildren = function() {
    return console.error('"getChildren" has not been overridden.');
  };

  TreemaNode.prototype.getChildSchema = function() {
    return console.error('"getChildSchema" has not been overridden.');
  };

  TreemaNode.prototype.setValueForReadingSimply = function(valEl, cssClass, text) {
    return valEl.append($("<pre class='" + cssClass + "'></pre>").text(text));
  };

  TreemaNode.prototype.setValueForEditingSimply = function(valEl, value) {
    var input,
      _this = this;
    input = $('<input />');
    if (value !== null) {
      input.val(value);
    }
    valEl.append(input);
    return input.focus().select().blur(function() {
      if ($('.treema-value', _this.$el).hasClass('edit')) {
        return _this.toggleEdit('read');
      }
    });
  };

  function TreemaNode(schema, data, options, isChild) {
    this.schema = schema;
    this.data = data;
    this.isChild = isChild;
    this.sortFromUI = __bind(this.sortFromUI, this);
    this.options = options || {};
  }

  TreemaNode.prototype.build = function() {
    var valEl;
    this.$el = $(this.nodeTemplate);
    valEl = $('.treema-value', this.$el);
    this.setValueForReading(valEl);
    if (!this.collection) {
      valEl.addClass('read');
    }
    this.$el.data('instance', this);
    if (!this.isChild) {
      this.$el.addClass('treema-root');
    }
    if (this.collection) {
      this.$el.append($(this.childrenTemplate)).addClass('closed');
    }
    if (this.collection && !this.isChild) {
      this.open();
    }
    if (!this.isChild) {
      this.setUpEvents();
    }
    return this.$el;
  };

  TreemaNode.prototype.setUpEvents = function() {
    var _this = this;
    this.$el.click(function(e) {
      var _ref;
      return (_ref = $(e.target).closest('.treema-node').data('instance')) != null ? _ref.onClick(e) : void 0;
    });
    return this.$el.keydown(function(e) {
      var _ref;
      return (_ref = $(e.target).closest('.treema-node').data('instance')) != null ? _ref.onKeyDown(e) : void 0;
    });
  };

  TreemaNode.prototype.onClick = function(e) {
    var clickedToggle, clickedValue, _ref;
    if ((_ref = e.target.nodeName) === 'INPUT' || _ref === 'TEXTAREA') {
      return;
    }
    clickedValue = $(e.target).closest('.treema-value').length;
    clickedToggle = $(e.target).hasClass('treema-toggle');
    if (clickedValue && !this.collection) {
      this.toggleEdit();
    }
    if (clickedToggle || (clickedValue && this.collection)) {
      this.toggleOpen();
    }
    if ($(e.target).closest('.treema-add-child').length && this.collection) {
      return this.addNewChild();
    }
  };

  TreemaNode.prototype.onKeyDown = function(e) {
    if (e.which === 27) {
      this.onEscapePressed(e);
    }
    if (e.which === 9) {
      return this.onTabPressed(e);
    }
  };

  TreemaNode.prototype.onEscapePressed = function(e) {
    return $(e.target).data('escaped', true).blur();
  };

  TreemaNode.prototype.onTabPressed = function(e) {
    var direction, nextTreema, target, _ref;
    direction = e.shiftKey ? 'prev' : 'next';
    target = $(e.target);
    if (target.hasClass('treema-new-prop')) {
      e.preventDefault();
      target.blur();
    }
    nextTreema = this.getNextTreema(direction);
    if (nextTreema) {
      nextTreema.toggleEdit('edit');
      return e.preventDefault();
    }
    if ((_ref = this.parent) != null ? _ref.collection : void 0) {
      this.parent.addNewChild();
    }
    return e.preventDefault();
  };

  TreemaNode.prototype.getNextTreema = function(direction) {
    var instance, nextChild;
    nextChild = this.$el[direction]();
    while (true) {
      if (nextChild.length > 0) {
        instance = nextChild.data('instance');
        if (!instance) {
          return;
        }
        if (instance.collection || instance.skipTab) {
          nextChild = nextChild[dir]();
          continue;
        }
      }
      return instance;
    }
  };

  TreemaNode.prototype.toggleEdit = function(toClass) {
    var valEl, wasEditing;
    if (!this.editable) {
      return;
    }
    valEl = $('.treema-value', this.$el);
    wasEditing = valEl.hasClass('edit');
    if (!(toClass && valEl.hasClass(toClass))) {
      valEl.toggleClass('read edit');
    }
    if (valEl.hasClass('read')) {
      if (wasEditing) {
        this.saveChanges(valEl);
        this.refreshErrors();
      }
      this.propagateData();
      valEl.empty();
      this.setValueForReading(valEl);
    }
    if (valEl.hasClass('edit')) {
      valEl.empty();
      return this.setValueForEditing(valEl);
    }
  };

  TreemaNode.prototype.propagateData = function() {
    if (!this.parent) {
      return;
    }
    this.parent.data[this.parentKey] = this.data;
    return this.parent.refreshErrors();
  };

  TreemaNode.prototype.addNewChild = function() {
    var childNode, keyInput, newTreema, new_index, properties, schema,
      _this = this;
    if (this.ordered) {
      new_index = Object.keys(this.childrenTreemas).length;
      schema = this.getChildSchema();
      newTreema = this.addChildTreema(new_index, void 0, schema);
      childNode = this.createChildNode(newTreema);
      this.getMyAddButton().before(childNode);
      newTreema.toggleEdit('edit');
    }
    if (this.keyed) {
      properties = this.childPropertiesAvailable();
      keyInput = $(this.newPropertyTemplate);
      if (typeof keyInput.autocomplete === "function") {
        keyInput.autocomplete({
          source: properties
        });
      }
      this.getMyAddButton().before(keyInput);
      keyInput.focus();
      return keyInput.blur(function(e) {
        var escaped, key;
        console.log('blur');
        key = keyInput.val();
        escaped = keyInput.data('escaped');
        keyInput.remove();
        if (escaped) {
          return;
        }
        if (!(key.length && !_this.childrenTreemas[key])) {
          return;
        }
        schema = _this.getChildSchema(key);
        newTreema = _this.addChildTreema(key, null, schema);
        childNode = _this.createChildNode(newTreema);
        _this.getMyAddButton().before(childNode);
        return newTreema.toggleEdit('edit');
      });
    }
  };

  TreemaNode.prototype.getMyAddButton = function() {
    return this.$el.find('> .treema-children > .treema-add-child');
  };

  TreemaNode.prototype.childPropertiesAvailable = function() {
    var childSchema, properties, property, _ref;
    if (!this.schema.properties) {
      return [];
    }
    properties = [];
    _ref = this.schema.properties;
    for (property in _ref) {
      childSchema = _ref[property];
      if (this.childrenTreemas[property] != null) {
        continue;
      }
      properties.push(childSchema.title || property);
    }
    return properties.sort();
  };

  TreemaNode.prototype.toggleOpen = function() {
    if (this.$el.hasClass('closed')) {
      return this.open();
    } else {
      return this.close();
    }
  };

  TreemaNode.prototype.open = function() {
    var childNode, childrenContainer, key, schema, treema, value, _base, _i, _len, _ref, _ref1;
    childrenContainer = this.$el.find('.treema-children').detach();
    childrenContainer.empty();
    this.childrenTreemas = {};
    _ref = this.getChildren();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      _ref1 = _ref[_i], key = _ref1[0], value = _ref1[1], schema = _ref1[2];
      treema = this.addChildTreema(key, value, schema);
      childNode = this.createChildNode(treema);
      childrenContainer.append(childNode);
    }
    this.$el.append(childrenContainer).removeClass('closed').addClass('open');
    childrenContainer.append($(this.addChildTemplate));
    if (this.ordered && childrenContainer.sortable) {
      if (typeof childrenContainer.sortable === "function") {
        if (typeof (_base = childrenContainer.sortable({
          deactivate: this.sortFromUI
        })).disableSelection === "function") {
          _base.disableSelection();
        }
      }
    }
    return this.refreshErrors();
  };

  TreemaNode.prototype.sortFromUI = function() {
    var child, children_wrapper, index, treema, _i, _len, _ref, _results;
    children_wrapper = this.$el.find('> .treema-children');
    index = 0;
    _ref = children_wrapper[0].children;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      treema = $(child).data('instance');
      if (!treema) {
        continue;
      }
      treema.parentKey = index;
      this.childrenTreemas[index] = treema;
      this.data[index] = treema.data;
      _results.push(index += 1);
    }
    return _results;
  };

  TreemaNode.prototype.close = function() {
    var key, treema, _ref;
    _ref = this.childrenTreemas;
    for (key in _ref) {
      treema = _ref[key];
      this.data[key] = treema.data;
    }
    this.$el.find('.treema-children').empty();
    this.$el.addClass('closed').removeClass('open');
    this.childrenTreemas = null;
    return this.refreshErrors();
  };

  TreemaNode.prototype.addChildTreema = function(key, value, schema) {
    var treema;
    treema = makeTreema(schema, value, {}, true);
    treema.parentKey = key;
    treema.parent = this;
    this.childrenTreemas[key] = treema;
    return treema;
  };

  TreemaNode.prototype.createChildNode = function(treema) {
    var childNode, keyEl, name;
    childNode = treema.build();
    if (this.keyed) {
      name = treema.schema.title || treema.parentKey;
      keyEl = $(this.keyTemplate).text(name + ' : ');
      if (treema.schema.description) {
        keyEl.attr('title', treema.schema.description);
      }
      childNode.prepend(keyEl);
    }
    if (treema.collection) {
      childNode.prepend($(this.toggleTemplate));
    }
    if (this.ordered) {
      childNode.prepend($(this.grabberTemplate));
    }
    return childNode;
  };

  TreemaNode.prototype.refreshErrors = function() {
    this.removeErrors();
    return this.showErrors();
  };

  TreemaNode.prototype.showErrors = function() {
    var deepestTreema, error, erroredTreemas, errors, path, subpath, treema, _i, _j, _k, _len, _len1, _len2, _results;
    errors = this.getErrors();
    erroredTreemas = [];
    for (_i = 0, _len = errors.length; _i < _len; _i++) {
      error = errors[_i];
      path = error.dataPath.split('/').slice(1);
      deepestTreema = this;
      for (_j = 0, _len1 = path.length; _j < _len1; _j++) {
        subpath = path[_j];
        if (!deepestTreema.childrenTreemas) {
          break;
        }
        if (deepestTreema.ordered) {
          subpath = parseInt(subpath);
        }
        deepestTreema = deepestTreema.childrenTreemas[subpath];
      }
      if (!(deepestTreema._errors && __indexOf.call(erroredTreemas, deepestTreema) >= 0)) {
        deepestTreema._errors = [];
      }
      deepestTreema._errors.push(error);
      erroredTreemas.push(deepestTreema);
    }
    _results = [];
    for (_k = 0, _len2 = erroredTreemas.length; _k < _len2; _k++) {
      treema = erroredTreemas[_k];
      if (treema._errors.length > 1) {
        _results.push(treema.showError("[" + treema._errors.length + " errors]"));
      } else {
        _results.push(treema.showError(treema._errors[0].message));
      }
    }
    return _results;
  };

  TreemaNode.prototype.showError = function(message) {
    this.$el.append($(this.templateString));
    this.$el.find('> .treema-error').text(message).show();
    return this.$el.addClass('treema-has-error');
  };

  TreemaNode.prototype.removeErrors = function() {
    this.$el.find('.treema-error').remove();
    return this.$el.removeClass('treema-has-error');
  };

  return TreemaNode;

})();

StringTreemaNode = (function(_super) {
  __extends(StringTreemaNode, _super);

  function StringTreemaNode() {
    _ref = StringTreemaNode.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  StringTreemaNode.prototype.setValueForReading = function(valEl) {
    return this.setValueForReadingSimply(valEl, 'treema-string', "\"" + this.data + "\"");
  };

  StringTreemaNode.prototype.setValueForEditing = function(valEl) {
    return this.setValueForEditingSimply(valEl, this.data);
  };

  StringTreemaNode.prototype.saveChanges = function(valEl) {
    return this.data = $('input', valEl).val();
  };

  return StringTreemaNode;

})(TreemaNode);

NumberTreemaNode = (function(_super) {
  __extends(NumberTreemaNode, _super);

  function NumberTreemaNode() {
    _ref1 = NumberTreemaNode.__super__.constructor.apply(this, arguments);
    return _ref1;
  }

  NumberTreemaNode.prototype.setValueForReading = function(valEl) {
    return this.setValueForReadingSimply(valEl, 'treema-number', JSON.stringify(this.data));
  };

  NumberTreemaNode.prototype.setValueForEditing = function(valEl) {
    return this.setValueForEditingSimply(valEl, JSON.stringify(this.data));
  };

  NumberTreemaNode.prototype.saveChanges = function(valEl) {
    return this.data = parseFloat($('input', valEl).val());
  };

  return NumberTreemaNode;

})(TreemaNode);

NullTreemaNode = (function(_super) {
  __extends(NullTreemaNode, _super);

  function NullTreemaNode() {
    _ref2 = NullTreemaNode.__super__.constructor.apply(this, arguments);
    return _ref2;
  }

  NullTreemaNode.prototype.editable = false;

  NullTreemaNode.prototype.setValueForReading = function(valEl) {
    return this.setValueForReadingSimply(valEl, 'treema-null', 'null');
  };

  return NullTreemaNode;

})(TreemaNode);

BooleanTreemaNode = (function(_super) {
  __extends(BooleanTreemaNode, _super);

  function BooleanTreemaNode() {
    _ref3 = BooleanTreemaNode.__super__.constructor.apply(this, arguments);
    return _ref3;
  }

  BooleanTreemaNode.prototype.skipTab = true;

  BooleanTreemaNode.prototype.setValueForReading = function(valEl) {
    return this.setValueForReadingSimply(valEl, 'treema-boolean', JSON.stringify(this.data));
  };

  BooleanTreemaNode.prototype.onClick = function(e) {
    var value;
    value = $(e.target).closest('.treema-value');
    if (value.length) {
      this.data = !this.data;
      this.setValueForReading($('.treema-value', this.$el).empty());
      return;
    }
    return BooleanTreemaNode.__super__.onClick.call(this, e);
  };

  return BooleanTreemaNode;

})(TreemaNode);

ArrayTreemaNode = (function(_super) {
  __extends(ArrayTreemaNode, _super);

  function ArrayTreemaNode() {
    _ref4 = ArrayTreemaNode.__super__.constructor.apply(this, arguments);
    return _ref4;
  }

  ArrayTreemaNode.prototype.collection = true;

  ArrayTreemaNode.prototype.ordered = true;

  ArrayTreemaNode.prototype.getChildren = function() {
    var key, value, _i, _len, _ref5, _results;
    _ref5 = this.data;
    _results = [];
    for (key = _i = 0, _len = _ref5.length; _i < _len; key = ++_i) {
      value = _ref5[key];
      _results.push([key, value, this.getChildSchema()]);
    }
    return _results;
  };

  ArrayTreemaNode.prototype.getChildSchema = function() {
    return this.schema.items || {};
  };

  ArrayTreemaNode.prototype.setValueForReading = function(valEl) {
    return this.setValueForReadingSimply(valEl, 'treema-array', "[" + this.data.length + "]");
  };

  ArrayTreemaNode.prototype.setValueForEditing = function(valEl) {
    return this.setValueForEditingSimply(valEl, JSON.stringify(this.data));
  };

  return ArrayTreemaNode;

})(TreemaNode);

ObjectTreemaNode = (function(_super) {
  __extends(ObjectTreemaNode, _super);

  function ObjectTreemaNode() {
    _ref5 = ObjectTreemaNode.__super__.constructor.apply(this, arguments);
    return _ref5;
  }

  ObjectTreemaNode.prototype.collection = true;

  ObjectTreemaNode.prototype.keyed = true;

  ObjectTreemaNode.prototype.getChildren = function() {
    var key, value, _ref6, _results;
    _ref6 = this.data;
    _results = [];
    for (key in _ref6) {
      value = _ref6[key];
      _results.push([key, value, this.getChildSchema(key)]);
    }
    return _results;
  };

  ObjectTreemaNode.prototype.getChildSchema = function(key_or_title) {
    var child_schema, key, _ref6;
    _ref6 = this.schema.properties;
    for (key in _ref6) {
      child_schema = _ref6[key];
      if (key === key_or_title || child_schema.title === key_or_title) {
        return child_schema;
      }
    }
    return {};
  };

  ObjectTreemaNode.prototype.setValueForEditing = function(valEl) {
    return this.setValueForEditingSimply(valEl, JSON.stringify(this.data));
  };

  ObjectTreemaNode.prototype.setValueForReading = function(valEl) {
    var size;
    size = Object.keys(this.data).length;
    return this.setValueForReadingSimply(valEl, 'treema-object', "[" + size + "]");
  };

  return ObjectTreemaNode;

})(TreemaNode);

AnyTreemaNode = (function(_super) {
  __extends(AnyTreemaNode, _super);

  "Super flexible input, can handle inputs like:\n  true      -> true\n  'true     -> 'true'\n  'true'    -> 'true'\n  1.2       -> 1.2\n  [         -> []\n  {         -> {}\n  [1,2,3]   -> [1,2,3]\n  null      -> null";

  AnyTreemaNode.prototype.helper = null;

  function AnyTreemaNode() {
    var splat;
    splat = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    AnyTreemaNode.__super__.constructor.apply(this, splat);
    this.updateShadowMethods();
  }

  AnyTreemaNode.prototype.setValueForEditing = function(valEl) {
    return this.setValueForEditingSimply(valEl, JSON.stringify(this.data));
  };

  AnyTreemaNode.prototype.saveChanges = function(valEl) {
    var e;
    this.data = $('input', valEl).val();
    if (this.data[0] === "'" && this.data[this.data.length - 1] !== "'") {
      this.data = this.data.slice(1);
    } else if (this.data[0] === '"' && this.data[this.data.length - 1] !== '"') {
      this.data = this.data.slice(1);
    } else if (this.data.trim() === '[') {
      this.data = [];
    } else if (this.data.trim() === '{') {
      this.data = {};
    } else {
      try {
        this.data = JSON.parse(this.data);
      } catch (_error) {
        e = _error;
        console.log('could not parse data', this.data);
      }
    }
    this.updateShadowMethods();
    return this.rebuild();
  };

  AnyTreemaNode.prototype.updateShadowMethods = function() {
    var NodeClass, dataType, prop, _i, _len, _ref6, _results;
    dataType = $.type(this.data);
    NodeClass = TreemaNodeMap[dataType];
    this.helper = new NodeClass(this.schema, this.data, this.options, this.isChild);
    _ref6 = ['collection', 'ordered', 'keyed', 'getChildSchema', 'getChildren', 'getChildSchema', 'setValueForReading'];
    _results = [];
    for (_i = 0, _len = _ref6.length; _i < _len; _i++) {
      prop = _ref6[_i];
      _results.push(this[prop] = this.helper[prop]);
    }
    return _results;
  };

  AnyTreemaNode.prototype.rebuild = function() {
    var newNode, oldEl;
    oldEl = this.$el;
    if (this.parent) {
      newNode = this.parent.createChildNode(this);
    } else {
      newNode = this.build();
    }
    return oldEl.replaceWith(newNode);
  };

  return AnyTreemaNode;

})(TreemaNode);

TreemaNodeMap = {
  'array': ArrayTreemaNode,
  'string': StringTreemaNode,
  'object': ObjectTreemaNode,
  'number': NumberTreemaNode,
  'null': NullTreemaNode,
  'boolean': BooleanTreemaNode,
  'any': AnyTreemaNode
};

makeTreema = function(schema, data, options, child) {
  var NodeClass;
  NodeClass = TreemaNodeMap[schema.format];
  if (!NodeClass) {
    NodeClass = TreemaNodeMap[schema.type];
  }
  if (!NodeClass) {
    NodeClass = TreemaNodeMap['any'];
  }
  return new NodeClass(schema, data, options, child);
};
;
//@ sourceMappingURL=treema.js.map