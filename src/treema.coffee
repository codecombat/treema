class TreemaNode
  # Abstract node class

  # constructor arguments
  schema: {}
  data: null
  options: null
  isChild: false

  # templates
  nodeTemplate: '''<div class="treema-node treema-clearfix"><div class="treema-value"></div></div>'''
  childrenTemplate: '<div class="treema-children"></div>'
  addChildTemplate: '<div class="treema-add-child">+</div>'
  newPropertyTemplate: '<input class="treema-new-prop" />'
  toggleTemplate: '<span class="treema-toggle"></span>'
  keyTemplate: '<span class="treema-key"></span>'
  templateString: '<div class="treema-error"></div>'

  # behavior settings (overridden by subclasses)
  collection: false   # acts like an array or object
  ordered: false      # acts like an array
  keyed: false        # acts like an object
  editable: true      # can be changed
  skipTab: false      # is skipped over when tabbing between elements for editing


  # Thin interface for tv4 ----------------------------------------------------
  isValid: -> tv4.validate(@data, @schema)
  getErrors: -> tv4.validateMultiple(@data, @schema)['errors']
  getMissing: -> tv4.validateMultiple(@data, @schema)['missing']

  # Abstract functions --------------------------------------------------------
  setValueForReading: (valEl) -> console.error('"setValueForReading" has not been overridden.')
  setValueForEditing: (valEl) -> console.error('"setValueForEditing" has not been overridden.')
  saveChanges: (valEl) -> console.error('"saveChanges" has not been overridden.')
  getChildren: -> console.error('"getChildren" has not been overridden.') # should return a list of key-value-schema tuples
  getChildSchema: -> console.error('"getChildSchema" has not been overridden.')
  getDefaultValue: -> null

  # Subclass helper functions -------------------------------------------------
  setValueForReadingSimply: (valEl, cssClass, text) ->
    valEl.append($("<pre class='#{cssClass} treema-shortened'></pre>").text(text.slice(0,200)))

  setValueForEditingSimply: (valEl, value, inputType=null) ->
    input = $('<input />')
    input.attr('type', inputType) if inputType
    input.val(value) unless value is null
    valEl.append(input)
    input.focus().select().blur =>
      @.toggleEdit('treema-read') if $('.treema-value', @$el).hasClass('treema-edit')
    input.keydown (e) =>
      if e.which is 8 and not $(input).val()
        @remove()
        e.preventDefault()
    input

  # Initialization ------------------------------------------------------------
  constructor: (@schema, @data, @options, @isChild) ->
    @options = @options or {}
    @schema = @schema or {}

  build: ->
    @populateData()
    @$el = $(@nodeTemplate)
    valEl = $('.treema-value', @$el)
    @setValueForReading(valEl)
    valEl.addClass('treema-read') unless @collection
    @$el.data('instance', @)
    @$el.addClass('treema-root') unless @isChild
    @$el.attr('tabindex', 9001) unless @isChild
    @$el.append($(@childrenTemplate)).addClass('treema-closed') if @collection
    @open() if @collection and not @isChild
    @setUpEvents() unless @isChild
    @$el
    
  populateData: ->
    @data = @data or @schema.default or @getDefaultValue()

  # Event handling ------------------------------------------------------------
  setUpEvents: ->
    @$el.dblclick (e) => $(e.target).closest('.treema-node').data('instance')?.onDoubleClick(e)
    @$el.click (e) => $(e.target).closest('.treema-node').data('instance')?.onClick(e)
    @$el.keydown (e) =>
      if e.which is 8 and not (e.target.nodeName in ['INPUT', 'TEXTAREA'])  # Delete
        e.preventDefault()
        @removeSelectedNodes()
      $(e.target).closest('.treema-node').data('instance')?.onKeyDown(e)

  onClick: (e) ->
    return if e.target.nodeName in ['INPUT', 'TEXTAREA']
    clickedValue = $(e.target).closest('.treema-value').length  # Clicks are in children of .treema-value nodes
    clickedToggle = $(e.target).hasClass('treema-toggle')
    clickedKey = $(e.target).hasClass('treema-key')
    @$el.closest('.treema-root').focus() unless clickedValue and not @collection
    return @toggleEdit() if clickedValue and not @collection
    return @toggleOpen() if clickedToggle or (clickedValue and @collection)
    return @addNewChild() if $(e.target).closest('.treema-add-child').length and @collection
    return @toggleSelect() if clickedKey

  onDoubleClick: (e) ->
    return unless @collection
    clickedKey = $(e.target).hasClass('treema-key')
    return unless clickedKey
    @open() if @$el.hasClass('treema-closed')
    @addNewChild()

  onKeyDown: (e) ->
    @onEscapePressed(e) if e.which is 27
    @onTabPressed(e) if e.which is 9
    @onLeftArrowPressed(e) if e.which is 37
    @onUpArrowPressed(e) if e.which is 38
    @onRightArrowPressed(e) if e.which is 39
    @onDownArrowPressed(e) if e.which is 40
    @onEnterPressed(e) if e.which is 13

  onLeftArrowPressed: (e) ->
    treemas = @getSelectedTreemas()
    for treema in treemas
      return treema.close() if treema.$el.hasClass('treema-open')
    return unless treemas.length is 1
    parent = treemas[0].parent
    return if parent.$el.hasClass('treema-root')
    parent.close()
    parent.toggleSelect()

  onRightArrowPressed: (e) ->
    for treema in @getSelectedTreemas()
      return unless treema.collection
      treema.open() if treema.$el.hasClass('treema-closed') 

  onUpArrowPressed: (e) -> @navigateSelection('prev')
  onDownArrowPressed: (e) -> @navigateSelection('next')
      
  navigateSelection: (direction) ->
    selected = @getSelectedTreemas()
    return unless selected.length is 1
    selected = selected[0]
    next = if direction is 'next' then selected.getNextTreema() else selected.getPreviousTreema() 
    next?.toggleSelect()

  getSelectedTreemas: ->
    ($(el).data('instance') for el in @$el.closest('.treema-root').find('.treema-selected'))

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

  onEscapePressed: (e) -> 
    $(e.target).data('escaped', true).blur()
    @$el.addClass('treema-selected')
    @$el.closest('.treema-root').focus()

  onTabPressed: (e) ->
    direction = if e.shiftKey then 'prev' else 'next'
    target = $(e.target)

    addingNewProperty = target.hasClass('treema-new-prop')
    if addingNewProperty
      e.preventDefault()
      childIndex = @getTabbableChildrenTreemas().length  # One past the end, since we're adding
      target.blur()
      if @getTabbableChildrenTreemas().length is childIndex
        @tabToNextTreema childIndex, direction  # We didn't create one, so let's tab past
    else if @parent?.collection
      childIndex = @parent.getTabbableChildrenTreemas().indexOf @
      @parent.tabToNextTreema childIndex, direction

    # TODO: Handle switching between inputs within a single node, like for x, y points

    return e.preventDefault()


  getTabbableChildrenTreemas: ->
    (child for key, child of @childrenTreemas when not (child.collection or child.skipTab))

  tabToNextTreema: (childIndex, direction) ->
    tabbableChildren = @getTabbableChildrenTreemas()
    return null unless tabbableChildren.length
    nextIndex = childIndex + (if direction is "next" then 1 else -1)
    n = tabbableChildren.length + 1
    nextIndex = ((nextIndex % n) + n) % n  # http://stackoverflow.com/questions/4467539/javascript-modulo-not-behaving
    if nextIndex is tabbableChildren.length
      nextTreema = @addNewChild()  # not fully created yet
    else
      nextTreema = tabbableChildren[nextIndex]
      nextTreema.toggleEdit 'treema-edit'
    nextTreema

  onEnterPressed: (e, selected=null) ->
    if not selected
      selected = @getSelectedTreemas()
      return unless selected.length is 1
      selected = selected[0]
      return selected.onEnterPressed(e, selected) if selected isnt @
      
    return unless selected.editable
    return selected.toggleOpen() if selected.collection
    selected.toggleSelect()
    selected.toggleEdit('treema-edit')

  # Editing values ------------------------------------------------------------
  toggleEdit: (toClass) ->
    return unless @editable
    valEl = $('.treema-value', @$el)
    wasEditing = valEl.hasClass('treema-edit')
    valEl.toggleClass('treema-read treema-edit') unless toClass and valEl.hasClass(toClass)

    if valEl.hasClass('treema-read')
      if wasEditing
        @saveChanges(valEl)
        @refreshErrors()

      @propagateData()
      valEl.empty()
      @setValueForReading(valEl)

    if valEl.hasClass('treema-edit')
      valEl.empty()
      @setValueForEditing(valEl)
      @deselectAll()

  propagateData: ->
    return unless @parent
    @parent.data[@keyForParent] = @data
    @parent.refreshErrors()

  # Adding elemements to collections ------------------------------------------
  addNewChild: ->
    if @ordered # array
      new_index = Object.keys(@childrenTreemas).length
      schema = @getChildSchema()
      newTreema = @addChildTreema(new_index, undefined, schema)
      childNode = @createChildNode(newTreema)
      @getMyAddButton().before(childNode)
      newTreema.toggleEdit('treema-edit')

    if @keyed # object
      properties = @childPropertiesAvailable()
      keyInput = $(@newPropertyTemplate)
      keyInput.autocomplete?(source: properties)
      @getMyAddButton().before(keyInput)
      keyInput.focus()

      keyInput.keydown (e) =>
        if e.which is 8 and not keyInput.val()
          keyInput.remove()
          e.preventDefault()

      keyInput.blur (e) =>
        key = keyInput.val()
        escaped = keyInput.data('escaped')
        keyInput.remove()
        if @schema.properties
          for child_key, child_schema of @schema.properties
            key = child_key if child_schema.title is key
        return if escaped
        return unless key.length and not @childrenTreemas[key]

        schema = @getChildSchema(key)
        newTreema = @addChildTreema(key, null, schema)
        childNode = @createChildNode(newTreema)
        @findObjectInsertionPoint(key).before(childNode)
        newTreema.toggleEdit('treema-edit')

  findObjectInsertionPoint: (key) ->
    # Object children should be in the order of the schema.properties objects as much as possible
    return @getMyAddButton() unless @schema.properties?[key]
    allProps = Object.keys(@schema.properties)
    afterKeys = allProps.slice(allProps.indexOf(key)+1)
    allChildren = @$el.find('> .treema-children > .treema-node')
    for child in allChildren
      if $(child).data('instance').keyForParent in afterKeys
        return $(child)
    return @getMyAddButton()

  getMyAddButton: ->
    @$el.find('> .treema-children > .treema-add-child')

  childPropertiesAvailable: ->
    return [] unless @schema.properties
    properties = []
    for property, childSchema of @schema.properties
      continue if @childrenTreemas[property]?
      properties.push(childSchema.title or property)
    properties.sort()

  # Removing nodes ------------------------------------------------------------
  removeSelectedNodes: ->
    @$el.find('.treema-selected').each (i, elem) =>
      $(elem).data('instance')?.remove()

  remove: ->
    @$el.remove()
    return unless @parent?
    delete @parent.childrenTreemas[@keyForParent]
    delete @parent.data[@keyForParent]
    @parent.sortFromUI() if @parent.ordered
    @parent.refreshErrors()

  # Opening/closing collections -----------------------------------------------
  toggleOpen: ->
    if @$el.hasClass('treema-closed') then @open() else @close()

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
      childrenContainer.sortable?(deactivate: @sortFromUI).disableSelection?()
    @refreshErrors()

  sortFromUI: =>
    children_wrapper = @$el.find('> .treema-children')
    index = 0
    @childrenTreemas = {}  # rebuild it
    @data = if $.isArray(@data) then [] else {}
    for child in children_wrapper[0].children
      treema = $(child).data('instance')
      continue unless treema
      treema.keyForParent = index
      @childrenTreemas[index] = treema
      @data[index] = treema.data
      index += 1

  close: ->
    @data[key] = treema.data for key, treema of @childrenTreemas
    @$el.find('.treema-children').empty()
    @$el.addClass('treema-closed').removeClass('treema-open')
    @childrenTreemas = null
    @refreshErrors()
    @setValueForReading($('.treema-value', @$el).empty())

  # Selecting/deselecting nodes -----------------------------------------------
  toggleSelect: ->
    # For now, we'll let selections be independent, so that when we go to delete,
    # we'll be able to drag/delete multiple. Later we should rely on shift for that,
    # defaulting to either one or zero selections at a time with normal clicks.
    @deselectAll(true)
    @$el.toggleClass('treema-selected')

  # Child node utilities ------------------------------------------------------
  addChildTreema: (key, value, schema) ->
    treema = makeTreema(schema, value, {}, true)
    treema.keyForParent = key
    treema.parent = @
    @childrenTreemas[key] = treema
    treema
    
  deselectAll: (excludeSelf=false) ->
    for treema in @getSelectedTreemas()
      continue if excludeSelf and treema is @
      treema.$el.removeClass('treema-selected')

  createChildNode: (treema) ->
    childNode = treema.build()
    if @collection
      name = treema.schema.title or treema.keyForParent
      keyEl = $(@keyTemplate).text(name)
      keyEl.attr('title', treema.schema.description) if treema.schema.description
      childNode.prepend(' : ')
      childNode.prepend(keyEl)
    childNode.prepend($(@toggleTemplate)) if treema.collection
    childNode

  # Displaying validation errors ----------------------------------------------
  refreshErrors: ->
    @removeErrors()
    @showErrors()

  showErrors: ->
    errors = @getErrors()
    erroredTreemas = []
    for error in errors
      path = error.dataPath.split('/').slice(1)
      deepestTreema = @
      for subpath in path
        break unless deepestTreema.childrenTreemas
        subpath = parseInt(subpath) if deepestTreema.ordered
        deepestTreema = deepestTreema.childrenTreemas[subpath]
      deepestTreema._errors = [] unless deepestTreema._errors and deepestTreema in erroredTreemas
      deepestTreema._errors.push(error)
      erroredTreemas.push(deepestTreema)

    for treema in $.unique(erroredTreemas)
      messages = (e.message for e in treema._errors)
      treema.showError(messages.join('<br />'))

  showError: (message) ->
    @$el.append($(@templateString))
    @$el.find('> .treema-error').html(message).show()
    @$el.addClass('treema-has-error')

  removeErrors: ->
    @$el.find('.treema-error').remove()
    @$el.removeClass('treema-has-error')


