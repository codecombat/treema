class TreemaNode
  # Abstract node class

  # constructor defined
  schema: {}
  $el: null
  data: null
  options: null
  parent: null
  lastSelectedTreema: null # only root node uses this property.

  # properties related to filter
  treemaFilterHiddenClass: 'treema-filter-hidden'

  # templates
  nodeTemplate: '<div class="treema-row treema-clearfix"><div class="treema-value"></div></div>'
  childrenTemplate: '<div class="treema-children"></div>'
  addChildTemplate: '<div class="treema-add-child" tabindex="9009">+</div>'
  tempErrorTemplate: '<span class="treema-temp-error"></span>'
  toggleTemplate: '<span class="treema-toggle-hit-area"><span class="treema-toggle"></span></span>'
  keyTemplate: '<span class="treema-key"></span>'
  errorTemplate: '<div class="treema-error"></div>'
  newPropertyTemplate: '<input class="treema-new-prop" />'

  # behavior settings (overridden by subclasses)
  collection: false      # acts like an array or object
  ordered: false         # acts like an array
  keyed: false           # acts like an object
  editable: true         # can be changed
  directlyEditable: true # can be changed at this level directly
  skipTab: false         # is skipped over when tabbing between elements for editing
  valueClass: null
  removeOnEmptyDelete: true

  # dynamically managed properties
  keyForParent: null
  childrenTreemas: null
  justCreated: true
  removed: false
  workingSchema: null

  # Thin interface for tv4 ----------------------------------------------------
  isValid: ->
    errors = @getErrors()
    return errors.length is 0

  getErrors: ->
    return [] unless @tv4
    if @isRoot()
      return @cachedErrors if @cachedErrors
      @cachedErrors = @tv4.validateMultiple(@data, @schema)['errors']
      return @cachedErrors
    root = @getRoot()
    errors = root.getErrors()
    my_path = @getPath()
    errors = (e for e in errors when e.dataPath[..my_path.length] is my_path)
    e.dataPath = e.dataPath[..my_path.length] for e in errors

    if @workingSchema
      moreErrors = @tv4.validateMultiple(@data, @workingSchema).errors
      errors = errors.concat(moreErrors)

    errors

  setUpValidator: ->
    if not @parent
      @tv4 = window['tv4']?.freshApi()
      @tv4.addSchema('#', @schema)
      @tv4.addSchema(@schema.id, @schema) if @schema.id
    else
      root = @getRoot()
      @tv4 = root.tv4

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
  canAddChild: -> @collection and @editable and not @settings.readOnly
  canAddProperty: -> true
  addingNewProperty: -> false
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

  onEditInputBlur: (e) =>
    shouldRemove = @shouldTryToRemoveFromParent()
    closest = $(e.relatedTarget).closest('.treema-node')[0]
    shouldRemove = false if closest is @$el[0]
    @markAsChanged()
    @saveChanges(@getValEl())
    input = @getValEl().find('input, textarea, select')
    if @isValid() then @display() if @isEditing() else input.focus().select()
    if shouldRemove then @remove() else @flushChanges()
    @broadcastChanges()

  shouldTryToRemoveFromParent: ->
    return false # trying out disabling this feature,
    # because it's annoying trying to remove empty strings
    val = @getValEl()
    return if val.find('select').length
    inputs = val.find('input, textarea')
    for input in inputs
      input = $(input)
      return false if input.attr('type') is 'checkbox' or input.val()
    return true

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
      TreemaNode.changedTreemas.push(@)
      @broadcastChanges()

  # Initialization ------------------------------------------------------------
  @pluginName = "treema"
  defaults =
    schema: {}
    callbacks: {}

  constructor: (@$el, options, @parent) ->
    @$el = @$el or $('<div></div>')
    @settings = $.extend {}, defaults, options
    @schema = @settings.schema
    @schema.id = '__base__' unless (@schema.id or @parent)
    @data = options.data
    @patches = []
    @callbacks = @settings.callbacks
    @_defaults = defaults
    @_name = TreemaNode.pluginName
    @setUpValidator()
    @populateData()
    @previousState = @copyData()

  build: ->
    @$el.addClass('treema-node').addClass('treema-clearfix')
    @$el.empty().append($(@nodeTemplate))
    @$el.data('instance', @)
    @$el.addClass('treema-root') unless @parent
    @$el.attr('tabindex', 9001) unless @parent
    @justCreated = false unless @parent
    @$el.append($(@childrenTemplate)).addClass('treema-closed') if @collection
    valEl = @getValEl()
    valEl.addClass(@valueClass) if @valueClass
    valEl.addClass('treema-display') if @directlyEditable
    @buildValueForDisplay(valEl)
    @open() if @collection and not @parent
    @setUpGlobalEvents() unless @parent
    @setUpLocalEvents() if @parent
    @updateMyAddButton() if @collection
    @createTypeSelector()
    @createSchemaSelector() if @workingSchemas?.length > 1
    schema = @workingSchema or @schema
    @limitChoices(schema.enum) if schema.enum
    @$el

  populateData: ->
    return unless @data is undefined
    @data = @schema.default
    return unless @data is undefined
    @data = @getDefaultValue()

  setWorkingSchema: (@workingSchema, @workingSchemas) ->

  createSchemaSelector: ->
    div = $('<div></div>').addClass('treema-schema-select-container')
    select = $('<select></select>').addClass('treema-schema-select')
    button = $('<button></button>').addClass('treema-schema-select-button').text('...')
    for schema, i in @workingSchemas
      label = @makeWorkingSchemaLabel(schema)
      option = $('<option></option>').attr('value', i).text(label)
      option.attr('selected', true) if schema is @workingSchema
      select.append(option)
    div.append(button).append(select)
    select.change(@onSelectSchema)
    @$el.find('> .treema-row').prepend(div)

  makeWorkingSchemaLabel: (schema) ->
    return schema.title if schema.title?
    return schema.type if schema.type?
    return '???'

  getTypes: ->
    schema = @workingSchema or @schema
    types = schema.type or [ "string", "number", "integer", "boolean", "null", "array", "object" ]
    types = [types] unless $.isArray(types)
    types

  createTypeSelector: ->
    types = @getTypes()
    return unless types.length > 1
    schema = @workingSchema or @schema
    return if schema.enum
    div = $('<div></div>').addClass('treema-type-select-container')
    select = $('<select></select>').addClass('treema-type-select')
    button = $('<button></button>').addClass('treema-type-select-button')
    currentType = $.type(@data)
    currentType = 'integer' if @valueClass is 'treema-integer'
    for type in types
      option = $('<option></option>').attr('value', type).text(type)
      if type is currentType
        option.attr('selected', true)
        button.text(@typeToLetter(type))
      select.append(option)
    div.append(button).append(select)
    select.change(@onSelectType)
    @$el.find('> .treema-row').prepend(div)

  typeToLetter: (type) ->
    return {
      'boolean': 'B'
      'array': 'A'
      'object': 'O'
      'string': 'S'
      'number': 'F'
      'integer': 'I'
      'null': 'N'
    }[type]

  # Event handling ------------------------------------------------------------
  setUpGlobalEvents: ->
    @$el.unbind()
    @$el.dblclick (e) -> $(e.target).closest('.treema-node').data('instance')?.onDoubleClick(e)

    @$el.click (e) =>
      $(e.target).closest('.treema-node').data('instance')?.onClick(e)
      @broadcastChanges(e)

    @keysPreviouslyDown = {}
    @$el.keydown (e) =>
      e.heldDown = @keysPreviouslyDown[e.which] or false
      closest = $(e.target).closest('.treema-node').data('instance')
      lastSelected = @getLastSelectedTreema()
      (lastSelected or closest)?.onKeyDown(e)
      @broadcastChanges(e)
      @keysPreviouslyDown[e.which] = true
      @manageCopyAndPaste e if e.ctrlKey or e.metaKey

    @$el.keyup (e) =>
      delete @keysPreviouslyDown[e.which]

  manageCopyAndPaste: (e) ->
    # http://stackoverflow.com/questions/17527870/how-does-trello-access-the-users-clipboard
    #if user is using text field
    el = document.activeElement
    return if (el? and (el.tagName.toLowerCase() == 'input' and el.type == 'text') or el.tagName.toLowerCase() == 'textarea')

    target = @getLastSelectedTreema() ? @  # You can get the parent treema by somehow giving it focus but without selecting it; hacky
    if e.which is 86 and $(e.target).hasClass 'treema-clipboard'
      # Ctrl+V -- we might want the paste data
      if e.shiftKey and $(e.target).hasClass 'treema-clipboard'
        [x, y] = [window.scrollX, window.scrollY]
        setTimeout (=>
          @keepFocus x, y
          return unless newData = @$clipboard.val()
          try
            newData = JSON.parse newData
          catch e
            return
          result = target.tv4.validateMultiple(newData, target.schema)
          if result.valid
            target.set('/', newData)
          else
            console.log "not pasting", newData, "because it's not valid:", result
        ), 10  # This doesn't always preserve scroll; TODO
      else
        # We don't want the paste data to our clipboard textarea, so let's not even let it happen so we don't scroll
        e.preventDefault()
    else if e.shiftKey
      # Get ready for a possible Shift+Ctrl+V paste (hacky, I know)
      @$clipboardContainer.find('.treema-clipboard').focus().select()
    else unless window.getSelection()?.toString() or document.selection?.createRange().text
      # Get ready for a possible Ctrl+C copy
      setTimeout (=>
        @$clipboardContainer ?= $('<div class="treema-clipboard-container"></div>').appendTo(@$el)
        @$clipboardContainer.empty().show()
        @$clipboard = $('<textarea class="treema-clipboard"></textarea>').val(JSON.stringify(target.data)).appendTo(@$clipboardContainer).focus().select()
      ), 0

  broadcastChanges: (e) ->
    if @callbacks.select and TreemaNode.didSelect
      TreemaNode.didSelect = false
      @callbacks.select(e, @getSelectedTreemas())
    if TreemaNode.changedTreemas.length
      changes = (t for t in TreemaNode.changedTreemas when not t.removed)
      @callbacks.change?(e, jQuery.unique(changes))
      TreemaNode.changedTreemas = []

  markAsChanged: ->
    TreemaNode.changedTreemas.push(@)

  setUpLocalEvents: ->
    row = @$el.find('> .treema-row')
    row.mouseenter @onMouseEnter if @callbacks.mouseenter?
    row.mouseleave @onMouseLeave if @callbacks.mouseleave?

  onMouseEnter: (e) => @callbacks.mouseenter(e, @)
  onMouseLeave: (e) => @callbacks.mouseleave(e, @)

  onClick: (e) ->
    return if e.target.nodeName in ['INPUT', 'TEXTAREA']
    clickedValue = $(e.target).closest('.treema-value').length  # Clicks are in children of .treema-value nodes
    clickedToggle = $(e.target).hasClass('treema-toggle') or $(e.target).hasClass('treema-toggle-hit-area')
    usedModKey = e.shiftKey or e.ctrlKey or e.metaKey
    @keepFocus() unless clickedValue and not @collection
    return @toggleEdit() if @isDisplaying() and clickedValue and @canEdit() and not usedModKey
    if not usedModKey and (clickedToggle or (clickedValue and @collection))
      if not clickedToggle
        @deselectAll()
        @select()
      return @toggleOpen()
    return @addNewChild() if $(e.target).closest('.treema-add-child').length and @collection
    return if @isRoot() or @isEditing()
    return @shiftSelect() if e.shiftKey
    return @toggleSelect() if e.ctrlKey or e.metaKey
    return @select()

  onDoubleClick: (e) ->
    return @callbacks.dblclick?(e, @) unless @collection
    clickedKey = $(e.target).hasClass('treema-key')
    return @callbacks.dblclick?(e, @) unless clickedKey
    @open() if @isClosed()
    @addNewChild()
    @callbacks.dblclick?(e, @)

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
    @onDeletePressed(e) if e.which in [8, 46] and not e.heldDown

  # Default keyboard behaviors ------------------------------------------------

  onLeftArrowPressed: (e) ->
    return if @inputFocused()
    @navigateOut()
    e.preventDefault()

  onRightArrowPressed: (e) ->
    return if @inputFocused()
    @navigateIn()
    e.preventDefault()

  onUpArrowPressed: (e) ->
    return if @inputFocused()
    @navigateSelection(-1)
    e.preventDefault()

  onDownArrowPressed: (e) ->
    return if @inputFocused()
    @navigateSelection(1)
    e.preventDefault()

  inputFocused: ->
    return true if document.activeElement.nodeName in ['INPUT', 'TEXTAREA', 'SELECT']

  onSpacePressed: ->
  onTPressed: ->
  onFPressed: ->

  onDeletePressed: (e) ->
    editing = @editingIsHappening()
    if editing and not $(e.target).val() and @removeOnEmptyDelete
      @display()
      @select()
      @removeSelectedNodes()
      e.preventDefault()
    return if editing
    e.preventDefault()
    @removeSelectedNodes()

  onEscapePressed: ->
    return unless @isEditing()
    return @remove() if @justCreated
    @display() if @isEditing()
    @select() unless @isRoot()
    @keepFocus()

  onEnterPressed: (e) ->
    offset = if e.shiftKey then -1 else 1
    return @addNewChild() if offset is 1 and $(e.target).hasClass('treema-add-child')
    @traverseWhileEditing(offset, true)

  onTabPressed: (e) ->
    offset = if e.shiftKey then -1 else 1
    return if @hasMoreInputs(offset)
    e.preventDefault()
    @traverseWhileEditing(offset, false)

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

  onNPressed: (e) ->
    return if @editingIsHappening()
    selected = @getLastSelectedTreema()
    target = if selected?.collection then selected else selected?.parent
    return unless target
    success = target.addNewChild()
    @deselectAll() if success
    e.preventDefault()

  # Tree traversing/navigation ------------------------------------------------
  # (traversing means editing and adding fields, pressing enter and tab)
  # (navigation means selecting fields, pressing arrow keys)

  traverseWhileEditing: (offset, aggressive) ->
    shouldRemove = false
    selected = @getLastSelectedTreema()
    editing = @isEditing()
    return selected.edit() if not editing and selected?.canEdit()

    if editing
      shouldRemove = @shouldTryToRemoveFromParent()
      @saveChanges(@getValEl())
      @flushChanges() unless shouldRemove
      unless aggressive or @isValid()
        @refreshErrors() # make sure workingSchema's errors come through
        return
      if shouldRemove and $(@$el[0].nextSibling)?.hasClass('treema-add-child') and offset is 1
        offset = 2
      @endExistingEdits()
      @select()

    ctx = @traversalContext(offset)
    return @getRoot().addChild() unless ctx
    if not ctx.origin
      targetEl = if offset > 0 then ctx.first else ctx.last
      @selectOrActivateElement(targetEl)

    selected = $(ctx.origin).data('instance')
    if offset > 0 and aggressive and selected.collection and selected.isClosed()
      return selected.open()

    targetEl = if offset > 0 then ctx.next else ctx.prev
    if not targetEl
      targetEl = if offset > 0 then ctx.first else ctx.last
    @selectOrActivateElement(targetEl)
    if shouldRemove then @remove() else @refreshErrors()

  selectOrActivateElement: (el) ->
    el = $(el)
    treema = el.data('instance')
    if treema
      return if treema.canEdit() then treema.edit() else treema.select()

    # otherwise it must be an 'add' element
    @deselectAll()
    el.focus()

  navigateSelection: (offset) ->
    ctx = @navigationContext()
    return unless ctx
    if not ctx.origin
      targetTreema = if offset > 0 then ctx.first else ctx.last
      return targetTreema.select()
    targetTreema = if offset > 0 then ctx.next else ctx.prev
    if not targetTreema
      targetTreema = if offset > 0 then ctx.first else ctx.last
    targetTreema?.select()

  navigateOut: ->
    selected = @getLastSelectedTreema()
    return if not selected
    return selected.close() if selected.isOpen()
    return if (not selected.parent) or selected.parent.isRoot()
    selected.parent.select()

  navigateIn: ->
    for treema in @getSelectedTreemas()
      continue unless treema.collection
      treema.open() if treema.isClosed()

  traversalContext: (offset) ->
    list = @getNavigableElements(offset)
    origin = @getLastSelectedTreema()?.$el[0]
    origin = @getRootEl().find('.treema-add-child:focus')[0] if not origin
    origin = @getRootEl().find('.treema-new-prop')[0] if not origin
    @wrapContext(list, origin, offset)

  navigationContext: ->
    list = @getFilterVisibleTreemas()
    origin = @getLastSelectedTreema()
    @wrapContext(list, origin)

  wrapContext: (list, origin, offset=1) ->
    return unless list.length
    c =
      first: list[0]
      last: list[list.length-1]
      origin: origin
    if origin
      offset = Math.abs(offset)
      originIndex = list.indexOf(origin)
      c.next = list[originIndex+offset]
      c.prev = list[originIndex-offset]
    return c

  # Undo/redo -----------------------------------------------------------------

  # TODO: implement undo/redo, including saving and restoring which nodes are open

