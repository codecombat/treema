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
  integrated: false
  workingSchema: null

  # Node name to be used in undo-redo descriptions
  nodeDescription: 'Node'
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
    for e in errors
      if e.dataPath is my_path
        e.subDataPath = ''
      else
        e.subDataPath = e.dataPath[..my_path.length]

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
  saveChanges: (oldData) ->
    return if oldData is @data
    @addTrackedAction {'oldData':oldData, 'newData':@data, 'path':@getPath(), 'action':'edit'}
  getChildSchema: (key) -> TreemaNode.utils.getChildSchema(key, @workingSchema)
  buildValueForDisplay: -> console.error('"buildValueForDisplay" has not been overridden.')
  buildValueForEditing: ->
    return unless @editable and @directlyEditable
    console.error('"buildValueForEditing" has not been overridden.')

  # collection specific
  getChildren: -> console.error('"getChildren" has not been overridden.') # should return a list of key-value-schema tuples
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
    val = @getValEl()
    return if val.find('select').length
    inputs = val.find('input, textarea')
    for input in inputs
      input = $(input)
      return false if input.attr('type') is 'checkbox' or input.val()
    return false unless @getErrors().length
    return true

  limitChoices: (options) ->
    @enum = options
    @buildValueForEditing = (valEl, data) =>
      input = $('<select></select>')
      input.append($('<option></option>').text(option)) for option in @enum
      index = @enum.indexOf(data)
      input.prop('selectedIndex', index) if index >= 0
      valEl.append(input)
      input.focus()
      input.blur @onEditInputBlur
      input

    @saveChanges = (valEl) =>
      index = valEl.find('select').prop('selectedIndex')
      @addTrackedAction {'oldData':@data, 'newData':@enum[index], 'path':@getPath(), 'action':'edit'}
      @data = @enum[index]
      TreemaNode.changedTreemas.push(@)
      @broadcastChanges()

  # Initialization ------------------------------------------------------------
  @pluginName = "treema"
  defaults =
    schema: {}
    callbacks: {}

  constructor: (@$el, options, @parent) ->
    @setWorkingSchema(options.workingSchema, options.workingSchemas)
    delete options.workingSchema
    delete options.workingSchemas
    @$el = @$el or $('<div></div>')
    @settings = $.extend {}, defaults, options
    @schema = $.extend {}, @settings.schema
    @data = options.data
    @defaultData = options.defaultData
    @keyForParent = options.keyForParent
    @patches = []
    @trackedActions = []
    @currentStateIndex = 0
    @trackingDisabled = false
    @callbacks = @settings.callbacks
    @_defaults = defaults
    @_name = TreemaNode.pluginName
    @setUpValidator()
    @populateData()
    @previousState = @copyData()
    @unloadNodeSpecificSettings()

  unloadNodeSpecificSettings: ->
    # moves node-specific data from the options dict to the node itself, removing them from the options.
    for key in ['data', 'defaultData', 'schema', 'type']
      @[key] = @settings[key] if @settings[key]?
      delete @settings[key]

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
    @buildValueForDisplay(valEl, @getData())
    @open() if @collection and not @parent
    @setUpGlobalEvents() unless @parent
    @setUpLocalEvents() if @parent
    @updateMyAddButton() if @collection
    @createTypeSelector()
    @createSchemaSelector() if @workingSchemas?.length > 1
    schema = @workingSchema or @schema
    @limitChoices(schema.enum) if schema.enum
    @updateDefaultClass()
    @$el

  populateData: ->

  setWorkingSchema: (@workingSchema, @workingSchemas) ->

  createSchemaSelector: ->
    select = $('<select></select>').addClass('treema-schema-select')
    for schema, i in @workingSchemas
      label = @makeWorkingSchemaLabel(schema)
      option = $('<option></option>').attr('value', i).text(label)
      option.attr('selected', true) if schema is @workingSchema
      select.append(option)
    select.change(@onSelectSchema)
    @$el.find('> .treema-row').prepend(select)

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
    select = $('<select></select>').addClass('treema-type-select')
    currentType = $.type(@getData())
    currentType = 'integer' if @valueClass is 'treema-integer'
    for type in types
      option = $('<option></option>').attr('value', type).text(@getTypeName(type))
      option.attr('selected', true) if type is currentType
      select.append(option)
    select.change(@onSelectType)
    @$el.find('> .treema-row').prepend(select)

  getTypeName: (type) ->
    {
      null: 'null',
      array: 'arr',
      number: 'num',
      string: 'str',
      integer: 'int',
      boolean: 'bool',
      object: 'obj'
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
      if e.which in [17, 91] # ctrl, meta
        @targetOfCopyPaste?.removeClass('treema-target-of-copy-paste')
        @targetOfCopyPaste = null
      delete @keysPreviouslyDown[e.which]

  manageCopyAndPaste: (e) ->
    # http://stackoverflow.com/questions/17527870/how-does-trello-access-the-users-clipboard
    #if user is using text field
    el = document.activeElement
    return if (el? and (el.tagName.toLowerCase() is 'input' and el.type is 'text') or (el.tagName.toLowerCase() is 'textarea' and not $(el).hasClass('treema-clipboard')))

    target = @getLastSelectedTreema() ? @  # You can get the parent treema by somehow giving it focus but without selecting it; hacky
    if e.which is 86 and $(e.target).hasClass 'treema-clipboard'
      # Ctrl+V -- we might want the paste data
      if e.shiftKey and $(e.target).hasClass 'treema-clipboard'
        @saveScrolls()
        setTimeout (=> # must happen after data has actually been pasted in, so defer with a timeout
          @loadScrolls()
          return unless newData = @$clipboard.val()
          try
            newData = JSON.parse newData
          catch e
            @$el.trigger {
              type: 'treema-error'
              message: 'Could not parse pasted data as JSON.'
            }
            return
          result = target.tv4.validateMultiple(newData, target.schema)
          if result.valid
            target.set('/', newData)
            @$el.trigger 'treema-paste'
          else
            @$el.trigger {
              type: 'treema-error'
              message: 'Data provided is invalid according to schema.'
            }
            console.log "not pasting", newData, "because it's not valid:", result
        ), 5
      else
        # We don't want the paste data to our clipboard textarea, so let's not even let it happen so we don't scroll
        e.preventDefault()
    else if e.shiftKey
      # Get ready for a possible Shift+Ctrl+V paste (hacky, I know)
      return unless @$clipboardContainer
      @saveScrolls()
      @$clipboardContainer.find('.treema-clipboard').focus().select()
      @loadScrolls()
    else
      # Get ready for a possible Ctrl+C copy
      @saveScrolls()
      if not @$clipboardContainer
        @$clipboardContainer = $('<div class="treema-clipboard-container"></div>').appendTo(@$el)
        @$clipboardContainer.on 'paste', =>
          @targetOfCopyPaste?.removeClass('treema-target-of-copy-paste')
        @$clipboardContainer.on 'copy', =>
          @$el.trigger 'treema-copy'
          @targetOfCopyPaste?.removeClass('treema-target-of-copy-paste')
      @targetOfCopyPaste = target.$el
      @targetOfCopyPaste.addClass('treema-target-of-copy-paste')
      @$clipboardContainer.empty().show()
      @$clipboard = $('<textarea class="treema-clipboard"></textarea>').val(JSON.stringify(target.data, null, '  ')).appendTo(@$clipboardContainer).focus().select()
      @loadScrolls()

  broadcastChanges: (e) ->
    return if @getRoot().hush
    if @callbacks.select and TreemaNode.didSelect
      TreemaNode.didSelect = false
      @callbacks.select(e, @getSelectedTreemas())
    if TreemaNode.changedTreemas.length
      changes = (t for t in TreemaNode.changedTreemas when t.integrated or not t.parent)
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
    return if e.target.nodeName in ['INPUT', 'TEXTAREA', 'SELECT']
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
    @onZPressed(e) if e.which is 90
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
    return true if document.activeElement.nodeName in ['INPUT', 'TEXTAREA', 'SELECT'] and not $(document.activeElement).hasClass('treema-clipboard')

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
    return @remove() if @parent and (not @integrated) and @defaultData is undefined
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

  onZPressed: (e) ->
    if e.ctrlKey or e.metaKey
      if e.shiftKey
        @getRoot().redo()
      else
        @getRoot().undo()

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
    return unless ctx?.origin
    selected = $(ctx.origin).data('instance')
    # Super defensive, this happens when an outside force removes this treema in a callback
    # Need to have Treema send out events only after everything else is done.
    if offset > 0 and aggressive and selected and selected.collection and selected.isClosed()
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

  # Editing values ------------------------------------------------------------
  canEdit: ->
    return false if @workingSchema.readOnly or @parent?.schema.readOnly
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
    @buildValueForDisplay(valEl, @getData()) if @isDisplaying()

    if @isEditing()
      @buildValueForEditing(valEl, @getData())
      @deselectAll()

  endExistingEdits: ->
    editing = @getRootEl().find('.treema-edit').closest('.treema-node')
    for elem in editing
      treema = $(elem).data('instance')
      treema.saveChanges(treema.getValEl())
      treema.display()
      @markAsChanged()

  flushChanges: ->
    if @parent and (not @integrated) and @data isnt undefined
      @parent.integrateChildTreema(@)
    @getRoot().cachedErrors = null
    @markAsChanged()
    return @refreshErrors() unless @parent
    @updateDefaultClass()
    @parent.data[@keyForParent] = @data if @data isnt undefined
    @parent.refreshErrors()
    parent = @parent
    while parent
#      unless parent.valueClass in ['treema-array', 'treema-object']
      parent.buildValueForDisplay(parent.getValEl().empty(), parent.getData())
      parent = parent.parent

  focusLastInput: ->
    inputs = @getInputs()
    last = inputs[inputs.length-1]
    $(last).focus().select()

  # Removing nodes ------------------------------------------------------------
  removeSelectedNodes: (nodes = []) ->
    selected = nodes
    selected = @getSelectedTreemas() unless nodes.length
    toSelect = null
    if selected.length is 1
      nextSibling = selected[0].$el.next('.treema-node').data('instance')
      prevSibling = selected[0].$el.prev('.treema-node').data('instance')
      toSelect = nextSibling or prevSibling or selected[0].parent
    #Saves path and node before removing to preserve original paths
    data = []
    paths = []
    parentPaths = []
    @getRoot().hush = true
    for treema in selected
      data.push treema.data
      paths.push treema.getPath()
      parentPaths.push treema.parent?.getPath()
    @addTrackedAction { 'data':data, 'path':paths, 'parentPath':parentPaths, 'action':'delete' }
    for treema in selected
      treema.remove()
    toSelect.select() if toSelect and not @getSelectedTreemas().length
    @getRoot().hush = false
    @broadcastChanges()

  remove: ->
    required = @parent and @parent.schema.required? and @keyForParent in @parent.schema.required
    if required
      tempError = @createTemporaryError('required')
      @$el.prepend(tempError)
      return false

    readOnly = @workingSchema.readOnly or @parent?.schema.readOnly
    if readOnly
      tempError = @createTemporaryError('read only')
      @$el.prepend(tempError)
      return false

    if @defaultData isnt undefined
      options = $.extend({}, @settings, { defaultData: @defaultData, schema: @workingSchema }, )
      newNode = TreemaNode.make(null, options, @parent, @keyForParent)
      @parent.segregateChildTreema(@) if @parent
      @replaceNode(newNode)
      @destroy()
      return true

    @$el.remove()
    @keepFocus() if document.activeElement is $('body')[0]
    @parent.segregateChildTreema(@) if @parent
    @destroy()
    return true

  # Managing defaults

  updateDefaultClass: ->
    @$el.removeClass('treema-default-stub')
    @$el.addClass('treema-default-stub') if @isDefaultStub() and not @parent.isDefaultStub()
    child.updateDefaultClass() for key, child of @childrenTreemas

  # Opening/closing collections -----------------------------------------------
  toggleOpen: ->
    if @isClosed() then @open() else @close()
    @

  open: (depth=1) ->
    if @isClosed()
      childrenContainer = @$el.find('.treema-children').detach()
      childrenContainer.empty()
      @childrenTreemas = {}
      for child in @getChildren()
        continue if child.schema.format is 'hidden'
        treema = TreemaNode.make(null, {
          schema: child.schema
          data:child.value
          defaultData: child.defaultData
        }, @, child.key)
        @integrateChildTreema(treema) unless treema.data is undefined or (@data is undefined and not @integrated)
        @childrenTreemas[treema.keyForParent] = treema
        childNode = @createChildNode(treema)
        childrenContainer.append(childNode)
      @$el.append(childrenContainer).removeClass('treema-closed').addClass('treema-open')
      childrenContainer.append($(@addChildTemplate))
      # this tends to break ACE editors within
      if @ordered and childrenContainer.sortable and not @settings.noSortable
        childrenContainer.sortable?({
          deactivate: @orderDataFromUI
          forcePlaceholderSize: true
          placeholder: 'placeholder'
        })
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
      continue unless treema?.data
      if $.isArray @data
        treema.keyForParent = index
        @childrenTreemas[index] = treema
        @data[index] = treema.data
      else
        @childrenTreemas[treema.keyForParent] = treema
        @data[treema.keyForParent] = treema.data
      index += 1
    @refreshDisplay()

  close: (saveChildData=true) ->
    return unless @isOpen()
    if saveChildData
      @data[key] = treema.data for key, treema of @childrenTreemas when treema.integrated
    @$el.find('.treema-children').empty()
    @$el.addClass('treema-closed').removeClass('treema-open')
    @childrenTreemas[child].destroy() for child of @childrenTreemas
    @childrenTreemas = null
    @refreshErrors()
    @buildValueForDisplay(@getValEl().empty(), @getData())

  # Selecting/deselecting nodes -----------------------------------------------
  select: ->
    numSelected = @getSelectedTreemas().length
    # if we have multiple selected, we want this row to be selected at the end
    excludeSelf = numSelected is 1
    @deselectAll(excludeSelf)
    @toggleSelect()
    @keepFocus()
    TreemaNode.didSelect = true
    TreemaNode.lastTreemaWithFocus = @getRoot()

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
    @select()
    return unless lastSelected.length
    @deselectAll()
    allNodes = @getRootEl().find('.treema-node')
    endNodes = [@, lastSelected.data('instance')]
    started = false
    for node in allNodes
      node = $(node).data('instance')
      if not started
        if node in endNodes
          node.$el.addClass('treema-selected')
          started = true
        continue
      node.$el.addClass('treema-selected')
      if started and (node in endNodes)
        break
    lastSelected.removeClass('treema-last-selected')
    @$el.addClass('treema-last-selected')
    TreemaNode.didSelect = true

  #Save/restore state
  addTrackedAction: (action) ->
    root = @getRoot()
    return if root.trackingDisabled
    root.trackedActions.splice root.currentStateIndex, root.trackedActions.length - root.currentStateIndex
    root.trackedActions.push action
    root.currentStateIndex++

  disableTracking: ->
    @getRoot().trackingDisabled = true

  enableTracking: ->
    @getRoot().trackingDisabled = false

  canUndo: ->
    return @getCurrentStateIndex() isnt 0

  undo: ->
    return unless @canUndo()

    trackedActions = @getTrackedActions()
    currentStateIndex = @getCurrentStateIndex()
    root = @getRoot()
    @disableTracking()
    restoreChange = trackedActions[currentStateIndex-1]

    switch restoreChange.action
      when 'delete'
        if not $.isArray(restoreChange.path)
          restoreChange.data = [restoreChange.data]
          restoreChange.path = [restoreChange.path]
          restoreChange.parentPath = [restoreChange.parentPath]

        for treemaData, i in restoreChange.data
          parentPath = restoreChange.parentPath[i]
          treemaPath = restoreChange.path[i]
          parentData = @get parentPath
          switch $.isArray(parentData)
            when false
              @set treemaPath, treemaData
            when true
              deleteIndex = parseInt (treemaPath.substring (treemaPath.lastIndexOf('/') + 1))
              if deleteIndex < parentData.length
                parentData.splice deleteIndex, 0, treemaData
                @set parentPath, parentData
              else
                @insert parentPath, treemaData

      when 'edit'
        if restoreChange.oldData is undefined
          @delete restoreChange.path
        else
          @set restoreChange.path, restoreChange.oldData

      when 'replace'
        restoreChange.newNode.replaceNode restoreChange.oldNode
        @set restoreChange.path, restoreChange.oldNode.data

      when 'insert'
        @delete restoreChange.path

    root.currentStateIndex--
    @enableTracking()

  canRedo: ->
    return @getCurrentStateIndex() isnt @getTrackedActions().length

  redo: ->
    return unless @canRedo()

    trackedActions = @getTrackedActions()
    currentStateIndex = @getCurrentStateIndex()
    root = @getRoot()
    @disableTracking()
    restoreChange = trackedActions[currentStateIndex]

    switch restoreChange.action
      when 'delete'
        if not $.isArray(restoreChange.path)
          restoreChange.path = [restoreChange.path]
        for path in restoreChange.path
          @delete path

      when 'edit'
        @set restoreChange.path, restoreChange.newData

      when 'replace'
        restoreChange.oldNode.replaceNode restoreChange.newNode
        @set restoreChange.path, restoreChange.newNode.data

      when 'insert'
        parentData = @get restoreChange.parentPath
        switch $.isArray(parentData)
          when true
            @insert restoreChange.parentPath, restoreChange.data
          when false
            @set restoreChange.path, restoreChange.data

    root.currentStateIndex++
    @enableTracking()

  getUndoDescription: ->
    return '' unless @canUndo()
    trackedActions = @getTrackedActions()
    currentStateIndex = @getCurrentStateIndex()
    return @getTrackedActionDescription( trackedActions[currentStateIndex - 1] )

  getRedoDescription: ->
    return '' unless @canRedo()
    trackedActions = @getTrackedActions()
    currentStateIndex = @getCurrentStateIndex()
    return @getTrackedActionDescription trackedActions[currentStateIndex]

  getTrackedActionDescription: (trackedAction) ->
    switch trackedAction.action
      when 'insert'
        trackedActionDescription = 'Add New ' + @nodeDescription

      when 'delete'
        trackedActionDescription = 'Delete ' + @nodeDescription

      when 'edit'
        path = trackedAction.path.split '/'
        if path[path.length-1] is 'pos'
          trackedActionDescription = 'Move ' + @nodeDescription
        else
          trackedActionDescription = 'Edit ' + @nodeDescription

      else
        trackedActionDescription = ''
    trackedActionDescription

  getTrackedActions: ->
    @getRoot().trackedActions
  getCurrentStateIndex: ->
    @getRoot().currentStateIndex

  # Switching types or working schemas

  onSelectSchema: (e) =>
    index = parseInt($(e.target).val())
    workingSchema = @workingSchemas[index]
    settings = $.extend(true, {}, @settings)
    settings = $.extend(settings, {
      workingSchemas: @workingSchemas
      workingSchema: workingSchema
      data: @data
      defaultData: @defaultData
      schema: @schema
    })
    newNode = TreemaNode.make(null, settings, @parent, @keyForParent)
    @replaceNode(newNode)

  onSelectType: (e) =>
    newType = $(e.target).val()
    settings = $.extend(true, {}, @settings, {
      workingSchemas: @workingSchemas
      workingSchema: @workingSchema
      type: newType
      data: @data
      defaultData: @defaultData
      schema: @schema
    })
    if $.type(@data) isnt newType
      settings.data = TreemaNode.defaultForType(newType)

    newNode = TreemaNode.make(null, settings, @parent, @keyForParent)
    @replaceNode(newNode)

  replaceNode: (newNode) ->
    newNode.tv4 = @tv4
    newNode.keyForParent = @keyForParent if @keyForParent?
    @parent.childrenTreemas[@keyForParent] = newNode if @parent
    @parent.createChildNode(newNode)
    @$el.replaceWith(newNode.$el)
    newNode.flushChanges() # should integrate
    @addTrackedAction {'oldNode':@, 'newNode':newNode, 'path':@getPath(), 'action':'replace'}

  # Child node utilities ------------------------------------------------------
  integrateChildTreema: (treema) ->
    if @parent and not @integrated
      @data = if $.isArray(@defaultData) then [] else {}
      @parent.integrateChildTreema(@)
    else
      treema.updateDefaultClass()
    newData = @data[treema.keyForParent] isnt treema.data
    treema.integrated = true # no longer in limbo
    @childrenTreemas[treema.keyForParent] = treema
    @data[treema.keyForParent] = treema.data
    if newData
      @orderDataFromUI() if @ordered
      @refreshErrors()
      @updateMyAddButton()
      @markAsChanged()
      @buildValueForDisplay(@getValEl().empty(), @getData())
      @broadcastChanges()
    treema

  segregateChildTreema: (treema) ->
    treema.integrated = false
    delete @childrenTreemas[treema.keyForParent]
    delete @data[treema.keyForParent]
    @orderDataFromUI() if @ordered
    @refreshErrors()
    @updateMyAddButton()
    @markAsChanged()
    @buildValueForDisplay(@getValEl().empty(), @getData())
    @broadcastChanges()
    treema

  createChildNode: (treema) ->
    childNode = treema.build()
    row = childNode.find('.treema-row')
    if @collection and @keyed
      name = treema.schema.title or treema.keyForParent
      required = @workingSchema.required or []
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
    return if @parent and not @integrated
    return if @settings.skipValidation
    errors = @getErrors()
    erroredTreemas = []
    for error in errors
      path = (error.subDataPath ? error.dataPath)[1..]
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
    oldData = @get path
    if @setRecursive(path, newData)
      if JSON.stringify(newData) isnt JSON.stringify(oldData)
        @addTrackedAction {'oldData':oldData, 'newData':newData, 'path':path, 'action':'edit'}
      return true
    else
      return false

  setRecursive: (path, newData) ->
    path = @normalizePath(path)

    if path.length is 0
      @data = newData
      @refreshDisplay()
      return true

    if @childrenTreemas?
      result = @digDeeper(path, 'setRecursive', false, [newData])
      if result is false and path.length is 1 and $.isPlainObject(@data)
        # handles inserting values into objects
        @data[path[0]] = newData
        @refreshDisplay()
        return true
      return result

    data = @data
    nodePath = @getPath()
    for seg, i in path
      seg = @normalizeKey(seg, data)
      if path.length is i+1
        oldData = data[seg]
        data[seg] = newData
        @refreshDisplay()
        return true
      else
        data = data[seg]
        return false if data is undefined

  delete: (path) ->
    oldData = @get path
    if @deleteRecursive(path)
      parentPath = path.substring(0, path.lastIndexOf('/'))
      @addTrackedAction {'data': oldData, 'path': path, 'parentPath':parentPath, 'action':'delete'}
      return true
    else
      return false

  deleteRecursive: (path) ->
    path = @normalizePath(path)
    if path.length is 0
      return @remove()
    return @digDeeper(path, 'deleteRecursive', false, []) if @childrenTreemas?

    data = @data
    parentPath = @getPath()
    for seg, i in path
      seg = @normalizeKey(seg, data)
      if path.length is i+1
        if $.isArray(data) then data.splice(seg, 1) else delete data[seg]
        @refreshDisplay()
        return true
      else
        data = data[seg]
        return false if data is undefined
      parentPath += '/' + seg

  insert: (path, newData) ->
    if @insertRecursive(path, newData)
      parentPath = path
      parentData = @get parentPath
      childPath = parentPath
      childPath += '/' unless parentPath is '/'

      if parentData[parentData.length-1] isnt newData
        for key, val of parentData
          if JSON.stringify(val) is JSON.stringify(newData)
            insertPos = key
            break
      else
        insertPos = parentData.length-1

      childPath += insertPos.toString()
      @addTrackedAction {'data':newData, 'path':childPath, 'parentPath':parentPath, 'action':'insert'}
      return true
    else
      return false

  insertRecursive: (path, newData) ->
    # inserts objects at the end of arrays, path is to the array
    # for adding properties to object, use set
    path = @normalizePath(path)
    if path.length is 0
      return false unless $.isArray(@data)
      @data.push(newData)
      @refreshDisplay()
      @flushChanges()
      return true

    return @digDeeper(path, 'insertRecursive', false, [newData]) if @childrenTreemas?

    data = @data

    parentPath = @getPath()
    for seg, i in path
      parentPath +=  '/' + seg
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
    return def if childTreema is undefined or not childTreema.integrated
    return childTreema[func](path[1..], args...)

  refreshDisplay: ->
    if @isDisplaying()
      @buildValueForDisplay(@getValEl().empty(), @getData())

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
  getData: -> if $.type(@data) is 'undefined' then @defaultData else @data
  isDefaultStub: -> @data is undefined
  @getLastTreemaWithFocus: ->
    return @lastTreemaWithFocus

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
  setFilterVisible: (isFilterVisible) ->
    if isFilterVisible
      @$el.find('.treema-node').andSelf().removeClass(@treemaFilterHiddenClass)
    else
      @$el.find('.treema-node').andSelf().addClass(@treemaFilterHiddenClass)

  getFilterVisibleTreemas: ->
    ($(el).data('instance') for el in @getRootEl().find('.treema-node').not('.' + @treemaFilterHiddenClass))
  isFilterVisible: -> !@$el.hasClass(@treemaFilterHiddenClass)

  saveScrolls: ->
    @scrolls = []
    rootEl = @getRootEl()
    parent = rootEl
    while parent[0]
      @scrolls.push {el: parent, scrollTop: parent.scrollTop(), scrollLeft: parent.scrollLeft()}
      break if parent.prop('tagName').toLowerCase() is 'body'
      parent = parent.parent()

  loadScrolls: ->
    return unless @scrolls
    for scroll in @scrolls
      scroll.el.scrollTop(scroll.scrollTop)
      scroll.el.scrollLeft(scroll.scrollLeft)
    @scrolls = null

  keepFocus: ->
    @saveScrolls()
    @getRootEl().focus()
    @loadScrolls()

  copyData: -> $.extend(null, {}, {'d': @data})['d']
  updateMyAddButton: ->
    @$el.removeClass('treema-full')
    @$el.addClass('treema-full') unless @canAddChild()

  @nodeMap: {}

  @setNodeSubclass: (key, NodeClass) -> @nodeMap[key] = NodeClass

  @make: (element, options, parent, keyForParent) ->
    schema = options.schema or {}
    if schema.$ref
      tv4 = options.tv4 or parent?.tv4
      if not tv4
        tv4 = TreemaUtils.getGlobalTv4().freshApi()
        tv4.addSchema('#', schema)
      schema = @utils.resolveReference(schema, tv4)

    if schema.default? and not (options.data? or options.defaultData?)
      if $.type(schema.default) is 'object'
        options.data = {} # objects handle defaults uniquely
      else
        options.data = @utils.cloneDeep(schema.default)

    workingData = options.data or options.defaultData
    workingSchemas = options.workingSchemas or @utils.buildWorkingSchemas(schema, parent?.tv4)
    workingSchema = options.workingSchema or @utils.chooseWorkingSchema(workingData, workingSchemas, options.tv4)
    @massageData(options, workingSchema) # make sure the data at least meshes with the working schema type
    type = options.type or $.type(options.data ? options.defaultData)
    type = 'null' if type is 'undefined'
    localClasses = if parent then parent.settings.nodeClasses else options.nodeClasses
    NodeClass = @getNodeClassForSchema(workingSchema, type, localClasses)

    # still to redo a bit...
    if parent
      for key, value of parent.settings
        continue if key in ['data', 'defaultData', 'schema']
        options[key] = value

    options.workingSchema = workingSchema
    options.workingSchemas = workingSchemas
    options.keyForParent = keyForParent if keyForParent?
    newNode = new NodeClass(element, options, parent)
    newNode

  @massageData: (options, workingSchema) ->
    # do not allow data or default data to start out invalid with the working schema type, if possible
    schemaTypes = workingSchema.type or ['string', 'number', 'integer', 'object', 'array', 'boolean', 'null']
    schemaTypes = [schemaTypes] unless $.type(schemaTypes) is 'array'

    # type can't tell between number and integer, so just treat them as the same
    if 'integer' in schemaTypes and 'number' not in schemaTypes
      schemaTypes.push 'number'

    dataType = $.type(options.data)
    defaultDataType = $.type(options.defaultData)

    # if the data does not match the schema types
    if dataType isnt 'undefined' and dataType not in schemaTypes
      options.data = @defaultForType(schemaTypes[0])

    # if there's no data or default data that works for the schema, reset it
    if dataType is 'undefined' and defaultDataType not in schemaTypes
      options.data = @defaultForType(schemaTypes[0])

  @defaultForType: (type) -> TreemaNode.utils.defaultForType(type)

  @getNodeClassForSchema: (schema, def='string', localClasses=null) ->
    typeMismatch = false
    if schema.type
      if $.isArray(schema.type)
        typeMismatch = true if not def in schema.type
      else
        typeMismatch = def isnt schema.type

    NodeClass = null
    localClasses = localClasses or {}
    NodeClass = localClasses[schema.format] or @nodeMap[schema.format] if schema.format
    return NodeClass if NodeClass and not typeMismatch
    type = schema.type or def
    type = def if $.isArray(type) or typeMismatch
    NodeClass = localClasses[type] or @nodeMap[type]
    return NodeClass if NodeClass
    @nodeMap['any']

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

  filterChildren: (filter) ->
    for keyForParent, treemaNode of @childrenTreemas
      treemaNode.setFilterVisible(!filter || filter(treemaNode, keyForParent))

  clearFilter: ->
    for keyForParent, treemaNode of @childrenTreemas
      treemaNode.setFilterVisible true

  destroy: ->
    for child of @childrenTreemas
      @childrenTreemas[child].destroy()
    @$el.remove()
