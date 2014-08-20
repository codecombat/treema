var TreemaNode,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __slice = [].slice;

TreemaNode = (function() {
  var defaults;

  TreemaNode.prototype.schema = {};

  TreemaNode.prototype.$el = null;

  TreemaNode.prototype.data = null;

  TreemaNode.prototype.options = null;

  TreemaNode.prototype.parent = null;

  TreemaNode.prototype.lastSelectedTreema = null;

  TreemaNode.prototype.treemaFilterHiddenClass = 'treema-filter-hidden';

  TreemaNode.prototype.nodeTemplate = '<div class="treema-row treema-clearfix"><div class="treema-value"></div></div>';

  TreemaNode.prototype.childrenTemplate = '<div class="treema-children"></div>';

  TreemaNode.prototype.addChildTemplate = '<div class="treema-add-child" tabindex="9009">+</div>';

  TreemaNode.prototype.tempErrorTemplate = '<span class="treema-temp-error"></span>';

  TreemaNode.prototype.toggleTemplate = '<span class="treema-toggle-hit-area"><span class="treema-toggle"></span></span>';

  TreemaNode.prototype.keyTemplate = '<span class="treema-key"></span>';

  TreemaNode.prototype.errorTemplate = '<div class="treema-error"></div>';

  TreemaNode.prototype.newPropertyTemplate = '<input class="treema-new-prop" />';

  TreemaNode.prototype.collection = false;

  TreemaNode.prototype.ordered = false;

  TreemaNode.prototype.keyed = false;

  TreemaNode.prototype.editable = true;

  TreemaNode.prototype.directlyEditable = true;

  TreemaNode.prototype.skipTab = false;

  TreemaNode.prototype.valueClass = null;

  TreemaNode.prototype.removeOnEmptyDelete = true;

  TreemaNode.prototype.keyForParent = null;

  TreemaNode.prototype.childrenTreemas = null;

  TreemaNode.prototype.integrated = false;

  TreemaNode.prototype.removed = false;

  TreemaNode.prototype.workingSchema = null;

  TreemaNode.prototype.nodeDescription = 'Node';

  TreemaNode.prototype.isValid = function() {
    var errors;
    errors = this.getErrors();
    return errors.length === 0;
  };

  TreemaNode.prototype.getErrors = function() {
    var e, errors, moreErrors, my_path, root, _i, _len;
    if (!this.tv4) {
      return [];
    }
    if (this.isRoot()) {
      if (this.cachedErrors) {
        return this.cachedErrors;
      }
      this.cachedErrors = this.tv4.validateMultiple(this.data, this.schema)['errors'];
      return this.cachedErrors;
    }
    root = this.getRoot();
    errors = root.getErrors();
    my_path = this.getPath();
    errors = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = errors.length; _i < _len; _i++) {
        e = errors[_i];
        if (e.dataPath.slice(0, +my_path.length + 1 || 9e9) === my_path) {
          _results.push(e);
        }
      }
      return _results;
    })();
    for (_i = 0, _len = errors.length; _i < _len; _i++) {
      e = errors[_i];
      e.dataPath = e.dataPath.slice(0, +my_path.length + 1 || 9e9);
    }
    if (this.workingSchema) {
      moreErrors = this.tv4.validateMultiple(this.data, this.workingSchema).errors;
      errors = errors.concat(moreErrors);
    }
    return errors;
  };

  TreemaNode.prototype.setUpValidator = function() {
    var root, _ref;
    if (!this.parent) {
      this.tv4 = (_ref = window['tv4']) != null ? _ref.freshApi() : void 0;
      this.tv4.addSchema('#', this.schema);
      if (this.schema.id) {
        return this.tv4.addSchema(this.schema.id, this.schema);
      }
    } else {
      root = this.getRoot();
      return this.tv4 = root.tv4;
    }
  };

  TreemaNode.prototype.saveChanges = function(oldData) {
    if (oldData === this.data) {
      return;
    }
    return this.addTrackedAction({
      'oldData': oldData,
      'newData': this.data,
      'path': this.getPath(),
      'action': 'edit'
    });
  };

  TreemaNode.prototype.getDefaultValue = function() {
    return null;
  };

  TreemaNode.prototype.buildValueForDisplay = function() {
    return console.error('"buildValueForDisplay" has not been overridden.');
  };

  TreemaNode.prototype.buildValueForEditing = function() {
    if (!(this.editable && this.directlyEditable)) {
      return;
    }
    return console.error('"buildValueForEditing" has not been overridden.');
  };

  TreemaNode.prototype.getChildren = function() {
    return console.error('"getChildren" has not been overridden.');
  };

  TreemaNode.prototype.canAddChild = function() {
    return this.collection && this.editable && !this.settings.readOnly;
  };

  TreemaNode.prototype.canAddProperty = function() {
    return true;
  };

  TreemaNode.prototype.addingNewProperty = function() {
    return false;
  };

  TreemaNode.prototype.addNewChild = function() {
    return false;
  };

  TreemaNode.prototype.buildValueForDisplaySimply = function(valEl, text) {
    if (text.length > 200) {
      text = text.slice(0, 200) + '...';
    }
    return valEl.append($("<div></div>").addClass('treema-shortened').text(text));
  };

  TreemaNode.prototype.buildValueForEditingSimply = function(valEl, value, inputType) {
    var input;
    if (inputType == null) {
      inputType = null;
    }
    input = $('<input />');
    if (inputType) {
      input.attr('type', inputType);
    }
    if (value !== null) {
      input.val(value);
    }
    valEl.append(input);
    input.focus().select();
    input.blur(this.onEditInputBlur);
    return input;
  };

  TreemaNode.prototype.onEditInputBlur = function(e) {
    var closest, input, shouldRemove;
    shouldRemove = this.shouldTryToRemoveFromParent();
    closest = $(e.relatedTarget).closest('.treema-node')[0];
    if (closest === this.$el[0]) {
      shouldRemove = false;
    }
    this.markAsChanged();
    this.saveChanges(this.getValEl());
    input = this.getValEl().find('input, textarea, select');
    if (this.isValid()) {
      if (this.isEditing()) {
        this.display();
      }
    } else {
      input.focus().select();
    }
    if (shouldRemove) {
      this.remove();
    } else {
      this.flushChanges();
    }
    return this.broadcastChanges();
  };

  TreemaNode.prototype.shouldTryToRemoveFromParent = function() {
    var input, inputs, val, _i, _len;
    val = this.getValEl();
    if (val.find('select').length) {
      return;
    }
    inputs = val.find('input, textarea');
    for (_i = 0, _len = inputs.length; _i < _len; _i++) {
      input = inputs[_i];
      input = $(input);
      if (input.attr('type') === 'checkbox' || input.val()) {
        return false;
      }
    }
    if (!this.getErrors().length) {
      return false;
    }
    return true;
  };

  TreemaNode.prototype.limitChoices = function(options) {
    var _this = this;
    this["enum"] = options;
    this.buildValueForEditing = function(valEl, data) {
      var index, input, option, _i, _len, _ref;
      input = $('<select></select>');
      _ref = _this["enum"];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        input.append($('<option></option>').text(option));
      }
      index = _this["enum"].indexOf(data);
      if (index >= 0) {
        input.prop('selectedIndex', index);
      }
      valEl.append(input);
      input.focus();
      input.blur(_this.onEditInputBlur);
      return input;
    };
    return this.saveChanges = function(valEl) {
      var index;
      index = valEl.find('select').prop('selectedIndex');
      _this.addTrackedAction({
        'oldData': _this.data,
        'newData': _this["enum"][index],
        'path': _this.getPath(),
        'action': 'edit'
      });
      _this.data = _this["enum"][index];
      TreemaNode.changedTreemas.push(_this);
      return _this.broadcastChanges();
    };
  };

  TreemaNode.pluginName = "treema";

  defaults = {
    schema: {},
    callbacks: {}
  };

  function TreemaNode($el, options, parent) {
    this.$el = $el;
    this.parent = parent;
    this.onSelectType = __bind(this.onSelectType, this);
    this.onSelectSchema = __bind(this.onSelectSchema, this);
    this.orderDataFromUI = __bind(this.orderDataFromUI, this);
    this.onMouseLeave = __bind(this.onMouseLeave, this);
    this.onMouseEnter = __bind(this.onMouseEnter, this);
    this.onEditInputBlur = __bind(this.onEditInputBlur, this);
    this.$el = this.$el || $('<div></div>');
    this.settings = $.extend({}, defaults, options);
    this.schema = $.extend({}, this.settings.schema);
    if (!(this.schema.id || this.parent)) {
      this.schema.id = '__base__';
    }
    this.data = options.data;
    this.patches = [];
    this.trackedActions = [];
    this.currentStateIndex = 0;
    this.trackingDisabled = false;
    this.callbacks = this.settings.callbacks;
    this._defaults = defaults;
    this._name = TreemaNode.pluginName;
    this.setUpValidator();
    this.populateData();
    this.previousState = this.copyData();
  }

  TreemaNode.prototype.build = function() {
    var schema, valEl, _ref;
    this.$el.addClass('treema-node').addClass('treema-clearfix');
    this.$el.empty().append($(this.nodeTemplate));
    this.$el.data('instance', this);
    if (!this.parent) {
      this.$el.addClass('treema-root');
    }
    if (!this.parent) {
      this.$el.attr('tabindex', 9001);
    }
    if (this.collection) {
      this.$el.append($(this.childrenTemplate)).addClass('treema-closed');
    }
    valEl = this.getValEl();
    if (this.valueClass) {
      valEl.addClass(this.valueClass);
    }
    if (this.directlyEditable) {
      valEl.addClass('treema-display');
    }
    this.buildValueForDisplay(valEl, this.getData());
    if (this.collection && !this.parent) {
      this.open();
    }
    if (!this.parent) {
      this.setUpGlobalEvents();
    }
    if (this.parent) {
      this.setUpLocalEvents();
    }
    if (this.collection) {
      this.updateMyAddButton();
    }
    this.createTypeSelector();
    if (((_ref = this.workingSchemas) != null ? _ref.length : void 0) > 1) {
      this.createSchemaSelector();
    }
    schema = this.workingSchema || this.schema;
    if (schema["enum"]) {
      this.limitChoices(schema["enum"]);
    }
    return this.$el;
  };

  TreemaNode.prototype.populateData = function() {
    if (this.data !== void 0) {
      return;
    }
    this.data = this.schema["default"];
    if (this.data !== void 0) {
      return;
    }
    return this.data = this.getDefaultValue();
  };

  TreemaNode.prototype.setWorkingSchema = function(workingSchema, workingSchemas) {
    this.workingSchema = workingSchema;
    this.workingSchemas = workingSchemas;
  };

  TreemaNode.prototype.createSchemaSelector = function() {
    var i, label, option, schema, select, _i, _len, _ref;
    select = $('<select></select>').addClass('treema-schema-select');
    _ref = this.workingSchemas;
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      schema = _ref[i];
      label = this.makeWorkingSchemaLabel(schema);
      option = $('<option></option>').attr('value', i).text(label);
      if (schema === this.workingSchema) {
        option.attr('selected', true);
      }
      select.append(option);
    }
    select.change(this.onSelectSchema);
    return this.$el.find('> .treema-row').prepend(select);
  };

  TreemaNode.prototype.makeWorkingSchemaLabel = function(schema) {
    if (schema.title != null) {
      return schema.title;
    }
    if (schema.type != null) {
      return schema.type;
    }
    return '???';
  };

  TreemaNode.prototype.getTypes = function() {
    var schema, types;
    schema = this.workingSchema || this.schema;
    types = schema.type || ["string", "number", "integer", "boolean", "null", "array", "object"];
    if (!$.isArray(types)) {
      types = [types];
    }
    return types;
  };

  TreemaNode.prototype.createTypeSelector = function() {
    var currentType, option, schema, select, type, types, _i, _len;
    types = this.getTypes();
    if (!(types.length > 1)) {
      return;
    }
    schema = this.workingSchema || this.schema;
    if (schema["enum"]) {
      return;
    }
    select = $('<select></select>').addClass('treema-type-select');
    currentType = $.type(this.data);
    if (this.valueClass === 'treema-integer') {
      currentType = 'integer';
    }
    for (_i = 0, _len = types.length; _i < _len; _i++) {
      type = types[_i];
      option = $('<option></option>').attr('value', type).text(this.getTypeName(type));
      if (type === currentType) {
        option.attr('selected', true);
      }
      select.append(option);
    }
    select.change(this.onSelectType);
    return this.$el.find('> .treema-row').prepend(select);
  };

  TreemaNode.prototype.getTypeName = function(type) {
    return {
      "null": 'null',
      array: 'arr',
      number: 'num',
      string: 'str',
      integer: 'int',
      boolean: 'bool',
      object: 'obj'
    }[type];
  };

  TreemaNode.prototype.setUpGlobalEvents = function() {
    var _this = this;
    this.$el.unbind();
    this.$el.dblclick(function(e) {
      var _ref;
      return (_ref = $(e.target).closest('.treema-node').data('instance')) != null ? _ref.onDoubleClick(e) : void 0;
    });
    this.$el.click(function(e) {
      var _ref;
      if ((_ref = $(e.target).closest('.treema-node').data('instance')) != null) {
        _ref.onClick(e);
      }
      return _this.broadcastChanges(e);
    });
    this.keysPreviouslyDown = {};
    this.$el.keydown(function(e) {
      var closest, lastSelected, _ref;
      e.heldDown = _this.keysPreviouslyDown[e.which] || false;
      closest = $(e.target).closest('.treema-node').data('instance');
      lastSelected = _this.getLastSelectedTreema();
      if ((_ref = lastSelected || closest) != null) {
        _ref.onKeyDown(e);
      }
      _this.broadcastChanges(e);
      _this.keysPreviouslyDown[e.which] = true;
      if (e.ctrlKey || e.metaKey) {
        return _this.manageCopyAndPaste(e);
      }
    });
    return this.$el.keyup(function(e) {
      return delete _this.keysPreviouslyDown[e.which];
    });
  };

  TreemaNode.prototype.manageCopyAndPaste = function(e) {
    var el, target, x, y, _ref, _ref1, _ref2, _ref3,
      _this = this;
    el = document.activeElement;
    if ((el != null) && (el.tagName.toLowerCase() === 'input' && el.type === 'text') || (el.tagName.toLowerCase() === 'textarea' && !$(el).hasClass('treema-clipboard'))) {
      return;
    }
    target = (_ref = this.getLastSelectedTreema()) != null ? _ref : this;
    if (e.which === 86 && $(e.target).hasClass('treema-clipboard')) {
      if (e.shiftKey && $(e.target).hasClass('treema-clipboard')) {
        _ref1 = [window.scrollX, window.scrollY], x = _ref1[0], y = _ref1[1];
        return setTimeout((function() {
          var newData, result;
          _this.keepFocus(x, y);
          if (!(newData = _this.$clipboard.val())) {
            return;
          }
          try {
            newData = JSON.parse(newData);
          } catch (_error) {
            e = _error;
            return;
          }
          result = target.tv4.validateMultiple(newData, target.schema);
          if (result.valid) {
            return target.set('/', newData);
          } else {
            return console.log("not pasting", newData, "because it's not valid:", result);
          }
        }), 10);
      } else {
        return e.preventDefault();
      }
    } else if (e.shiftKey) {
      return this.$clipboardContainer.find('.treema-clipboard').focus().select();
    } else if (!(((_ref2 = window.getSelection()) != null ? _ref2.toString() : void 0) || ((_ref3 = document.selection) != null ? _ref3.createRange().text : void 0))) {
      return setTimeout((function() {
        if (_this.$clipboardContainer == null) {
          _this.$clipboardContainer = $('<div class="treema-clipboard-container"></div>').appendTo(_this.$el);
        }
        _this.$clipboardContainer.empty().show();
        return _this.$clipboard = $('<textarea class="treema-clipboard"></textarea>').val(JSON.stringify(target.data)).appendTo(_this.$clipboardContainer).focus().select();
      }), 0);
    }
  };

  TreemaNode.prototype.broadcastChanges = function(e) {
    var changes, t, _base;
    if (this.callbacks.select && TreemaNode.didSelect) {
      TreemaNode.didSelect = false;
      this.callbacks.select(e, this.getSelectedTreemas());
    }
    if (TreemaNode.changedTreemas.length) {
      changes = (function() {
        var _i, _len, _ref, _results;
        _ref = TreemaNode.changedTreemas;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          t = _ref[_i];
          if (!t.removed) {
            _results.push(t);
          }
        }
        return _results;
      })();
      if (typeof (_base = this.callbacks).change === "function") {
        _base.change(e, jQuery.unique(changes));
      }
      return TreemaNode.changedTreemas = [];
    }
  };

  TreemaNode.prototype.markAsChanged = function() {
    return TreemaNode.changedTreemas.push(this);
  };

  TreemaNode.prototype.setUpLocalEvents = function() {
    var row;
    row = this.$el.find('> .treema-row');
    if (this.callbacks.mouseenter != null) {
      row.mouseenter(this.onMouseEnter);
    }
    if (this.callbacks.mouseleave != null) {
      return row.mouseleave(this.onMouseLeave);
    }
  };

  TreemaNode.prototype.onMouseEnter = function(e) {
    return this.callbacks.mouseenter(e, this);
  };

  TreemaNode.prototype.onMouseLeave = function(e) {
    return this.callbacks.mouseleave(e, this);
  };

  TreemaNode.prototype.onClick = function(e) {
    var clickedToggle, clickedValue, usedModKey, _ref;
    if ((_ref = e.target.nodeName) === 'INPUT' || _ref === 'TEXTAREA' || _ref === 'SELECT') {
      return;
    }
    clickedValue = $(e.target).closest('.treema-value').length;
    clickedToggle = $(e.target).hasClass('treema-toggle') || $(e.target).hasClass('treema-toggle-hit-area');
    usedModKey = e.shiftKey || e.ctrlKey || e.metaKey;
    if (!(clickedValue && !this.collection)) {
      this.keepFocus();
    }
    if (this.isDisplaying() && clickedValue && this.canEdit() && !usedModKey) {
      return this.toggleEdit();
    }
    if (!usedModKey && (clickedToggle || (clickedValue && this.collection))) {
      if (!clickedToggle) {
        this.deselectAll();
        this.select();
      }
      return this.toggleOpen();
    }
    if ($(e.target).closest('.treema-add-child').length && this.collection) {
      return this.addNewChild();
    }
    if (this.isRoot() || this.isEditing()) {
      return;
    }
    if (e.shiftKey) {
      return this.shiftSelect();
    }
    if (e.ctrlKey || e.metaKey) {
      return this.toggleSelect();
    }
    return this.select();
  };

  TreemaNode.prototype.onDoubleClick = function(e) {
    var clickedKey, _base, _base1, _base2;
    if (!this.collection) {
      return typeof (_base = this.callbacks).dblclick === "function" ? _base.dblclick(e, this) : void 0;
    }
    clickedKey = $(e.target).hasClass('treema-key');
    if (!clickedKey) {
      return typeof (_base1 = this.callbacks).dblclick === "function" ? _base1.dblclick(e, this) : void 0;
    }
    if (this.isClosed()) {
      this.open();
    }
    this.addNewChild();
    return typeof (_base2 = this.callbacks).dblclick === "function" ? _base2.dblclick(e, this) : void 0;
  };

  TreemaNode.prototype.onKeyDown = function(e) {
    var _ref;
    if (e.which === 27) {
      this.onEscapePressed(e);
    }
    if (e.which === 9) {
      this.onTabPressed(e);
    }
    if (e.which === 37) {
      this.onLeftArrowPressed(e);
    }
    if (e.which === 38) {
      this.onUpArrowPressed(e);
    }
    if (e.which === 39) {
      this.onRightArrowPressed(e);
    }
    if (e.which === 40) {
      this.onDownArrowPressed(e);
    }
    if (e.which === 13) {
      this.onEnterPressed(e);
    }
    if (e.which === 78) {
      this.onNPressed(e);
    }
    if (e.which === 32) {
      this.onSpacePressed(e);
    }
    if (e.which === 84) {
      this.onTPressed(e);
    }
    if (e.which === 70) {
      this.onFPressed(e);
    }
    if (e.which === 90) {
      this.onZPressed(e);
    }
    if (((_ref = e.which) === 8 || _ref === 46) && !e.heldDown) {
      return this.onDeletePressed(e);
    }
  };

  TreemaNode.prototype.onLeftArrowPressed = function(e) {
    if (this.inputFocused()) {
      return;
    }
    this.navigateOut();
    return e.preventDefault();
  };

  TreemaNode.prototype.onRightArrowPressed = function(e) {
    if (this.inputFocused()) {
      return;
    }
    this.navigateIn();
    return e.preventDefault();
  };

  TreemaNode.prototype.onUpArrowPressed = function(e) {
    if (this.inputFocused()) {
      return;
    }
    this.navigateSelection(-1);
    return e.preventDefault();
  };

  TreemaNode.prototype.onDownArrowPressed = function(e) {
    if (this.inputFocused()) {
      return;
    }
    this.navigateSelection(1);
    return e.preventDefault();
  };

  TreemaNode.prototype.inputFocused = function() {
    var _ref;
    if ((_ref = document.activeElement.nodeName) === 'INPUT' || _ref === 'TEXTAREA' || _ref === 'SELECT') {
      return true;
    }
  };

  TreemaNode.prototype.onSpacePressed = function() {};

  TreemaNode.prototype.onTPressed = function() {};

  TreemaNode.prototype.onFPressed = function() {};

  TreemaNode.prototype.onDeletePressed = function(e) {
    var editing;
    editing = this.editingIsHappening();
    if (editing && !$(e.target).val() && this.removeOnEmptyDelete) {
      this.display();
      this.select();
      this.removeSelectedNodes();
      e.preventDefault();
    }
    if (editing) {
      return;
    }
    e.preventDefault();
    return this.removeSelectedNodes();
  };

  TreemaNode.prototype.onEscapePressed = function() {
    if (!this.isEditing()) {
      return;
    }
    if (this.parent && (!this.integrated) && this.defaultData === void 0) {
      return this.remove();
    }
    if (this.isEditing()) {
      this.display();
    }
    if (!this.isRoot()) {
      this.select();
    }
    return this.keepFocus();
  };

  TreemaNode.prototype.onEnterPressed = function(e) {
    var offset;
    offset = e.shiftKey ? -1 : 1;
    if (offset === 1 && $(e.target).hasClass('treema-add-child')) {
      return this.addNewChild();
    }
    return this.traverseWhileEditing(offset, true);
  };

  TreemaNode.prototype.onTabPressed = function(e) {
    var offset;
    offset = e.shiftKey ? -1 : 1;
    if (this.hasMoreInputs(offset)) {
      return;
    }
    e.preventDefault();
    return this.traverseWhileEditing(offset, false);
  };

  TreemaNode.prototype.hasMoreInputs = function(offset) {
    var input, inputs, passedFocusedEl, _i, _len;
    inputs = this.getInputs().toArray();
    if (offset < 0) {
      inputs = inputs.reverse();
    }
    passedFocusedEl = false;
    for (_i = 0, _len = inputs.length; _i < _len; _i++) {
      input = inputs[_i];
      if (input === document.activeElement) {
        passedFocusedEl = true;
        continue;
      }
      if (!passedFocusedEl) {
        continue;
      }
      return true;
    }
    return false;
  };

  TreemaNode.prototype.onNPressed = function(e) {
    var selected, success, target;
    if (this.editingIsHappening()) {
      return;
    }
    selected = this.getLastSelectedTreema();
    target = (selected != null ? selected.collection : void 0) ? selected : selected != null ? selected.parent : void 0;
    if (!target) {
      return;
    }
    success = target.addNewChild();
    if (success) {
      this.deselectAll();
    }
    return e.preventDefault();
  };

  TreemaNode.prototype.onZPressed = function(e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.shiftKey) {
        return this.getRoot().redo();
      } else {
        return this.getRoot().undo();
      }
    }
  };

  TreemaNode.prototype.traverseWhileEditing = function(offset, aggressive) {
    var ctx, editing, selected, shouldRemove, targetEl, _ref;
    shouldRemove = false;
    selected = this.getLastSelectedTreema();
    editing = this.isEditing();
    if (!editing && (selected != null ? selected.canEdit() : void 0)) {
      return selected.edit();
    }
    if (editing) {
      shouldRemove = this.shouldTryToRemoveFromParent();
      this.saveChanges(this.getValEl());
      if (!shouldRemove) {
        this.flushChanges();
      }
      if (!(aggressive || this.isValid())) {
        this.refreshErrors();
        return;
      }
      if (shouldRemove && ((_ref = $(this.$el[0].nextSibling)) != null ? _ref.hasClass('treema-add-child') : void 0) && offset === 1) {
        offset = 2;
      }
      this.endExistingEdits();
      this.select();
    }
    ctx = this.traversalContext(offset);
    if (!ctx) {
      return this.getRoot().addChild();
    }
    if (!ctx.origin) {
      targetEl = offset > 0 ? ctx.first : ctx.last;
      this.selectOrActivateElement(targetEl);
    }
    selected = $(ctx.origin).data('instance');
    if (offset > 0 && aggressive && selected.collection && selected.isClosed()) {
      return selected.open();
    }
    targetEl = offset > 0 ? ctx.next : ctx.prev;
    if (!targetEl) {
      targetEl = offset > 0 ? ctx.first : ctx.last;
    }
    this.selectOrActivateElement(targetEl);
    if (shouldRemove) {
      return this.remove();
    } else {
      return this.refreshErrors();
    }
  };

  TreemaNode.prototype.selectOrActivateElement = function(el) {
    var treema;
    el = $(el);
    treema = el.data('instance');
    if (treema) {
      if (treema.canEdit()) {
        return treema.edit();
      } else {
        return treema.select();
      }
    }
    this.deselectAll();
    return el.focus();
  };

  TreemaNode.prototype.navigateSelection = function(offset) {
    var ctx, targetTreema;
    ctx = this.navigationContext();
    if (!ctx) {
      return;
    }
    if (!ctx.origin) {
      targetTreema = offset > 0 ? ctx.first : ctx.last;
      return targetTreema.select();
    }
    targetTreema = offset > 0 ? ctx.next : ctx.prev;
    if (!targetTreema) {
      targetTreema = offset > 0 ? ctx.first : ctx.last;
    }
    return targetTreema != null ? targetTreema.select() : void 0;
  };

  TreemaNode.prototype.navigateOut = function() {
    var selected;
    selected = this.getLastSelectedTreema();
    if (!selected) {
      return;
    }
    if (selected.isOpen()) {
      return selected.close();
    }
    if ((!selected.parent) || selected.parent.isRoot()) {
      return;
    }
    return selected.parent.select();
  };

  TreemaNode.prototype.navigateIn = function() {
    var treema, _i, _len, _ref, _results;
    _ref = this.getSelectedTreemas();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      treema = _ref[_i];
      if (!treema.collection) {
        continue;
      }
      if (treema.isClosed()) {
        _results.push(treema.open());
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  TreemaNode.prototype.traversalContext = function(offset) {
    var list, origin, _ref;
    list = this.getNavigableElements(offset);
    origin = (_ref = this.getLastSelectedTreema()) != null ? _ref.$el[0] : void 0;
    if (!origin) {
      origin = this.getRootEl().find('.treema-add-child:focus')[0];
    }
    if (!origin) {
      origin = this.getRootEl().find('.treema-new-prop')[0];
    }
    return this.wrapContext(list, origin, offset);
  };

  TreemaNode.prototype.navigationContext = function() {
    var list, origin;
    list = this.getFilterVisibleTreemas();
    origin = this.getLastSelectedTreema();
    return this.wrapContext(list, origin);
  };

  TreemaNode.prototype.wrapContext = function(list, origin, offset) {
    var c, originIndex;
    if (offset == null) {
      offset = 1;
    }
    if (!list.length) {
      return;
    }
    c = {
      first: list[0],
      last: list[list.length - 1],
      origin: origin
    };
    if (origin) {
      offset = Math.abs(offset);
      originIndex = list.indexOf(origin);
      c.next = list[originIndex + offset];
      c.prev = list[originIndex - offset];
    }
    return c;
  };

  TreemaNode.prototype.canEdit = function() {
    var _ref;
    if (this.schema.readOnly || ((_ref = this.parent) != null ? _ref.schema.readOnly : void 0)) {
      return false;
    }
    if (this.settings.readOnly) {
      return false;
    }
    if (!this.editable) {
      return false;
    }
    if (!this.directlyEditable) {
      return false;
    }
    if (this.collection && this.isOpen()) {
      return false;
    }
    return true;
  };

  TreemaNode.prototype.display = function() {
    return this.toggleEdit('treema-display');
  };

  TreemaNode.prototype.edit = function(options) {
    if (options == null) {
      options = {};
    }
    this.toggleEdit('treema-edit');
    if ((options.offset != null) && options.offset < 0) {
      return this.focusLastInput();
    }
  };

  TreemaNode.prototype.toggleEdit = function(toClass) {
    var valEl;
    if (toClass == null) {
      toClass = null;
    }
    if (!this.editable) {
      return;
    }
    valEl = this.getValEl();
    if (toClass && valEl.hasClass(toClass)) {
      return;
    }
    toClass = toClass || (valEl.hasClass('treema-display') ? 'treema-edit' : 'treema-display');
    if (toClass === 'treema-edit') {
      this.endExistingEdits();
    }
    valEl.removeClass('treema-display').removeClass('treema-edit').addClass(toClass);
    valEl.empty();
    if (this.isDisplaying()) {
      this.buildValueForDisplay(valEl, this.getData());
    }
    if (this.isEditing()) {
      this.buildValueForEditing(valEl, this.getData());
      return this.deselectAll();
    }
  };

  TreemaNode.prototype.endExistingEdits = function() {
    var editing, elem, treema, _i, _len, _results;
    editing = this.getRootEl().find('.treema-edit').closest('.treema-node');
    _results = [];
    for (_i = 0, _len = editing.length; _i < _len; _i++) {
      elem = editing[_i];
      treema = $(elem).data('instance');
      treema.saveChanges(treema.getValEl());
      treema.display();
      _results.push(this.markAsChanged());
    }
    return _results;
  };

  TreemaNode.prototype.flushChanges = function() {
    var parent, _results;
    if (this.parent && (!this.integrated) && this.data !== void 0) {
      this.parent.integrateChildTreema(this);
    }
    this.getRoot().cachedErrors = null;
    this.markAsChanged();
    if (!this.parent) {
      return this.refreshErrors();
    }
    this.parent.data[this.keyForParent] = this.data;
    this.parent.refreshErrors();
    parent = this.parent;
    _results = [];
    while (parent) {
      parent.buildValueForDisplay(parent.getValEl().empty(), parent.getData());
      _results.push(parent = parent.parent);
    }
    return _results;
  };

  TreemaNode.prototype.focusLastInput = function() {
    var inputs, last;
    inputs = this.getInputs();
    last = inputs[inputs.length - 1];
    return $(last).focus().select();
  };

  TreemaNode.prototype.removeSelectedNodes = function(nodes) {
    var data, nextSibling, parentPaths, paths, prevSibling, selected, toSelect, treema, _i, _j, _len, _len1, _ref;
    if (nodes == null) {
      nodes = [];
    }
    selected = nodes;
    if (!nodes.length) {
      selected = this.getSelectedTreemas();
    }
    toSelect = null;
    if (selected.length === 1) {
      nextSibling = selected[0].$el.next('.treema-node').data('instance');
      prevSibling = selected[0].$el.prev('.treema-node').data('instance');
      toSelect = nextSibling || prevSibling || selected[0].parent;
    }
    data = [];
    paths = [];
    parentPaths = [];
    for (_i = 0, _len = selected.length; _i < _len; _i++) {
      treema = selected[_i];
      data.push(treema.data);
      paths.push(treema.getPath());
      parentPaths.push((_ref = treema.parent) != null ? _ref.getPath() : void 0);
    }
    this.addTrackedAction({
      'data': data,
      'path': paths,
      'parentPath': parentPaths,
      'action': 'delete'
    });
    for (_j = 0, _len1 = selected.length; _j < _len1; _j++) {
      treema = selected[_j];
      treema.remove();
    }
    if (toSelect && !this.getSelectedTreemas().length) {
      return toSelect.select();
    }
  };

  TreemaNode.prototype.remove = function() {
    var readOnly, required, root, tempError, _ref, _ref1;
    required = this.parent && (this.parent.schema.required != null) && (_ref = this.keyForParent, __indexOf.call(this.parent.schema.required, _ref) >= 0);
    if (required) {
      tempError = this.createTemporaryError('required');
      this.$el.prepend(tempError);
      return false;
    }
    readOnly = this.schema.readOnly || ((_ref1 = this.parent) != null ? _ref1.schema.readOnly : void 0);
    if (readOnly) {
      tempError = this.createTemporaryError('read only');
      this.$el.prepend(tempError);
      return false;
    }
    root = this.getRootEl();
    this.$el.remove();
    this.removed = true;
    if (document.activeElement === $('body')[0]) {
      this.keepFocus();
    }
    if (this.parent == null) {
      return true;
    }
    delete this.parent.childrenTreemas[this.keyForParent];
    delete this.parent.data[this.keyForParent];
    if (this.parent.ordered) {
      this.parent.orderDataFromUI();
    }
    this.parent.refreshErrors();
    this.parent.updateMyAddButton();
    this.parent.markAsChanged();
    this.parent.buildValueForDisplay(this.parent.getValEl().empty(), this.parent.getData());
    this.broadcastChanges();
    return true;
  };

  TreemaNode.prototype.toggleOpen = function() {
    if (this.isClosed()) {
      this.open();
    } else {
      this.close();
    }
    return this;
  };

  TreemaNode.prototype.open = function(depth) {
    var child, childIndex, childNode, childrenContainer, treema, _i, _len, _ref, _ref1, _ref2, _results;
    if (depth == null) {
      depth = 1;
    }
    if (this.isClosed()) {
      childrenContainer = this.$el.find('.treema-children').detach();
      childrenContainer.empty();
      this.childrenTreemas = {};
      _ref = this.getChildren();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        if (child.schema.format === 'hidden') {
          continue;
        }
        treema = TreemaNode.make(null, {
          schema: child.schema,
          data: child.value
        }, this, child.key);
        this.integrateChildTreema(treema);
        childNode = this.createChildNode(treema);
        childrenContainer.append(childNode);
      }
      this.$el.append(childrenContainer).removeClass('treema-closed').addClass('treema-open');
      childrenContainer.append($(this.addChildTemplate));
      if (this.ordered && childrenContainer.sortable && !this.settings.noSortable) {
        if (typeof childrenContainer.sortable === "function") {
          childrenContainer.sortable({
            deactivate: this.orderDataFromUI
          });
        }
      }
      this.refreshErrors();
    }
    depth -= 1;
    if (depth) {
      _ref2 = (_ref1 = this.childrenTreemas) != null ? _ref1 : {};
      _results = [];
      for (childIndex in _ref2) {
        child = _ref2[childIndex];
        _results.push(child.open(depth));
      }
      return _results;
    }
  };

  TreemaNode.prototype.orderDataFromUI = function() {
    var child, children, index, treema, _i, _len;
    children = this.$el.find('> .treema-children > .treema-node');
    index = 0;
    this.childrenTreemas = {};
    this.data = $.isArray(this.data) ? [] : {};
    for (_i = 0, _len = children.length; _i < _len; _i++) {
      child = children[_i];
      treema = $(child).data('instance');
      if (!treema) {
        continue;
      }
      treema.keyForParent = index;
      this.childrenTreemas[index] = treema;
      this.data[index] = treema.data;
      index += 1;
    }
    return this.flushChanges();
  };

  TreemaNode.prototype.close = function(saveChildData) {
    var key, treema, _ref;
    if (saveChildData == null) {
      saveChildData = true;
    }
    if (!this.isOpen()) {
      return;
    }
    if (saveChildData) {
      _ref = this.childrenTreemas;
      for (key in _ref) {
        treema = _ref[key];
        this.data[key] = treema.data;
      }
    }
    this.$el.find('.treema-children').empty();
    this.$el.addClass('treema-closed').removeClass('treema-open');
    this.childrenTreemas = null;
    this.refreshErrors();
    return this.buildValueForDisplay(this.getValEl().empty(), this.getData());
  };

  TreemaNode.prototype.select = function() {
    var excludeSelf, numSelected;
    numSelected = this.getSelectedTreemas().length;
    excludeSelf = numSelected === 1;
    this.deselectAll(excludeSelf);
    this.toggleSelect();
    this.keepFocus();
    TreemaNode.didSelect = true;
    return TreemaNode.lastTreemaWithFocus = this.getRoot();
  };

  TreemaNode.prototype.deselectAll = function(excludeSelf) {
    var treema, _i, _len, _ref;
    if (excludeSelf == null) {
      excludeSelf = false;
    }
    _ref = this.getSelectedTreemas();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      treema = _ref[_i];
      if (excludeSelf && treema === this) {
        continue;
      }
      treema.$el.removeClass('treema-selected');
    }
    this.clearLastSelected();
    return TreemaNode.didSelect = true;
  };

  TreemaNode.prototype.toggleSelect = function() {
    this.clearLastSelected();
    if (!this.isRoot()) {
      this.$el.toggleClass('treema-selected');
    }
    if (this.isSelected()) {
      this.setLastSelectedTreema(this);
    }
    return TreemaNode.didSelect = true;
  };

  TreemaNode.prototype.clearLastSelected = function() {
    var _ref;
    if ((_ref = this.getLastSelectedTreema()) != null) {
      _ref.$el.removeClass('treema-last-selected');
    }
    return this.setLastSelectedTreema(null);
  };

  TreemaNode.prototype.shiftSelect = function() {
    var allNodes, lastSelected, node, started, _i, _len;
    lastSelected = this.getRootEl().find('.treema-last-selected');
    if (!lastSelected.length) {
      this.select();
    }
    this.deselectAll();
    allNodes = this.getRootEl().find('.treema-node');
    started = false;
    for (_i = 0, _len = allNodes.length; _i < _len; _i++) {
      node = allNodes[_i];
      node = $(node).data('instance');
      if (!started) {
        if (node === this || node.wasSelectedLast()) {
          started = true;
        }
        if (started) {
          node.$el.addClass('treema-selected');
        }
        continue;
      }
      if (started && (node === this || node.wasSelectedLast())) {
        break;
      }
      node.$el.addClass('treema-selected');
    }
    this.$el.addClass('treema-selected');
    lastSelected.addClass('treema-selected');
    lastSelected.removeClass('treema-last-selected');
    this.$el.addClass('treema-last-selected');
    return TreemaNode.didSelect = true;
  };

  TreemaNode.prototype.addTrackedAction = function(action) {
    var root;
    root = this.getRoot();
    if (root.trackingDisabled) {
      return;
    }
    root.trackedActions.splice(root.currentStateIndex, root.trackedActions.length - root.currentStateIndex);
    root.trackedActions.push(action);
    return root.currentStateIndex++;
  };

  TreemaNode.prototype.disableTracking = function() {
    return this.getRoot().trackingDisabled = true;
  };

  TreemaNode.prototype.enableTracking = function() {
    return this.getRoot().trackingDisabled = false;
  };

  TreemaNode.prototype.canUndo = function() {
    return this.getCurrentStateIndex() !== 0;
  };

  TreemaNode.prototype.undo = function() {
    var currentStateIndex, deleteIndex, i, parentData, parentPath, restoreChange, root, trackedActions, treemaData, treemaPath, _i, _len, _ref;
    if (!this.canUndo()) {
      return;
    }
    trackedActions = this.getTrackedActions();
    currentStateIndex = this.getCurrentStateIndex();
    root = this.getRoot();
    this.disableTracking();
    restoreChange = trackedActions[currentStateIndex - 1];
    switch (restoreChange.action) {
      case 'delete':
        if (!$.isArray(restoreChange.path)) {
          restoreChange.data = [restoreChange.data];
          restoreChange.path = [restoreChange.path];
          restoreChange.parentPath = [restoreChange.parentPath];
        }
        _ref = restoreChange.data;
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          treemaData = _ref[i];
          parentPath = restoreChange.parentPath[i];
          treemaPath = restoreChange.path[i];
          parentData = this.get(parentPath);
          switch ($.isArray(parentData)) {
            case false:
              this.set(treemaPath, treemaData);
              break;
            case true:
              deleteIndex = parseInt(treemaPath.substring(treemaPath.lastIndexOf('/') + 1));
              if (deleteIndex < parentData.length) {
                parentData.splice(deleteIndex, 0, treemaData);
                this.set(parentPath, parentData);
              } else {
                this.insert(parentPath, treemaData);
              }
          }
        }
        break;
      case 'edit':
        if (restoreChange.oldData === void 0) {
          this["delete"](restoreChange.path);
        } else {
          this.set(restoreChange.path, restoreChange.oldData);
        }
        break;
      case 'replace':
        restoreChange.newNode.replaceNode(restoreChange.oldNode.constructor);
        this.set(restoreChange.path, restoreChange.oldNode.data);
        break;
      case 'insert':
        this["delete"](restoreChange.path);
    }
    root.currentStateIndex--;
    return this.enableTracking();
  };

  TreemaNode.prototype.canRedo = function() {
    return this.getCurrentStateIndex() !== this.getTrackedActions().length;
  };

  TreemaNode.prototype.redo = function() {
    var currentStateIndex, parentData, path, restoreChange, root, trackedActions, _i, _len, _ref;
    if (!this.canRedo()) {
      return;
    }
    trackedActions = this.getTrackedActions();
    currentStateIndex = this.getCurrentStateIndex();
    root = this.getRoot();
    this.disableTracking();
    restoreChange = trackedActions[currentStateIndex];
    switch (restoreChange.action) {
      case 'delete':
        if (!$.isArray(restoreChange.path)) {
          restoreChange.path = [restoreChange.path];
        }
        _ref = restoreChange.path;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          path = _ref[_i];
          this["delete"](path);
        }
        break;
      case 'edit':
        this.set(restoreChange.path, restoreChange.newData);
        break;
      case 'replace':
        restoreChange.oldNode.replaceNode(restoreChange.newNode.constructor);
        this.set(restoreChange.path, restoreChange.newNode.data);
        break;
      case 'insert':
        parentData = this.get(restoreChange.parentPath);
        switch ($.isArray(parentData)) {
          case true:
            this.insert(restoreChange.parentPath, restoreChange.data);
            break;
          case false:
            this.set(restoreChange.path, restoreChange.data);
        }
    }
    root.currentStateIndex++;
    return this.enableTracking();
  };

  TreemaNode.prototype.getUndoDescription = function() {
    var currentStateIndex, trackedActions;
    if (!this.canUndo()) {
      return '';
    }
    trackedActions = this.getTrackedActions();
    currentStateIndex = this.getCurrentStateIndex();
    return this.getTrackedActionDescription(trackedActions[currentStateIndex - 1]);
  };

  TreemaNode.prototype.getRedoDescription = function() {
    var currentStateIndex, trackedActions;
    if (!this.canRedo()) {
      return '';
    }
    trackedActions = this.getTrackedActions();
    currentStateIndex = this.getCurrentStateIndex();
    return this.getTrackedActionDescription(trackedActions[currentStateIndex]);
  };

  TreemaNode.prototype.getTrackedActionDescription = function(trackedAction) {
    var path, trackedActionDescription;
    switch (trackedAction.action) {
      case 'insert':
        trackedActionDescription = 'Add New ' + this.nodeDescription;
        break;
      case 'delete':
        trackedActionDescription = 'Delete ' + this.nodeDescription;
        break;
      case 'edit':
        path = trackedAction.path.split('/');
        if (path[path.length - 1] === 'pos') {
          trackedActionDescription = 'Move ' + this.nodeDescription;
        } else {
          trackedActionDescription = 'Edit ' + this.nodeDescription;
        }
        break;
      default:
        trackedActionDescription = '';
    }
    return trackedActionDescription;
  };

  TreemaNode.prototype.getTrackedActions = function() {
    return this.getRoot().trackedActions;
  };

  TreemaNode.prototype.getCurrentStateIndex = function() {
    return this.getRoot().currentStateIndex;
  };

  TreemaNode.prototype.onSelectSchema = function(e) {
    var NodeClass, defaultType, index, workingSchema;
    index = parseInt($(e.target).val());
    workingSchema = this.workingSchemas[index];
    defaultType = "null";
    if (workingSchema["default"] != null) {
      defaultType = $.type(workingSchema["default"]);
    }
    if (workingSchema.type != null) {
      defaultType = workingSchema.type;
    }
    if ($.isArray(defaultType)) {
      defaultType = defaultType[0];
    }
    NodeClass = TreemaNode.getNodeClassForSchema(workingSchema, defaultType, this.settings.nodeClasses);
    this.workingSchema = workingSchema;
    return this.replaceNode(NodeClass);
  };

  TreemaNode.prototype.onSelectType = function(e) {
    var NodeClass, newType;
    newType = $(e.target).val();
    NodeClass = TreemaNode.getNodeClassForSchema(this.workingSchema, newType, this.settings.nodeClasses);
    return this.replaceNode(NodeClass);
  };

  TreemaNode.prototype.replaceNode = function(NodeClass) {
    var newNode, oldData, settings;
    settings = $.extend(true, {}, this.settings);
    oldData = this.data;
    if (settings.data) {
      delete settings.data;
    }
    newNode = new NodeClass(null, settings, this.parent);
    newNode.data = newNode.getDefaultValue();
    if (this.workingSchema["default"] != null) {
      newNode.data = this.workingSchema["default"];
    }
    if ($.type(oldData) === 'string' && $.type(newNode.data) === 'number') {
      newNode.data = parseFloat(oldData) || 0;
    }
    if ($.type(oldData) === 'number' && $.type(newNode.data) === 'string') {
      newNode.data = oldData.toString();
    }
    if ($.type(oldData) === 'number' && $.type(newNode.data) === 'number') {
      newNode.data = oldData;
      if (newNode.valueClass === 'treema-integer') {
        newNode.data = parseInt(newNode.data);
      }
    }
    newNode.tv4 = this.tv4;
    if (this.keyForParent != null) {
      newNode.keyForParent = this.keyForParent;
    }
    newNode.setWorkingSchema(this.workingSchema, this.workingSchemas);
    this.parent.createChildNode(newNode);
    this.$el.replaceWith(newNode.$el);
    newNode.flushChanges();
    return this.addTrackedAction({
      'oldNode': this,
      'newNode': newNode,
      'path': this.getPath(),
      'action': 'replace'
    });
  };

  TreemaNode.prototype.integrateChildTreema = function(treema) {
    treema.integrated = true;
    this.childrenTreemas[treema.keyForParent] = treema;
    treema.populateData();
    this.data[treema.keyForParent] = treema.data;
    return treema;
  };

  TreemaNode.prototype.createChildNode = function(treema) {
    var childNode, defnEl, keyEl, name, required, row, suffix, _ref;
    childNode = treema.build();
    row = childNode.find('.treema-row');
    if (this.collection && this.keyed) {
      name = treema.schema.title || treema.keyForParent;
      required = this.schema.required || [];
      suffix = ': ';
      if (_ref = treema.keyForParent, __indexOf.call(required, _ref) >= 0) {
        suffix = '*' + suffix;
      }
      keyEl = $(this.keyTemplate).text(name + suffix);
      row.prepend(keyEl);
      defnEl = $('<span></span>').addClass('treema-description').text(treema.schema.description || '');
      row.append(defnEl);
    }
    if (treema.collection) {
      childNode.prepend($(this.toggleTemplate));
    }
    return childNode;
  };

  TreemaNode.prototype.refreshErrors = function() {
    this.clearErrors();
    return this.showErrors();
  };

  TreemaNode.prototype.showErrors = function() {
    var childErrors, deepestTreema, e, error, erroredTreemas, errors, message, messages, ownErrors, path, subpath, treema, _i, _j, _k, _len, _len1, _len2, _ref, _results;
    if (this.parent && !this.integrated) {
      return;
    }
    errors = this.getErrors();
    erroredTreemas = [];
    for (_i = 0, _len = errors.length; _i < _len; _i++) {
      error = errors[_i];
      path = error.dataPath.slice(1);
      path = path ? path.split('/') : [];
      deepestTreema = this;
      for (_j = 0, _len1 = path.length; _j < _len1; _j++) {
        subpath = path[_j];
        if (!deepestTreema.childrenTreemas) {
          error.forChild = true;
          break;
        }
        if (deepestTreema.ordered) {
          subpath = parseInt(subpath);
        }
        deepestTreema = deepestTreema.childrenTreemas[subpath];
        if (!deepestTreema) {
          console.error('could not find treema down path', path, this, "so couldn't show error", error);
          return;
        }
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
      childErrors = (function() {
        var _l, _len3, _ref1, _results1;
        _ref1 = treema._errors;
        _results1 = [];
        for (_l = 0, _len3 = _ref1.length; _l < _len3; _l++) {
          e = _ref1[_l];
          if (e.forChild) {
            _results1.push(e);
          }
        }
        return _results1;
      })();
      ownErrors = (function() {
        var _l, _len3, _ref1, _results1;
        _ref1 = treema._errors;
        _results1 = [];
        for (_l = 0, _len3 = _ref1.length; _l < _len3; _l++) {
          e = _ref1[_l];
          if (!e.forChild) {
            _results1.push(e);
          }
        }
        return _results1;
      })();
      messages = (function() {
        var _l, _len3, _results1;
        _results1 = [];
        for (_l = 0, _len3 = ownErrors.length; _l < _len3; _l++) {
          e = ownErrors[_l];
          _results1.push(e.message);
        }
        return _results1;
      })();
      if (childErrors.length > 0) {
        message = "[" + childErrors.length + "] error";
        if (childErrors.length > 1) {
          message = message + 's';
        }
        messages.push(message);
      }
      _results.push(treema.showError(messages.join('<br />')));
    }
    return _results;
  };

  TreemaNode.prototype.showError = function(message) {
    this.$el.prepend($(this.errorTemplate));
    this.$el.find('> .treema-error').html(message).show();
    return this.$el.addClass('treema-has-error');
  };

  TreemaNode.prototype.clearErrors = function() {
    this.$el.find('.treema-error').remove();
    this.$el.find('.treema-has-error').removeClass('treema-has-error');
    return this.$el.removeClass('treema-has-error');
  };

  TreemaNode.prototype.createTemporaryError = function(message, attachFunction) {
    if (attachFunction == null) {
      attachFunction = null;
    }
    if (!attachFunction) {
      attachFunction = this.$el.prepend;
    }
    this.clearTemporaryErrors();
    return $(this.tempErrorTemplate).text(message).delay(3000).fadeOut(1000, function() {
      return $(this).remove();
    });
  };

  TreemaNode.prototype.clearTemporaryErrors = function() {
    return this.getRootEl().find('.treema-temp-error').remove();
  };

  TreemaNode.prototype.get = function(path) {
    var data, seg, _i, _len;
    if (path == null) {
      path = '/';
    }
    path = this.normalizePath(path);
    if (path.length === 0) {
      return this.data;
    }
    if (this.childrenTreemas != null) {
      return this.digDeeper(path, 'get', void 0, []);
    }
    data = this.data;
    for (_i = 0, _len = path.length; _i < _len; _i++) {
      seg = path[_i];
      data = data[this.normalizeKey(seg, data)];
      if (data === void 0) {
        break;
      }
    }
    return data;
  };

  TreemaNode.prototype.set = function(path, newData) {
    var oldData;
    oldData = this.get(path);
    if (this.setRecursive(path, newData)) {
      if (JSON.stringify(newData) !== JSON.stringify(oldData)) {
        this.addTrackedAction({
          'oldData': oldData,
          'newData': newData,
          'path': path,
          'action': 'edit'
        });
      }
      return true;
    } else {
      return false;
    }
  };

  TreemaNode.prototype.setRecursive = function(path, newData) {
    var data, i, nodePath, oldData, result, seg, _i, _len;
    path = this.normalizePath(path);
    if (path.length === 0) {
      this.data = newData;
      this.refreshDisplay();
      return true;
    }
    if (this.childrenTreemas != null) {
      result = this.digDeeper(path, 'setRecursive', false, [newData]);
      if (result === false && path.length === 1 && $.isPlainObject(this.data)) {
        this.data[path[0]] = newData;
        this.refreshDisplay();
        return true;
      }
      return result;
    }
    data = this.data;
    nodePath = this.getPath();
    for (i = _i = 0, _len = path.length; _i < _len; i = ++_i) {
      seg = path[i];
      seg = this.normalizeKey(seg, data);
      if (path.length === i + 1) {
        oldData = data[seg];
        data[seg] = newData;
        this.refreshDisplay();
        return true;
      } else {
        data = data[seg];
        if (data === void 0) {
          return false;
        }
      }
    }
  };

  TreemaNode.prototype["delete"] = function(path) {
    var oldData, parentPath;
    oldData = this.get(path);
    if (this.deleteRecursive(path)) {
      parentPath = path.substring(0, path.lastIndexOf('/'));
      this.addTrackedAction({
        'data': oldData,
        'path': path,
        'parentPath': parentPath,
        'action': 'delete'
      });
      return true;
    } else {
      return false;
    }
  };

  TreemaNode.prototype.deleteRecursive = function(path) {
    var data, i, parentPath, seg, _i, _len;
    path = this.normalizePath(path);
    if (path.length === 0) {
      return this.remove();
    }
    if (this.childrenTreemas != null) {
      return this.digDeeper(path, 'deleteRecursive', false, []);
    }
    data = this.data;
    parentPath = this.getPath();
    for (i = _i = 0, _len = path.length; _i < _len; i = ++_i) {
      seg = path[i];
      seg = this.normalizeKey(seg, data);
      if (path.length === i + 1) {
        if ($.isArray(data)) {
          data.splice(seg, 1);
        } else {
          delete data[seg];
        }
        this.refreshDisplay();
        return true;
      } else {
        data = data[seg];
        if (data === void 0) {
          return false;
        }
      }
      parentPath += '/' + seg;
    }
  };

  TreemaNode.prototype.insert = function(path, newData) {
    var childPath, insertPos, key, parentData, parentPath, val;
    if (this.insertRecursive(path, newData)) {
      parentPath = path;
      parentData = this.get(parentPath);
      childPath = parentPath;
      if (parentPath !== '/') {
        childPath += '/';
      }
      if (parentData[parentData.length - 1] !== newData) {
        for (key in parentData) {
          val = parentData[key];
          if (JSON.stringify(val) === JSON.stringify(newData)) {
            insertPos = key;
            break;
          }
        }
      } else {
        insertPos = parentData.length - 1;
      }
      childPath += insertPos.toString();
      this.addTrackedAction({
        'data': newData,
        'path': childPath,
        'parentPath': parentPath,
        'action': 'insert'
      });
      return true;
    } else {
      return false;
    }
  };

  TreemaNode.prototype.insertRecursive = function(path, newData) {
    var childPath, data, i, lastTreema, parentPath, seg, _i, _len;
    path = this.normalizePath(path);
    if (path.length === 0) {
      if (!$.isArray(this.data)) {
        return false;
      }
      this.data.push(newData);
      this.refreshDisplay();
      this.flushChanges();
      parentPath = this.getPath();
      childPath = this.getPath() + '/' + (this.data.length - 1).toString();
      lastTreema = this.getLastTreema();
      return true;
    }
    if (this.childrenTreemas != null) {
      return this.digDeeper(path, 'insertRecursive', false, [newData]);
    }
    data = this.data;
    parentPath = this.getPath();
    for (i = _i = 0, _len = path.length; _i < _len; i = ++_i) {
      seg = path[i];
      parentPath += '/' + seg;
      seg = this.normalizeKey(seg, data);
      data = data[seg];
      if (data === void 0) {
        return false;
      }
    }
    if (!$.isArray(data)) {
      return false;
    }
    data.push(newData);
    this.refreshDisplay();
    return true;
  };

  TreemaNode.prototype.normalizeKey = function(key, collection) {
    var i, parts, value, _i, _len;
    if ($.isArray(collection)) {
      if (__indexOf.call(key, '=') >= 0) {
        parts = key.split('=');
        for (i = _i = 0, _len = collection.length; _i < _len; i = ++_i) {
          value = collection[i];
          if (value[parts[0]] === parts[1]) {
            return i;
          }
        }
      } else {
        return parseInt(key);
      }
    }
    return key;
  };

  TreemaNode.prototype.normalizePath = function(path) {
    var s;
    if ($.type(path) === 'string') {
      path = path.split('/');
      path = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = path.length; _i < _len; _i++) {
          s = path[_i];
          if (s.length) {
            _results.push(s);
          }
        }
        return _results;
      })();
    }
    return path;
  };

  TreemaNode.prototype.digDeeper = function(path, func, def, args) {
    var childTreema, seg;
    seg = this.normalizeKey(path[0], this.data);
    childTreema = this.childrenTreemas[seg];
    if (childTreema === void 0) {
      return def;
    }
    return childTreema[func].apply(childTreema, [path.slice(1)].concat(__slice.call(args)));
  };

  TreemaNode.prototype.refreshDisplay = function() {
    if (this.isDisplaying()) {
      this.buildValueForDisplay(this.getValEl().empty(), this.getData());
    } else {
      this.display();
    }
    if (this.collection && this.isOpen()) {
      this.close(false);
      this.open();
    }
    this.flushChanges();
    return this.broadcastChanges();
  };

  TreemaNode.prototype.getNodeEl = function() {
    return this.$el;
  };

  TreemaNode.prototype.getValEl = function() {
    return this.$el.find('> .treema-row .treema-value');
  };

  TreemaNode.prototype.getRootEl = function() {
    return this.$el.closest('.treema-root');
  };

  TreemaNode.prototype.getRoot = function() {
    var node;
    node = this;
    while (node.parent != null) {
      node = node.parent;
    }
    return node;
  };

  TreemaNode.prototype.getInputs = function() {
    return this.getValEl().find('input, textarea');
  };

  TreemaNode.prototype.getSelectedTreemas = function() {
    var el, _i, _len, _ref, _results;
    _ref = this.getRootEl().find('.treema-selected');
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      el = _ref[_i];
      _results.push($(el).data('instance'));
    }
    return _results;
  };

  TreemaNode.prototype.getLastSelectedTreema = function() {
    return this.getRoot().lastSelectedTreema;
  };

  TreemaNode.prototype.setLastSelectedTreema = function(node) {
    this.getRoot().lastSelectedTreema = node;
    return node != null ? node.$el.addClass('treema-last-selected') : void 0;
  };

  TreemaNode.prototype.getAddButtonEl = function() {
    return this.$el.find('> .treema-children > .treema-add-child');
  };

  TreemaNode.prototype.getVisibleTreemas = function() {
    var el, _i, _len, _ref, _results;
    _ref = this.getRootEl().find('.treema-node');
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      el = _ref[_i];
      _results.push($(el).data('instance'));
    }
    return _results;
  };

  TreemaNode.prototype.getNavigableElements = function() {
    return this.getRootEl().find('.treema-node, .treema-add-child:visible').toArray();
  };

  TreemaNode.prototype.getPath = function() {
    var pathPieces, pointer;
    pathPieces = [];
    pointer = this;
    while (pointer && (pointer.keyForParent != null)) {
      pathPieces.push(pointer.keyForParent + '');
      pointer = pointer.parent;
    }
    pathPieces.reverse();
    return '/' + pathPieces.join('/');
  };

  TreemaNode.prototype.getData = function() {
    if ($.type(this.data) === 'undefined') {
      return this.defaultData;
    } else {
      return this.data;
    }
  };

  TreemaNode.prototype.getLastTreema = function() {
    var lastKey, lastTreema, treemaKeys;
    if (!this.childrenTreemas) {
      return this;
    }
    treemaKeys = Object.keys(this.childrenTreemas);
    lastKey = treemaKeys[treemaKeys.length - 1];
    lastTreema = this.childrenTreemas[lastKey];
    return lastTreema;
  };

  TreemaNode.getLastTreemaWithFocus = function() {
    return this.lastTreemaWithFocus;
  };

  TreemaNode.prototype.isRoot = function() {
    return !this.parent;
  };

  TreemaNode.prototype.isEditing = function() {
    return this.getValEl().hasClass('treema-edit');
  };

  TreemaNode.prototype.isDisplaying = function() {
    return this.getValEl().hasClass('treema-display');
  };

  TreemaNode.prototype.isOpen = function() {
    return this.$el.hasClass('treema-open');
  };

  TreemaNode.prototype.isClosed = function() {
    return this.$el.hasClass('treema-closed');
  };

  TreemaNode.prototype.isSelected = function() {
    return this.$el.hasClass('treema-selected');
  };

  TreemaNode.prototype.wasSelectedLast = function() {
    return this.$el.hasClass('treema-last-selected');
  };

  TreemaNode.prototype.editingIsHappening = function() {
    return this.getRootEl().find('.treema-edit').length;
  };

  TreemaNode.prototype.rootSelected = function() {
    return $(document.activeElement).hasClass('treema-root');
  };

  TreemaNode.prototype.setFilterVisible = function(isFilterVisible) {
    if (isFilterVisible) {
      return this.$el.find('.treema-node').andSelf().removeClass(this.treemaFilterHiddenClass);
    } else {
      return this.$el.find('.treema-node').andSelf().addClass(this.treemaFilterHiddenClass);
    }
  };

  TreemaNode.prototype.getFilterVisibleTreemas = function() {
    var el, _i, _len, _ref, _results;
    _ref = this.getRootEl().find('.treema-node').not('.' + this.treemaFilterHiddenClass);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      el = _ref[_i];
      _results.push($(el).data('instance'));
    }
    return _results;
  };

  TreemaNode.prototype.isFilterVisible = function() {
    return !this.$el.hasClass(this.treemaFilterHiddenClass);
  };

  TreemaNode.prototype.keepFocus = function(x, y) {
    var _ref;
    if (!((x != null) && (y != null))) {
      _ref = [window.scrollX, window.scrollY], x = _ref[0], y = _ref[1];
    }
    this.getRootEl().focus();
    return window.scrollTo(x, y);
  };

  TreemaNode.prototype.copyData = function() {
    return $.extend(null, {}, {
      'd': this.data
    })['d'];
  };

  TreemaNode.prototype.updateMyAddButton = function() {
    this.$el.removeClass('treema-full');
    if (!this.canAddChild()) {
      return this.$el.addClass('treema-full');
    }
  };

  TreemaNode.nodeMap = {};

  TreemaNode.setNodeSubclass = function(key, NodeClass) {
    return this.nodeMap[key] = NodeClass;
  };

  TreemaNode.make = function(element, options, parent, keyForParent) {
    var NodeClass, combinedOps, localClasses, newNode, type, workingData, workingSchema, workingSchemas, _ref;
    if ((options.schema["default"] != null) && !((options.data != null) || (options.defaultData != null))) {
      if ($.type(options.schema["default"]) === 'object') {
        options.data = {};
      } else {
        options.data = this.utils.cloneDeep(options.schema["default"]);
      }
    }
    workingData = options.data || options.defaultData;
    workingSchemas = this.utils.buildWorkingSchemas(options.schema, parent != null ? parent.tv4 : void 0);
    workingSchema = this.utils.chooseWorkingSchema(workingData, workingSchemas, options.tv4);
    this.massageData(options, workingSchema);
    type = $.type((_ref = options.data) != null ? _ref : options.defaultData);
    localClasses = parent ? parent.settings.nodeClasses : options.nodeClasses;
    NodeClass = this.getNodeClassForSchema(workingSchema, type, localClasses);
    combinedOps = {};
    if (parent) {
      $.extend(combinedOps, parent.settings);
    }
    $.extend(combinedOps, options);
    newNode = new NodeClass(element, combinedOps, parent);
    if (keyForParent != null) {
      newNode.keyForParent = keyForParent;
    }
    if (parent) {
      newNode.setWorkingSchema(workingSchema, workingSchemas);
    }
    return newNode;
  };

  TreemaNode.massageData = function(options, workingSchema) {
    var dataType, defaultDataType, schemaTypes;
    if (!(schemaTypes = workingSchema.type)) {
      return;
    }
    if ($.type(schemaTypes) !== 'array') {
      schemaTypes = [schemaTypes];
    }
    dataType = $.type(options.data);
    defaultDataType = $.type(options.defaultData);
    if (dataType !== 'undefined' && __indexOf.call(schemaTypes, dataType) < 0) {
      options.data = this.defaultForType(schemaTypes[0]);
    }
    if (defaultDataType !== 'undefined' && __indexOf.call(schemaTypes, defaultDataType) < 0) {
      delete options.defaultDataType;
      defaultDataType = 'undefined';
    }
    if (dataType === 'undefined' && defaultDataType === 'undefined') {
      return options.data = this.defaultForType(schemaTypes[0]);
    }
  };

  TreemaNode.defaultForType = function(type) {
    return {
      'string': '',
      'number': 0,
      'null': null,
      'object': {},
      'integer': 0,
      'boolean': false,
      'array': []
    }[type];
  };

  TreemaNode.getNodeClassForSchema = function(schema, def, localClasses) {
    var NodeClass, type, typeMismatch, _ref;
    if (def == null) {
      def = 'string';
    }
    if (localClasses == null) {
      localClasses = null;
    }
    typeMismatch = false;
    if (schema.type) {
      if ($.isArray(schema.type)) {
        if (_ref = !def, __indexOf.call(schema.type, _ref) >= 0) {
          typeMismatch = true;
        }
      } else {
        typeMismatch = def !== schema.type;
      }
    }
    NodeClass = null;
    localClasses = localClasses || {};
    if (schema.format) {
      NodeClass = localClasses[schema.format] || this.nodeMap[schema.format];
    }
    if (NodeClass && !typeMismatch) {
      return NodeClass;
    }
    type = schema.type || def;
    if ($.isArray(type) || typeMismatch) {
      type = def;
    }
    NodeClass = localClasses[type] || this.nodeMap[type];
    if (NodeClass) {
      return NodeClass;
    }
    return this.nodeMap['any'];
  };

  TreemaNode.extend = function(child) {
    var ctor;
    ctor = function() {};
    ctor.prototype = this.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    child.__super__ = this.prototype;
    child.prototype["super"] = function(method) {
      return this.constructor.__super__[method];
    };
    return child;
  };

  TreemaNode.didSelect = false;

  TreemaNode.changedTreemas = [];

  TreemaNode.prototype.filterChildren = function(filter) {
    var keyForParent, treemaNode, _ref, _results;
    _ref = this.childrenTreemas;
    _results = [];
    for (keyForParent in _ref) {
      treemaNode = _ref[keyForParent];
      _results.push(treemaNode.setFilterVisible(!filter || filter(treemaNode, keyForParent)));
    }
    return _results;
  };

  TreemaNode.prototype.clearFilter = function() {
    var keyForParent, treemaNode, _ref, _results;
    _ref = this.childrenTreemas;
    _results = [];
    for (keyForParent in _ref) {
      treemaNode = _ref[keyForParent];
      _results.push(treemaNode.setFilterVisible(true));
    }
    return _results;
  };

  return TreemaNode;

})();
;var __init,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __slice = [].slice;