#  patches: []
#  patchIndex: 0
#  previousState: null
#
#  saveState: ->
#    @patches = @patches.slice(@patchIndex)
#    @patchIndex = 0
#    @patches.splice(0, 0, jsondiffpatch.diff(@previousState, @data))
#    @previousState = @copyData()
#    @patches = @patches[..10]
#
#  undo: ->
#    return unless @patches[@patchIndex]
#    jsondiffpatch.unpatch(@previousState, @patches[@patchIndex])


  # Editing values ------------------------------------------------------------
  canEdit: ->
    return false if @schema.readOnly or @parent?.schema.readOnly
    return false if @settings.readOnly
    return false if not @editable
    return false if not @directlyEditable
    return false if @collection and @isOpen()
    return true

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
      @markAsChanged()

  flushChanges: ->
    @parent.integrateChildTreema(@) if @parent and @justCreated
    @getRoot().cachedErrors = null
    @justCreated = false
    @markAsChanged()
    return @refreshErrors() unless @parent
    @parent.data[@keyForParent] = @data
    @parent.refreshErrors()
    parent = @parent
    while parent
#      unless parent.valueClass in ['treema-array', 'treema-object']
      parent.buildValueForDisplay(parent.getValEl().empty())
      parent = parent.parent

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
      @$el.prepend(tempError)
      return false

    readOnly = @schema.readOnly or @parent?.schema.readOnly
    if readOnly
      tempError = @createTemporaryError('read only')
      @$el.prepend(tempError)
      return false

    root = @getRootEl()
    @$el.remove()
    @removed = true
    @keepFocus() if document.activeElement is $('body')[0]
    return true unless @parent?
    delete @parent.childrenTreemas[@keyForParent]
    delete @parent.data[@keyForParent]
    @parent.orderDataFromUI() if @parent.ordered
    @parent.refreshErrors()
    @parent.updateMyAddButton()
    @parent.markAsChanged()
    @parent.buildValueForDisplay(@parent.getValEl().empty())
    @broadcastChanges()
    return true

  # Opening/closing collections -----------------------------------------------
  toggleOpen: ->
    if @isClosed() then @open() else @close()
    @

  open: (depth=1) ->
    if @isClosed()
      childrenContainer = @$el.find('.treema-children').detach()
      childrenContainer.empty()
      @childrenTreemas = {}
      for [key, value, schema] in @getChildren()
        continue if schema.format is 'hidden'
        treema = TreemaNode.make(null, {schema: schema, data:value}, @, key)
        @integrateChildTreema(treema)
        childNode = @createChildNode(treema)
        childrenContainer.append(childNode)
      @$el.append(childrenContainer).removeClass('treema-closed').addClass('treema-open')
      childrenContainer.append($(@addChildTemplate))
      # this tends to break ACE editors within
      if @ordered and childrenContainer.sortable and not @settings.noSortable
        childrenContainer.sortable?(deactivate: @orderDataFromUI)
      @refreshErrors()
    depth -= 1
    if depth
      child.open(depth) for childIndex, child of @childrenTreemas ? {}

  orderDataFromUI: =>
    children = @$el.find('> .treema-children > .treema-node')
    index = 0
    @childrenTreemas = {}  # rebuild it
    @data = if $.isArray(@data) then [] else {}
    for child in children
      treema = $(child).data('instance')
      continue unless treema
      treema.keyForParent = index
      @childrenTreemas[index] = treema
      @data[index] = treema.data
      index += 1
    @flushChanges()

  close: (saveChildData=true) ->
    return unless @isOpen()
    if saveChildData
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
    @keepFocus()
    TreemaNode.didSelect = true

  deselectAll: (excludeSelf=false) ->
    for treema in @getSelectedTreemas()
      continue if excludeSelf and treema is @
      treema.$el.removeClass('treema-selected')
    @clearLastSelected()
    TreemaNode.didSelect = true

  toggleSelect: ->
    @clearLastSelected()
    @$el.toggleClass('treema-selected') unless @isRoot()
    @setLastSelectedTreema(@) if @isSelected()
    TreemaNode.didSelect = true

  clearLastSelected: ->
    @getLastSelectedTreema()?.$el.removeClass('treema-last-selected')
    @setLastSelectedTreema(null)

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
    TreemaNode.didSelect = true

  # Working schemas -----------------------------------------------------------

  # Schemas can be flexible using combinatorial properties and references.
  # But it simplifies logic if schema props like $ref, allOf, anyOf, and oneOf
  # are flattened into a list of more straightforward user choices.
  # These simplifications are called working schemas.

  buildWorkingSchemas: (originalSchema) ->
    baseSchema = @resolveReference($.extend(true, {}, originalSchema or {}))
    allOf = baseSchema.allOf
    anyOf = baseSchema.anyOf
    oneOf = baseSchema.oneOf
    delete baseSchema.allOf if baseSchema.allOf?
    delete baseSchema.anyOf if baseSchema.anyOf?
    delete baseSchema.oneOf if baseSchema.oneOf?

    if allOf?
      for schema in allOf
        $.extend(null, baseSchema, @resolveReference(schema))

    workingSchemas = []
    singularSchemas = []
    singularSchemas = singularSchemas.concat(anyOf) if anyOf?
    singularSchemas = singularSchemas.concat(oneOf) if oneOf?

    for singularSchema in singularSchemas
      singularSchema = @resolveReference(singularSchema)
      s = $.extend(true, {}, baseSchema)
      s = $.extend(true, s, singularSchema)
      workingSchemas.push(s)
    workingSchemas = [baseSchema] if workingSchemas.length is 0
    workingSchemas

  resolveReference: (schema, scrubTitle=false) ->
    return schema unless schema.$ref?
    resolved = @tv4.getSchema(schema.$ref)
    unless resolved
      console.warn('could not resolve reference', schema.$ref, tv4.getMissingUris())
    resolved ?= {}
    delete resolved.title if scrubTitle and resolved.title?
    resolved

  chooseWorkingSchema: (workingSchemas, data) ->
    return workingSchemas[0] if workingSchemas.length is 1
    root = @getRoot()
    for schema in workingSchemas
      result = tv4.validateMultiple(data, schema, false, root.schema)
      return schema if result.valid
    return workingSchemas[0]

  onSelectSchema: (e) =>
    index = parseInt($(e.target).val())
    workingSchema = @workingSchemas[index]
    defaultType = "null"
    defaultType = $.type(workingSchema.default) if workingSchema.default?
    defaultType = workingSchema.type if workingSchema.type?
    defaultType = defaultType[0] if $.isArray(defaultType)
    NodeClass = TreemaNode.getNodeClassForSchema(workingSchema, defaultType, @settings.nodeClasses)
    @workingSchema = workingSchema
    @replaceNode(NodeClass)

  onSelectType: (e) =>
    newType = $(e.target).val()
    NodeClass = TreemaNode.getNodeClassForSchema(@workingSchema, newType, @settings.nodeClasses)
    @replaceNode(NodeClass)

  replaceNode: (NodeClass) ->
    settings = $.extend(true, {}, @settings)
    oldData = @data
    delete settings.data if settings.data
    newNode = new NodeClass(null, settings, @parent)
    newNode.data = newNode.getDefaultValue()
    newNode.data = @workingSchema.default if @workingSchema.default?
    if $.type(oldData) is 'string' and $.type(newNode.data) is 'number'
      newNode.data = parseFloat(oldData) or 0
    if $.type(oldData) is 'number' and $.type(newNode.data) is 'string'
      newNode.data = oldData.toString()
    if $.type(oldData) is 'number' and $.type(newNode.data) is 'number'
      newNode.data = oldData
      if newNode.valueClass is 'treema-integer'
        newNode.data = parseInt(newNode.data)
    newNode.tv4 = @tv4
    newNode.keyForParent = @keyForParent if @keyForParent?
    newNode.setWorkingSchema(@workingSchema, @workingSchemas)
    @parent.createChildNode(newNode)
    @$el.replaceWith(newNode.$el)
    newNode.flushChanges() # should integrate


  # Child node utilities ------------------------------------------------------
  integrateChildTreema: (treema) ->
    treema.justCreated = false # no longer in limbo
    @childrenTreemas[treema.keyForParent] = treema
    treema.populateData()
    @data[treema.keyForParent] = treema.data
    treema

  createChildNode: (treema) ->
    childNode = treema.build()
    row = childNode.find('.treema-row')
    if @collection and @keyed
      name = treema.schema.title or treema.keyForParent
      required = @schema.required or []
      suffix = ': '
      suffix = '*'+suffix if treema.keyForParent in required
      keyEl = $(@keyTemplate).text(name + suffix)
      row.prepend(keyEl)
      defnEl = $('<span></span>').addClass('treema-description').text(treema.schema.description or '')
      row.append(defnEl)
    childNode.prepend($(@toggleTemplate)) if treema.collection
    childNode

  # Validation errors ---------------------------------------------------------
  refreshErrors: ->
    @clearErrors()
    @showErrors()

  showErrors: ->
    return if @justCreated
    errors = @getErrors()
    erroredTreemas = []
    for error in errors
      path = error.dataPath[1..]
      path = if path then path.split('/') else []
      deepestTreema = @
      for subpath in path
        unless deepestTreema.childrenTreemas
          error.forChild = true
          break
        subpath = parseInt(subpath) if deepestTreema.ordered
        deepestTreema = deepestTreema.childrenTreemas[subpath]
        unless deepestTreema
          console.error('could not find treema down path', path, @, "so couldn't show error", error)
          return
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

  # Getting/setting data ------------------------------------------------------
  # The four functions have similar structures:

  #   1. normalize path
  #   2. perform action if treema is the end of the line
  #   3. dig deeper if there are deeper treemas
  #   4. perform action if treema path is over but need to dig deeper into data

  # Could refactor this into a template method pattern.

  get: (path='/') ->
    path = @normalizePath(path)
    return @data if path.length is 0
    return @digDeeper(path, 'get', undefined, []) if @childrenTreemas?

    data = @data
    for seg in path
      data = data[@normalizeKey(seg, data)]
      break if data is undefined
    return data

  set: (path, newData) ->
    path = @normalizePath(path)

    if path.length is 0
      @data = newData
      @refreshDisplay()
      return true

    if @childrenTreemas?
      result = @digDeeper(path, 'set', false, [newData])
      if result is false and path.length is 1 and $.isPlainObject(@data)
        # handles inserting values into objects
        @data[path[0]] = newData
        return true
      return result

    data = @data
    for seg, i in path
      seg = @normalizeKey(seg, data)
      if path.length is i+1
        data[seg] = newData
        @refreshDisplay()
        return true
      else
        data = data[seg]
        return false if data is undefined

  delete: (path) ->
    path = @normalizePath(path)
    return @remove() if path.length is 0
    return @digDeeper(path, 'delete', false, []) if @childrenTreemas?

    data = @data
    for seg, i in path
      seg = @normalizeKey(seg, data)
      if path.length is i+1
        if $.isArray(data) then data.splice(seg, 1) else delete data[seg]
        @refreshDisplay()
        return true
      else
        data = data[seg]
        return false if data is undefined

  insert: (path, newData) ->
    # inserts objects at the end of arrays, path is to the array
    # for adding properties to object, use set
    path = @normalizePath(path)
    if path.length is 0
      return false unless $.isArray(@data)
      @data.push(newData)
      @refreshDisplay()
      @flushChanges()
      return true

    return @digDeeper(path, 'insert', false, [newData]) if @childrenTreemas?

    data = @data
    for seg, i in path
      seg = @normalizeKey(seg, data)
      data = data[seg]
      return false if data is undefined

    return false unless $.isArray(data)
    data.push(newData)
    @refreshDisplay()
    return true


  normalizeKey: (key, collection) ->
    if $.isArray(collection)
      if '=' in key
        parts = key.split('=')
        for value, i in collection
          if value[parts[0]] is parts[1]
            return i
      else
        return parseInt(key)
    return key

  normalizePath: (path) ->
    if $.type(path) is 'string'
      path = path.split('/')
      path = (s for s in path when s.length)
    path

  digDeeper: (path, func, def, args) ->
    seg = @normalizeKey(path[0], @data)
    childTreema = @childrenTreemas[seg]
    return def if childTreema is undefined
    return childTreema[func](path[1..], args...)

  refreshDisplay: ->
    if @isDisplaying()
      valEl = @getValEl()
      valEl.empty()
      @buildValueForDisplay(valEl)

    else
      @display()

    if @collection and @isOpen()
      @close(false)
      @open()

    @flushChanges()
    @broadcastChanges()

  # Utilities -----------------------------------------------------------------

  getNodeEl: -> @$el
  getValEl: -> @$el.find('> .treema-row .treema-value')
  getRootEl: -> @$el.closest('.treema-root')
  getRoot: ->
    node = @
    node = node.parent while node.parent?
    node
  getInputs: -> @getValEl().find('input, textarea')
  getSelectedTreemas: -> ($(el).data('instance') for el in @getRootEl().find('.treema-selected'))
  getLastSelectedTreema: -> 
    @getRoot().lastSelectedTreema

  setLastSelectedTreema: (node) -> 
    @getRoot().lastSelectedTreema = node
    node?.$el.addClass('treema-last-selected')

  getAddButtonEl: -> @$el.find('> .treema-children > .treema-add-child')
  getVisibleTreemas: -> ($(el).data('instance') for el in @getRootEl().find('.treema-node'))
  getNavigableElements: ->
    @getRootEl().find('.treema-node, .treema-add-child:visible').toArray()
  getPath: ->
    pathPieces = []
    pointer = @
    while pointer and pointer.keyForParent?
      pathPieces.push(pointer.keyForParent+'')
      pointer = pointer.parent
    pathPieces.reverse()
    return '/' + pathPieces.join('/')
  getData: -> @data

  isRoot: -> not @parent
  isEditing: -> @getValEl().hasClass('treema-edit')
  isDisplaying: -> @getValEl().hasClass('treema-display')
  isOpen: -> @$el.hasClass('treema-open')
  isClosed: -> @$el.hasClass('treema-closed')
  isSelected: -> @$el.hasClass('treema-selected')
  wasSelectedLast: -> @$el.hasClass('treema-last-selected')
  editingIsHappening: -> @getRootEl().find('.treema-edit').length
  rootSelected: -> $(document.activeElement).hasClass('treema-root')

  # to avoid naming conflict with "visible", "displaying". Visibility related to filter is denoted to "filterVisible"
  setFilterVisible: (isFilterVisible)->    
    if isFilterVisible 
      @$el.find('.treema-node').andSelf().removeClass(@treemaFilterHiddenClass) 
    else 
      @$el.find('.treema-node').andSelf().addClass(@treemaFilterHiddenClass)

  getFilterVisibleTreemas: -> 
    ($(el).data('instance') for el in @getRootEl().find('.treema-node').not('.' + @treemaFilterHiddenClass))
  isFilterVisible: -> !@$el.hasClass(@treemaFilterHiddenClass)

  keepFocus: (x, y) ->
    # We want to keep Treema receiving events, so we focus on the root, but we preserve scroll position to do it invisibly.
    [x, y] = [window.scrollX, window.scrollY] unless x? and y?
    @getRootEl().focus()
    window.scrollTo x, y
  copyData: -> $.extend(null, {}, {'d': @data})['d']
  updateMyAddButton: ->
    @$el.removeClass('treema-full')
    @$el.addClass('treema-full') unless @canAddChild()

  @nodeMap: {}

  @setNodeSubclass: (key, NodeClass) -> @nodeMap[key] = NodeClass

  @getNodeClassForSchema: (schema, def='string', localClasses=null) ->
    NodeClass = null
    localClasses = localClasses or {}
    NodeClass = localClasses[schema.format] or @nodeMap[schema.format] if schema.format
    return NodeClass if NodeClass
    type = schema.type or def
    type = def if $.isArray(type)
    NodeClass = localClasses[type] or @nodeMap[type]
    return NodeClass if NodeClass
    @nodeMap['any']

  @make: (element, options, parent, keyForParent) ->
    # this is a mess, make a factory which is able to deal with working schemas
    # and setting defaults.
    if options.data is undefined and options.schema.default?
      d = options.schema.default
      options.data = $.extend(true, {}, {'x':d})['x']

    workingSchemas = []
    workingSchema = null
    type = null
    type = $.type(options.schema.default) unless options.schema.default is undefined
    type = $.type(options.data) if options.data?
    type = 'integer' if type == 'number' and options.data % 1
    unless type?
      schemaTypes = options.schema.type
      schemaTypes = schemaTypes[0] if $.isArray(schemaTypes)
      schemaTypes = 'string' unless schemaTypes?
      type = schemaTypes
    localClasses = if parent then parent.settings.nodeClasses else options.nodeClasses
    if parent
      workingSchemas = parent.buildWorkingSchemas(options.schema)
      data = options.data
      data = options.schema.default if data is undefined
      workingSchema = parent.chooseWorkingSchema(workingSchemas, data)
      NodeClass = @getNodeClassForSchema(workingSchema, type, localClasses)
    else
      NodeClass = @getNodeClassForSchema(options.schema, type, localClasses)

    if options.data is undefined
      type = options.schema.type
      type ?= workingSchema?.type
      type ?= 'string'
      type = type[0] if $.isArray(type)
      options.data = {
        'string':'',
        'number':0,
        'null': null,
        'object': {},
        'integer': 0,
        'boolean': false,
        'array':[]
      }[type]

    combinedOps = {}
    $.extend(combinedOps, parent.settings) if parent
    $.extend(combinedOps, options)

    newNode = new NodeClass(element, combinedOps, parent)
    newNode.tv4 = parent.tv4 if parent?
    newNode.keyForParent = keyForParent if keyForParent?
    if parent
      newNode.setWorkingSchema(workingSchema, workingSchemas)
    newNode

  @extend: (child) ->
    # https://github.com/jashkenas/coffee-script/issues/2385
    ctor = ->
    ctor:: = @::
    child:: = new ctor()
    child::constructor = child
    child.__super__ = @::

    # provides easy access to the given method on super (must use call or apply)
    child::super = (method) -> @constructor.__super__[method]
    child

  @didSelect = false
  @changedTreemas = []

  filterChildren: (filter)->
    for keyForParent, treemaNode of @childrenTreemas
      treemaNode.setFilterVisible(!filter || filter(treemaNode, keyForParent))

  clearFilter: ->
    for keyForParent, treemaNode of @childrenTreemas
      treemaNode.setFilterVisible true