# TreemaNode subclasses -------------------------------------------------------

class StringTreemaNode extends TreemaNode
  getDefaultValue: -> ''
  @inputTypes = ['color', 'date', 'datetime', 'datetime-local', 'email', 'month', 'range', 'search',
                 'tel', 'text', 'time', 'url', 'week']
  setValueForReading: (valEl) -> @setValueForReadingSimply(valEl, 'treema-string', "\"#{@data}\"")
  setValueForEditing: (valEl) ->
    input = @setValueForEditingSimply(valEl, @data)
    input.attr('maxlength', @schema.maxLength) if @schema.maxLength
    input.attr('type', @schema.format) if @schema.format in StringTreemaNode.inputTypes
    
  saveChanges: (valEl) -> @data = $('input', valEl).val()

class NumberTreemaNode extends TreemaNode
  getDefaultValue: -> 0
  setValueForReading: (valEl) -> @setValueForReadingSimply(valEl, 'treema-number', JSON.stringify(@data))
  setValueForEditing: (valEl) -> 
    input = @setValueForEditingSimply(valEl, JSON.stringify(@data), 'number')
    input.attr('max', @schema.maximum) if @schema.maximum
    input.attr('min', @schema.minimum) if @schema.minimum
    
  saveChanges: (valEl) -> @data = parseFloat($('input', valEl).val())

