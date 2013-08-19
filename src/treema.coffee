class TreemaNode
  # Abstract node class

  # constructor arguments
  schema: {}
  data: null
  options: null
  parent: null
  
  # templates
  nodeTemplate: '<div class="treema-node treema-clearfix"><div class="treema-value"></div><div class="treema-backdrop"></div></div>'
  childrenTemplate: '<div class="treema-children"></div>'
  addChildTemplate: '<div class="treema-add-child">+</div>'
  tempErrorTemplate: '<span class="treema-temp-error"></span>'
  toggleTemplate: '<span class="treema-toggle"></span>'
  keyTemplate: '<span class="treema-key"></span>'
  templateString: '<div class="treema-error"></div>'

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
  $el: null
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
  setValueForReading: -> console.error('"setValueForReading" has not been overridden.')
  setValueForEditing: ->
    return unless @editable
    console.error('"setValueForEditing" has not been overridden.')
  
  # collection specific
  getChildren: -> console.error('"getChildren" has not been overridden.') # should return a list of key-value-schema tuples
  getChildSchema: -> console.error('"getChildSchema" has not been overridden.')
  canAddChild: -> @collection and @editable
  canAddProperty: -> true
  addNewChild: -> false

  # Subclass helper functions -------------------------------------------------
  setValueForReadingSimply: (valEl, text) ->
    valEl.append($("<pre></pre>").addClass('treema-shortened').text(text.slice(0,200)))

  setValueForEditingSimply: (valEl, value, inputType=null) ->
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
    if @isValid() then @read() if @isEditing() else input.focus().select()

  limitChoices: (options) ->
    @enum = options
    @setValueForEditing = (valEl) =>
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
  constructor: (@schema, @data, @options, @parent) ->
    @options = @options or {}
    @schema = @schema or {}

  build: ->
    @populateData()
    @setUpValidator()
    @$el = $(@nodeTemplate)
    @$el.data('instance', @)
    @$el.addClass('treema-root') unless @parent
    @$el.attr('tabindex', 9001) unless @parent
    @$el.append($(@childrenTemplate)).addClass('treema-closed') if @collection
    valEl = @getValEl()
    valEl.addClass(@valueClass) if @valueClass
    valEl.addClass('treema-read') if @directlyEditable
    @setValueForReading(valEl)
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
    return @toggleEdit() if clickedValue and @canEdit() and not usedModKey
    return @toggleOpen() if clickedToggle or (clickedValue and @collection)
    return @addNewChild() if $(e.target).closest('.treema-add-child').length and @collection
    return if @isRoot()
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
      @remove()
      e.preventDefault()
    return if e.target.nodeName in ['INPUT', 'TEXTAREA']
    e.preventDefault()
    @removeSelectedNodes()

  onEscapePressed: ->
    return unless @isEditing()
    return @remove() if @justAdded
    @read() if @isEditing()
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
    selected = @getLastSelectedTreema()
    return unless selected
    next = if offset > 0 then selected.getNextTreema() else selected.getPreviousTreema()
    next?.select()

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
  read: ->
    @toggleEdit('treema-read')

  edit: (options={}) ->
    @toggleEdit('treema-edit')
    @focusLastInput() if options.offset? and options.offset < 0
    
  toggleEdit: (toClass=null) ->
    return unless @editable
    valEl = @getValEl()
    return if toClass and valEl.hasClass(toClass)
    toClass = toClass or (if valEl.hasClass('treema-read') then 'treema-edit' else 'treema-read')
    @endExistingEdits() if toClass is 'treema-edit'
    valEl.removeClass('treema-read').removeClass('treema-edit').addClass(toClass)

    valEl.empty()
    @setValueForReading(valEl) if @isReading()

    if @isEditing()
      @setValueForEditing(valEl)
      @deselectAll()

  endExistingEdits: ->
    editing = @getRootEl().find('.treema-edit').closest('.treema-node')
    $(elem).data('instance').read() for elem in editing
      
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
    @setValueForReading(@getValEl().empty())

  # Selecting/deselecting nodes -----------------------------------------------
  select: ->
    @deselectAll(true)
    @toggleSelect()

  deselectAll: (excludeSelf=false) ->
    for treema in @getSelectedTreemas()
      continue if excludeSelf and treema is @
      treema.$el.removeClass('treema-selected')

  toggleSelect: ->
    @$el.toggleClass('treema-selected') unless @isRoot()
    if @isSelected()
      @getRootEl().find('.treema-last-selected').removeClass('treema-last-selected')
      @$el.addClass('treema-last-selected')
      
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

  # Child node utilities ------------------------------------------------------
  addChildTreema: (key, value, schema) ->
    treema = makeTreema(schema, value, {}, @)
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
    @$el.prepend($(@templateString))
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

  isRoot: -> @$el.hasClass('treema-root')
  isEditing: -> @getValEl().hasClass('treema-edit')
  isReading: -> @getValEl().hasClass('treema-read')
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



