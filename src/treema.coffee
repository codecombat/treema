class TreemaNode
  """
  Base class for a single node in the Treema.
  """
  
  schema: {}
  lastOutput: null
  
  nodeString: '''<div class="treema-node treema-clearfix">
    <div class="treema-value"></div>
  </div>'''
  childrenString: '<div class="treema-children"></div>'
  addChildString: '<div class="treema-add-child">+</div>'
  newPropertyString: '<input class="treema-new-prop" />'
  grabberString: '<span class="treema-grabber"> G </span>'
  toggleString: '<span class="treema-toggle"> T </span>'
  keyString: '<span class="treema-key"></span>'
  errorString: '<div class="treema-error"></div>'
  
  collection: false
  ordered: false
  keyed: false
  editable: true
  skipTab: false
  
  constructor: (@schema, @data, options, @child) ->
    @options = options or {}
    
  isValid: -> tv4.validate(@data, @schema)
  getErrors: -> tv4.validateMultiple(@data, @schema)['errors']
  getMissing: -> tv4.validateMultiple(@data, @schema)['missing']
    
  nodeElement: -> $(@nodeString)
  setValueForReading: (valEl) -> valEl.append($('<span>undefined</span>'))
  setValueForEditing: (valEl) -> valEl.append($('<span>no edit</span>'))
  saveChanges: (valEl) ->
    
  build: ->
    @$el = @nodeElement()
    valEl = $('.treema-value', @$el)
    @setValueForReading(valEl)
    valEl.addClass('read') unless @collection
    @$el.data('instance', @)
    @$el.addClass('treema-root') unless @child
    @$el.append($(@childrenString)).addClass('closed') if @collection
    @open() if @collection and not @child
    @setUpEvents() unless @child
    @$el
    
  setUpEvents: ->
    @$el.click (e) =>
      node = $(e.target).closest('.treema-node').data('instance')?.onClick(e)
    @$el.keydown (e) =>
      node = $(e.target).closest('.treema-node').data('instance')?.onKeyDown(e)
    
  onClick: (e) ->
    return if e.target.nodeName in ['INPUT', 'TEXTAREA']

    value = $(e.target).closest('.treema-value')
    if value.length
      if @collection then @open() else @toggleEdit()

    @toggleOpen() if $(e.target).hasClass('treema-toggle')

    value = $(e.target).closest('.treema-add-child')
    @addNewChild() if value.length and @collection
    
  onKeyDown: (e) ->
    if e.which is 27 # ESC
      $(e.target).data('escaped', true).blur()
    
    if e.which is 9 # TAB
      dir = if e.shiftKey then 'prev' else 'next'
      target = $(e.target)
      
      if target.hasClass('treema-new-prop')
        e.preventDefault()
        target.blur()
        
      # figure this out later
#      nextInput = target.find('+ input, + textarea')
#      return if nextInput.length > 0 # go to next input as normal

      nextChild = @$el[dir]()
      while true
        if nextChild.length > 0
          instance = nextChild.data('instance')
          break unless instance
          if instance.collection or instance.skipTab
            nextChild = nextChild[dir]()
            continue
          instance.toggleEdit('edit')
          return e.preventDefault()
        break
        
      if @parent?.collection
        @parent.addNewChild()
        return e.preventDefault()
    
  toggleEdit: (toClass) ->
    return unless @editable
    valEl = $('.treema-value', @$el)
    wasEditing = valEl.hasClass('edit')
    valEl.toggleClass('read edit') unless toClass and valEl.hasClass(toClass)
    
    if valEl.hasClass('read')
      if wasEditing
        @saveChanges(valEl)
        @removeError()
        @showErrors()

      @propagateData()
      valEl.empty()
      @setValueForReading(valEl)
      
    if valEl.hasClass('edit')
      valEl.empty()
      @setValueForEditing(valEl)
      
  getChildren: -> [] # should be list of key-value-schema tuples
  
  getMyAddButton: ->
    @$el.find('> .treema-children > .treema-add-child')

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
      keyInput = $(@newPropertyString)
      keyInput.autocomplete?(source: properties)
      @getMyAddButton().before(keyInput)
      keyInput.focus()
      keyInput.blur (e) =>
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
    
  childPropertiesAvailable: ->
    return [] unless @schema.properties
    properties = []
    for property, childSchema of @schema.properties
      continue if @childrenTreemas[property]?
      properties.push(childSchema.title or property)
    properties.sort()

  propagateData: ->
    return unless @parent
    @parent.data[@parentKey] = @data
  
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
    childrenContainer.append($(@addChildString))
    if @ordered and childrenContainer.sortable
      onchange = => @sortFromUI()
      childrenContainer.sortable?(deactivate: onchange).disableSelection?()

  sortFromUI: ->
    children_wrapper = @$el.find('> .treema-children')
    index = 0
    for child in children_wrapper[0].children
      treema = $(child).data('instance')
      continue unless treema
      treema.parentKey = index
      @childrenTreemas[index] = treema
      @data[index] = treema.data
      index += 1
    
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
      keyEl = $(@keyString).text(name + ' : ')
      keyEl.attr('title', treema.schema.description) if treema.schema.description
      childNode.prepend(keyEl)
    childNode.prepend($(@toggleString)) if treema.collection
    childNode.prepend($(@grabberString)) if @ordered
    childNode

  close: ->
    @data[key] = treema.data for key, treema of @childrenTreemas
    @$el.find('.treema-children').empty()
    @$el.addClass('closed').removeClass('open')
    @childrenTreemas = null
    
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
    @$el.append($(@errorString))    
    @$el.find('> .treema-error').text(message).show()
    @$el.addClass('treema-has-error')
    
  removeError: ->
    @$el.find('.treema-error').remove()
    @$el.removeClass('treema-has-error')