class NullTreemaNode extends TreemaNode
  editable: false
  setValueForReading: (valEl) -> @setValueForReadingSimply(valEl, 'treema-null', 'null')

class BooleanTreemaNode extends TreemaNode
  getDefaultValue: -> false
  skipTab: true
  setValueForReading: (valEl) -> @setValueForReadingSimply(valEl, 'treema-boolean', JSON.stringify(@data))
  
  onEnterPressed: (e) ->
    @data = not @data
    @setValueForReading($('.treema-value', @$el).empty())
    
  onClick: (e) ->
    # Override the normal behavior for clicking the value, just flip the value instead.
    value = $(e.target).closest('.treema-value')
    if value.length
      @data = not @data
      @setValueForReading($('.treema-value', @$el).empty())
      return
    super(e)

class ArrayTreemaNode extends TreemaNode
  getDefaultValue: -> []
  collection: true
  ordered: true

  getChildren: -> ([key, value, @getChildSchema()] for value, key in @data)
  getChildSchema: -> @schema.items or {}
  setValueForReading: (valEl) -> @setValueForReadingSimply(valEl, 'treema-array', JSON.stringify(@data))
  setValueForEditing: (valEl) -> @setValueForEditingSimply(valEl, JSON.stringify(@data))

class ObjectTreemaNode extends TreemaNode
  getDefaultValue: -> {}
  collection: true
  keyed: true

  getChildren: ->
    # order based on properties object first
    children = []
    keysAccountedFor = []
    if @schema.properties
      for key of @schema.properties
        continue if typeof @data[key] is 'undefined'
        keysAccountedFor.push(key)
        children.push([key, @data[key], @getChildSchema(key)])
        
    for key, value of data
      continue if key in keysAccountedFor
      children.push([key, value, @getChildSchema(key)])
    children
      
  getChildSchema: (key_or_title) ->
    for key, child_schema of @schema.properties
      return child_schema if key is key_or_title or child_schema.title is key_or_title
    {}

  setValueForEditing: (valEl) -> @setValueForEditingSimply(valEl, JSON.stringify(@data))
  setValueForReading: (valEl) ->
    size = Object.keys(@data).length
    @setValueForReadingSimply(valEl, 'treema-object', "[#{size}]")

  populateData: ->
    super()
    return unless @schema.required
    for key in @schema.required
      continue if @data[key]
      helperTreema = makeTreema(@getChildSchema(key), null, {}, true)
      helperTreema.populateData()
      @data[key] = helperTreema.data


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
    @helper = new NodeClass(@schema, @data, @options, @isChild)
    for prop in ['collection', 'ordered', 'keyed', 'getChildSchema', 'getChildren', 'getChildSchema', 'setValueForReading']
      @[prop] = @helper[prop]

  rebuild: ->
    oldEl = @$el
    if @parent
      newNode = @parent.createChildNode(@)
    else
      newNode = @build()

    oldEl.replaceWith(newNode)


TreemaNodeMap =
  'array': ArrayTreemaNode
  'string': StringTreemaNode
  'object': ObjectTreemaNode
  'number': NumberTreemaNode
  'null': NullTreemaNode
  'boolean': BooleanTreemaNode
  'any': AnyTreemaNode

makeTreema = (schema, data, options, child) ->
  NodeClass = TreemaNodeMap[schema.format]
  unless NodeClass
    NodeClass = TreemaNodeMap[schema.type]
  unless NodeClass
    NodeClass = TreemaNodeMap['any']

  return new NodeClass(schema, data, options, child)
