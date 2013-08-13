var AnyTreemaNode, ArrayTreemaNode, BooleanTreemaNode, NullTreemaNode, NumberTreemaNode, ObjectTreemaNode, StringTreemaNode, TreemaNode, TreemaNodeMap, makeTreema, _ref, _ref1, _ref2, _ref3, _ref4, _ref5,
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
    input.focus().select().blur(function() {
      if ($('.treema-value', _this.$el).hasClass('treema-edit')) {
        return _this.toggleEdit('treema-read');
      }
    });
    return input.keydown(function(e) {
      if (e.which === 8 && !$(input).val()) {
        return _this.remove();
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
      valEl.addClass('treema-read');
    }
    this.$el.data('instance', this);
    if (!this.isChild) {
      this.$el.addClass('treema-root');
    }
    if (!this.isChild) {
      this.$el.attr('tabindex', 9001);
    }
    if (this.collection) {
      this.$el.append($(this.childrenTemplate)).addClass('treema-closed');
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
    this.$el.dblclick(function(e) {
      var _ref;
      return (_ref = $(e.target).closest('.treema-node').data('instance')) != null ? _ref.onDoubleClick(e) : void 0;
    });
    this.$el.click(function(e) {
      var _ref;
      return (_ref = $(e.target).closest('.treema-node').data('instance')) != null ? _ref.onClick(e) : void 0;
    });
    return this.$el.keydown(function(e) {
      var _ref;
      if (e.which === 8) {
        e.preventDefault();
        _this.removeSelectedNodes();
      }
      return (_ref = $(e.target).closest('.treema-node').data('instance')) != null ? _ref.onKeyDown(e) : void 0;
    });
  };

  TreemaNode.prototype.onClick = function(e) {
    var clickedKey, clickedToggle, clickedValue, _ref;
    if ((_ref = e.target.nodeName) === 'INPUT' || _ref === 'TEXTAREA') {
      return;
    }
    clickedValue = $(e.target).closest('.treema-value').length;
    clickedToggle = $(e.target).hasClass('treema-toggle');
    clickedKey = $(e.target).hasClass('treema-key');
    if (!(clickedValue && !this.collection)) {
      this.$el.closest('.treema-root').focus();
    }
    if (clickedValue && !this.collection) {
      return this.toggleEdit();
    }
    if (clickedToggle || (clickedValue && this.collection)) {
      return this.toggleOpen();
    }
    if ($(e.target).closest('.treema-add-child').length && this.collection) {
      return this.addNewChild();
    }
    if (clickedKey) {
      return this.toggleSelect();
    }
  };

  TreemaNode.prototype.onDoubleClick = function(e) {
    var clickedKey;
    if (!this.collection) {
      return;
    }
    clickedKey = $(e.target).hasClass('treema-key');
    if (!clickedKey) {
      return;
    }
    if (this.$el.hasClass('treema-closed')) {
      this.open();
    }
    return this.addNewChild();
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
      nextTreema.toggleEdit('treema-edit');
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
          nextChild = nextChild[direction]();
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
    wasEditing = valEl.hasClass('treema-edit');
    if (!(toClass && valEl.hasClass(toClass))) {
      valEl.toggleClass('treema-read treema-edit');
    }
    if (valEl.hasClass('treema-read')) {
      if (wasEditing) {
        this.saveChanges(valEl);
        this.refreshErrors();
      }
      this.propagateData();
      valEl.empty();
      this.setValueForReading(valEl);
    }
    if (valEl.hasClass('treema-edit')) {
      valEl.empty();
      return this.setValueForEditing(valEl);
    }
  };

  TreemaNode.prototype.propagateData = function() {
    if (!this.parent) {
      return;
    }
    this.parent.data[this.keyForParent] = this.data;
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
      newTreema.toggleEdit('treema-edit');
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
        return newTreema.toggleEdit('treema-edit');
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

  TreemaNode.prototype.removeSelectedNodes = function() {
    var _this = this;
    return this.$el.find('.treema-selected').each(function(i, elem) {
      var _ref;
      return (_ref = $(elem).data('instance')) != null ? _ref.remove() : void 0;
    });
  };

  TreemaNode.prototype.remove = function() {
    this.$el.remove();
    if (this.parent == null) {
      return;
    }
    delete this.parent.childrenTreemas[this.keyForParent];
    delete this.parent.data[this.keyForParent];
    this.parent.sortFromUI();
    return this.parent.refreshErrors();
  };

  TreemaNode.prototype.toggleOpen = function() {
    if (this.$el.hasClass('treema-closed')) {
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
    this.$el.append(childrenContainer).removeClass('treema-closed').addClass('treema-open');
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
    this.childrenTreemas = {};
    this.data = $.isArray(this.data) ? [] : {};
    _ref = children_wrapper[0].children;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      treema = $(child).data('instance');
      if (!treema) {
        continue;
      }
      treema.keyForParent = index;
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
    this.$el.addClass('treema-closed').removeClass('treema-open');
    this.childrenTreemas = null;
    return this.refreshErrors();
  };

  TreemaNode.prototype.toggleSelect = function() {
    return this.$el.toggleClass('treema-selected');
  };

  TreemaNode.prototype.addChildTreema = function(key, value, schema) {
    var treema;
    treema = makeTreema(schema, value, {}, true);
    treema.keyForParent = key;
    treema.parent = this;
    this.childrenTreemas[key] = treema;
    return treema;
  };

  TreemaNode.prototype.createChildNode = function(treema) {
    var childNode, keyEl, name;
    childNode = treema.build();
    if (this.keyed) {
      name = treema.schema.title || treema.keyForParent;
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
    var deepestTreema, e, error, erroredTreemas, errors, messages, path, subpath, treema, _i, _j, _k, _len, _len1, _len2, _ref, _results;
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
    _ref = $.unique(erroredTreemas);
    _results = [];
    for (_k = 0, _len2 = _ref.length; _k < _len2; _k++) {
      treema = _ref[_k];
      messages = (function() {
        var _l, _len3, _ref1, _results1;
        _ref1 = treema._errors;
        _results1 = [];
        for (_l = 0, _len3 = _ref1.length; _l < _len3; _l++) {
          e = _ref1[_l];
          _results1.push(e.message);
        }
        return _results1;
      })();
      _results.push(treema.showError(messages.join('<br />')));
    }
    return _results;
  };

  TreemaNode.prototype.showError = function(message) {
    this.$el.append($(this.templateString));
    this.$el.find('> .treema-error').html(message).show();
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

//@ sourceMappingURL=treema.js.map