class TreemaNode
  # Abstract node class

  # constructor defined
  schema: {}
  $el: null
  data: null
  options: null
  parent: null
  
  # templates
  nodeTemplate: '<div class="treema-value"></div><div class="treema-backdrop"></div>'
  childrenTemplate: '<div class="treema-children"></div>'
  addChildTemplate: '<div class="treema-add-child">+</div>'
  tempErrorTemplate: '<span class="treema-temp-error"></span>'
  toggleTemplate: '<span class="treema-toggle"></span>'
  keyTemplate: '<span class="treema-key"></span>'
  errorTemplate: '<div class="treema-error"></div>'

  # behavior settings (overridden by subclasses)
  collection: false      # acts like an array or object
  ordered: false         # acts like an array
  keyed: false           # acts like an object
  editable: true         # can be changed
  directlyEditable: true # can be changed at this level directly
  skipTab: false         # is skipped over when tabbing between elements for editing
  valueClass: null
  
  # dynamically managed properties
  keyForParent: null
  childrenTreemas: null
  justAdded: false

  # Thin interface for tv4 ----------------------------------------------------
  isValid: ->
    return true unless @tv4
    @tv4.validate(@data, @schema)
    
  getErrors: ->
    return [] unless @tv4
    @tv4.validateMultiple(@data, @schema)['errors']
    
  getMissing: ->
    return [] unless @tv4
    @tv4.validateMultiple(@data, @schema)['missing']

  setUpValidator: ->
    return @tv4 = window['tv4']?.freshApi() if not @parent
    node = @
    node = node.parent while node.parent
    @tv4 = node.tv4

  # Abstract functions --------------------------------------------------------
  saveChanges: -> console.error('"saveChanges" has not been overridden.')
  getDefaultValue: -> null
  buildValueForDisplay: -> console.error('"buildValueForDisplay" has not been overridden.')
  buildValueForEditing: ->
    return unless @editable
    console.error('"buildValueForEditing" has not been overridden.')
  
  # collection specific
  getChildren: -> console.error('"getChildren" has not been overridden.') # should return a list of key-value-schema tuples
  getChildSchema: -> console.error('"getChildSchema" has not been overridden.')
  canAddChild: -> @collection and @editable
  canAddProperty: -> true
  addNewChild: -> false

  # Subclass helper functions -------------------------------------------------
  buildValueForDisplaySimply: (valEl, text) ->
    text = text.slice(0,200) + '...' if text.length > 200
    valEl.append($("<div></div>").addClass('treema-shortened').text(text))

  buildValueForEditingSimply: (valEl, value, inputType=null) ->
    input = $('<input />')
    input.attr('type', inputType) if inputType
    input.val(value) unless value is null
    valEl.append(input)
    input.focus().select()
    input.blur @onEditInputBlur
    input

  onEditInputBlur: =>
    @saveChanges(@getValEl())
    input = @getValEl().find('input, textarea, select')
    if @isValid() then @display() if @isEditing() else input.focus().select()

  limitChoices: (options) ->
    @enum = options
    @buildValueForEditing = (valEl) =>
      input = $('<select></select>')
      input.append($('<option></option>').text(option)) for option in @enum
      index = @enum.indexOf(@data)
      input.prop('selectedIndex', index) if index >= 0
      valEl.append(input)
      input.focus()
      input.blur @onEditInputBlur
      input
      
    @saveChanges = (valEl) =>
      index = valEl.find('select').prop('selectedIndex')
      @data = @enum[index]

  # Initialization ------------------------------------------------------------
  @pluginName = "treema"
  defaults =
    schema: {}
    callbacks: {}

  constructor: (@$el, options, @parent) ->
    @$el = @$el or $('<div></div>')
    @settings = $.extend {}, defaults, options
    @schema = @settings.schema
    @data = options.data
    @callbacks = @settings.callbacks
    @_defaults = defaults
    @_name = TreemaNode.pluginName
    @setUpValidator()
    @populateData()

  build: ->
    @$el.addClass('treema-node').addClass('treema-clearfix')
    @$el.empty().append($(@nodeTemplate))
    @$el.data('instance', @)
    @$el.addClass('treema-root') unless @parent
    @$el.attr('tabindex', 9001) unless @parent
    @$el.append($(@childrenTemplate)).addClass('treema-closed') if @collection
    valEl = @getValEl()
    valEl.addClass(@valueClass) if @valueClass
    valEl.addClass('treema-display') if @directlyEditable
    @buildValueForDisplay(valEl)
    @open() if @collection and not @parent
    @setUpEvents() unless @parent
    @updateMyAddButton() if @collection
    @limitChoices(@schema.enum) if @schema.enum
    @$el
    
  populateData: ->
    @data = @data or @schema.default or @getDefaultValue()

  # Event handling ------------------------------------------------------------
  setUpEvents: ->
    @$el.dblclick (e) => $(e.target).closest('.treema-node').data('instance')?.onDoubleClick(e)
    @$el.click (e) => $(e.target).closest('.treema-node').data('instance')?.onClick(e)
    @$el.keydown (e) => $(e.target).closest('.treema-node').data('instance')?.onKeyDown(e)

  onClick: (e) ->
    return if e.target.nodeName in ['INPUT', 'TEXTAREA']
    clickedValue = $(e.target).closest('.treema-value').length  # Clicks are in children of .treema-value nodes
    clickedToggle = $(e.target).hasClass('treema-toggle')
    usedModKey = e.shiftKey or e.ctrlKey or e.metaKey
    @keepFocus() unless clickedValue and not @collection
    return @toggleEdit() if @isDisplaying() and clickedValue and @canEdit() and not usedModKey
    return @toggleOpen() if clickedToggle or (clickedValue and @collection)
    return @addNewChild() if $(e.target).closest('.treema-add-child').length and @collection
    return if @isRoot() or @isEditing()
    return @shiftSelect() if e.shiftKey
    return @toggleSelect() if e.ctrlKey or e.metaKey
    return @select()
    
  onDoubleClick: (e) ->
    return unless @collection
    clickedKey = $(e.target).hasClass('treema-key')
    return unless clickedKey
    @open() if @isClosed()
    @addNewChild()

  onKeyDown: (e) ->
    @onEscapePressed(e) if e.which is 27
    @onTabPressed(e) if e.which is 9
    @onLeftArrowPressed(e) if e.which is 37
    @onUpArrowPressed(e) if e.which is 38
    @onRightArrowPressed(e) if e.which is 39
    @onDownArrowPressed(e) if e.which is 40
    @onEnterPressed(e) if e.which is 13
    @onNPressed(e) if e.which is 78
    @onSpacePressed(e) if e.which is 32
    @onTPressed(e) if e.which is 84
    @onFPressed(e) if e.which is 70
    @onDeletePressed(e) if e.which is 8

  # Default keyboard behaviors ------------------------------------------------
    
  onLeftArrowPressed: -> @navigateOut() unless @editingIsHappening()
  onRightArrowPressed: -> @navigateIn() unless @editingIsHappening()
  onUpArrowPressed: -> @navigateSelection(-1) unless @editingIsHappening()
  onDownArrowPressed: -> @navigateSelection(1) unless @editingIsHappening()
  onSpacePressed: ->
  onTPressed: ->
  onFPressed: ->
    
  onDeletePressed: (e) ->
    if @editingIsHappening() and not $(e.target).val()
      @display()
      @select()
      @removeSelectedNodes()
      e.preventDefault()
    return if e.target.nodeName in ['INPUT', 'TEXTAREA']
    e.preventDefault()
    @removeSelectedNodes()

  onEscapePressed: ->
    return unless @isEditing()
    return @remove() if @justAdded
    @display() if @isEditing()
    @select() unless @isRoot()
    @getRootEl().focus()

  onEnterPressed: (e) ->
    if @editingIsHappening()
      @saveChanges(@getValEl())
      @flushChanges()
      @endExistingEdits()
      targetTreema = @getNextEditableTreema(if e.shiftKey then -1 else 1)
      if targetTreema then targetTreema.edit() else @parent?.addNewChild()
      return
      
    selected = @getLastSelectedTreema()
    return unless selected?.editable
    return selected.toggleOpen() if selected.collection
    selected.select()
    selected.edit()

  onNPressed: (e) ->
    return if @editingIsHappening()
    selected = @getLastSelectedTreema()
    target = if selected?.collection then selected else selected?.parent
    return unless target
    success = target.addNewChild()
    @deselectAll() if success
    e.preventDefault()
    
  onTabPressed: (e) ->
    offset = if e.shiftKey then -1 else 1
    return if @hasMoreInputs(offset)
    
    e.preventDefault()
    if not @editingIsHappening()
      targetTreema = @getLastSelectedTreema()
      return unless targetTreema?.canEdit()
      return targetTreema.edit(offset: offset)
      
    inputValues = (Boolean($(input).val()) for input in @getValEl().find('input, textarea, select'))
    unless true in inputValues
      targetTreema = @getNextEditableTreemaFromElement(@$el, offset)
      @remove() unless @data
      return targetTreema.edit(offset: offset)
      
    @saveChanges(@getValEl())
    @flushChanges()
    return unless @isValid()
    @endExistingEdits()
    targetTreema = @getNextEditableTreema(offset)
    if targetTreema then targetTreema.edit(offset:offset) else @parent?.addNewChild()
    
  hasMoreInputs: (offset) ->
    inputs = @getInputs().toArray()
    inputs = inputs.reverse() if offset < 0
    passedFocusedEl = false
    for input in inputs
      if input is document.activeElement
        passedFocusedEl = true
        continue
      continue unless passedFocusedEl
      return true
    return false
  
  # Tree traversing -----------------------------------------------------------

  getNextEditableTreemaFromElement: (el, offset) ->
    dir = if offset > 0 then 'next' else 'prev'

    # try siblings first
    targetTreema = el[dir]('.treema-node').data('instance')
    if targetTreema and not targetTreema?.canEdit()
      targetTreema = targetTreema.getNextEditableTreema(offset) 
      
    # then from parent treemas
    else if not targetTreema
      parentTreema = el.closest('.treema-node').data('instance')
      targetTreema = parentTreema?.getNextEditableTreema(offset)
      
    # otherwise, just start again from the beginning or end
    if not targetTreema
      dir = if offset > 0 then 'first' else 'last'
      selector = '> .treema-children > .treema-node:'+dir
      targetTreema = @getRootEl().find(selector).data('instance')
      targetTreema = targetTreema.getNextEditableTreema(offset) if targetTreema and not targetTreema.canEdit()
    return targetTreema

  getNextEditableTreema: (offset) ->
    targetTreema = @
    while targetTreema
      targetTreema = if offset > 0 then targetTreema.getNextTreema() else targetTreema.getPreviousTreema()
      continue if targetTreema and not targetTreema.canEdit()
      break
    targetTreema
  
  navigateSelection: (offset) ->
    treemas = @getVisibleTreemas()
    return unless treemas.length
    selected = @getLastSelectedTreema()
    firstTreema = treemas[0]
    lastTreema = treemas[treemas.length-1]
    
    if not selected
      targetTreema = if offset > 0 then firstTreema else lastTreema
      return targetTreema.select()
      
    return if offset < 0 and selected is firstTreema
    return if offset > 0 and selected is lastTreema

    targetTreema = treemas[treemas.indexOf(selected) + offset]
    targetTreema.select()

  navigateOut: ->
    treema.close() if treema.isOpen() for treema in @getSelectedTreemas()
    parentSelection = @getLastSelectedTreema()?.parent
    return unless parentSelection
    return if parentSelection.isRoot()
    parentSelection.close()
    parentSelection.select()

  navigateIn: ->
    for treema in @getSelectedTreemas()
      continue unless treema.collection
      treema.open() if treema.isClosed()

  getNextTreema: ->
    nextChild = @$el.find('.treema-node:first').data('instance')
    return nextChild if nextChild
    nextSibling = @$el.next('.treema-node').data('instance')
    return nextSibling if nextSibling
    nextParent = @parent?.$el.next('.treema-node').data('instance')
    return nextParent

  getPreviousTreema: ->
    prevSibling = @$el.prev('.treema-node').data('instance')
    lastChild = prevSibling?.$el.find('.treema-node:last').data('instance')
    return lastChild or prevSibling or @parent
    
  canEdit: ->
    return false if not @editable
    return false if not @directlyEditable
    return false if @collection and @isOpen()
    return true

  # Editing values ------------------------------------------------------------
  display: ->
    @toggleEdit('treema-display')

  edit: (options={}) ->
    @toggleEdit('treema-edit')
    @focusLastInput() if options.offset? and options.offset < 0
    
  toggleEdit: (toClass=null) ->
    return unless @editable
    valEl = @getValEl()
    return if toClass and valEl.hasClass(toClass)
    toClass = toClass or (if valEl.hasClass('treema-display') then 'treema-edit' else 'treema-display')
    @endExistingEdits() if toClass is 'treema-edit'
    valEl.removeClass('treema-display').removeClass('treema-edit').addClass(toClass)

    valEl.empty()
    @buildValueForDisplay(valEl) if @isDisplaying()

    if @isEditing()
      @buildValueForEditing(valEl)
      @deselectAll()

  endExistingEdits: ->
    editing = @getRootEl().find('.treema-edit').closest('.treema-node')
    for elem in editing
      treema = $(elem).data('instance')
      treema.saveChanges(treema.getValEl())
      treema.display()
      
  flushChanges: ->
    @justAdded = false
    return @refreshErrors() unless @parent
    @parent.data[@keyForParent] = @data
    @parent.refreshErrors()
    
  focusLastInput: ->
    inputs = @getInputs()
    last = inputs[inputs.length-1]
    $(last).focus().select()
    
  # Removing nodes ------------------------------------------------------------
  removeSelectedNodes: ->
    selected = @getSelectedTreemas()
    toSelect = null
    if selected.length is 1
      nextSibling = selected[0].$el.next('.treema-node').data('instance')
      prevSibling = selected[0].$el.prev('.treema-node').data('instance')
      toSelect = nextSibling or prevSibling or selected[0].parent
    treema.remove() for treema in selected
    toSelect.select() if toSelect and not @getSelectedTreemas().length

  remove: ->
    required = @parent and @parent.schema.required? and @keyForParent in @parent.schema.required
    if required
      tempError = @createTemporaryError('required')
      return @$el.prepend(tempError)

    root = @getRootEl()
    @$el.remove()
    root.focus()
    return unless @parent?
    delete @parent.childrenTreemas[@keyForParent]
    delete @parent.data[@keyForParent]
    @parent.orderDataFromUI() if @parent.ordered
    @parent.refreshErrors()
    @parent.updateMyAddButton()

  # Opening/closing collections -----------------------------------------------
  toggleOpen: ->
    if @isClosed() then @open() else @close()

  open: ->
    childrenContainer = @$el.find('.treema-children').detach()
    childrenContainer.empty()
    @childrenTreemas = {}
    for [key, value, schema] in @getChildren()
      treema = @addChildTreema(key, value, schema)
      childNode = @createChildNode(treema)
      childrenContainer.append(childNode)
    @$el.append(childrenContainer).removeClass('treema-closed').addClass('treema-open')
    childrenContainer.append($(@addChildTemplate))
    if @ordered and childrenContainer.sortable
      childrenContainer.sortable?(deactivate: @orderDataFromUI).disableSelection?()
    @refreshErrors()

  orderDataFromUI: =>
    children = @$el.find('> .treema-children > .treema-node')
    index = 0
    @childrenTreemas = {}  # rebuild it
    @data = if $.isArray(@data) then [] else {}
    for child in children
      treema = $(child).data('instance')
      continue unless treema
      treema.keyForParent = index
      treema.$el.find('.treema-key').text(index)
      @childrenTreemas[index] = treema
      @data[index] = treema.data
      index += 1
    @flushChanges()

  close: ->
    @data[key] = treema.data for key, treema of @childrenTreemas
    @$el.find('.treema-children').empty()
    @$el.addClass('treema-closed').removeClass('treema-open')
    @childrenTreemas = null
    @refreshErrors()
    @buildValueForDisplay(@getValEl().empty())

  # Selecting/deselecting nodes -----------------------------------------------
  select: ->
    numSelected = @getSelectedTreemas().length
    # if we have multiple selected, we want this row to be selected at the end
    excludeSelf = numSelected is 1 
    @deselectAll(excludeSelf)
    @toggleSelect()

  deselectAll: (excludeSelf=false) ->
    for treema in @getSelectedTreemas()
      continue if excludeSelf and treema is @
      treema.$el.removeClass('treema-selected')
    @clearLastSelected()

  toggleSelect: ->
    @clearLastSelected()
    @$el.toggleClass('treema-selected') unless @isRoot()
    @$el.addClass('treema-last-selected') if @isSelected()
    
  clearLastSelected: ->
    @getRootEl().find('.treema-last-selected').removeClass('treema-last-selected')
      
  shiftSelect: ->
    lastSelected = @getRootEl().find('.treema-last-selected')
    @select() if not lastSelected.length
    @deselectAll()
    allNodes = @getRootEl().find('.treema-node')
    started = false
    for node in allNodes
      node = $(node).data('instance')
      if not started
        started = true if node is @ or node.wasSelectedLast()
        node.$el.addClass('treema-selected') if started
        continue
      break if started and (node is @ or node.wasSelectedLast())
      node.$el.addClass('treema-selected')
    @$el.addClass('treema-selected')
    lastSelected.addClass('treema-selected')
    lastSelected.removeClass('treema-last-selected')
    @$el.addClass('treema-last-selected')

  # Child node utilities ------------------------------------------------------
  addChildTreema: (key, value, schema) ->
    treema = TreemaNode.make(null, {schema: schema, data:value}, @)
    treema.keyForParent = key
    @childrenTreemas[key] = treema
    treema.populateData()
    @data[key] = treema.data
    treema
    
  createChildNode: (treema) ->
    childNode = treema.build()
    if @collection
      name = treema.schema.title or treema.keyForParent
      keyEl = $(@keyTemplate).text(name)
      keyEl.attr('title', treema.schema.description) if treema.schema.description
      childNode.prepend(' : ')
      required = @schema.required or []
      keyEl.text(keyEl.text()+'*') if treema.keyForParent in required 
      childNode.prepend(keyEl)
    childNode.prepend($(@toggleTemplate)) if treema.collection
    childNode

  # Validation errors ---------------------------------------------------------
  refreshErrors: ->
    @clearErrors()
    @showErrors()

  showErrors: ->
    return if @justAdded
    errors = @getErrors()
    erroredTreemas = []
    for error in errors
      path = error.dataPath.split('/').slice(1)
      deepestTreema = @
      for subpath in path
        unless deepestTreema.childrenTreemas
          error.forChild = true
          break 
        subpath = parseInt(subpath) if deepestTreema.ordered
        deepestTreema = deepestTreema.childrenTreemas[subpath]
      deepestTreema._errors = [] unless deepestTreema._errors and deepestTreema in erroredTreemas
      deepestTreema._errors.push(error)
      erroredTreemas.push(deepestTreema)

    for treema in $.unique(erroredTreemas)
      childErrors = (e for e in treema._errors when e.forChild)
      ownErrors = (e for e in treema._errors when not e.forChild)
      messages = (e.message for e in ownErrors)
      if childErrors.length > 0
        message = "[#{childErrors.length}] error"
        message = message + 's' if childErrors.length > 1
        messages.push(message)
        
      treema.showError(messages.join('<br />'))

  showError: (message) ->
    @$el.prepend($(@errorTemplate))
    @$el.find('> .treema-error').html(message).show()
    @$el.addClass('treema-has-error')

  clearErrors: ->
    @$el.find('.treema-error').remove()
    @$el.find('.treema-has-error').removeClass('treema-has-error')
    @$el.removeClass('treema-has-error')

  createTemporaryError: (message, attachFunction=null) ->
    attachFunction = @$el.prepend unless attachFunction
    @clearTemporaryErrors()
    return $(@tempErrorTemplate).text(message).delay(3000).fadeOut(1000, -> $(@).remove())
    
  clearTemporaryErrors: -> @getRootEl().find('.treema-temp-error').remove()
    
  # Utilities -----------------------------------------------------------------

  getValEl: -> @$el.find('> .treema-value')
  getRootEl: -> @$el.closest('.treema-root')
  getInputs: -> @getValEl().find('input, textarea')
  getSelectedTreemas: -> ($(el).data('instance') for el in @getRootEl().find('.treema-selected'))
  getLastSelectedTreema: -> @getRootEl().find('.treema-last-selected').data('instance')
  getAddButtonEl: -> @$el.find('> .treema-children > .treema-add-child')
  getVisibleTreemas: -> ($(el).data('instance') for el in @getRootEl().find('.treema-node'))

  isRoot: -> @$el.hasClass('treema-root')
  isEditing: -> @getValEl().hasClass('treema-edit')
  isDisplaying: -> @getValEl().hasClass('treema-display')
  isOpen: -> @$el.hasClass('treema-open')
  isClosed: -> @$el.hasClass('treema-closed')
  isSelected: -> @$el.hasClass('treema-selected')
  wasSelectedLast: -> @$el.hasClass('treema-last-selected')
  editingIsHappening: -> @getRootEl().find('.treema-edit').length
  rootSelected: -> $(document.activeElement).hasClass('treema-root')

  keepFocus: -> @getRootEl().focus()
  updateMyAddButton: ->
    @$el.removeClass('treema-full')
    @$el.addClass('treema-full') unless @canAddChild()

  @nodeMap = {}
  
  @setNodeSubclass = (key, NodeClass) -> @nodeMap[key] = NodeClass
    
  @getNodeClassForSchema = (schema) ->
    NodeClass = null
    NodeClass = @nodeMap[schema.format] if schema.format
    return NodeClass if NodeClass
    NodeClass = @nodeMap[schema.type] if schema.type
    return NodeClass if NodeClass
    @nodeMap['any']
    
  @make = (element, options, parent) ->
    NodeClass = @getNodeClassForSchema(options.schema)
    return new NodeClass(element, options, parent)

