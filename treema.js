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

  TreemaNode.prototype.parent = null;

  TreemaNode.prototype.nodeTemplate = '<div class="treema-node treema-clearfix"><div class="treema-value"></div><div class="treema-backdrop"></div></div>';

  TreemaNode.prototype.childrenTemplate = '<div class="treema-children"></div>';

  TreemaNode.prototype.addChildTemplate = '<div class="treema-add-child">+</div>';

  TreemaNode.prototype.tempErrorTemplate = '<span class="treema-temp-error"></span>';

  TreemaNode.prototype.toggleTemplate = '<span class="treema-toggle"></span>';

  TreemaNode.prototype.keyTemplate = '<span class="treema-key"></span>';

  TreemaNode.prototype.templateString = '<div class="treema-error"></div>';

  TreemaNode.prototype.collection = false;

  TreemaNode.prototype.ordered = false;

  TreemaNode.prototype.keyed = false;

  TreemaNode.prototype.editable = true;

  TreemaNode.prototype.directlyEditable = true;

  TreemaNode.prototype.skipTab = false;

  TreemaNode.prototype.valueClass = null;

  TreemaNode.prototype.keyForParent = null;

  TreemaNode.prototype.$el = null;

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

  TreemaNode.prototype.setValueForReading = function() {
    return console.error('"setValueForReading" has not been overridden.');
  };

  TreemaNode.prototype.setValueForEditing = function() {
    if (!this.editable) {
      return;
    }
    return console.error('"setValueForEditing" has not been overridden.');
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

  TreemaNode.prototype.setValueForReadingSimply = function(valEl, text) {
    return valEl.append($("<pre></pre>").addClass('treema-shortened').text(text.slice(0, 200)));
  };

  TreemaNode.prototype.setValueForEditingSimply = function(valEl, value, inputType) {
    var input,
      _this = this;
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
    input.blur(function() {
      var allEmpty, inputs, success;
      if (_this.isEditing()) {
        success = _this.toggleEdit('treema-read');
      }
      if (!success) {
        inputs = _this.getValEl().find('input, textarea');
        allEmpty = __indexOf.call((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = inputs.length; _i < _len; _i++) {
            input = inputs[_i];
            _results.push(Boolean($(input).val()));
          }
          return _results;
        })(), true) < 0;
      }
      if (!success) {
        return input.focus().select();
      }
    });
    return input;
  };

  function TreemaNode(schema, data, options, parent) {
    this.schema = schema;
    this.data = data;
    this.options = options;
    this.parent = parent;
    this.orderDataFromUI = __bind(this.orderDataFromUI, this);
    this.options = this.options || {};
    this.schema = this.schema || {};
  }

  TreemaNode.prototype.build = function() {
    var valEl;
    this.populateData();
    this.setUpValidator();
    this.$el = $(this.nodeTemplate);
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
      valEl.addClass('treema-read');
    }
    this.setValueForReading(valEl);
    if (this.collection && !this.parent) {
      this.open();
    }
    if (!this.parent) {
      this.setUpEvents();
    }
    if (this.collection) {
      this.updateMyAddButton();
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
    if (clickedValue && this.canEdit() && !usedModKey) {
      return this.toggleEdit();
    }
    if (clickedToggle || (clickedValue && this.collection)) {
      return this.toggleOpen();
    }
    if ($(e.target).closest('.treema-add-child').length && this.collection) {
      return this.addNewChild();
    }
    if (this.isRoot()) {
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

  TreemaNode.prototype.onUpArrowPressed = function() {
    if (!this.editingIsHappening()) {
      return this.navigateSelection(-1);
    }
  };

  TreemaNode.prototype.onDownArrowPressed = function() {
    if (!this.editingIsHappening()) {
      return this.navigateSelection(1);
    }
  };

  TreemaNode.prototype.onSpacePressed = function() {};

  TreemaNode.prototype.onTPressed = function() {};

  TreemaNode.prototype.onFPressed = function() {};

  TreemaNode.prototype.onDeletePressed = function(e) {
    var _ref;
    if (this.editingIsHappening() && !$(e.target).val()) {
      this.remove();
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
      this.toggleEdit('treema-read');
    }
    if (!this.isRoot()) {
      this.select();
    }
    return this.getRootEl().focus();
  };

  TreemaNode.prototype.onEnterPressed = function(e) {
    var selected, targetTreema, _ref;
    if (this.editingIsHappening()) {
      this.saveChanges();
      this.flushChanges();
      this.endExistingEdits();
      targetTreema = this.getNextEditableTreema(e.shiftKey ? -1 : 1);
      if (targetTreema) {
        targetTreema.toggleEdit('treema-edit');
      } else {
        if ((_ref = this.parent) != null) {
          _ref.addNewChild();
        }
      }
      return;
    }
    selected = this.getLastSelectedTreema();
    if (!(selected != null ? selected.editable : void 0)) {
      return;
    }
    if (selected.collection) {
      return selected.toggleOpen();
    }
    selected.select();
    return selected.toggleEdit('treema-edit');
  };

  TreemaNode.prototype.onNPressed = function(e) {
    var selected, success, _ref;
    if (this.editingIsHappening()) {
      return;
    }
    selected = this.getLastSelectedTreema();
    success = selected != null ? (_ref = selected.parent) != null ? _ref.addNewChild() : void 0 : void 0;
    if (success) {
      this.deselectAll();
    }
    return e.preventDefault();
  };

  TreemaNode.prototype.onTabPressed = function(e) {
    var input, inputValues, offset, targetTreema, _ref;
    e.preventDefault();
    offset = e.shiftKey ? -1 : 1;
    if (!this.editingIsHappening()) {
      targetTreema = this.getLastSelectedTreema();
      if (!(targetTreema != null ? targetTreema.canEdit() : void 0)) {
        return;
      }
      return targetTreema.toggleEdit('treema-edit');
    }
    inputValues = (function() {
      var _i, _len, _ref, _results;
      _ref = this.getValEl().find('input, textarea');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        input = _ref[_i];
        _results.push(Boolean($(input).val()));
      }
      return _results;
    }).call(this);
    if (__indexOf.call(inputValues, true) < 0) {
      targetTreema = this.getNextEditableTreemaFromElement(this.$el, offset);
      this.remove();
      return targetTreema.toggleEdit('treema-edit');
    }
    this.saveChanges();
    this.flushChanges();
    if (!this.isValid()) {
      return;
    }
    this.endExistingEdits();
    targetTreema = this.getNextEditableTreema(offset);
    if (targetTreema) {
      return targetTreema.toggleEdit('treema-edit');
    } else {
      return (_ref = this.parent) != null ? _ref.addNewChild() : void 0;
    }
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
    var next, selected;
    selected = this.getLastSelectedTreema();
    if (!selected) {
      return;
    }
    next = offset > 0 ? selected.getNextTreema() : selected.getPreviousTreema();
    return next != null ? next.select() : void 0;
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
    toClass = toClass || (valEl.hasClass('treema-read') ? 'treema-edit' : 'treema-read');
    if (toClass === 'treema-edit') {
      this.endExistingEdits();
    }
    valEl.removeClass('treema-read').removeClass('treema-edit').addClass(toClass);
    valEl.empty();
    if (this.isReading()) {
      this.setValueForReading(valEl);
    }
    if (this.isEditing()) {
      this.setValueForEditing(valEl);
      return this.deselectAll();
    }
  };

  TreemaNode.prototype.endExistingEdits = function() {
    var editing, elem, _i, _len, _results;
    editing = this.getRootEl().find('.treema-edit').closest('.treema-node');
    _results = [];
    for (_i = 0, _len = editing.length; _i < _len; _i++) {
      elem = editing[_i];
      _results.push($(elem).data('instance').toggleEdit('treema-read'));
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
      treema.$el.find('.treema-key').text(index);
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
    return this.setValueForReading(this.getValEl().empty());
  };

  TreemaNode.prototype.select = function() {
    this.deselectAll(true);
    return this.toggleSelect();
  };

  TreemaNode.prototype.deselectAll = function(excludeSelf) {
    var treema, _i, _len, _ref, _results;
    if (excludeSelf == null) {
      excludeSelf = false;
    }
    _ref = this.getSelectedTreemas();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      treema = _ref[_i];
      if (excludeSelf && treema === this) {
        continue;
      }
      _results.push(treema.$el.removeClass('treema-selected'));
    }
    return _results;
  };

  TreemaNode.prototype.toggleSelect = function() {
    if (!this.isRoot()) {
      this.$el.toggleClass('treema-selected');
    }
    if (this.isSelected()) {
      this.getRootEl().find('.treema-last-selected').removeClass('treema-last-selected');
      return this.$el.addClass('treema-last-selected');
    }
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
    return lastSelected.addClass('treema-selected');
  };

  TreemaNode.prototype.addChildTreema = function(key, value, schema) {
    var treema;
    treema = makeTreema(schema, value, {}, this);
    treema.keyForParent = key;
    this.childrenTreemas[key] = treema;
    treema.populateData();
    this.data[key] = treema.data;
    return treema;
  };

  TreemaNode.prototype.createChildNode = function(treema) {
    var childNode, keyEl, name, required, _ref;
    childNode = treema.build();
    if (this.collection) {
      name = treema.schema.title || treema.keyForParent;
      keyEl = $(this.keyTemplate).text(name);
      if (treema.schema.description) {
        keyEl.attr('title', treema.schema.description);
      }
      childNode.prepend(' : ');
      required = this.schema.required || [];
      if (_ref = treema.keyForParent, __indexOf.call(required, _ref) >= 0) {
        keyEl.text(keyEl.text() + '*');
      }
      childNode.prepend(keyEl);
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
    this.$el.prepend($(this.templateString));
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
    return this.$el.find('> .treema-value');
  };

  TreemaNode.prototype.getRootEl = function() {
    return this.$el.closest('.treema-root');
  };

  TreemaNode.prototype.isRoot = function() {
    return this.$el.hasClass('treema-root');
  };

  TreemaNode.prototype.isEditing = function() {
    return this.getValEl().hasClass('treema-edit');
  };

  TreemaNode.prototype.isReading = function() {
    return this.getValEl().hasClass('treema-read');
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

  TreemaNode.prototype.keepFocus = function() {
    return this.getRootEl().focus();
  };

  TreemaNode.prototype.rootSelected = function() {
    return $(document.activeElement).hasClass('treema-root');
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

  TreemaNode.prototype.updateMyAddButton = function() {
    this.$el.removeClass('treema-full');
    if (!this.canAddChild()) {
      return this.$el.addClass('treema-full');
    }
  };

  return TreemaNode;

})();

StringTreemaNode = (function(_super) {
  __extends(StringTreemaNode, _super);

  function StringTreemaNode() {
    _ref = StringTreemaNode.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  StringTreemaNode.prototype.valueClass = 'treema-string';

  StringTreemaNode.prototype.getDefaultValue = function() {
    return '';
  };

  StringTreemaNode.inputTypes = ['color', 'date', 'datetime', 'datetime-local', 'email', 'month', 'range', 'search', 'tel', 'text', 'time', 'url', 'week'];

  StringTreemaNode.prototype.setValueForReading = function(valEl) {
    return this.setValueForReadingSimply(valEl, "\"" + this.data + "\"");
  };

  StringTreemaNode.prototype.setValueForEditing = function(valEl) {
    var input, _ref1;
    input = this.setValueForEditingSimply(valEl, this.data);
    if (this.schema.maxLength) {
      input.attr('maxlength', this.schema.maxLength);
    }
    if (_ref1 = this.schema.format, __indexOf.call(StringTreemaNode.inputTypes, _ref1) >= 0) {
      return input.attr('type', this.schema.format);
    }
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

  NumberTreemaNode.prototype.valueClass = 'treema-number';

  NumberTreemaNode.prototype.getDefaultValue = function() {
    return 0;
  };

  NumberTreemaNode.prototype.setValueForReading = function(valEl) {
    return this.setValueForReadingSimply(valEl, JSON.stringify(this.data));
  };

  NumberTreemaNode.prototype.setValueForEditing = function(valEl) {
    var input;
    input = this.setValueForEditingSimply(valEl, JSON.stringify(this.data), 'number');
    if (this.schema.maximum) {
      input.attr('max', this.schema.maximum);
    }
    if (this.schema.minimum) {
      return input.attr('min', this.schema.minimum);
    }
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

  NullTreemaNode.prototype.valueClass = 'treema-null';

  NullTreemaNode.prototype.editable = false;

  NullTreemaNode.prototype.setValueForReading = function(valEl) {
    return this.setValueForReadingSimply(valEl, 'null');
  };

  return NullTreemaNode;

})(TreemaNode);

BooleanTreemaNode = (function(_super) {
  __extends(BooleanTreemaNode, _super);

  function BooleanTreemaNode() {
    _ref3 = BooleanTreemaNode.__super__.constructor.apply(this, arguments);
    return _ref3;
  }

  BooleanTreemaNode.prototype.valueClass = 'treema-boolean';

  BooleanTreemaNode.prototype.getDefaultValue = function() {
    return false;
  };

  BooleanTreemaNode.prototype.setValueForReading = function(valEl) {
    return this.setValueForReadingSimply(valEl, JSON.stringify(this.data));
  };

  BooleanTreemaNode.prototype.setValueForEditing = function(valEl) {
    var input;
    input = this.setValueForEditingSimply(valEl, JSON.stringify(this.data));
    $('<span></span>').text(JSON.stringify(this.data)).insertBefore(input);
    return input.focus();
  };

  BooleanTreemaNode.prototype.toggleValue = function(newValue) {
    var valEl;
    if (newValue == null) {
      newValue = null;
    }
    this.data = !this.data;
    if (newValue != null) {
      this.data = newValue;
    }
    valEl = this.getValEl().empty();
    if (this.isReading()) {
      return this.setValueForReading(valEl);
    } else {
      return this.setValueForEditing(valEl);
    }
  };

  BooleanTreemaNode.prototype.onSpacePressed = function() {
    return this.toggleValue();
  };

  BooleanTreemaNode.prototype.onFPressed = function() {
    return this.toggleValue(false);
  };

  BooleanTreemaNode.prototype.onTPressed = function() {
    return this.toggleValue(true);
  };

  BooleanTreemaNode.prototype.saveChanges = function() {};

  return BooleanTreemaNode;

})(TreemaNode);

ArrayTreemaNode = (function(_super) {
  __extends(ArrayTreemaNode, _super);

  function ArrayTreemaNode() {
    _ref4 = ArrayTreemaNode.__super__.constructor.apply(this, arguments);
    return _ref4;
  }

  ArrayTreemaNode.prototype.valueClass = 'treema-array';

  ArrayTreemaNode.prototype.getDefaultValue = function() {
    return [];
  };

  ArrayTreemaNode.prototype.collection = true;

  ArrayTreemaNode.prototype.ordered = true;

  ArrayTreemaNode.prototype.directlyEditable = false;

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
    return this.setValueForReadingSimply(valEl, JSON.stringify(this.data));
  };

  ArrayTreemaNode.prototype.setValueForEditing = function(valEl) {
    return this.setValueForEditingSimply(valEl, JSON.stringify(this.data));
  };

  ArrayTreemaNode.prototype.canAddChild = function() {
    if (this.schema.additionalItems === false && this.data.length >= this.schema.items.length) {
      return false;
    }
    if ((this.schema.maxItems != null) && this.data.length >= this.schema.maxItems) {
      return false;
    }
    return true;
  };

  ArrayTreemaNode.prototype.addNewChild = function() {
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
    newTreema.toggleEdit('treema-edit');
    return true;
  };

  return ArrayTreemaNode;

})(TreemaNode);

ObjectTreemaNode = (function(_super) {
  __extends(ObjectTreemaNode, _super);

  function ObjectTreemaNode() {
    this.onNewPropertyBlur = __bind(this.onNewPropertyBlur, this);
    _ref5 = ObjectTreemaNode.__super__.constructor.apply(this, arguments);
    return _ref5;
  }

  ObjectTreemaNode.prototype.valueClass = 'treema-object';

  ObjectTreemaNode.prototype.getDefaultValue = function() {
    return {};
  };

  ObjectTreemaNode.prototype.collection = true;

  ObjectTreemaNode.prototype.keyed = true;

  ObjectTreemaNode.prototype.newPropertyTemplate = '<input class="treema-new-prop" />';

  ObjectTreemaNode.prototype.directlyEditable = false;

  ObjectTreemaNode.prototype.getChildren = function() {
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

  ObjectTreemaNode.prototype.setValueForReading = function(valEl) {
    return this.setValueForReadingSimply(valEl, JSON.stringify(this.data));
  };

  ObjectTreemaNode.prototype.setValueForEditing = function(valEl) {
    return this.setValueForEditingSimply(valEl, JSON.stringify(this.data));
  };

  ObjectTreemaNode.prototype.populateData = function() {
    var helperTreema, key, _i, _len, _ref6, _results;
    ObjectTreemaNode.__super__.populateData.call(this);
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
      helperTreema = makeTreema(this.getChildSchema(key), null, {}, this);
      helperTreema.populateData();
      _results.push(this.data[key] = helperTreema.data);
    }
    return _results;
  };

  ObjectTreemaNode.prototype.canAddChild = function() {
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

  ObjectTreemaNode.prototype.canAddProperty = function(key) {
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

  ObjectTreemaNode.prototype.addNewChild = function() {
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

  ObjectTreemaNode.prototype.addingNewProperty = function() {
    return document.activeElement === this.$el.find('.treema-new-prop')[0];
  };

  ObjectTreemaNode.prototype.onNewPropertyBlur = function(e) {
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

  ObjectTreemaNode.prototype.getPropertyKey = function(keyInput) {
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

  ObjectTreemaNode.prototype.showBadPropertyError = function(keyInput) {
    var tempError;
    keyInput.focus();
    tempError = this.createTemporaryError('Invalid property name.');
    tempError.insertAfter(keyInput);
  };

  ObjectTreemaNode.prototype.addNewChildForKey = function(key) {
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
      newTreema.toggleEdit('treema-edit');
    }
    return this.updateMyAddButton();
  };

  ObjectTreemaNode.prototype.findObjectInsertionPoint = function(key) {
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

  ObjectTreemaNode.prototype.childPropertiesAvailable = function() {
    var childSchema, properties, property, _ref6;
    if (!this.schema.properties) {
      return [];
    }
    properties = [];
    _ref6 = this.schema.properties;
    for (property in _ref6) {
      childSchema = _ref6[property];
      if (this.childrenTreemas[property] != null) {
        continue;
      }
      properties.push(childSchema.title || property);
    }
    return properties.sort();
  };

  ObjectTreemaNode.prototype.onDeletePressed = function(e) {
    var keyInput;
    ObjectTreemaNode.__super__.onDeletePressed.call(this, e);
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

  ObjectTreemaNode.prototype.onEscapePressed = function(e) {
    var keyInput;
    keyInput = $(e.target);
    if (!keyInput.hasClass('treema-new-prop')) {
      return;
    }
    this.clearTemporaryErrors();
    keyInput.remove();
    return e.preventDefault();
  };

  ObjectTreemaNode.prototype.onTabPressed = function(e) {
    var keyInput, targetTreema;
    e.preventDefault();
    keyInput = $(e.target);
    if (!keyInput.hasClass('treema-new-prop')) {
      return ObjectTreemaNode.__super__.onTabPressed.call(this, e);
    }
    if (keyInput.val()) {
      return keyInput.blur();
    }
    targetTreema = this.getNextEditableTreemaFromElement(keyInput, e.shiftKey ? -1 : 1);
    keyInput.remove();
    if (targetTreema) {
      return targetTreema.toggleEdit('treema-edit');
    }
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
    this.helper = new NodeClass(this.schema, this.data, this.options, this.parent);
    this.helper.tv4 = this.tv4;
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

  AnyTreemaNode.prototype.onClick = function(e) {
    var clickedValue, usedModKey, _ref6;
    if ((_ref6 = e.target.nodeName) === 'INPUT' || _ref6 === 'TEXTAREA') {
      return;
    }
    clickedValue = $(e.target).closest('.treema-value').length;
    usedModKey = e.shiftKey || e.ctrlKey || e.metaKey;
    if (clickedValue && !usedModKey) {
      return this.toggleEdit();
    }
    return AnyTreemaNode.__super__.onClick.call(this, e);
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

makeTreema = function(schema, data, options, parent) {
  var NodeClass;
  NodeClass = TreemaNodeMap[schema.format];
  if (!NodeClass) {
    NodeClass = TreemaNodeMap[schema.type];
  }
  if (!NodeClass) {
    NodeClass = TreemaNodeMap['any'];
  }
  return new NodeClass(schema, data, options, parent);
};

//@ sourceMappingURL=treema.js.map