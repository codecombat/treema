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
  grabberString: '<span class="treema-grabber"> G </span>'
  toggleString: '<span class="treema-toggle"> T </span>'
  keyString: '<span class="treema-key"></span>'
  errorString: '<div class="treema-error"></div>'
  
  collection: false
  ordered: false
  keyed: false
  
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
      node = $(e.target).closest('.treema-node').data('instance').onClick(e)
    @$el.keydown (e) =>
      node = $(e.target).closest('.treema-node').data('instance').onKeyDown(e)
    
  onClick: (e) ->
    return if e.target.nodeName in ['INPUT', 'TEXTAREA']

    value = $(e.target).closest('.treema-value')
    if value.length
      if @collection then @open() else @toggleEdit()

    @toggleOpen() if $(e.target).hasClass('treema-toggle')

    value = $(e.target).closest('.treema-add-child')
    @addNewChild() if value.length and @collection
    
  onKeyDown: (e) ->
    if e.which is 9 # TAB
      nextInput = $(e.target).find('+ input, + textarea')
      return if nextInput.length > 0 # go to next input as normal
      
      nextChild = @$el.find('+ .treema-node:first')
      if nextChild.length > 0
        instance = nextChild.data('instance')
        return if instance.collection # TODO: what should the behavior be here exactly?
        instance.toggleEdit('edit')
        return e.preventDefault()
        
      if @parent?.collection
        @parent.addNewChild()
        return e.preventDefault()
    
  toggleEdit: (toClass) ->
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
      @stopEdits()
      TreemaNode.lastEditing = @

  getChildren: -> [] # should be list of key-value-schema tuples

  addNewChild: ->
    
    if @ordered # array
      new_index = @childrenTreemas.length
      schema = @getChildSchema()
      newTreema = @addChildTreema(new_index, undefined, schema)
      childNode = @createChildNode(newTreema)
      @$el.find('.treema-add-child').before(childNode)
      newTreema.toggleEdit('edit')
    
    # if object
    
    #   if properties
    
    #     create list of possible properties
    
    #   if additionalproperties is false, and no patternproperties, create select box using list
    
    #   else
    
    #     create textbox
    
    #     if we have a list of possible properties, and autocomplete is available, set it up
    
    

  propagateData: ->
    return unless @parent
    @parent.data[@parentKey] = @data
  
  stopEdits: ->
    TreemaNode.lastEditing?.toggleEdit('read') if TreemaNode.lastEditing isnt @
    
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
    
  addChildTreema: (key, value, schema) ->
    treema = makeTreema(schema, value, {}, true)
    treema.parentKey = key
    treema.parent = @
    @childrenTreemas[key] = treema
    treema
    
  createChildNode: (treema) ->
    childNode = treema.build()
    childNode.prepend($(@keyString).text(treema.parentKey + ' : ')) if @keyed
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
    input = $('<input />').val(@data)
    valEl.append(input)
    input.focus()
    input.blur =>
      @.toggleEdit('read') if $('.treema-value', @$el).hasClass('edit')
      
  saveChanges: (valEl) ->
    window.what = valEl
    @data = $('input', valEl).val()
  

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


TreemaNodeMap =
  'array': ArrayTreemaNode
  'string': StringTreemaNode
  'object': ObjectTreemaNode

makeTreema = (schema, data, options, child) ->
  NodeClass = TreemaNodeMap[schema.format]
  unless NodeClass
    NodeClass = TreemaNodeMap[schema.type]
  unless NodeClass
    return null
    
  return new NodeClass(schema, data, options, child)
