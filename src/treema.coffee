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
  grabberTemplate: '<span class="treema-grabber"> G </span>'
  toggleTemplate: '<span class="treema-toggle"> T </span>'
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
  
  # Subclass helper functions -------------------------------------------------
  setValueForReadingSimply: (valEl, cssClass, text) -> 
    valEl.append($("<pre class='#{cssClass}'></pre>").text(text))

  setValueForEditingSimply: (valEl, value) ->
    input = $('<input />')
    input.val(value) unless value is null
    valEl.append(input)
    input.focus().select().blur =>
      @.toggleEdit('read') if $('.treema-value', @$el).hasClass('edit')    

  # Initialization ------------------------------------------------------------
  constructor: (@schema, @data, options, @isChild) ->
    @options = options or {}

  build: ->
    @$el = $(@nodeTemplate)
    valEl = $('.treema-value', @$el)
    @setValueForReading(valEl)
    valEl.addClass('read') unless @collection
    @$el.data('instance', @)
    @$el.addClass('treema-root') unless @isChild
    @$el.append($(@childrenTemplate)).addClass('closed') if @collection
    @open() if @collection and not @isChild
    @setUpEvents() unless @isChild
    @$el
    
  # Event handling ------------------------------------------------------------
  setUpEvents: ->
    @$el.click (e) => $(e.target).closest('.treema-node').data('instance')?.onClick(e)
    @$el.keydown (e) => $(e.target).closest('.treema-node').data('instance')?.onKeyDown(e)
    
  onClick: (e) ->
    return if e.target.nodeName in ['INPUT', 'TEXTAREA']
    @toggleEdit() if $(e.target).closest('.treema-value').length
    @toggleOpen() if $(e.target).hasClass('treema-toggle')
    @addNewChild() if $(e.target).closest('.treema-add-child').length and @collection
    
  onKeyDown: (e) ->
    @onEscapePressed(e) if e.which is 27
    @onTabPressed(e) if e.which is 9
        
  onEscapePressed: (e) -> $(e.target).data('escaped', true).blur()
  
  onTabPressed: (e) ->
    direction = if e.shiftKey then 'prev' else 'next'
    target = $(e.target)

    if target.hasClass('treema-new-prop')
      e.preventDefault()
      target.blur()

    # TODO: Handle switching between inputs within a single node, like for x, y points

    nextTreema = @getNextTreema(direction)
    if nextTreema
      nextTreema.toggleEdit('edit')
      return e.preventDefault()

    if @parent?.collection
      @parent.addNewChild()
    return e.preventDefault()
    
  getNextTreema: (direction) ->
    nextChild = @$el[direction]()
    while true
      if nextChild.length > 0
        instance = nextChild.data('instance')
        return unless instance
        if instance.collection or instance.skipTab
          nextChild = nextChild[dir]()
          continue
      return instance
    
  # Editing values ------------------------------------------------------------
  toggleEdit: (toClass) ->
    return unless @editable
    valEl = $('.treema-value', @$el)
    wasEditing = valEl.hasClass('edit')
    valEl.toggleClass('read edit') unless toClass and valEl.hasClass(toClass)
    
    if valEl.hasClass('read')
      if wasEditing
        @saveChanges(valEl)
        @refreshErrors()

      @propagateData()
      valEl.empty()
      @setValueForReading(valEl)
      
    if valEl.hasClass('edit')
      valEl.empty()
      @setValueForEditing(valEl)

  propagateData: ->
    return unless @parent
    @parent.data[@parentKey] = @data
    @parent.refreshErrors()

  # Adding elemements to collections ------------------------------------------
  addNewChild: ->
    if @ordered # array
      new_index = Object.keys(@childrenTreemas).length
      schema = @getChildSchema()
      newTreema = @addChildTreema(new_index, undefined, schema)
      childNode = @createChildNode(newTreema)
      @getMyAddButton().before(childNode)
      newTreema.toggleEdit('edit')
    
    if @keyed # object
      properties = @childPropertiesAvailable()
      keyInput = $(@newPropertyTemplate)
      keyInput.autocomplete?(source: properties)
      @getMyAddButton().before(keyInput)
      keyInput.focus()
      keyInput.blur (e) =>
        console.log('blur')
        key = keyInput.val()
        escaped = keyInput.data('escaped')
        keyInput.remove()
        return if escaped
        return unless key.length and not @childrenTreemas[key]
        
        schema = @getChildSchema(key)
        newTreema = @addChildTreema(key, null, schema)
        childNode = @createChildNode(newTreema)
        @getMyAddButton().before(childNode)
        newTreema.toggleEdit('edit')

  getMyAddButton: ->
    @$el.find('> .treema-children > .treema-add-child')

  childPropertiesAvailable: ->
    return [] unless @schema.properties
    properties = []
    for property, childSchema of @schema.properties
      continue if @childrenTreemas[property]?
      properties.push(childSchema.title or property)
    properties.sort()

  # Opening/closing collections -----------------------------------------------
  toggleOpen: ->
    if @$el.hasClass('closed') then @open() else @close()
      
  open: ->
    childrenContainer = @$el.find('.treema-children').detach()
    childrenContainer.empty()
    @childrenTreemas = {}
    for [key, value, schema] in @getChildren()
      treema = @addChildTreema(key, value, schema)
      childNode = @createChildNode(treema)
      childrenContainer.append(childNode)
    @$el.append(childrenContainer).removeClass('closed').addClass('open')
    childrenContainer.append($(@addChildTemplate))
    if @ordered and childrenContainer.sortable
      childrenContainer.sortable?(deactivate: @sortFromUI).disableSelection?()
    @refreshErrors()

  sortFromUI: =>
    children_wrapper = @$el.find('> .treema-children')
    index = 0
    for child in children_wrapper[0].children
      treema = $(child).data('instance')
      continue unless treema
      treema.parentKey = index
      @childrenTreemas[index] = treema
      @data[index] = treema.data
      index += 1

  close: ->
    @data[key] = treema.data for key, treema of @childrenTreemas
    @$el.find('.treema-children').empty()
    @$el.addClass('closed').removeClass('open')
    @childrenTreemas = null
    @refreshErrors()

  # Child node utilities ------------------------------------------------------
  addChildTreema: (key, value, schema) ->
    treema = makeTreema(schema, value, {}, true)
    treema.parentKey = key
    treema.parent = @
    @childrenTreemas[key] = treema
    treema
    
  createChildNode: (treema) ->
    childNode = treema.build()
    if @keyed
      name = treema.schema.title or treema.parentKey
      keyEl = $(@keyTemplate).text(name + ' : ')
      keyEl.attr('title', treema.schema.description) if treema.schema.description
      childNode.prepend(keyEl)
    childNode.prepend($(@toggleTemplate)) if treema.collection
    childNode.prepend($(@grabberTemplate)) if @ordered
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
      
    for treema in erroredTreemas
      if treema._errors.length > 1
        treema.showError("[#{treema._errors.length} errors]")
      else
        treema.showError(treema._errors[0].message)
    
  showError: (message) ->
    @$el.append($(@templateString))    
    @$el.find('> .treema-error').text(message).show()
    @$el.addClass('treema-has-error')
    
  removeErrors: ->
    @$el.find('.treema-error').remove()
    @$el.removeClass('treema-has-error')


