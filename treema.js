var TreemaNode,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

TreemaNode = (function() {
  var defaults;

  TreemaNode.prototype.schema = {};

  TreemaNode.prototype.$el = null;

  TreemaNode.prototype.data = null;

  TreemaNode.prototype.options = null;

  TreemaNode.prototype.parent = null;

  TreemaNode.prototype.nodeTemplate = '<div class="treema-row"><div class="treema-value"></div></div>';

  TreemaNode.prototype.childrenTemplate = '<div class="treema-children"></div>';

  TreemaNode.prototype.addChildTemplate = '<div class="treema-add-child">+</div>';

  TreemaNode.prototype.tempErrorTemplate = '<span class="treema-temp-error"></span>';

  TreemaNode.prototype.toggleTemplate = '<span class="treema-toggle"></span>';

  TreemaNode.prototype.keyTemplate = '<span class="treema-key"></span>';

  TreemaNode.prototype.errorTemplate = '<div class="treema-error"></div>';

  TreemaNode.prototype.collection = false;

  TreemaNode.prototype.ordered = false;

  TreemaNode.prototype.keyed = false;

  TreemaNode.prototype.editable = true;

  TreemaNode.prototype.directlyEditable = true;

  TreemaNode.prototype.skipTab = false;

  TreemaNode.prototype.valueClass = null;

  TreemaNode.prototype.keyForParent = null;

  TreemaNode.prototype.childrenTreemas = null;

  TreemaNode.prototype.justAdded = false;

  TreemaNode.prototype.isValid = function() {
    if (!this.tv4) {
      return true;
    }
    return this.tv4.validate(this.data, this.schema);
  };

  TreemaNode.prototype.getErrors = function() {
    if (!this.tv4) {
      return [];
    }
    return this.tv4.validateMultiple(this.data, this.schema)['errors'];
  };

  TreemaNode.prototype.getMissing = function() {
    if (!this.tv4) {
      return [];
    }
    return this.tv4.validateMultiple(this.data, this.schema)['missing'];
  };

  TreemaNode.prototype.setUpValidator = function() {
    var node, _ref;
    if (!this.parent) {
      return this.tv4 = (_ref = window['tv4']) != null ? _ref.freshApi() : void 0;
    }
    node = this;
    while (node.parent) {
      node = node.parent;
    }
    return this.tv4 = node.tv4;
  };

  TreemaNode.prototype.saveChanges = function() {
    return console.error('"saveChanges" has not been overridden.');
  };

  TreemaNode.prototype.getDefaultValue = function() {
    return null;
  };

  TreemaNode.prototype.buildValueForDisplay = function() {
    return console.error('"buildValueForDisplay" has not been overridden.');
  };

  TreemaNode.prototype.buildValueForEditing = function() {
    if (!this.editable) {
      return;
    }
    return console.error('"buildValueForEditing" has not been overridden.');
  };

  TreemaNode.prototype.getChildren = function() {
    return console.error('"getChildren" has not been overridden.');
  };

  TreemaNode.prototype.getChildSchema = function() {
    return console.error('"getChildSchema" has not been overridden.');
  };

  TreemaNode.prototype.canAddChild = function() {
    return this.collection && this.editable;
  };

  TreemaNode.prototype.canAddProperty = function() {
    return true;
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

  TreemaNode.prototype.onEditInputBlur = function() {
    var input;
    this.saveChanges(this.getValEl());
    input = this.getValEl().find('input, textarea, select');
    if (this.isValid()) {
      if (this.isEditing()) {
        return this.display();
      }
    } else {
      return input.focus().select();
    }
  };

  TreemaNode.prototype.limitChoices = function(options) {
    var _this = this;
    this["enum"] = options;
    this.buildValueForEditing = function(valEl) {
      var index, input, option, _i, _len, _ref;
      input = $('<select></select>');
      _ref = _this["enum"];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        input.append($('<option></option>').text(option));
      }
      index = _this["enum"].indexOf(_this.data);
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
      return _this.data = _this["enum"][index];
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
    this.orderDataFromUI = __bind(this.orderDataFromUI, this);
    this.onEditInputBlur = __bind(this.onEditInputBlur, this);
    this.$el = this.$el || $('<div></div>');
    this.settings = $.extend({}, defaults, options);
    this.schema = this.settings.schema;
    this.data = options.data;
    this.callbacks = this.settings.callbacks;
    this._defaults = defaults;
    this._name = TreemaNode.pluginName;
    this.setUpValidator();
    this.populateData();
  }

  TreemaNode.prototype.build = function() {
    var valEl;
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
    this.buildValueForDisplay(valEl);
    if (this.collection && !this.parent) {
      this.open();
    }
    if (!this.parent) {
      this.setUpEvents();
    }
    if (this.collection) {
      this.updateMyAddButton();
    }
    if (this.schema["enum"]) {
      this.limitChoices(this.schema["enum"]);
    }
    return this.$el;
  };

  TreemaNode.prototype.populateData = function() {
    return this.data = this.data || this.schema["default"] || this.getDefaultValue();
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
      return (_ref = $(e.target).closest('.treema-node').data('instance')) != null ? _ref.onKeyDown(e) : void 0;
    });
  };

  TreemaNode.prototype.onClick = function(e) {
    var clickedToggle, clickedValue, usedModKey, _ref;
    if ((_ref = e.target.nodeName) === 'INPUT' || _ref === 'TEXTAREA') {
      return;
    }
    clickedValue = $(e.target).closest('.treema-value').length;
    clickedToggle = $(e.target).hasClass('treema-toggle');
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
    var clickedKey;
    if (!this.collection) {
      return;
    }
    clickedKey = $(e.target).hasClass('treema-key');
    if (!clickedKey) {
      return;
    }
    if (this.isClosed()) {
      this.open();
    }
    return this.addNewChild();
  };

  TreemaNode.prototype.onKeyDown = function(e) {
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
    if (e.which === 8) {
      return this.onDeletePressed(e);
    }
  };

  TreemaNode.prototype.onLeftArrowPressed = function() {
    if (!this.editingIsHappening()) {
      return this.navigateOut();
    }
  };

  TreemaNode.prototype.onRightArrowPressed = function() {
    if (!this.editingIsHappening()) {
      return this.navigateIn();
    }
  };

  TreemaNode.prototype.onUpArrowPressed = function(e) {
    if (!this.editingIsHappening()) {
      this.navigateSelection(-1);
    }
    return e.preventDefault();
  };

  TreemaNode.prototype.onDownArrowPressed = function(e) {
    if (!this.editingIsHappening()) {
      this.navigateSelection(1);
    }
    return e.preventDefault();
  };

  TreemaNode.prototype.onSpacePressed = function() {};

  TreemaNode.prototype.onTPressed = function() {};

  TreemaNode.prototype.onFPressed = function() {};

  TreemaNode.prototype.onDeletePressed = function(e) {
    var _ref;
    if (this.editingIsHappening() && !$(e.target).val()) {
      this.display();
      this.select();
      this.removeSelectedNodes();
      e.preventDefault();
    }
    if ((_ref = e.target.nodeName) === 'INPUT' || _ref === 'TEXTAREA') {
      return;
    }
    e.preventDefault();
    return this.removeSelectedNodes();
  };

  TreemaNode.prototype.onEscapePressed = function() {
    if (!this.isEditing()) {
      return;
    }
    if (this.justAdded) {
      return this.remove();
    }
    if (this.isEditing()) {
      this.display();
    }
    if (!this.isRoot()) {
      this.select();
    }
    return this.getRootEl().focus();
  };

  TreemaNode.prototype.onEnterPressed = function(e) {
    var offset, selected, targetTreema, _ref;
    offset = e.shiftKey ? -1 : 1;
    if (this.editingIsHappening()) {
      this.saveChanges(this.getValEl());
      this.flushChanges();
      this.endExistingEdits();
      targetTreema = this.getNextEditableTreema(offset);
      if (targetTreema) {
        targetTreema.edit();
      } else {
        if ((_ref = this.parent) != null) {
          _ref.addNewChild();
        }
      }
      return;
    }
    selected = this.getLastSelectedTreema();
    if (selected.collection) {
      return selected.disinter(offset);
    }
    if (selected.canEdit()) {
      return selected.edit();
    }
  };

  TreemaNode.prototype.onTabPressed = function(e) {
    var input, inputValues, offset, selected, targetTreema, _ref;
    offset = e.shiftKey ? -1 : 1;
    if (this.hasMoreInputs(offset)) {
      return;
    }
    e.preventDefault();
    if (!this.editingIsHappening()) {
      selected = this.getLastSelectedTreema();
      if (!selected) {
        return;
      }
      if (selected.collection) {
        selected.disinter(offset);
      }
      if (selected.canEdit()) {
        selected.edit({
          offset: offset
        });
      }
      return;
    }
    inputValues = (function() {
      var _i, _len, _ref, _results;
      _ref = this.getValEl().find('input, textarea, select');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        input = _ref[_i];
        _results.push(Boolean($(input).val()));
      }
      return _results;
    }).call(this);
    if (__indexOf.call(inputValues, true) < 0) {
      targetTreema = this.getNextEditableTreemaFromElement(this.$el, offset);
      if (!this.data) {
        this.remove();
      }
      return targetTreema.edit({
        offset: offset
      });
    }
    this.saveChanges(this.getValEl());
    this.flushChanges();
    if (!this.isValid()) {
      return;
    }
    this.endExistingEdits();
    targetTreema = this.getNextEditableTreema(offset);
    if (targetTreema) {
      return targetTreema.edit({
        offset: offset
      });
    } else {
      return (_ref = this.parent) != null ? _ref.addNewChild() : void 0;
    }
  };

  TreemaNode.prototype.disinter = function(offset) {
    var targetTreema;
    if (offset > 0 && this.isClosed()) {
      return this.toggleOpen();
    }
    targetTreema = this.getNextEditableTreema(offset);
    if (targetTreema) {
      targetTreema.edit();
    }
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

  TreemaNode.prototype.getNextEditableTreemaFromElement = function(el, offset) {
    var dir, parentTreema, selector, targetTreema;
    dir = offset > 0 ? 'next' : 'prev';
    targetTreema = el[dir]('.treema-node').data('instance');
    if (targetTreema && !(targetTreema != null ? targetTreema.canEdit() : void 0)) {
      targetTreema = targetTreema.getNextEditableTreema(offset);
    } else if (!targetTreema) {
      parentTreema = el.closest('.treema-node').data('instance');
      targetTreema = parentTreema != null ? parentTreema.getNextEditableTreema(offset) : void 0;
    }
    if (!targetTreema) {
      dir = offset > 0 ? 'first' : 'last';
      selector = '> .treema-children > .treema-node:' + dir;
      targetTreema = this.getRootEl().find(selector).data('instance');
      if (targetTreema && !targetTreema.canEdit()) {
        targetTreema = targetTreema.getNextEditableTreema(offset);
      }
    }
    return targetTreema;
  };

  TreemaNode.prototype.getNextEditableTreema = function(offset) {
    var targetTreema;
    targetTreema = this;
    while (targetTreema) {
      targetTreema = offset > 0 ? targetTreema.getNextTreema() : targetTreema.getPreviousTreema();
      if (targetTreema && !targetTreema.canEdit()) {
        continue;
      }
      break;
    }
    return targetTreema;
  };

  TreemaNode.prototype.navigateSelection = function(offset) {
    var firstTreema, lastTreema, selected, targetTreema, treemas;
    treemas = this.getVisibleTreemas();
    if (!treemas.length) {
      return;
    }
    selected = this.getLastSelectedTreema();
    firstTreema = treemas[0];
    lastTreema = treemas[treemas.length - 1];
    if (!selected) {
      targetTreema = offset > 0 ? firstTreema : lastTreema;
      return targetTreema.select();
    }
    if (offset < 0 && selected === firstTreema) {
      return;
    }
    if (offset > 0 && selected === lastTreema) {
      return;
    }
    targetTreema = treemas[treemas.indexOf(selected) + offset];
    return targetTreema.select();
  };

  TreemaNode.prototype.navigateOut = function() {
    var parentSelection, treema, _ref;
    if ((function() {
      var _i, _len, _ref, _results;
      _ref = this.getSelectedTreemas();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        treema = _ref[_i];
        _results.push(treema.isOpen());
      }
      return _results;
    }).call(this)) {
      treema.close();
    }
    parentSelection = (_ref = this.getLastSelectedTreema()) != null ? _ref.parent : void 0;
    if (!parentSelection) {
      return;
    }
    if (parentSelection.isRoot()) {
      return;
    }
    parentSelection.close();
    return parentSelection.select();
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

  TreemaNode.prototype.getNextTreema = function() {
    var nextChild, nextParent, nextSibling, _ref;
    nextChild = this.$el.find('.treema-node:first').data('instance');
    if (nextChild) {
      return nextChild;
    }
    nextSibling = this.$el.next('.treema-node').data('instance');
    if (nextSibling) {
      return nextSibling;
    }
    nextParent = (_ref = this.parent) != null ? _ref.$el.next('.treema-node').data('instance') : void 0;
    return nextParent;
  };

  TreemaNode.prototype.getPreviousTreema = function() {
    var lastChild, prevSibling;
    prevSibling = this.$el.prev('.treema-node').data('instance');
    lastChild = prevSibling != null ? prevSibling.$el.find('.treema-node:last').data('instance') : void 0;
    return lastChild || prevSibling || this.parent;
  };

  TreemaNode.prototype.canEdit = function() {
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
      this.buildValueForDisplay(valEl);
    }
    if (this.isEditing()) {
      this.buildValueForEditing(valEl);
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
      _results.push(treema.display());
    }
    return _results;
  };

  TreemaNode.prototype.flushChanges = function() {
    this.justAdded = false;
    if (!this.parent) {
      return this.refreshErrors();
    }
    this.parent.data[this.keyForParent] = this.data;
    return this.parent.refreshErrors();
  };

  TreemaNode.prototype.focusLastInput = function() {
    var inputs, last;
    inputs = this.getInputs();
    last = inputs[inputs.length - 1];
    return $(last).focus().select();
  };

  TreemaNode.prototype.removeSelectedNodes = function() {
    var nextSibling, prevSibling, selected, toSelect, treema, _i, _len;
    selected = this.getSelectedTreemas();
    toSelect = null;
    if (selected.length === 1) {
      nextSibling = selected[0].$el.next('.treema-node').data('instance');
      prevSibling = selected[0].$el.prev('.treema-node').data('instance');
      toSelect = nextSibling || prevSibling || selected[0].parent;
    }
    for (_i = 0, _len = selected.length; _i < _len; _i++) {
      treema = selected[_i];
      treema.remove();
    }
    if (toSelect && !this.getSelectedTreemas().length) {
      return toSelect.select();
    }
  };

  TreemaNode.prototype.remove = function() {
    var required, root, tempError, _ref;
    required = this.parent && (this.parent.schema.required != null) && (_ref = this.keyForParent, __indexOf.call(this.parent.schema.required, _ref) >= 0);
    if (required) {
      tempError = this.createTemporaryError('required');
      return this.$el.prepend(tempError);
    }
    root = this.getRootEl();
    this.$el.remove();
    root.focus();
    if (this.parent == null) {
      return;
    }
    delete this.parent.childrenTreemas[this.keyForParent];
    delete this.parent.data[this.keyForParent];
    if (this.parent.ordered) {
      this.parent.orderDataFromUI();
    }
    this.parent.refreshErrors();
    return this.parent.updateMyAddButton();
  };

  TreemaNode.prototype.toggleOpen = function() {
    if (this.isClosed()) {
      this.open();
    } else {
      this.close();
    }
    return this;
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
          deactivate: this.orderDataFromUI
        })).disableSelection === "function") {
          _base.disableSelection();
        }
      }
    }
    return this.refreshErrors();
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
    this.refreshErrors();
    return this.buildValueForDisplay(this.getValEl().empty());
  };

  TreemaNode.prototype.select = function() {
    var excludeSelf, numSelected;
    numSelected = this.getSelectedTreemas().length;
    excludeSelf = numSelected === 1;
    this.deselectAll(excludeSelf);
    return this.toggleSelect();
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
    return this.clearLastSelected();
  };

  TreemaNode.prototype.toggleSelect = function() {
    this.clearLastSelected();
    if (!this.isRoot()) {
      this.$el.toggleClass('treema-selected');
    }
    if (this.isSelected()) {
      return this.$el.addClass('treema-last-selected');
    }
  };

  TreemaNode.prototype.clearLastSelected = function() {
    return this.getRootEl().find('.treema-last-selected').removeClass('treema-last-selected');
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
    return this.$el.addClass('treema-last-selected');
  };

  TreemaNode.prototype.addChildTreema = function(key, value, schema) {
    var treema;
    treema = TreemaNode.make(null, {
      schema: schema,
      data: value
    }, this);
    treema.keyForParent = key;
    this.childrenTreemas[key] = treema;
    treema.populateData();
    this.data[key] = treema.data;
    return treema;
  };

  TreemaNode.prototype.createChildNode = function(treema) {
    var childNode, keyEl, name, required, row, _ref;
    childNode = treema.build();
    row = childNode.find('.treema-row');
    if (this.collection && this.keyed) {
      name = treema.schema.title || treema.keyForParent;
      keyEl = $(this.keyTemplate).text(name);
      if (treema.schema.description) {
        keyEl.attr('title', treema.schema.description);
      }
      row.prepend(' : ');
      required = this.schema.required || [];
      if (_ref = treema.keyForParent, __indexOf.call(required, _ref) >= 0) {
        keyEl.text(keyEl.text() + '*');
      }
      row.prepend(keyEl);
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
    if (this.justAdded) {
      return;
    }
    errors = this.getErrors();
    erroredTreemas = [];
    for (_i = 0, _len = errors.length; _i < _len; _i++) {
      error = errors[_i];
      path = error.dataPath.split('/').slice(1);
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

  TreemaNode.prototype.getValEl = function() {
    return this.$el.find('> .treema-row .treema-value');
  };

  TreemaNode.prototype.getRootEl = function() {
    return this.$el.closest('.treema-root');
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
    return this.getRootEl().find('.treema-last-selected').data('instance');
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

  TreemaNode.prototype.isRoot = function() {
    return this.$el.hasClass('treema-root');
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

  TreemaNode.prototype.keepFocus = function() {
    return this.getRootEl().focus();
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

  TreemaNode.getNodeClassForSchema = function(schema) {
    var NodeClass;
    NodeClass = null;
    if (schema.format) {
      NodeClass = this.nodeMap[schema.format];
    }
    if (NodeClass) {
      return NodeClass;
    }
    if (schema.type) {
      NodeClass = this.nodeMap[schema.type];
    }
    if (NodeClass) {
      return NodeClass;
    }
    return this.nodeMap['any'];
  };

  TreemaNode.make = function(element, options, parent) {
    var NodeClass;
    NodeClass = this.getNodeClassForSchema(options.schema);
    return new NodeClass(element, options, parent);
  };

  return TreemaNode;

})();
var __init,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __slice = [].slice;

(__init = function() {
  var AnyNode, ArrayNode, BooleanNode, NullNode, NumberNode, ObjectNode, StringNode, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
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

    StringNode.prototype.buildValueForDisplay = function(valEl) {
      return this.buildValueForDisplaySimply(valEl, "\"" + this.data + "\"");
    };

    StringNode.prototype.buildValueForEditing = function(valEl) {
      var input, _ref1;
      input = this.buildValueForEditingSimply(valEl, this.data);
      if (this.schema.maxLength) {
        input.attr('maxlength', this.schema.maxLength);
      }
      if (_ref1 = this.schema.format, __indexOf.call(StringNode.inputTypes, _ref1) >= 0) {
        return input.attr('type', this.schema.format);
      }
    };

    StringNode.prototype.saveChanges = function(valEl) {
      return this.data = $('input', valEl).val();
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

    NumberNode.prototype.buildValueForDisplay = function(valEl) {
      return this.buildValueForDisplaySimply(valEl, JSON.stringify(this.data));
    };

    NumberNode.prototype.buildValueForEditing = function(valEl) {
      var input;
      input = this.buildValueForEditingSimply(valEl, JSON.stringify(this.data), 'number');
      if (this.schema.maximum) {
        input.attr('max', this.schema.maximum);
      }
      if (this.schema.minimum) {
        return input.attr('min', this.schema.minimum);
      }
    };

    NumberNode.prototype.saveChanges = function(valEl) {
      return this.data = parseFloat($('input', valEl).val());
    };

    return NumberNode;

  })(TreemaNode));
  TreemaNode.setNodeSubclass('null', NullNode = NullNode = (function(_super) {
    __extends(NullNode, _super);

    function NullNode() {
      _ref2 = NullNode.__super__.constructor.apply(this, arguments);
      return _ref2;
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
      _ref3 = BooleanNode.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    BooleanNode.prototype.valueClass = 'treema-boolean';

    BooleanNode.prototype.getDefaultValue = function() {
      return false;
    };

    BooleanNode.prototype.buildValueForDisplay = function(valEl) {
      return this.buildValueForDisplaySimply(valEl, JSON.stringify(this.data));
    };

    BooleanNode.prototype.buildValueForEditing = function(valEl) {
      var input;
      input = this.buildValueForEditingSimply(valEl, JSON.stringify(this.data));
      $('<span></span>').text(JSON.stringify(this.data)).insertBefore(input);
      return input.focus();
    };

    BooleanNode.prototype.toggleValue = function(newValue) {
      var valEl;
      if (newValue == null) {
        newValue = null;
      }
      this.data = !this.data;
      if (newValue != null) {
        this.data = newValue;
      }
      valEl = this.getValEl().empty();
      if (this.isDisplaying()) {
        return this.buildValueForDisplay(valEl);
      } else {
        return this.buildValueForEditing(valEl);
      }
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

    return BooleanNode;

  })(TreemaNode));
  TreemaNode.setNodeSubclass('array', ArrayNode = (function(_super) {
    __extends(ArrayNode, _super);

    function ArrayNode() {
      _ref4 = ArrayNode.__super__.constructor.apply(this, arguments);
      return _ref4;
    }

    ArrayNode.prototype.valueClass = 'treema-array';

    ArrayNode.prototype.getDefaultValue = function() {
      return [];
    };

    ArrayNode.prototype.collection = true;

    ArrayNode.prototype.ordered = true;

    ArrayNode.prototype.directlyEditable = false;

    ArrayNode.prototype.getChildren = function() {
      var key, value, _i, _len, _ref5, _results;
      _ref5 = this.data;
      _results = [];
      for (key = _i = 0, _len = _ref5.length; _i < _len; key = ++_i) {
        value = _ref5[key];
        _results.push([key, value, this.getChildSchema()]);
      }
      return _results;
    };

    ArrayNode.prototype.getChildSchema = function() {
      return this.schema.items || {};
    };

    ArrayNode.prototype.buildValueForDisplay = function(valEl) {
      var child, helperTreema, text, val, _i, _len, _ref5;
      text = [];
      if (!this.data) {
        return;
      }
      _ref5 = this.data.slice(0, 3);
      for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
        child = _ref5[_i];
        helperTreema = TreemaNode.make(null, {
          schema: this.getChildSchema(),
          data: child
        }, this);
        val = $('<div></div>');
        helperTreema.buildValueForDisplay(val);
        text.push(val.text());
      }
      if (this.data.length > 3) {
        text.push('...');
      }
      return this.buildValueForDisplaySimply(valEl, text.join(', '));
    };

    ArrayNode.prototype.buildValueForEditing = function(valEl) {
      return this.buildValueForEditingSimply(valEl, JSON.stringify(this.data));
    };

    ArrayNode.prototype.canAddChild = function() {
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
      schema = this.getChildSchema();
      newTreema = this.addChildTreema(new_index, void 0, schema);
      newTreema.justAdded = true;
      newTreema.tv4 = this.tv4;
      childNode = this.createChildNode(newTreema);
      this.getAddButtonEl().before(childNode);
      newTreema.edit();
      return true;
    };

    return ArrayNode;

  })(TreemaNode));
  TreemaNode.setNodeSubclass('object', ObjectNode = (function(_super) {
    __extends(ObjectNode, _super);

    function ObjectNode() {
      this.onNewPropertyBlur = __bind(this.onNewPropertyBlur, this);
      _ref5 = ObjectNode.__super__.constructor.apply(this, arguments);
      return _ref5;
    }

    ObjectNode.prototype.valueClass = 'treema-object';

    ObjectNode.prototype.getDefaultValue = function() {
      var childKey, childSchema, d, _ref6, _ref7;
      d = {};
      if (!((_ref6 = this.schema) != null ? _ref6.properties : void 0)) {
        return d;
      }
      _ref7 = this.schema.properties;
      for (childKey in _ref7) {
        childSchema = _ref7[childKey];
        if (childSchema["default"]) {
          d[childKey] = childSchema["default"];
        }
      }
      return d;
    };

    ObjectNode.prototype.collection = true;

    ObjectNode.prototype.keyed = true;

    ObjectNode.prototype.newPropertyTemplate = '<input class="treema-new-prop" />';

    ObjectNode.prototype.directlyEditable = false;

    ObjectNode.prototype.getChildren = function() {
      var children, key, keysAccountedFor, value, _ref6;
      children = [];
      keysAccountedFor = [];
      if (this.schema.properties) {
        for (key in this.schema.properties) {
          if (typeof this.data[key] === 'undefined') {
            continue;
          }
          keysAccountedFor.push(key);
          children.push([key, this.data[key], this.getChildSchema(key)]);
        }
      }
      _ref6 = this.data;
      for (key in _ref6) {
        value = _ref6[key];
        if (__indexOf.call(keysAccountedFor, key) >= 0) {
          continue;
        }
        children.push([key, value, this.getChildSchema(key)]);
      }
      return children;
    };

    ObjectNode.prototype.getChildSchema = function(key_or_title) {
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

    ObjectNode.prototype.buildValueForDisplay = function(valEl) {
      var helperTreema, key, skipped, text, val, value, _ref6;
      text = [];
      if (!this.data) {
        return;
      }
      skipped = [];
      _ref6 = this.data;
      for (key in _ref6) {
        value = _ref6[key];
        if ((this.schema.displayProperty != null) && key !== this.schema.displayProperty) {
          skipped.push(key);
          continue;
        }
        helperTreema = TreemaNode.make(null, {
          schema: this.getChildSchema(key),
          data: value
        }, this);
        val = $('<div></div>');
        helperTreema.buildValueForDisplay(val);
        text.push(val.text());
      }
      return this.buildValueForDisplaySimply(valEl, '{' + text.join(', ') + '}');
    };

    ObjectNode.prototype.buildValueForEditing = function(valEl) {
      return this.buildValueForEditingSimply(valEl, JSON.stringify(this.data));
    };

    ObjectNode.prototype.populateData = function() {
      var helperTreema, key, _i, _len, _ref6, _results;
      ObjectNode.__super__.populateData.call(this);
      if (!this.schema.required) {
        return;
      }
      _ref6 = this.schema.required;
      _results = [];
      for (_i = 0, _len = _ref6.length; _i < _len; _i++) {
        key = _ref6[_i];
        if (this.data[key]) {
          continue;
        }
        helperTreema = TreemaNode.make(null, {
          schema: this.getChildSchema(key),
          data: null
        }, this);
        helperTreema.populateData();
        _results.push(this.data[key] = helperTreema.data);
      }
      return _results;
    };

    ObjectNode.prototype.canAddChild = function() {
      if ((this.schema.maxProperties != null) && Object.keys(this.data).length >= this.schema.maxProperties) {
        return false;
      }
      if (this.schema.additionalProperties === false) {
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

    ObjectNode.prototype.addNewChild = function() {
      var keyInput, properties;
      if (!this.canAddChild()) {
        return;
      }
      properties = this.childPropertiesAvailable();
      keyInput = $(this.newPropertyTemplate);
      if (typeof keyInput.autocomplete === "function") {
        keyInput.autocomplete({
          source: properties,
          minLength: 0,
          delay: 0,
          autoFocus: true
        });
      }
      this.getAddButtonEl().before(keyInput);
      keyInput.focus();
      keyInput.blur(this.onNewPropertyBlur);
      keyInput.autocomplete('search');
      return true;
    };

    ObjectNode.prototype.addingNewProperty = function() {
      return document.activeElement === this.$el.find('.treema-new-prop')[0];
    };

    ObjectNode.prototype.onNewPropertyBlur = function(e) {
      var key, keyInput;
      keyInput = $(e.target);
      this.clearTemporaryErrors();
      key = this.getPropertyKey(keyInput);
      if (key.length && !this.canAddProperty(key)) {
        return this.showBadPropertyError(keyInput);
      }
      keyInput.remove();
      if (!key.length) {
        return;
      }
      if (this.childrenTreemas[key] != null) {
        return this.childrenTreemas[key].toggleEdit();
      }
      return this.addNewChildForKey(key);
    };

    ObjectNode.prototype.getPropertyKey = function(keyInput) {
      var child_key, child_schema, key, _ref6;
      key = keyInput.val();
      if (this.schema.properties) {
        _ref6 = this.schema.properties;
        for (child_key in _ref6) {
          child_schema = _ref6[child_key];
          if (child_schema.title === key) {
            key = child_key;
          }
        }
      }
      return key;
    };

    ObjectNode.prototype.showBadPropertyError = function(keyInput) {
      var tempError;
      keyInput.focus();
      tempError = this.createTemporaryError('Invalid property name.');
      tempError.insertAfter(keyInput);
    };

    ObjectNode.prototype.addNewChildForKey = function(key) {
      var childNode, newTreema, schema;
      schema = this.getChildSchema(key);
      newTreema = this.addChildTreema(key, null, schema);
      newTreema.justAdded = true;
      newTreema.tv4 = this.tv4;
      childNode = this.createChildNode(newTreema);
      this.findObjectInsertionPoint(key).before(childNode);
      if (newTreema.collection) {
        newTreema.addNewChild();
      } else {
        newTreema.edit();
      }
      return this.updateMyAddButton();
    };

    ObjectNode.prototype.findObjectInsertionPoint = function(key) {
      var afterKeys, allChildren, allProps, child, _i, _len, _ref6, _ref7;
      if (!((_ref6 = this.schema.properties) != null ? _ref6[key] : void 0)) {
        return this.getAddButtonEl();
      }
      allProps = Object.keys(this.schema.properties);
      afterKeys = allProps.slice(allProps.indexOf(key) + 1);
      allChildren = this.$el.find('> .treema-children > .treema-node');
      for (_i = 0, _len = allChildren.length; _i < _len; _i++) {
        child = allChildren[_i];
        if (_ref7 = $(child).data('instance').keyForParent, __indexOf.call(afterKeys, _ref7) >= 0) {
          return $(child);
        }
      }
      return this.getAddButtonEl();
    };

    ObjectNode.prototype.childPropertiesAvailable = function() {
      var childSchema, properties, property, _ref6;
      if (!this.schema.properties) {
        return [];
      }
      properties = [];
      _ref6 = this.schema.properties;
      for (property in _ref6) {
        childSchema = _ref6[property];
        if (this.data[property] != null) {
          continue;
        }
        properties.push(childSchema.title || property);
      }
      return properties.sort();
    };

    ObjectNode.prototype.onDeletePressed = function(e) {
      var keyInput;
      ObjectNode.__super__.onDeletePressed.call(this, e);
      if (!this.addingNewProperty()) {
        return;
      }
      keyInput = $(e.target);
      if (!keyInput.hasClass('treema-new-prop')) {
        return;
      }
      if (!keyInput.val()) {
        this.clearTemporaryErrors();
        keyInput.remove();
        return e.preventDefault();
      }
    };

    ObjectNode.prototype.onEscapePressed = function(e) {
      var keyInput;
      keyInput = $(e.target);
      if (!keyInput.hasClass('treema-new-prop')) {
        return;
      }
      this.clearTemporaryErrors();
      keyInput.remove();
      return e.preventDefault();
    };

    ObjectNode.prototype.onTabPressed = function(e) {
      var keyInput, targetTreema;
      e.preventDefault();
      keyInput = $(e.target);
      if (!keyInput.hasClass('treema-new-prop')) {
        return ObjectNode.__super__.onTabPressed.call(this, e);
      }
      if (keyInput.val()) {
        return keyInput.blur();
      }
      targetTreema = this.getNextEditableTreemaFromElement(keyInput, e.shiftKey ? -1 : 1);
      keyInput.remove();
      if (targetTreema) {
        return targetTreema.edit();
      }
    };

    return ObjectNode;

  })(TreemaNode));
  return TreemaNode.setNodeSubclass('any', AnyNode = (function(_super) {
    __extends(AnyNode, _super);

    AnyNode.prototype.helper = null;

    function AnyNode() {
      var splat;
      splat = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      AnyNode.__super__.constructor.apply(this, splat);
      this.updateShadowMethods();
    }

    AnyNode.prototype.buildValueForEditing = function(valEl) {
      return this.buildValueForEditingSimply(valEl, JSON.stringify(this.data));
    };

    AnyNode.prototype.saveChanges = function(valEl) {
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

    AnyNode.prototype.updateShadowMethods = function() {
      var NodeClass, prop, _i, _len, _ref6, _results;
      NodeClass = TreemaNode.getNodeClassForSchema({
        type: $.type(this.data)
      });
      this.helper = new NodeClass(this.schema, this.data, this.parent);
      this.helper.tv4 = this.tv4;
      _ref6 = ['collection', 'ordered', 'keyed', 'getChildSchema', 'getChildren', 'getChildSchema', 'buildValueForDisplay'];
      _results = [];
      for (_i = 0, _len = _ref6.length; _i < _len; _i++) {
        prop = _ref6[_i];
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
      var clickedValue, usedModKey, _ref6;
      if ((_ref6 = e.target.nodeName) === 'INPUT' || _ref6 === 'TEXTAREA') {
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
var AceNode, DatabaseSearchTreemaNode, Point2DNode, Point3DNode, debounce, _ref, _ref1, _ref2, _ref3,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __slice = [].slice;

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

  Point2DNode.prototype.buildValueForDisplay = function(valEl) {
    return this.buildValueForDisplaySimply(valEl, "(" + this.data.x + ", " + this.data.y + ")");
  };

  Point2DNode.prototype.buildValueForEditing = function(valEl) {
    var xInput, yInput;
    xInput = $('<input />').val(this.data.x);
    yInput = $('<input />').val(this.data.y);
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

  Point3DNode.prototype.buildValueForDisplay = function(valEl) {
    return this.buildValueForDisplaySimply(valEl, "(" + this.data.x + ", " + this.data.y + ", " + this.data.z + ")");
  };

  Point3DNode.prototype.buildValueForEditing = function(valEl) {
    var xInput, yInput, zInput;
    xInput = $('<input />').val(this.data.x);
    yInput = $('<input />').val(this.data.y);
    zInput = $('<input />').val(this.data.z);
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

  DatabaseSearchTreemaNode.prototype.buildValueForDisplay = function(valEl) {
    return this.buildValueForDisplaySimply(valEl, this.data ? this.formatDocument(this.data) : 'None');
  };

  DatabaseSearchTreemaNode.prototype.formatDocument = function(doc) {
    if ($.isString(doc)) {
      return doc;
    }
    return JSON.stringify(doc);
  };

  DatabaseSearchTreemaNode.prototype.buildValueForEditing = function(valEl) {
    var input;
    valEl.html(this.searchValueTemplate);
    input = valEl.find('input');
    input.focus().keyup(this.search);
    if (this.data) {
      return input.attr('placeholder', this.formatDocument(this.data));
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
    var container, i, result, row, _i, _len;
    container = this.getSearchResultsEl().detach().empty();
    for (i = _i = 0, _len = results.length; _i < _len; i = ++_i) {
      result = results[i];
      row = $('<div></div>').addClass('treema-search-result-row');
      if (i === 0) {
        row.addClass('treema-search-selected');
      }
      row.text(this.formatDocument(result));
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

  DatabaseSearchTreemaNode.prototype.onDownArrowPressed = function() {
    return this.navigateSearch(1);
  };

  DatabaseSearchTreemaNode.prototype.onUpArrowPressed = function() {
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
    _ref3 = AceNode.__super__.constructor.apply(this, arguments);
    return _ref3;
  }

  AceNode.prototype.valueClass = 'treema-ace';

  AceNode.prototype.getDefaultValue = function() {
    return '';
  };

  AceNode.prototype.buildValueForDisplay = function(valEl) {
    var pre, _ref4;
    if ((_ref4 = this.editor) != null) {
      _ref4.destroy();
    }
    pre = $('<pre></pre>');
    this.buildValueForDisplaySimply(pre, ("" + this.data) || "-empty-");
    return valEl.append(pre);
  };

  AceNode.prototype.buildValueForEditing = function(valEl) {
    var d;
    d = $('<div></div>').text(this.data);
    valEl.append(d);
    this.editor = ace.edit(d[0]);
    console.log('@editor', this.editor);
    this.editor.setReadOnly(false);
    if (this.schema.aceMode != null) {
      this.editor.getSession().setMode(this.schema.aceMode);
    }
    if (this.schema.aceTheme != null) {
      this.editor.setTheme(this.schema.aceTheme);
    }
    return valEl.find('textarea').focus();
  };

  AceNode.prototype.saveChanges = function() {
    return this.data = this.editor.getValue();
  };

  AceNode.prototype.onTabPressed = function() {};

  AceNode.prototype.onEnterPressed = function() {};

  return AceNode;

})(TreemaNode));
(function($) {
  return $.fn[TreemaNode.pluginName] = function(options) {
    var element;
    if (this.length === 0) {
      return null;
    }
    element = $(this[0]);
    return TreemaNode.make(element, options);
  };
})(jQuery);

//@ sourceMappingURL=treema.js.map