# TreemaNode subclasses -------------------------------------------------------

class Point2DTreemaNode extends TreemaNode
  valueClass: 'treema-point2d'
  getDefaultValue: -> {x:0, y:0}

  setValueForReading: (valEl) -> @setValueForReadingSimply(valEl, "(#{@data.x}, #{@data.y})")

  setValueForEditing: (valEl) ->
    xInput = $('<input />').val(@data.x)
    yInput = $('<input />').val(@data.y)
    valEl.append('(').append(xInput).append(', ').append(yInput).append(')')
    valEl.find('input:first').focus().select()

  saveChanges: (valEl) ->
    @data.x = parseFloat(valEl.find('input:first').val())
    @data.y = parseFloat(valEl.find('input:last').val())

class Point3DTreemaNode extends TreemaNode
  valueClass: 'treema-point3d'
  getDefaultValue: -> {x:0, y:0, z:0}

  setValueForReading: (valEl) ->
    @setValueForReadingSimply(valEl, "(#{@data.x}, #{@data.y}, #{@data.z})")

  setValueForEditing: (valEl) ->
    xInput = $('<input />').val(@data.x)
    yInput = $('<input />').val(@data.y)
    zInput = $('<input />').val(@data.z)
    valEl.append('(').append(xInput).append(', ').append(yInput).append(', ').append(zInput).append(')')
    valEl.find('input:first').focus().select()

  saveChanges: ->
    inputs = @getInputs()
    @data.x = parseFloat($(inputs[0]).val())
    @data.y = parseFloat($(inputs[1]).val())
    @data.z = parseFloat($(inputs[2]).val())

class StringTreemaNode extends TreemaNode
  valueClass: 'treema-string'
  getDefaultValue: -> ''
  @inputTypes = ['color', 'date', 'datetime', 'datetime-local', 
                 'email', 'month', 'range', 'search',
                 'tel', 'text', 'time', 'url', 'week']
  
  setValueForReading: (valEl) -> @setValueForReadingSimply(valEl, "\"#{@data}\"")
  
  setValueForEditing: (valEl) ->
    input = @setValueForEditingSimply(valEl, @data)
    input.attr('maxlength', @schema.maxLength) if @schema.maxLength
    input.attr('type', @schema.format) if @schema.format in StringTreemaNode.inputTypes
    
  saveChanges: (valEl) -> @data = $('input', valEl).val()

  
class NumberTreemaNode extends TreemaNode
  valueClass: 'treema-number'
  getDefaultValue: -> 0
    
  setValueForReading: (valEl) -> @setValueForReadingSimply(valEl, JSON.stringify(@data))
  
  setValueForEditing: (valEl) -> 
    input = @setValueForEditingSimply(valEl, JSON.stringify(@data), 'number')
    input.attr('max', @schema.maximum) if @schema.maximum
    input.attr('min', @schema.minimum) if @schema.minimum
    
  saveChanges: (valEl) -> @data = parseFloat($('input', valEl).val())

  
class NullTreemaNode extends TreemaNode
  valueClass: 'treema-null'
  editable: false
  setValueForReading: (valEl) -> @setValueForReadingSimply(valEl, 'null')

  
class BooleanTreemaNode extends TreemaNode
  valueClass: 'treema-boolean'
  getDefaultValue: -> false
    
  setValueForReading: (valEl) -> @setValueForReadingSimply(valEl, JSON.stringify(@data))
  
  setValueForEditing: (valEl) -> 
    input = @setValueForEditingSimply(valEl, JSON.stringify(@data))
    $('<span></span>').text(JSON.stringify(@data)).insertBefore(input)
    input.focus()
    
  toggleValue: (newValue=null) ->
    @data = not @data
    @data = newValue if newValue?
    valEl = @getValEl().empty()
    if @isReading() then @setValueForReading(valEl) else @setValueForEditing(valEl) 
    
  onSpacePressed: -> @toggleValue()
  onFPressed: -> @toggleValue(false)
  onTPressed: -> @toggleValue(true)
  saveChanges: ->
    