# TreemaNode subclasses -------------------------------------------------------
    
class StringTreemaNode extends TreemaNode
  setValueForReading: (valEl) -> @setValueForReadingSimply(valEl, 'treema-string', "\"#{@data}\"")    
  setValueForEditing: (valEl) -> @setValueForEditingSimply(valEl, @data)
  saveChanges: (valEl) -> @data = $('input', valEl).val()
    
class NumberTreemaNode extends TreemaNode
  setValueForReading: (valEl) -> @setValueForReadingSimply(valEl, 'treema-number', JSON.stringify(@data))
  setValueForEditing: (valEl) -> @setValueForEditingSimply(valEl, JSON.stringify(@data))
  saveChanges: (valEl) -> @data = parseFloat($('input', valEl).val())

class NullTreemaNode extends TreemaNode
  editable: false
  setValueForReading: (valEl) -> @setValueForReadingSimply(valEl, 'treema-null', 'null')
    
class BooleanTreemaNode extends TreemaNode
  skipTab: true
  setValueForReading: (valEl) -> @setValueForReadingSimply(valEl, 'treema-boolean', JSON.stringify(@data))
  onClick: (e) ->
    # Override the normal behavior for clicking the value, just flip the value instead.
    value = $(e.target).closest('.treema-value')
    if value.length
      @data = not @data
      @setValueForReading($('.treema-value', @$el).empty())
      return
    super(e)
  
class ArrayTreemaNode extends TreemaNode
  collection: true
  ordered: true
  
  getChildren: -> ([key, value, @getChildSchema()] for value, key in @data)
  getChildSchema: -> @schema.items or {}
  setValueForReading: (valEl) -> @setValueForReadingSimply(valEl, 'treema-array', "[#{@data.length}]")
  setValueForEditing: (valEl) -> @setValueForEditingSimply(valEl, JSON.stringify(@data))
    
class ObjectTreemaNode extends TreemaNode
  collection: true
  keyed: true
  
  getChildren: -> ([key, value, @getChildSchema(key)] for key, value of @data)
  getChildSchema: (key_or_title) ->
    for key, child_schema of @schema.properties
      return child_schema if key is key_or_title or child_schema.title is key_or_title
    {}

  setValueForEditing: (valEl) -> @setValueForEditingSimply(valEl, JSON.stringify(@data))
  setValueForReading: (valEl) ->
    size = Object.keys(@data).length
    @setValueForReadingSimply(valEl, 'treema-object', "[#{size}]")

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