class StringTreemaNode extends TreemaNode
  """
  Basic 'string' type node.
  """

  setValueForReading: (valEl) ->
    valEl.append(
      $('<pre class="treema-string"></pre>')
        .text("'#{@data}'"))
    
  setValueForEditing: (valEl) ->
    input = $('<input />')
    input.val(@data) unless @data is null
    valEl.append(input)
    input.focus()
    input.select()
    input.blur =>
      @.toggleEdit('read') if $('.treema-value', @$el).hasClass('edit')
      
  saveChanges: (valEl) ->
    @data = $('input', valEl).val()

    
class NumberTreemaNode extends TreemaNode
  """
  Basic 'number' type node.
  """
  
  setValueForReading: (valEl) ->
    valEl.append(
      $('<pre class="treema-number"></pre>')
        .text("#{@data}"))

  setValueForEditing: (valEl) ->
    input = $('<input />')
    input.val(JSON.stringify(@data)) unless @data is null
    valEl.append(input)
    input.focus()
    input.select()
    input.blur =>
      @.toggleEdit('read') if $('.treema-value', @$el).hasClass('edit')

  saveChanges: (valEl) ->
    @data = parseFloat($('input', valEl).val())

    
class NullTreemaNode extends TreemaNode
  """
  Basic 'number' type node.
  """

  editable: false

  setValueForReading: (valEl) ->
    valEl.append($('<pre class="treema-null">null</pre>'))

    
class BooleanTreemaNode extends TreemaNode
  """
  Basic 'boolean' type node.
  """
  
  skipTab: true

  onClick: (e) ->
    '''
    Override the normal behavior for clicking the value, just flip the value instead.
    '''

    value = $(e.target).closest('.treema-value')
    if value.length
      @data = not @data
      valEl = $('.treema-value', @$el)
      valEl.empty()
      @setValueForReading(valEl)
      return
      
    super(e)
  
  setValueForReading: (valEl) ->
    valEl.append(
      $('<pre class="treema-boolean"></pre>')
        .text("#{@data}"))

class ArrayTreemaNode extends TreemaNode
  """
  Basic 'array' type node.
  """
  
  collection: true
  ordered: true
  
  getChildren: ->
    ([key, value, @getChildSchema()] for value, key in @data)
    
  getChildSchema: ->
    @schema.items or {}

  setValueForReading: (valEl) ->
    valEl.append($('<span></span>').text("[#{@data.length}]"))

    
class ObjectTreemaNode extends TreemaNode
  """
  Basic 'object' type node.
  """
  
  collection: true
  keyed: true
  
  getChildren: ->
    ([key, value, @getChildSchema(key)] for key, value of @data)
    
  getChildSchema: (key_or_title) ->
    for key, child_schema of @schema.properties
      return child_schema if key is key_or_title or child_schema.title is key_or_title
    {}
    
  valueElement: ->
    return $(@valueElementString).text("{#{@data.length}}")

  setValueForReading: (valEl) ->
    size = Object.keys(@data).length
    valEl.append($('<span></span>').text("{#{size}}"))
    
class AnyTreemaNode extends TreemaNode
  """
  Super flexible input, can handle inputs like:
    true      (Boolean)
    'true     (string "true", anything that starts with ' or " is treated as a string, like in spreadsheet programs)
    1.2       (number)
    [         (empty array)
    {         (empty object)
    [1,2,3]   (array with tree values)
    null
  """

  helper: null
  
  constructor: (splat...) ->
    super(splat...)
    @updateShadowMethods()
  
  setValueForEditing: (valEl) ->
    input = $('<input id="what" />').val(JSON.stringify(@data))
    valEl.append(input)
    valEl.find('input').focus()
    
    input.focus()
    input.select()
    input.blur =>
      @.toggleEdit('read') if $('.treema-value', @$el).hasClass('edit')

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
    dataType = $.type(@data)
    NodeClass = TreemaNodeMap[dataType]
    @helper = new NodeClass(@schema, @data, @options, @child)
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