(__init = function() {
  var AnyNode, ArrayNode, BooleanNode, IntegerNode, NullNode, NumberNode, ObjectNode, StringNode, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
  TreemaNode.setNodeSubclass('string', StringNode = (function(_super) {
    __extends(StringNode, _super);

    function StringNode() {
      _ref = StringNode.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    StringNode.prototype.valueClass = 'treema-string';

    StringNode.prototype.getDefaultValue = function() {
      return '';
    };

    StringNode.inputTypes = ['color', 'date', 'datetime', 'datetime-local', 'email', 'month', 'range', 'search', 'tel', 'text', 'time', 'url', 'week'];

    StringNode.prototype.buildValueForDisplay = function(valEl, data) {
      return this.buildValueForDisplaySimply(valEl, "\"" + data + "\"");
    };

    StringNode.prototype.buildValueForEditing = function(valEl, data) {
      var input, _ref1;
      input = this.buildValueForEditingSimply(valEl, data);
      if (this.schema.maxLength) {
        input.attr('maxlength', this.schema.maxLength);
      }
      if (_ref1 = this.schema.format, __indexOf.call(StringNode.inputTypes, _ref1) >= 0) {
        return input.attr('type', this.schema.format);
      }
    };

    StringNode.prototype.saveChanges = function(valEl) {
      var oldData;
      oldData = this.data;
      this.data = $('input', valEl).val();
      return StringNode.__super__.saveChanges.call(this, oldData);
    };

    return StringNode;

  })(TreemaNode));
  TreemaNode.setNodeSubclass('number', NumberNode = (function(_super) {
    __extends(NumberNode, _super);

    function NumberNode() {
      _ref1 = NumberNode.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    NumberNode.prototype.valueClass = 'treema-number';

    NumberNode.prototype.getDefaultValue = function() {
      return 0;
    };

    NumberNode.prototype.buildValueForDisplay = function(valEl, data) {
      return this.buildValueForDisplaySimply(valEl, JSON.stringify(data));
    };

    NumberNode.prototype.buildValueForEditing = function(valEl, data) {
      var input;
      input = this.buildValueForEditingSimply(valEl, JSON.stringify(data), 'number');
      if (this.schema.maximum) {
        input.attr('max', this.schema.maximum);
      }
      if (this.schema.minimum) {
        return input.attr('min', this.schema.minimum);
      }
    };

    NumberNode.prototype.saveChanges = function(valEl) {
      var oldData;
      oldData = this.data;
      this.data = parseFloat($('input', valEl).val());
      return NumberNode.__super__.saveChanges.call(this, oldData);
    };

    return NumberNode;

  })(TreemaNode));
  TreemaNode.setNodeSubclass('integer', IntegerNode = (function(_super) {
    __extends(IntegerNode, _super);

    function IntegerNode() {
      _ref2 = IntegerNode.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    IntegerNode.prototype.valueClass = 'treema-integer';

    IntegerNode.prototype.getDefaultValue = function() {
      return 0;
    };

    IntegerNode.prototype.buildValueForDisplay = function(valEl, data) {
      return this.buildValueForDisplaySimply(valEl, JSON.stringify(data));
    };

    IntegerNode.prototype.buildValueForEditing = function(valEl, data) {
      var input;
      input = this.buildValueForEditingSimply(valEl, JSON.stringify(data), 'number');
      if (this.schema.maximum) {
        input.attr('max', this.schema.maximum);
      }
      if (this.schema.minimum) {
        return input.attr('min', this.schema.minimum);
      }
    };

    IntegerNode.prototype.saveChanges = function(valEl) {
      var oldData;
      oldData = this.data;
      this.data = parseInt($('input', valEl).val());
      return IntegerNode.__super__.saveChanges.call(this, oldData);
    };

    return IntegerNode;

  })(TreemaNode));
  TreemaNode.setNodeSubclass('null', NullNode = NullNode = (function(_super) {
    __extends(NullNode, _super);

    function NullNode() {
      _ref3 = NullNode.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    NullNode.prototype.valueClass = 'treema-null';

    NullNode.prototype.editable = false;

    NullNode.prototype.buildValueForDisplay = function(valEl) {
      return this.buildValueForDisplaySimply(valEl, 'null');
    };

    return NullNode;

  })(TreemaNode));
  TreemaNode.setNodeSubclass('boolean', BooleanNode = (function(_super) {
    __extends(BooleanNode, _super);

    function BooleanNode() {
      _ref4 = BooleanNode.__super__.constructor.apply(this, arguments);
      return _ref4;
    }

    BooleanNode.prototype.valueClass = 'treema-boolean';

    BooleanNode.prototype.getDefaultValue = function() {
      return false;
    };

    BooleanNode.prototype.buildValueForDisplay = function(valEl, data) {
      this.buildValueForDisplaySimply(valEl, JSON.stringify(data));
      return this.select();
    };

    BooleanNode.prototype.buildValueForEditing = function(valEl, data) {
      var input;
      input = this.buildValueForEditingSimply(valEl, JSON.stringify(data));
      $('<span></span>').text(JSON.stringify(this.data)).insertBefore(input);
      return input.focus();
    };

    BooleanNode.prototype.toggleValue = function(newValue) {
      var oldData, valEl;
      if (newValue == null) {
        newValue = null;
      }
      oldData = this.getData();
      this.data = !this.data;
      if (newValue != null) {
        this.data = newValue;
      }
      valEl = this.getValEl().empty();
      if (this.isDisplaying()) {
        this.buildValueForDisplay(valEl, this.getData());
      } else {
        this.buildValueForEditing(valEl, this.getData());
      }
      this.addTrackedAction({
        'oldData': oldData,
        'newData': this.data,
        'path': this.getPath(),
        'action': 'edit'
      });
      this.select();
      return this.flushChanges();
    };

    BooleanNode.prototype.onSpacePressed = function() {
      return this.toggleValue();
    };

    BooleanNode.prototype.onFPressed = function() {
      return this.toggleValue(false);
    };

    BooleanNode.prototype.onTPressed = function() {
      return this.toggleValue(true);
    };

    BooleanNode.prototype.saveChanges = function() {};

    BooleanNode.prototype.onClick = function(e) {
      var value;
      value = $(e.target).closest('.treema-value');
      if (!value.length) {
        return BooleanNode.__super__.onClick.call(this, e);
      }
      if (this.canEdit()) {
        return this.toggleValue();
      }
    };

    return BooleanNode;

  })(TreemaNode));
  TreemaNode.setNodeSubclass('array', ArrayNode = (function(_super) {
    __extends(ArrayNode, _super);

    function ArrayNode() {
      _ref5 = ArrayNode.__super__.constructor.apply(this, arguments);
      return _ref5;
    }

    ArrayNode.prototype.valueClass = 'treema-array';

    ArrayNode.prototype.getDefaultValue = function() {
      return [];
    };

    ArrayNode.prototype.collection = true;

    ArrayNode.prototype.ordered = true;

    ArrayNode.prototype.directlyEditable = false;

    ArrayNode.prototype.sort = false;

    ArrayNode.prototype.getChildren = function() {
      var key, value, _i, _len, _ref6, _results;
      _ref6 = this.data;
      _results = [];
      for (key = _i = 0, _len = _ref6.length; _i < _len; key = ++_i) {
        value = _ref6[key];
        _results.push({
          key: key,
          value: value,
          schema: TreemaNode.utils.getChildSchema(key, this.schema)
        });
      }
      return _results;
    };

    ArrayNode.prototype.buildValueForDisplay = function(valEl, data) {
      var child, empty, helperTreema, index, text, val, _i, _len, _ref6;
      text = [];
      if (!data) {
        return;
      }
      _ref6 = data.slice(0, 3);
      for (index = _i = 0, _len = _ref6.length; _i < _len; index = ++_i) {
        child = _ref6[index];
        helperTreema = TreemaNode.make(null, {
          schema: TreemaNode.utils.getChildSchema(index, this.schema),
          data: child
        }, this);
        val = $('<div></div>');
        helperTreema.buildValueForDisplay(val, helperTreema.getData());
        text.push(val.text());
      }
      if (data.length > 3) {
        text.push('...');
      }
      empty = this.schema.title != null ? "(empty " + this.schema.title + ")" : '(empty)';
      text = text.length ? text.join(' | ') : empty;
      return this.buildValueForDisplaySimply(valEl, text);
    };

    ArrayNode.prototype.buildValueForEditing = function(valEl, data) {
      return this.buildValueForEditingSimply(valEl, JSON.stringify(data));
    };

    ArrayNode.prototype.canAddChild = function() {
      if (this.settings.readOnly || this.schema.readOnly) {
        return false;
      }
      if (this.schema.additionalItems === false && this.data.length >= this.schema.items.length) {
        return false;
      }
      if ((this.schema.maxItems != null) && this.data.length >= this.schema.maxItems) {
        return false;
      }
      return true;
    };

    ArrayNode.prototype.addNewChild = function() {
      var childNode, newTreema, new_index, schema;
      if (!this.canAddChild()) {
        return;
      }
      if (this.isClosed()) {
        this.open();
      }
      new_index = Object.keys(this.childrenTreemas).length;
      schema = TreemaNode.utils.getChildSchema(new_index, this.schema);
      newTreema = TreemaNode.make(void 0, {
        schema: schema
      }, this, new_index);
      newTreema.tv4 = this.tv4;
      childNode = this.createChildNode(newTreema);
      this.addTrackedAction({
        'data': newTreema.data,
        'path': newTreema.getPath(),
        'parentPath': this.getPath(),
        'action': 'insert'
      });
      this.getAddButtonEl().before(childNode);
      if (newTreema.canEdit()) {
        newTreema.edit();
      } else {
        newTreema.select();
        this.integrateChildTreema(newTreema);
        newTreema.flushChanges();
      }
      return newTreema;
    };

    ArrayNode.prototype.open = function() {
      if (this.sort) {
        this.data.sort(this.sortFunction);
      }
      return ArrayNode.__super__.open.apply(this, arguments);
    };

    ArrayNode.prototype.close = function() {
      var valEl;
      ArrayNode.__super__.close.apply(this, arguments);
      valEl = this.getValEl().empty();
      return this.buildValueForDisplay(valEl, this.getData());
    };

    ArrayNode.prototype.sortFunction = function(a, b) {
      if (a > b) {
        return 1;
      }
      if (a < b) {
        return -1;
      }
      return 0;
    };

    return ArrayNode;

  })(TreemaNode));
  window.TreemaArrayNode = ArrayNode;
  TreemaNode.setNodeSubclass('object', ObjectNode = (function(_super) {
    __extends(ObjectNode, _super);

    function ObjectNode() {
      this.cleanupAddNewChild = __bind(this.cleanupAddNewChild, this);
      this.onAutocompleteSelect = __bind(this.onAutocompleteSelect, this);
      _ref6 = ObjectNode.__super__.constructor.apply(this, arguments);
      return _ref6;
    }

    ObjectNode.prototype.valueClass = 'treema-object';

    ObjectNode.prototype.getDefaultValue = function() {
      var childKey, childSchema, d, _ref7, _ref8;
      d = {};
      if (!((_ref7 = this.schema) != null ? _ref7.properties : void 0)) {
        return d;
      }
      _ref8 = this.schema.properties;
      for (childKey in _ref8) {
        childSchema = _ref8[childKey];
        if (childSchema["default"]) {
          d[childKey] = childSchema["default"];
        }
      }
      return d;
    };

    ObjectNode.prototype.collection = true;

    ObjectNode.prototype.keyed = true;

    ObjectNode.prototype.directlyEditable = false;

    ObjectNode.prototype.getChildren = function() {
      var children, defaultData, key, keysAccountedFor, schema, value, _ref7;
      children = [];
      keysAccountedFor = [];
      if (this.schema.properties) {
        for (key in this.schema.properties) {
          defaultData = this.getDefaultDataForKey(key);
          if ($.type(this.data[key]) === 'undefined') {
            if (defaultData != null) {
              keysAccountedFor.push(key);
              children.push({
                key: key,
                schema: TreemaNode.utils.getChildSchema(key, this.schema),
                defaultData: defaultData
              });
            }
            continue;
          }
          keysAccountedFor.push(key);
          schema = TreemaNode.utils.getChildSchema(key, this.schema);
          children.push({
            key: key,
            value: this.data[key],
            schema: schema,
            defaultData: defaultData
          });
        }
      }
      _ref7 = this.data;
      for (key in _ref7) {
        value = _ref7[key];
        if (__indexOf.call(keysAccountedFor, key) >= 0) {
          continue;
        }
        keysAccountedFor.push(key);
        children.push({
          key: key,
          value: value,
          schema: TreemaNode.utils.getChildSchema(key, this.schema),
          defaultData: this.getDefaultDataForKey(key)
        });
      }
      if ($.isPlainObject(this.defaultData)) {
        for (key in this.defaultData) {
          if (__indexOf.call(keysAccountedFor, key) >= 0) {
            continue;
          }
          keysAccountedFor.push(key);
          children.push({
            key: key,
            schema: TreemaNode.utils.getChildSchema(key, this.schema),
            defaultData: this.getDefaultDataForKey(key)
          });
        }
      }
      if ($.isPlainObject(this.schema["default"])) {
        for (key in this.schema["default"]) {
          if (__indexOf.call(keysAccountedFor, key) >= 0) {
            continue;
          }
          keysAccountedFor.push(key);
          children.push({
            key: key,
            schema: TreemaNode.utils.getChildSchema(key, this.schema),
            defaultData: this.getDefaultDataForKey(key)
          });
        }
      }
      return children;
    };

    ObjectNode.prototype.getDefaultDataForKey = function(key) {
      var childDefaultData, _ref7, _ref8, _ref9;
      childDefaultData = (_ref7 = (_ref8 = this.defaultData) != null ? _ref8[key] : void 0) != null ? _ref7 : (_ref9 = this.schema["default"]) != null ? _ref9[key] : void 0;
      if ($.isArray(childDefaultData)) {
        childDefaultData = $.extend(true, [], childDefaultData);
      }
      if ($.isPlainObject(childDefaultData)) {
        childDefaultData = $.extend(true, {}, childDefaultData);
      }
      return childDefaultData;
    };

    ObjectNode.prototype.buildValueForDisplay = function(valEl, data) {
      var childSchema, displayValue, empty, i, key, name, schema, text, value, valueString;
      text = [];
      if (!data) {
        return;
      }
      displayValue = data[this.schema.displayProperty];
      if (displayValue) {
        text = displayValue;
        return this.buildValueForDisplaySimply(valEl, text);
      }
      i = 0;
      schema = this.workingSchema || this.schema;
      for (key in data) {
        value = data[key];
        if (i === 3) {
          text.push('...');
          break;
        }
        i += 1;
        childSchema = TreemaNode.utils.getChildSchema(key, this.schema);
        name = childSchema.title || key;
        if ($.isPlainObject(value) || $.isArray(value)) {
          text.push("" + name);
          continue;
        }
        valueString = value;
        if ($.type(value) !== 'string') {
          valueString = JSON.stringify(value);
        }
        if (typeof value === 'undefined') {
          valueString = 'undefined';
        }
        if (valueString.length > 20) {
          valueString = valueString.slice(0, 21) + ' ...';
        }
        text.push("" + name + "=" + valueString);
      }
      empty = this.schema.title != null ? "(empty " + this.schema.title + ")" : '(empty)';
      text = text.length ? text.join(', ') : empty;
      return this.buildValueForDisplaySimply(valEl, text);
    };

    ObjectNode.prototype.populateData = function() {
      var helperTreema, key, _i, _len, _ref7, _results;
      ObjectNode.__super__.populateData.call(this);
      if (!this.schema.required) {
        return;
      }
      _ref7 = this.schema.required;
      _results = [];
      for (_i = 0, _len = _ref7.length; _i < _len; _i++) {
        key = _ref7[_i];
        if (this.data[key] != null) {
          continue;
        }
        helperTreema = TreemaNode.make(null, {
          schema: TreemaNode.utils.getChildSchema(key, this.schema)
        }, this);
        helperTreema.populateData();
        _results.push(this.data[key] = helperTreema.data);
      }
      return _results;
    };

    ObjectNode.prototype.close = function() {
      ObjectNode.__super__.close.apply(this, arguments);
      return this.buildValueForDisplay(this.getValEl().empty(), this.getData());
    };

    ObjectNode.prototype.addNewChild = function() {
      var keyInput, properties,
        _this = this;
      if (!this.canAddChild()) {
        return;
      }
      if (!this.isRoot()) {
        this.open();
      }
      this.deselectAll();
      properties = this.childPropertiesAvailable();
      keyInput = $(this.newPropertyTemplate);
      keyInput.blur(this.cleanupAddNewChild);
      keyInput.keydown(function(e) {
        return _this.originalTargetValue = $(e.target).val();
      });
      if (typeof keyInput.autocomplete === "function") {
        keyInput.autocomplete({
          source: properties,
          minLength: 0,
          delay: 0,
          autoFocus: true,
          select: this.onAutocompleteSelect
        });
      }
      this.getAddButtonEl().before(keyInput).hide();
      keyInput.focus();
      keyInput.autocomplete('search');
      return true;
    };

    ObjectNode.prototype.onAutocompleteSelect = function(e, ui) {
      $(e.target).val(ui.item.value);
      return this.tryToAddNewChild(e, true);
    };

    ObjectNode.prototype.canAddChild = function() {
      if (this.settings.readOnly || this.schema.readOnly) {
        return false;
      }
      if ((this.schema.maxProperties != null) && Object.keys(this.data).length >= this.schema.maxProperties) {
        return false;
      }
      if (this.schema.additionalProperties !== false) {
        return true;
      }
      if (this.schema.patternProperties != null) {
        return true;
      }
      if (this.childPropertiesAvailable().length) {
        return true;
      }
      return false;
    };

    ObjectNode.prototype.childPropertiesAvailable = function() {
      var childSchema, properties, property, schema, _ref7;
      schema = this.workingSchema || this.schema;
      if (!schema.properties) {
        return [];
      }
      properties = [];
      _ref7 = schema.properties;
      for (property in _ref7) {
        childSchema = _ref7[property];
        if (this.data[property] != null) {
          continue;
        }
        if (childSchema.format === 'hidden') {
          continue;
        }
        if (childSchema.readOnly) {
          continue;
        }
        properties.push(childSchema.title || property);
      }
      return properties.sort();
    };

    ObjectNode.prototype.onDeletePressed = function(e) {
      if (!this.addingNewProperty()) {
        return ObjectNode.__super__.onDeletePressed.call(this, e);
      }
      if (!$(e.target).val()) {
        this.cleanupAddNewChild();
        e.preventDefault();
        return this.$el.find('.treema-add-child').focus();
      }
    };

    ObjectNode.prototype.onEscapePressed = function() {
      return this.cleanupAddNewChild();
    };

    ObjectNode.prototype.onTabPressed = function(e) {
      if (!this.addingNewProperty()) {
        return ObjectNode.__super__.onTabPressed.call(this, e);
      }
      e.preventDefault();
      return this.tryToAddNewChild(e, false);
    };

    ObjectNode.prototype.onEnterPressed = function(e) {
      if (!this.addingNewProperty()) {
        return ObjectNode.__super__.onEnterPressed.call(this, e);
      }
      return this.tryToAddNewChild(e, true);
    };

    ObjectNode.prototype.tryToAddNewChild = function(e, aggressive) {
      var key, keyInput, offset, treema;
      if ((!this.originalTargetValue) && (!aggressive)) {
        offset = e.shiftKey ? -1 : 1;
        this.cleanupAddNewChild();
        this.$el.find('.treema-add-child').focus();
        this.traverseWhileEditing(offset);
        return;
      }
      keyInput = $(e.target);
      key = this.getPropertyKey($(e.target));
      if (key.length && !this.canAddProperty(key)) {
        this.clearTemporaryErrors();
        this.showBadPropertyError(keyInput);
        return;
      }
      if (this.childrenTreemas[key] != null) {
        this.cleanupAddNewChild();
        treema = this.childrenTreemas[key];
        if (treema.canEdit()) {
          return treema.toggleEdit();
        } else {
          return treema.select();
        }
      }
      this.cleanupAddNewChild();
      return this.addNewChildForKey(key);
    };

    ObjectNode.prototype.getPropertyKey = function(keyInput) {
      var child_key, child_schema, key, _ref7;
      key = keyInput.val();
      if (this.schema.properties) {
        _ref7 = this.schema.properties;
        for (child_key in _ref7) {
          child_schema = _ref7[child_key];
          if (child_schema.title === key) {
            key = child_key;
          }
        }
      }
      return key;
    };

    ObjectNode.prototype.canAddProperty = function(key) {
      var pattern;
      if (this.schema.additionalProperties !== false) {
        return true;
      }
      if (this.schema.properties[key] != null) {
        return true;
      }
      if (this.schema.patternProperties != null) {
        if ((function() {
          var _results;
          _results = [];
          for (pattern in this.schema.patternProperties) {
            _results.push(RegExp(pattern).test(key));
          }
          return _results;
        }).call(this)) {
          return true;
        }
      }
      return false;
    };

    ObjectNode.prototype.showBadPropertyError = function(keyInput) {
      var tempError;
      keyInput.focus();
      tempError = this.createTemporaryError('Invalid property name.');
      tempError.insertAfter(keyInput);
    };

    ObjectNode.prototype.addNewChildForKey = function(key) {
      var child, childNode, children, newTreema, schema;
      schema = TreemaNode.utils.getChildSchema(key, this.schema);
      newTreema = TreemaNode.make(null, {
        schema: schema
      }, this, key);
      childNode = this.createChildNode(newTreema);
      this.findObjectInsertionPoint(key).before(childNode);
      if (newTreema.canEdit()) {
        newTreema.edit();
      } else {
        this.integrateChildTreema(newTreema);
        if (newTreema.collection) {
          children = newTreema.getChildren();
          if (children.length) {
            newTreema.open();
            child = newTreema.childrenTreemas[children[0][0]];
            child.select();
          } else {
            newTreema.addNewChild();
          }
        }
      }
      this.addTrackedAction({
        'data': newTreema.data,
        'path': newTreema.getPath(),
        'parentPath': this.getPath(),
        action: 'insert'
      });
      return this.updateMyAddButton();
    };

    ObjectNode.prototype.findObjectInsertionPoint = function(key) {
      var afterKeys, allChildren, allProps, child, _i, _len, _ref7, _ref8;
      if (!((_ref7 = this.schema.properties) != null ? _ref7[key] : void 0)) {
        return this.getAddButtonEl();
      }
      allProps = Object.keys(this.schema.properties);
      afterKeys = allProps.slice(allProps.indexOf(key) + 1);
      allChildren = this.$el.find('> .treema-children > .treema-node');
      for (_i = 0, _len = allChildren.length; _i < _len; _i++) {
        child = allChildren[_i];
        if (_ref8 = $(child).data('instance').keyForParent, __indexOf.call(afterKeys, _ref8) >= 0) {
          return $(child);
        }
      }
      return this.getAddButtonEl();
    };

    ObjectNode.prototype.cleanupAddNewChild = function() {
      this.$el.find('.treema-new-prop').remove();
      this.getAddButtonEl().show();
      return this.clearTemporaryErrors();
    };

    ObjectNode.prototype.addingNewProperty = function() {
      return document.activeElement === this.$el.find('.treema-new-prop')[0];
    };

    return ObjectNode;

  })(TreemaNode));
  window.TreemaObjectNode = ObjectNode;
  return TreemaNode.setNodeSubclass('any', AnyNode = (function(_super) {
    __extends(AnyNode, _super);

    AnyNode.prototype.helper = null;

    function AnyNode() {
      var splat;
      splat = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      AnyNode.__super__.constructor.apply(this, splat);
      this.updateShadowMethods();
    }

    AnyNode.prototype.buildValueForEditing = function(valEl, data) {
      return this.buildValueForEditingSimply(valEl, JSON.stringify(data));
    };

    AnyNode.prototype.saveChanges = function(valEl) {
      var e, oldData;
      oldData = this.data;
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
      AnyNode.__super__.saveChanges.call(this, oldData);
      this.updateShadowMethods();
      return this.rebuild();
    };

    AnyNode.prototype.updateShadowMethods = function() {
      var NodeClass, prop, _i, _len, _ref7, _results;
      NodeClass = TreemaNode.getNodeClassForSchema({
        type: $.type(this.data)
      });
      this.helper = new NodeClass(this.schema, {
        data: this.data,
        options: this.options
      }, this.parent);
      this.helper.tv4 = this.tv4;
      _ref7 = ['collection', 'ordered', 'keyed', 'getChildren', 'buildValueForDisplay', 'addNewChild', 'childPropertiesAvailable'];
      _results = [];
      for (_i = 0, _len = _ref7.length; _i < _len; _i++) {
        prop = _ref7[_i];
        _results.push(this[prop] = this.helper[prop]);
      }
      return _results;
    };

    AnyNode.prototype.rebuild = function() {
      var newNode, oldEl;
      oldEl = this.$el;
      if (this.parent) {
        newNode = this.parent.createChildNode(this);
      } else {
        newNode = this.build();
      }
      return this.$el = newNode;
    };

    AnyNode.prototype.onClick = function(e) {
      var clickedValue, usedModKey, _ref7;
      if ((_ref7 = e.target.nodeName) === 'INPUT' || _ref7 === 'TEXTAREA') {
        return;
      }
      clickedValue = $(e.target).closest('.treema-value').length;
      usedModKey = e.shiftKey || e.ctrlKey || e.metaKey;
      if (clickedValue && !usedModKey) {
        return this.toggleEdit();
      }
      return AnyNode.__super__.onClick.call(this, e);
    };

    return AnyNode;

  })(TreemaNode));
})();
;var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __slice = [].slice;

(function() {
  var AceNode, DatabaseSearchTreemaNode, LongStringNode, Point2DNode, Point3DNode, debounce, _ref, _ref1, _ref2, _ref3, _ref4;
  TreemaNode.setNodeSubclass('point2d', Point2DNode = (function(_super) {
    __extends(Point2DNode, _super);

    function Point2DNode() {
      _ref = Point2DNode.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Point2DNode.prototype.valueClass = 'treema-point2d';

    Point2DNode.prototype.getDefaultValue = function() {
      return {
        x: 0,
        y: 0
      };
    };

    Point2DNode.prototype.buildValueForDisplay = function(valEl, data) {
      return this.buildValueForDisplaySimply(valEl, "(" + data.x + ", " + data.y + ")");
    };

    Point2DNode.prototype.buildValueForEditing = function(valEl, data) {
      var xInput, yInput;
      xInput = $('<input />').val(data.x).attr('placeholder', 'x');
      yInput = $('<input />').val(data.y).attr('placeholder', 'y');
      valEl.append('(').append(xInput).append(', ').append(yInput).append(')');
      return valEl.find('input:first').focus().select();
    };

    Point2DNode.prototype.saveChanges = function(valEl) {
      this.data.x = parseFloat(valEl.find('input:first').val());
      return this.data.y = parseFloat(valEl.find('input:last').val());
    };

    return Point2DNode;

  })(TreemaNode));
  TreemaNode.setNodeSubclass('point3d', Point3DNode = (function(_super) {
    __extends(Point3DNode, _super);

    function Point3DNode() {
      _ref1 = Point3DNode.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Point3DNode.prototype.valueClass = 'treema-point3d';

    Point3DNode.prototype.getDefaultValue = function() {
      return {
        x: 0,
        y: 0,
        z: 0
      };
    };

    Point3DNode.prototype.buildValueForDisplay = function(valEl, data) {
      return this.buildValueForDisplaySimply(valEl, "(" + this.data.x + ", " + this.data.y + ", " + this.data.z + ")");
    };

    Point3DNode.prototype.buildValueForEditing = function(valEl, data) {
      var xInput, yInput, zInput;
      xInput = $('<input />').val(data.x).attr('placeholder', 'x');
      yInput = $('<input />').val(data.y).attr('placeholder', 'y');
      zInput = $('<input />').val(data.z).attr('placeholder', 'z');
      valEl.append('(').append(xInput).append(', ').append(yInput).append(', ').append(zInput).append(')');
      return valEl.find('input:first').focus().select();
    };

    Point3DNode.prototype.saveChanges = function() {
      var inputs;
      inputs = this.getInputs();
      this.data.x = parseFloat($(inputs[0]).val());
      this.data.y = parseFloat($(inputs[1]).val());
      return this.data.z = parseFloat($(inputs[2]).val());
    };

    return Point3DNode;

  })(TreemaNode));
  DatabaseSearchTreemaNode = (function(_super) {
    __extends(DatabaseSearchTreemaNode, _super);

    function DatabaseSearchTreemaNode() {
      this.searchCallback = __bind(this.searchCallback, this);
      this.search = __bind(this.search, this);
      _ref2 = DatabaseSearchTreemaNode.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    DatabaseSearchTreemaNode.prototype.valueClass = 'treema-search';

    DatabaseSearchTreemaNode.prototype.searchValueTemplate = '<input placeholder="Search" /><div class="treema-search-results"></div>';

    DatabaseSearchTreemaNode.prototype.url = null;

    DatabaseSearchTreemaNode.prototype.lastTerm = null;

    DatabaseSearchTreemaNode.prototype.buildValueForDisplay = function(valEl, data) {
      var val;
      val = this.data ? this.formatDocument(data) : 'None';
      return this.buildValueForDisplaySimply(valEl, val);
    };

    DatabaseSearchTreemaNode.prototype.formatDocument = function(doc) {
      if ($.isString(doc)) {
        return doc;
      }
      return JSON.stringify(doc);
    };

    DatabaseSearchTreemaNode.prototype.buildValueForEditing = function(valEl, data) {
      var input;
      valEl.html(this.searchValueTemplate);
      input = valEl.find('input');
      input.focus().keyup(this.search);
      if (data) {
        return input.attr('placeholder', this.formatDocument(data));
      }
    };

    DatabaseSearchTreemaNode.prototype.search = function() {
      var term;
      term = this.getValEl().find('input').val();
      if (term === this.lastTerm) {
        return;
      }
      if (this.lastTerm && !term) {
        this.getSearchResultsEl().empty();
      }
      if (!term) {
        return;
      }
      this.lastTerm = term;
      this.getSearchResultsEl().empty().append('Searching');
      return $.ajax(this.url + '?term=' + term, {
        dataType: 'json',
        success: this.searchCallback
      });
    };

    DatabaseSearchTreemaNode.prototype.searchCallback = function(results) {
      var container, first, i, result, row, text, _i, _len;
      container = this.getSearchResultsEl().detach().empty();
      first = true;
      for (i = _i = 0, _len = results.length; _i < _len; i = ++_i) {
        result = results[i];
        row = $('<div></div>').addClass('treema-search-result-row');
        text = this.formatDocument(result);
        if (text == null) {
          continue;
        }
        if (first) {
          row.addClass('treema-search-selected');
        }
        first = false;
        row.text(text);
        row.data('value', result);
        container.append(row);
      }
      if (!results.length) {
        container.append($('<div>No results</div>'));
      }
      return this.getValEl().append(container);
    };

    DatabaseSearchTreemaNode.prototype.getSearchResultsEl = function() {
      return this.getValEl().find('.treema-search-results');
    };

    DatabaseSearchTreemaNode.prototype.getSelectedResultEl = function() {
      return this.getValEl().find('.treema-search-selected');
    };

    DatabaseSearchTreemaNode.prototype.saveChanges = function() {
      var selected;
      selected = this.getSelectedResultEl();
      if (!selected.length) {
        return;
      }
      return this.data = selected.data('value');
    };

    DatabaseSearchTreemaNode.prototype.onDownArrowPressed = function(e) {
      this.navigateSearch(1);
      return e.preventDefault();
    };

    DatabaseSearchTreemaNode.prototype.onUpArrowPressed = function(e) {
      e.preventDefault();
      return this.navigateSearch(-1);
    };

    DatabaseSearchTreemaNode.prototype.navigateSearch = function(offset) {
      var func, next, selected;
      selected = this.getSelectedResultEl();
      func = offset > 0 ? 'next' : 'prev';
      next = selected[func]('.treema-search-result-row');
      if (!next.length) {
        return;
      }
      selected.removeClass('treema-search-selected');
      return next.addClass('treema-search-selected');
    };

    DatabaseSearchTreemaNode.prototype.onClick = function(e) {
      var newSelection;
      newSelection = $(e.target).closest('.treema-search-result-row');
      if (!newSelection.length) {
        return DatabaseSearchTreemaNode.__super__.onClick.call(this, e);
      }
      this.getSelectedResultEl().removeClass('treema-search-selected');
      newSelection.addClass('treema-search-selected');
      this.saveChanges();
      return this.display();
    };

    DatabaseSearchTreemaNode.prototype.shouldTryToRemoveFromParent = function() {
      var selected;
      if (this.data != null) {
        return;
      }
      selected = this.getSelectedResultEl();
      return !selected.length;
    };

    return DatabaseSearchTreemaNode;

  })(TreemaNode);
  debounce = function(func, threshold, execAsap) {
    var timeout;
    timeout = null;
    return function() {
      var args, delayed, obj;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      obj = this;
      delayed = function() {
        if (!execAsap) {
          func.apply(obj, args);
        }
        return timeout = null;
      };
      if (timeout) {
        clearTimeout(timeout);
      } else if (execAsap) {
        func.apply(obj, args);
      }
      return timeout = setTimeout(delayed, threshold || 100);
    };
  };
  DatabaseSearchTreemaNode.prototype.search = debounce(DatabaseSearchTreemaNode.prototype.search, 200);
  window.DatabaseSearchTreemaNode = DatabaseSearchTreemaNode;
  TreemaNode.setNodeSubclass('ace', AceNode = (function(_super) {
    __extends(AceNode, _super);

    function AceNode() {
      this.saveChanges = __bind(this.saveChanges, this);
      _ref3 = AceNode.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    AceNode.prototype.valueClass = 'treema-ace treema-multiline';

    AceNode.prototype.getDefaultValue = function() {
      return '';
    };

    AceNode.prototype.initEditor = function(valEl) {
      var d, session;
      d = $('<div></div>').text(this.getData());
      valEl.append(d);
      this.editor = ace.edit(d[0]);
      session = this.editor.getSession();
      if (this.schema.aceMode != null) {
        session.setMode(this.schema.aceMode);
      }
      if (this.schema.aceTabSize != null) {
        session.setTabSize(this.schema.aceTabSize);
      }
      if (this.schema.aceUseWrapMode != null) {
        session.setUseWrapMode(this.schema.aceUseWrapMode);
      }
      session.setNewLineMode("unix");
      session.setUseSoftTabs(true);
      session.on('change', this.saveChanges);
      this.editor.setOptions({
        maxLines: Infinity
      });
      if (this.schema.aceTheme != null) {
        return this.editor.setTheme(this.schema.aceTheme);
      }
    };

    AceNode.prototype.toggleEdit = function() {
      if (!this.editor) {
        this.initEditor(this.getValEl());
      }
      return this.deselectAll();
    };

    AceNode.prototype.buildValueForDisplay = function(valEl) {
      if (!this.editor) {
        return this.initEditor(valEl);
      }
    };

    AceNode.prototype.buildValueForEditing = function() {};

    AceNode.prototype.saveChanges = function() {
      this.data = this.editor.getValue();
      this.flushChanges();
      return this.broadcastChanges();
    };

    AceNode.prototype.onTabPressed = function() {};

    AceNode.prototype.onEnterPressed = function() {};

    return AceNode;

  })(TreemaNode));
  return TreemaNode.setNodeSubclass('long-string', LongStringNode = (function(_super) {
    __extends(LongStringNode, _super);

    function LongStringNode() {
      _ref4 = LongStringNode.__super__.constructor.apply(this, arguments);
      return _ref4;
    }

    LongStringNode.prototype.valueClass = 'treema-long-string treema-multiline';

    LongStringNode.prototype.getDefaultValue = function() {
      return '';
    };

    LongStringNode.prototype.buildValueForDisplay = function(valEl, data) {
      var text;
      text = data.replace(/\n/g, '<br />');
      return valEl.append($("<div></div>").html(text));
    };

    LongStringNode.prototype.buildValueForEditing = function(valEl, data) {
      var input;
      input = $('<textarea />');
      if (this.data !== null) {
        input.val(data);
      }
      valEl.append(input);
      input.focus().select();
      input.blur(this.onEditInputBlur);
      return input;
    };

    LongStringNode.prototype.saveChanges = function(valEl) {
      var input;
      input = valEl.find('textarea');
      return this.data = input.val();
    };

    return LongStringNode;

  })(TreemaNode));
})();
;(function($) {
  return $.fn[TreemaNode.pluginName] = function(options) {
    var element;
    if (this.length === 0) {
      return null;
    }
    element = $(this[0]);
    return TreemaNode.make(element, options);
  };
})(jQuery);
;var TreemaNode;

if (!TreemaNode) {
  TreemaNode = {};
}

TreemaNode.utils = {};

TreemaNode.utils.populateDefaults = function(rootData, rootSchema, tv4) {
  var _this = this;
  if (rootSchema["default"] && !rootData) {
    rootData = this.cloneDeep(rootSchema["default"]);
  }
  this.walk(rootData, rootSchema, tv4, function(path, data, schema) {
    var def, key, value, _results;
    def = schema["default"];
    if (!(_this.type(def) === 'object' && _this.type(data) === 'object')) {
      return;
    }
    _results = [];
    for (key in def) {
      value = def[key];
      _results.push(data[key] != null ? data[key] : data[key] = _this.cloneDeep(value));
    }
    return _results;
  });
  return rootData;
};

TreemaNode.utils.walk = function(data, schema, tv4, callback, path) {
  var childPath, childSchema, key, value, workingSchema, workingSchemas, _ref, _results;
  if (path == null) {
    path = '';
  }
  workingSchemas = this.buildWorkingSchemas(schema, tv4);
  workingSchema = this.chooseWorkingSchema(data, workingSchemas, tv4);
  callback(path, data, workingSchema);
  if ((_ref = this.type(data)) === 'array' || _ref === 'object') {
    _results = [];
    for (key in data) {
      value = data[key];
      childPath = path.slice();
      if (childPath) {
        childPath += '.';
      }
      childPath += key;
      childSchema = this.getChildSchema(key, workingSchema);
      _results.push(this.walk(value, childSchema, tv4, callback, childPath));
    }
    return _results;
  }
};

TreemaNode.utils.getChildSchema = function(key, schema) {
  var childKey, childSchema, index, _ref, _ref1;
  if (this.type(key) === 'string') {
    _ref = schema.properties;
    for (childKey in _ref) {
      childSchema = _ref[childKey];
      if (childKey === key) {
        return childSchema;
      }
    }
    _ref1 = schema.patternProperties;
    for (childKey in _ref1) {
      childSchema = _ref1[childKey];
      if (key.match(new RegExp(childKey))) {
        return childSchema;
      }
    }
    if (typeof schema.additionalProperties === 'object') {
      return schema.additionalProperties;
    }
  }
  if (this.type(key) === 'number') {
    index = key;
    if (schema.items) {
      if (Array.isArray(schema.items)) {
        if (index < schema.items.length) {
          return schema.items[index];
        } else if (schema.additionalItems) {
          return schema.additionalItems;
        }
      } else if (schema.items) {
        return schema.items;
      }
    }
  }
  return {};
};

TreemaNode.utils.buildWorkingSchemas = function(schema, tv4) {
  var allOf, anyOf, baseSchema, newBase, oneOf, singularSchema, singularSchemas, workingSchemas, _i, _j, _len, _len1;
  if (schema == null) {
    schema = {};
  }
  baseSchema = this.resolveReference(schema, tv4);
  if (!(schema.allOf || schema.anyOf || schema.oneOf)) {
    return [schema];
  }
  baseSchema = this.cloneSchema(baseSchema);
  allOf = baseSchema.allOf;
  anyOf = baseSchema.anyOf;
  oneOf = baseSchema.oneOf;
  if (baseSchema.allOf != null) {
    delete baseSchema.allOf;
  }
  if (baseSchema.anyOf != null) {
    delete baseSchema.anyOf;
  }
  if (baseSchema.oneOf != null) {
    delete baseSchema.oneOf;
  }
  if (allOf != null) {
    for (_i = 0, _len = allOf.length; _i < _len; _i++) {
      schema = allOf[_i];
      this.combineSchemas(baseSchema, this.resolveReference(schema, tv4));
    }
  }
  workingSchemas = [];
  singularSchemas = [];
  if (anyOf != null) {
    singularSchemas = singularSchemas.concat(anyOf);
  }
  if (oneOf != null) {
    singularSchemas = singularSchemas.concat(oneOf);
  }
  for (_j = 0, _len1 = singularSchemas.length; _j < _len1; _j++) {
    singularSchema = singularSchemas[_j];
    singularSchema = this.resolveReference(singularSchema, tv4);
    newBase = this.cloneSchema(baseSchema);
    this.combineSchemas(newBase, singularSchema);
    workingSchemas.push(newBase);
  }
  if (workingSchemas.length === 0) {
    workingSchemas = [baseSchema];
  }
  return workingSchemas;
};

TreemaNode.utils.chooseWorkingSchema = function(data, workingSchemas, tv4) {
  var result, schema, _i, _len;
  if (workingSchemas.length === 1) {
    return workingSchemas[0];
  }
  if (tv4 == null) {
    tv4 = this.getGlobalTv4();
  }
  for (_i = 0, _len = workingSchemas.length; _i < _len; _i++) {
    schema = workingSchemas[_i];
    result = tv4.validateMultiple(data, schema);
    if (result.valid) {
      return schema;
    }
  }
  return workingSchemas[0];
};

TreemaNode.utils.resolveReference = function(schema, tv4, scrubTitle) {
  var resolved;
  if (scrubTitle == null) {
    scrubTitle = false;
  }
  if (schema.$ref == null) {
    return schema;
  }
  if (tv4 == null) {
    tv4 = this.getGlobalTv4();
  }
  resolved = tv4.getSchema(schema.$ref);
  if (!resolved) {
    console.warn('could not resolve reference', schema.$ref, tv4.getMissingUris());
  }
  if (resolved == null) {
    resolved = {};
  }
  if (scrubTitle && (resolved.title != null)) {
    delete resolved.title;
  }
  return resolved;
};

TreemaNode.utils.getGlobalTv4 = function() {
  if (typeof window !== 'undefined') {
    return window.tv4;
  }
  if (typeof global !== 'undefined') {
    return global.tv4;
  }
};

TreemaNode.utils.cloneSchema = function(schema) {
  var clone, key, value;
  clone = {};
  for (key in schema) {
    value = schema[key];
    clone[key] = value;
  }
  return clone;
};

TreemaNode.utils.combineSchemas = function(schema1, schema2) {
  var key, value;
  for (key in schema2) {
    value = schema2[key];
    schema1[key] = value;
  }
  return schema1;
};

TreemaNode.utils.cloneDeep = function(data) {
  var clone, key, type, value;
  clone = data;
  type = this.type(data);
  if (type === 'object') {
    clone = {};
  }
  if (type === 'array') {
    clone = [];
  }
  if (type === 'object' || type === 'array') {
    for (key in data) {
      value = data[key];
      clone[key] = this.cloneDeep(value);
    }
  }
  return clone;
};

TreemaNode.utils.type = (function() {
  var classToType, name, _i, _len, _ref;
  classToType = {};
  _ref = "Boolean Number String Function Array Date RegExp Undefined Null".split(" ");
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    name = _ref[_i];
    classToType["[object " + name + "]"] = name.toLowerCase();
  }
  return function(obj) {
    var strType;
    strType = Object.prototype.toString.call(obj);
    return classToType[strType] || "object";
  };
})();
;
//# sourceMappingURL=treema.js.map