class ArrayTreemaNode extends TreemaNode
  valueClass: 'treema-array'
  getDefaultValue: -> []
  collection: true
  ordered: true
  directlyEditable: false

  getChildren: -> ([key, value, @getChildSchema()] for value, key in @data)
  getChildSchema: -> @schema.items or {}
  setValueForReading: (valEl) ->
    text = []
    return unless @data
    for child in @data[..2]
      helperTreema = makeTreema(@getChildSchema(), child, {}, @)
      val = $('<div></div>')
      helperTreema.setValueForReading(val)
      text.push(val.text())
    text.push('...') if @data.length > 3
      
    @setValueForReadingSimply(valEl, text.join(', '))
    
  setValueForEditing: (valEl) -> @setValueForEditingSimply(valEl, JSON.stringify(@data))

  canAddChild: ->
    return false if @schema.additionalItems is false and @data.length >= @schema.items.length
    return false if @schema.maxItems? and @data.length >= @schema.maxItems
    return true
    
  addNewChild: ->
    return unless @canAddChild()
    @open() if @isClosed()
    new_index = Object.keys(@childrenTreemas).length
    schema = @getChildSchema()
    newTreema = @addChildTreema(new_index, undefined, schema)
    newTreema.justAdded = true
    newTreema.tv4 = @tv4
    childNode = @createChildNode(newTreema)
    @getAddButtonEl().before(childNode)
    newTreema.edit()
    true


