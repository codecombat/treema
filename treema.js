var ArrayTreemaNode, ObjectTreemaNode, StringTreemaNode, TreemaNode, TreemaNodeMap, makeTreema, _ref, _ref1, _ref2,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

TreemaNode = (function() {
  "Base class for a single node in the Treema.";
  TreemaNode.prototype.schema = {};

  TreemaNode.prototype.lastOutput = null;

  TreemaNode.prototype.nodeString = '<div class="treema-node"><div class="treema-value"></div></div>';

  TreemaNode.prototype.childrenString = '<div class="treema-children"></div>';

  TreemaNode.prototype.grabberString = '<span class="treema-grabber"> G </span>';

  TreemaNode.prototype.toggleString = '<span class="treema-toggle"> T </span>';

  TreemaNode.prototype.keyString = '<span class="treema-key"></span>';

  TreemaNode.prototype.collection = false;

  TreemaNode.prototype.ordered = false;

  TreemaNode.prototype.keyed = false;

  function TreemaNode(schema, data, options, child) {
    this.schema = schema;
    this.data = data;
    this.child = child;
    this.options = options || {};
  }

  TreemaNode.prototype.isValid = function() {
    return tv4.validate(this.getData(), this.schema);
  };

  TreemaNode.prototype.getErrors = function() {
    return tv4.validateMultiple(this.getData(), this.schema)['errors'];
  };

  TreemaNode.prototype.getMissing = function() {
    return tv4.validateMultiple(this.getData(), this.schema)['missing'];
  };

  TreemaNode.prototype.nodeElement = function() {
    return $(this.nodeString);
  };

  TreemaNode.prototype.valueElement = function() {
    return $('<span>undefined</span>');
  };

  TreemaNode.prototype.build = function() {
    var valEl;
    this.$el = this.nodeElement();
    valEl = $('.treema-value', this.$el);
    valEl.append(this.valueElement());
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
    return this.$el.click(function(e) {
      var node;
      return node = $(e.target).closest('.treema-node').data('instance').onClick(e);
    });
  };

  TreemaNode.prototype.onClick = function(e) {
    var value;
    value = $(e.target).closest('.treema-value');
    if (value.length) {
      if (this.collection) {
        this.open();
      } else {
        this.toggleEdit();
      }
    }
    console.log($(e.target).hasClass('treema-toggle'), e.target);
    if ($(e.target).hasClass('treema-toggle')) {
      return this.toggle();
    }
  };

  TreemaNode.prototype.toggleEdit = function() {};

  TreemaNode.prototype.getChildren = function() {
    return [];
  };

  TreemaNode.prototype.toggle = function() {
    if (this.$el.hasClass('closed')) {
      return this.open();
    } else {
      return this.close();
    }
  };

  TreemaNode.prototype.open = function() {
    var child, childNode, children, childrenContainer, key, schema, treema, value, _i, _len;
    childrenContainer = this.$el.find('.treema-children').detach();
    childrenContainer.empty();
    children = this.getChildren();
    for (_i = 0, _len = children.length; _i < _len; _i++) {
      child = children[_i];
      key = child[0], value = child[1], schema = child[2];
      treema = makeTreema(schema, value, {}, true);
      childNode = treema.build();
      if (this.keyed) {
        childNode.prepend($(this.keyString).text(key + ' : '));
      }
      if (treema.collection) {
        childNode.prepend($(this.toggleString));
      }
      if (this.ordered) {
        childNode.prepend($(this.grabberString));
      }
      childrenContainer.append(childNode);
    }
    return this.$el.append(childrenContainer).removeClass('closed').addClass('open');
  };

  TreemaNode.prototype.close = function() {
    this.$el.find('.treema-children').empty();
    return this.$el.addClass('closed').removeClass('open');
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

  StringTreemaNode.prototype.valueElementString = '<pre class="treema-string"></pre>';

  StringTreemaNode.prototype.valueElementEditingString = '<input />';

  StringTreemaNode.prototype.valueElement = function() {
    var e;
    e = $(this.valueElementString).text("'" + this.data + "'");
    return e;
  };

  StringTreemaNode.prototype.valueElementEditing = function() {
    return $(this.valueElementEditingString).val(this.data);
  };

  return StringTreemaNode;

})(TreemaNode);

ArrayTreemaNode = (function(_super) {
  __extends(ArrayTreemaNode, _super);

  "Basic 'array' type node.";

  function ArrayTreemaNode() {
    _ref1 = ArrayTreemaNode.__super__.constructor.apply(this, arguments);
    return _ref1;
  }

  ArrayTreemaNode.prototype.collection = true;

  ArrayTreemaNode.prototype.ordered = true;

  ArrayTreemaNode.prototype.valueElementString = '<span></span>';

  ArrayTreemaNode.prototype.getChildren = function() {
    var key, value, _i, _len, _ref2, _results;
    _ref2 = this.data;
    _results = [];
    for (key = _i = 0, _len = _ref2.length; _i < _len; key = ++_i) {
      value = _ref2[key];
      _results.push([key, value, this.schema.items]);
    }
    return _results;
  };

  ArrayTreemaNode.prototype.valueElement = function() {
    return $(this.valueElementString).text("[" + this.data.length + "]");
  };

  return ArrayTreemaNode;

})(TreemaNode);

ObjectTreemaNode = (function(_super) {
  __extends(ObjectTreemaNode, _super);

  "Basic 'object' type node.";

  function ObjectTreemaNode() {
    _ref2 = ObjectTreemaNode.__super__.constructor.apply(this, arguments);
    return _ref2;
  }

  ObjectTreemaNode.prototype.collection = true;

  ObjectTreemaNode.prototype.keyed = true;

  ObjectTreemaNode.prototype.getChildren = function() {
    var key, value, _ref3, _results;
    _ref3 = this.data;
    _results = [];
    for (key in _ref3) {
      value = _ref3[key];
      _results.push([key, value, this.schema.properties[key]]);
    }
    return _results;
  };

  ObjectTreemaNode.prototype.valueElement = function() {
    return $(this.valueElementString).text("{" + this.data.length + "}");
  };

  return ObjectTreemaNode;

})(TreemaNode);

TreemaNodeMap = {
  'array': ArrayTreemaNode,
  'string': StringTreemaNode,
  'object': ObjectTreemaNode
};

makeTreema = function(schema, data, options, child) {
  var NodeClass;
  NodeClass = TreemaNodeMap[schema.format];
  if (!NodeClass) {
    NodeClass = TreemaNodeMap[schema.type];
  }
  if (!NodeClass) {
    return null;
  }
  return new NodeClass(schema, data, options, child);
};

//@ sourceMappingURL=treema.js.map