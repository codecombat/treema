var AnyTreemaNode, ArrayTreemaNode, BooleanTreemaNode, NullTreemaNode, NumberTreemaNode, ObjectTreemaNode, StringTreemaNode, TreemaNode, TreemaNodeMap, makeTreema, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

TreemaNode = (function() {
  "Base class for a single node in the Treema.";
  TreemaNode.prototype.schema = {};

  TreemaNode.prototype.lastOutput = null;

  TreemaNode.prototype.nodeString = '<div class="treema-node treema-clearfix">\n  <div class="treema-value"></div>\n</div>';

  TreemaNode.prototype.childrenString = '<div class="treema-children"></div>';

  TreemaNode.prototype.addChildString = '<div class="treema-add-child">+</div>';

  TreemaNode.prototype.newPropertyString = '<input class="treema-new-prop" />';

  TreemaNode.prototype.grabberString = '<span class="treema-grabber"> G </span>';

  TreemaNode.prototype.toggleString = '<span class="treema-toggle"> T </span>';

  TreemaNode.prototype.keyString = '<span class="treema-key"></span>';

  TreemaNode.prototype.errorString = '<div class="treema-error"></div>';

  TreemaNode.prototype.collection = false;

  TreemaNode.prototype.ordered = false;

  TreemaNode.prototype.keyed = false;

  TreemaNode.prototype.editable = true;

  TreemaNode.prototype.skipTab = false;

  function TreemaNode(schema, data, options, child) {
    this.schema = schema;
    this.data = data;
    this.child = child;
    this.options = options || {};
  }

  TreemaNode.prototype.isValid = function() {
    return tv4.validate(this.data, this.schema);
  };

  TreemaNode.prototype.getErrors = function() {
    return tv4.validateMultiple(this.data, this.schema)['errors'];
  };

  TreemaNode.prototype.getMissing = function() {
    return tv4.validateMultiple(this.data, this.schema)['missing'];
  };

  TreemaNode.prototype.nodeElement = function() {
    return $(this.nodeString);
  };

  TreemaNode.prototype.setValueForReading = function(valEl) {
    return valEl.append($('<span>undefined</span>'));
  };

  TreemaNode.prototype.setValueForEditing = function(valEl) {
    return valEl.append($('<span>no edit</span>'));
  };

  TreemaNode.prototype.saveChanges = function(valEl) {};

  TreemaNode.prototype.build = function() {
    var valEl;
    this.$el = this.nodeElement();
    valEl = $('.treema-value', this.$el);
    this.setValueForReading(valEl);
    if (!this.collection) {
      valEl.addClass('read');
    }
    this.$el.data('instance', this);
    if (!this.child) {
      this.$el.addClass('treema-root');
    }
    if (this.collection) {
      this.$el.append($(this.childrenString)).addClass('closed');
    }
    if (this.collection && !this.child) {
      this.open();
    }
    if (!this.child) {
      this.setUpEvents();
    }
    return this.$el;
  };

  TreemaNode.prototype.setUpEvents = function() {
    var _this = this;
    this.$el.click(function(e) {
      var node, _ref;
      return node = (_ref = $(e.target).closest('.treema-node').data('instance')) != null ? _ref.onClick(e) : void 0;
    });
    return this.$el.keydown(function(e) {
      var node, _ref;
      return node = (_ref = $(e.target).closest('.treema-node').data('instance')) != null ? _ref.onKeyDown(e) : void 0;
    });
  };

  TreemaNode.prototype.onClick = function(e) {
    var value, _ref;
    if ((_ref = e.target.nodeName) === 'INPUT' || _ref === 'TEXTAREA') {
      return;
    }
    value = $(e.target).closest('.treema-value');
    if (value.length) {
      if (this.collection) {
        this.open();
      } else {
        this.toggleEdit();
      }
    }
    if ($(e.target).hasClass('treema-toggle')) {
      this.toggleOpen();
    }
    value = $(e.target).closest('.treema-add-child');
    if (value.length && this.collection) {
      return this.addNewChild();
    }
  };

  TreemaNode.prototype.onKeyDown = function(e) {
    var dir, instance, nextChild, target, _ref;
    if (e.which === 9) {
      dir = e.shiftKey ? 'prev' : 'next';
      target = $(e.target);
      if (target.hasClass('treema-new-prop')) {
        e.preventDefault();
        target.blur();
      }
      nextChild = this.$el[dir]();
      while (true) {
        if (nextChild.length > 0) {
          instance = nextChild.data('instance');
          if (!instance) {
            break;
          }
          if (instance.collection || instance.skipTab) {
            nextChild = nextChild[dir]();
            continue;
          }
          instance.toggleEdit('edit');
          return e.preventDefault();
        }
        break;
      }
      if ((_ref = this.parent) != null ? _ref.collection : void 0) {
        this.parent.addNewChild();
        return e.preventDefault();
      }
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
        this.removeError();
        this.showErrors();
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

  TreemaNode.prototype.getChildren = function() {
    return [];
  };

  TreemaNode.prototype.addNewChild = function() {
    var childNode, keyInput, newTreema, new_index, properties, schema,
      _this = this;
    if (this.ordered) {
      new_index = this.childrenTreemas.length;
      schema = this.getChildSchema();
      newTreema = this.addChildTreema(new_index, void 0, schema);
      childNode = this.createChildNode(newTreema);
      this.$el.find('.treema-add-child').before(childNode);
      newTreema.toggleEdit('edit');
    }
    if (this.keyed) {
      properties = this.childPropertiesAvailable();
      keyInput = $(this.newPropertyString);
      this.$el.find('.treema-add-child').before(keyInput);
      keyInput.focus();
      return keyInput.blur(function(e) {
        var key;
        key = keyInput.val();
        keyInput.remove();
        if (!(key.length && !_this.childrenTreemas[key])) {
          return;
        }
        schema = _this.getChildSchema(key);
        newTreema = _this.addChildTreema(key, null, schema);
        childNode = _this.createChildNode(newTreema);
        _this.$el.find('.treema-add-child').before(childNode);
        return newTreema.toggleEdit('edit');
      });
    }
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

  TreemaNode.prototype.propagateData = function() {
    if (!this.parent) {
      return;
    }
    return this.parent.data[this.parentKey] = this.data;
  };

  TreemaNode.prototype.toggleOpen = function() {
    if (this.$el.hasClass('closed')) {
      return this.open();
    } else {
      return this.close();
    }
  };

  TreemaNode.prototype.open = function() {
    var childNode, childrenContainer, key, schema, treema, value, _i, _len, _ref, _ref1;
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
    return childrenContainer.append($(this.addChildString));
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
      keyEl = $(this.keyString).text(name + ' : ');
      if (treema.schema.description) {
        keyEl.attr('title', treema.schema.description);
      }
      childNode.prepend(keyEl);
    }
    if (treema.collection) {
      childNode.prepend($(this.toggleString));
    }
    if (this.ordered) {
      childNode.prepend($(this.grabberString));
    }
    return childNode;
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
    return this.childrenTreemas = null;
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
    this.$el.append($(this.errorString));
    this.$el.find('> .treema-error').text(message).show();
    return this.$el.addClass('treema-has-error');
  };

  TreemaNode.prototype.removeError = function() {
    this.$el.find('.treema-error').remove();
    return this.$el.removeClass('treema-has-error');
  };

  return TreemaNode;

})();

StringTreemaNode = (function(_super) {
  __extends(StringTreemaNode, _super);

  "Basic 'string' type node.";

  function StringTreemaNode() {
    _ref = StringTreemaNode.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  StringTreemaNode.prototype.setValueForReading = function(valEl) {
    return valEl.append($('<pre class="treema-string"></pre>').text("'" + this.data + "'"));
  };

  StringTreemaNode.prototype.setValueForEditing = function(valEl) {
    var input,
      _this = this;
    input = $('<input />');
    if (this.data !== null) {
      input.val(this.data);
    }
    valEl.append(input);
    input.focus();
    input.select();
    return input.blur(function() {
      if ($('.treema-value', _this.$el).hasClass('edit')) {
        return _this.toggleEdit('read');
      }
    });
  };

  StringTreemaNode.prototype.saveChanges = function(valEl) {
    return this.data = $('input', valEl).val();
  };

  return StringTreemaNode;

})(TreemaNode);

NumberTreemaNode = (function(_super) {
  __extends(NumberTreemaNode, _super);

  "Basic 'number' type node.";

  function NumberTreemaNode() {
    _ref1 = NumberTreemaNode.__super__.constructor.apply(this, arguments);
    return _ref1;
  }

  NumberTreemaNode.prototype.setValueForReading = function(valEl) {
    return valEl.append($('<pre class="treema-number"></pre>').text("" + this.data));
  };

  NumberTreemaNode.prototype.setValueForEditing = function(valEl) {
    var input,
      _this = this;
    input = $('<input />');
    if (this.data !== null) {
      input.val(JSON.stringify(this.data));
    }
    valEl.append(input);
    input.focus();
    input.select();
    return input.blur(function() {
      if ($('.treema-value', _this.$el).hasClass('edit')) {
        return _this.toggleEdit('read');
      }
    });
  };

  NumberTreemaNode.prototype.saveChanges = function(valEl) {
    return this.data = parseFloat($('input', valEl).val());
  };

  return NumberTreemaNode;

})(TreemaNode);

NullTreemaNode = (function(_super) {
  __extends(NullTreemaNode, _super);

  "Basic 'number' type node.";

  function NullTreemaNode() {
    _ref2 = NullTreemaNode.__super__.constructor.apply(this, arguments);
    return _ref2;
  }

  NullTreemaNode.prototype.editable = false;

  NullTreemaNode.prototype.setValueForReading = function(valEl) {
    return valEl.append($('<pre class="treema-null">null</pre>'));
  };

  return NullTreemaNode;

})(TreemaNode);

BooleanTreemaNode = (function(_super) {
  __extends(BooleanTreemaNode, _super);

  "Basic 'boolean' type node.";

  function BooleanTreemaNode() {
    _ref3 = BooleanTreemaNode.__super__.constructor.apply(this, arguments);
    return _ref3;
  }

  BooleanTreemaNode.prototype.skipTab = true;

  BooleanTreemaNode.prototype.onClick = function(e) {
    'Override the normal behavior for clicking the value, just flip the value instead.';
    var valEl, value;
    value = $(e.target).closest('.treema-value');
    if (value.length) {
      this.data = !this.data;
      valEl = $('.treema-value', this.$el);
      valEl.empty();
      this.setValueForReading(valEl);
      return;
    }
    return BooleanTreemaNode.__super__.onClick.call(this, e);
  };

  BooleanTreemaNode.prototype.setValueForReading = function(valEl) {
    return valEl.append($('<pre class="treema-boolean"></pre>').text("" + this.data));
  };

  return BooleanTreemaNode;

})(TreemaNode);

ArrayTreemaNode = (function(_super) {
  __extends(ArrayTreemaNode, _super);

  "Basic 'array' type node.";

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
    return valEl.append($('<span></span>').text("[" + this.data.length + "]"));
  };

  return ArrayTreemaNode;

})(TreemaNode);

ObjectTreemaNode = (function(_super) {
  __extends(ObjectTreemaNode, _super);

  "Basic 'object' type node.";

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

  ObjectTreemaNode.prototype.valueElement = function() {
    return $(this.valueElementString).text("{" + this.data.length + "}");
  };

  ObjectTreemaNode.prototype.setValueForReading = function(valEl) {
    var size;
    size = Object.keys(this.data).length;
    return valEl.append($('<span></span>').text("{" + size + "}"));
  };

  return ObjectTreemaNode;

})(TreemaNode);

AnyTreemaNode = (function(_super) {
  __extends(AnyTreemaNode, _super);

  "Super flexible input, can handle inputs like:\n  true      (Boolean)\n  'true     (string \"true\", anything that starts with ' or \" is treated as a string, like in spreadsheet programs)\n  1.2       (number)\n  [         (empty array)\n  {         (empty object)\n  [1,2,3]   (array with tree values)\n  null";

  function AnyTreemaNode() {
    _ref6 = AnyTreemaNode.__super__.constructor.apply(this, arguments);
    return _ref6;
  }

  AnyTreemaNode.prototype.setValueForReading = function(valEl) {
    var NodeClass, dataType, helperNode;
    dataType = $.type(this.data);
    NodeClass = TreemaNodeMap[dataType];
    helperNode = new NodeClass(this.schema, this.data, this.options, this.child);
    return helperNode.setValueForReading(valEl);
  };

  AnyTreemaNode.prototype.setValueForEditing = function(valEl) {
    var input,
      _this = this;
    input = $('<input id="what" />').val(JSON.stringify(this.data));
    valEl.append(input);
    valEl.find('input').focus();
    input.focus();
    input.select();
    return input.blur(function() {
      if ($('.treema-value', _this.$el).hasClass('edit')) {
        return _this.toggleEdit('read');
      }
    });
  };

  AnyTreemaNode.prototype.saveChanges = function(valEl) {
    var e;
    this.data = $('input', valEl).val();
    if (this.data[0] === "'" && this.data[this.data.length - 1] !== "'") {
      return this.data = this.data.slice(1);
    } else if (this.data[0] === '"' && this.data[this.data.length - 1] !== '"') {
      return this.data = this.data.slice(1);
    } else if (this.data.trim() === '[') {
      return this.data = [];
    } else if (this.data.trim() === '{') {
      return this.data = {};
    } else {
      try {
        return this.data = JSON.parse(this.data);
      } catch (_error) {
        e = _error;
      }
    }
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