class ObjectTreemaNode extends TreemaNode
  valueClass: 'treema-object'
  getDefaultValue: -> {}
  collection: true
  keyed: true
  newPropertyTemplate: '<input class="treema-new-prop" />'
  directlyEditable: false

  getChildren: ->
    # order based on properties object first
    children = []
    keysAccountedFor = []
    if @schema.properties
      for key of @schema.properties
        continue if typeof @data[key] is 'undefined'
        keysAccountedFor.push(key)
        children.push([key, @data[key], @getChildSchema(key)])
        
    for key, value of @data
      continue if key in keysAccountedFor
      children.push([key, value, @getChildSchema(key)])
    children
      
  getChildSchema: (key_or_title) ->
    for key, child_schema of @schema.properties
      return child_schema if key is key_or_title or child_schema.title is key_or_title
    {}

  setValueForReading: (valEl) -> @setValueForReadingSimply(valEl, JSON.stringify(@data))
  setValueForEditing: (valEl) -> @setValueForEditingSimply(valEl, JSON.stringify(@data))

  populateData: ->
    super()
    return unless @schema.required
    for key in @schema.required
      continue if @data[key]
      helperTreema = makeTreema(@getChildSchema(key), null, {}, @)
      helperTreema.populateData()
      @data[key] = helperTreema.data

  canAddChild: ->
    return false if @schema.maxProperties? and Object.keys(@data).length >= @schema.maxProperties
    return true if @schema.additionalProperties is false
    return true if @schema.patternProperties?
    return true if @childPropertiesAvailable().length
    return false

  canAddProperty: (key) ->
    return true unless @schema.additionalProperties is false
    return true if @schema.properties[key]?
    if @schema.patternProperties?
      return true if RegExp(pattern).test(key) for pattern of @schema.patternProperties
    return false
    
  addNewChild: ->
    return unless @canAddChild()
    properties = @childPropertiesAvailable()
    keyInput = $(@newPropertyTemplate)
    keyInput.autocomplete?(source: properties, minLength: 0, delay: 0, autoFocus: true)
    @getAddButtonEl().before(keyInput)
    keyInput.focus()
    keyInput.blur @onNewPropertyBlur
    keyInput.autocomplete('search')
    true
    
  addingNewProperty: -> document.activeElement is @$el.find('.treema-new-prop')[0]
    
  onNewPropertyBlur: (e) =>
    keyInput = $(e.target)
    @clearTemporaryErrors()
    key = @getPropertyKey(keyInput)
    return @showBadPropertyError(keyInput) if key.length and not @canAddProperty(key)
    keyInput.remove()
    return unless key.length
    return @childrenTreemas[key].toggleEdit() if @childrenTreemas[key]?
    @addNewChildForKey(key)
    
  getPropertyKey: (keyInput) ->
    key = keyInput.val()
    if @schema.properties
      for child_key, child_schema of @schema.properties
        key = child_key if child_schema.title is key
    key
    
  showBadPropertyError: (keyInput) ->
    keyInput.focus()
    tempError = @createTemporaryError('Invalid property name.')
    tempError.insertAfter(keyInput)
    return
    
  addNewChildForKey: (key) ->
    schema = @getChildSchema(key)
    newTreema = @addChildTreema(key, null, schema)
    newTreema.justAdded = true
    newTreema.tv4 = @tv4
    childNode = @createChildNode(newTreema)
    @findObjectInsertionPoint(key).before(childNode)
    if newTreema.collection then newTreema.addNewChild() else newTreema.edit()
    @updateMyAddButton()

  findObjectInsertionPoint: (key) ->
    # Object children should be in the order of the schema.properties objects as much as possible
    return @getAddButtonEl() unless @schema.properties?[key]
    allProps = Object.keys(@schema.properties)
    afterKeys = allProps.slice(allProps.indexOf(key)+1)
    allChildren = @$el.find('> .treema-children > .treema-node')
    for child in allChildren
      if $(child).data('instance').keyForParent in afterKeys
        return $(child)
    return @getAddButtonEl()

  childPropertiesAvailable: ->
    return [] unless @schema.properties
    properties = []
    for property, childSchema of @schema.properties
      continue if @childrenTreemas[property]?
      properties.push(childSchema.title or property)
    properties.sort()

  onDeletePressed: (e) ->
    super(e)
    return unless @addingNewProperty()
    keyInput = $(e.target)
    return unless keyInput.hasClass('treema-new-prop')
    if not keyInput.val()
      @clearTemporaryErrors()
      keyInput.remove()
      e.preventDefault()
      
  onEscapePressed: (e) ->
    keyInput = $(e.target)
    return unless keyInput.hasClass('treema-new-prop')
    @clearTemporaryErrors()
    keyInput.remove()
    e.preventDefault()

  onTabPressed: (e) ->
    e.preventDefault()
    keyInput = $(e.target)
    return super(e) unless keyInput.hasClass('treema-new-prop')
    return keyInput.blur() if keyInput.val() # pass to onNewPropertyBlur
    targetTreema = @getNextEditableTreemaFromElement(keyInput, if e.shiftKey then -1 else 1)
    keyInput.remove()
    targetTreema.edit() if targetTreema
    


class AnyTreemaNode extends TreemaNode
  """
  Super flexible input, can handle inputs like:
    true      -> true
    'true     -> 'true'
    'true'    -> 'true'
    1.2       -> 1.2
    [         -> []
    {         -> {}
    [1,2,3]   -> [1,2,3]
    null      -> null
  """

  helper: null

  constructor: (splat...) ->
    super(splat...)
    @updateShadowMethods()

  setValueForEditing: (valEl) -> @setValueForEditingSimply(valEl, JSON.stringify(@data))
  saveChanges: (valEl) ->
    @data =$('input', valEl).val()
    if @data[0] is "'" and @data[@data.length-1] isnt "'"
      @data = @data[1..]
    else if @data[0] is '"' and @data[@data.length-1] isnt '"'
      @data = @data[1..]
    else if @data.trim() is '['
      @data = []
    else if @data.trim() is '{'
      @data = {}
    else
      try
        @data = JSON.parse(@data)
      catch e
        console.log('could not parse data', @data)
    @updateShadowMethods()
    @rebuild()

  updateShadowMethods: ->
    # This node takes on the behaviors of the other basic nodes.
    dataType = $.type(@data)
    NodeClass = TreemaNodeMap[dataType]
    @helper = new NodeClass(@schema, @data, @options, @parent)
    @helper.tv4 = @tv4
    for prop in ['collection', 'ordered', 'keyed', 'getChildSchema', 'getChildren', 'getChildSchema',
                 'setValueForReading']
      @[prop] = @helper[prop]

  rebuild: ->
    oldEl = @$el
    if @parent
      newNode = @parent.createChildNode(@)
    else
      newNode = @build()

    oldEl.replaceWith(newNode)

  onClick: (e) ->
    return if e.target.nodeName in ['INPUT', 'TEXTAREA']
    clickedValue = $(e.target).closest('.treema-value').length  # Clicks are in children of .treema-value nodes
    usedModKey = e.shiftKey or e.ctrlKey or e.metaKey
    return @toggleEdit() if clickedValue and not usedModKey
    super(e)

    

class DatabaseSearchNode extends TreemaNode
  valueClass: 'treema-search'
  searchValueTemplate: '<input placeholder="Search" /><div class="treema-search-results"></div>'
  url: null
  lastTerm: null

  setValueForReading: (valEl) ->
    @setValueForReadingSimply(valEl, if @data then @formatDocument(@data) else 'None')
    
  formatDocument: (doc) ->
    return doc if $.isString(doc)
    JSON.stringify(doc)
    
  setValueForEditing: (valEl) ->
    valEl.html(@searchValueTemplate)
    input = valEl.find('input')
    input.focus().keyup @search
    input.attr('placeholder', @formatDocument(@data)) if @data
  
  search: =>
    term = @getValEl().find('input').val()
    return if term is @lastTerm
    @getSearchResultsEl().empty() if @lastTerm and not term
    return unless term
    @lastTerm = term
    @getSearchResultsEl().empty().append('Searching')
    $.ajax(@url+'?term='+term, {dataType: 'json', success: @searchCallback})
    
  searchCallback: (results) =>
    container = @getSearchResultsEl().detach().empty()
    for result, i in results
      row = $('<div></div>').addClass('treema-search-result-row')
      row.addClass('treema-search-selected') if i is 0
      row.text(@formatDocument(result))
      row.data('value', result)
      container.append(row)
    if not results.length
      container.append($('<div>No results</div>'))
    @getValEl().append(container)
    
  getSearchResultsEl: -> @getValEl().find('.treema-search-results')
  getSelectedResultEl: -> @getValEl().find('.treema-search-selected')

  saveChanges: ->
    selected = @getSelectedResultEl()
    return unless selected.length
    @data = selected.data('value')
    
  onDownArrowPressed: -> @navigateSearch(1)
  onUpArrowPressed: -> @navigateSearch(-1)
    
  navigateSearch: (offset) ->
    selected = @getSelectedResultEl()
    func = if offset > 0 then 'next' else 'prev'
    next = selected[func]('.treema-search-result-row')
    return unless next.length
    selected.removeClass('treema-search-selected')
    next.addClass('treema-search-selected')
    
  onClick: (e) ->
    newSelection = $(e.target).closest('.treema-search-result-row')
    return super(e) unless newSelection.length
    @getSelectedResultEl().removeClass('treema-search-selected')
    newSelection.addClass('treema-search-selected')
    

# Source: http://coffeescriptcookbook.com/chapters/functions/debounce

debounce = (func, threshold, execAsap) ->
  timeout = null
  (args...) ->
    obj = this
    delayed = ->
      func.apply(obj, args) unless execAsap
      timeout = null
    if timeout
      clearTimeout(timeout)
    else if (execAsap)
      func.apply(obj, args)
    timeout = setTimeout delayed, threshold || 100

DatabaseSearchNode.prototype.search = debounce(DatabaseSearchNode.prototype.search, 200)
    
class RestaurantSearchNode extends DatabaseSearchNode
  url: '/db/fastfood'
  formatDocument: (doc) -> doc.name



TreemaNodeMap =
  'array': ArrayTreemaNode
  'string': StringTreemaNode
  'object': ObjectTreemaNode
  'number': NumberTreemaNode
  'null': NullTreemaNode
  'boolean': BooleanTreemaNode
  'any': AnyTreemaNode
  'point2d': Point2DTreemaNode
  'point3d': Point3DTreemaNode
  'restaurant': RestaurantSearchNode

makeTreema = (schema, data, options, parent) ->
  NodeClass = TreemaNodeMap[schema.format]
  unless NodeClass
    NodeClass = TreemaNodeMap[schema.type]
  unless NodeClass
    NodeClass = TreemaNodeMap['any']
    
  return new NodeClass(schema, data, options, parent)
