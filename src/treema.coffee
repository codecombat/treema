class TreemaNode
  """
  Base class for a single node in the Treema.
  """
  
  schema: {}
  lastOutput: null
  
  nodeString: '<div class="treema-node"><div class="treema-value"></div></div>'
  childrenString: '<div class="treema-children"></div>'
  grabberString: '<span class="treema-grabber"> G </span>'
  toggleString: '<span class="treema-toggle"> T </span>'
  keyString: '<span class="treema-key"></span>'
  
  collection: false
  ordered: false
  keyed: false
  
  constructor: (@schema, @data, options, @child) ->
    @options = options or {}
    
  isValid: -> tv4.validate(@getData(), @schema)
  getErrors: -> tv4.validateMultiple(@getData(), @schema)['errors']
  getMissing: -> tv4.validateMultiple(@getData(), @schema)['missing']
    
  nodeElement: -> $(@nodeString)
  valueElement: -> $('<span>undefined</span>')
    
  build: ->
    @$el = @nodeElement()
    valEl = $('.treema-value', @$el)
    valEl.append(@valueElement())
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
    
  onClick: (e) ->
    value = $(e.target).closest('.treema-value')
    if value.length
      if @collection then @open() else @toggleEdit()
    console.log($(e.target).hasClass('treema-toggle'), e.target)
    @toggle() if $(e.target).hasClass('treema-toggle')
    
      
  toggleEdit: ->
#    valEl = $('.treema-value', @$el)
    
  getChildren: -> [] # should be list of key-value-schema tuples 
    
  toggle: ->
    if @$el.hasClass('closed') then @open() else @close()
      
  open: ->
    childrenContainer = @$el.find('.treema-children').detach()
    childrenContainer.empty()
    children = @getChildren()
    for child in children
      [key, value, schema] = child
      treema = makeTreema(schema, value, {}, true)
      childNode = treema.build()
      childNode.prepend($(@keyString).text(key + ' : ')) if @keyed
      childNode.prepend($(@toggleString)) if treema.collection
      childNode.prepend($(@grabberString)) if @ordered
      childrenContainer.append(childNode)
    @$el.append(childrenContainer).removeClass('closed').addClass('open')
    
  close: ->
    @$el.find('.treema-children').empty()
    @$el.addClass('closed').removeClass('open')
  



class StringTreemaNode extends TreemaNode
  """
  Basic 'string' type node.
  """

  valueElementString: '<pre class="treema-string"></pre>'
  valueElementEditingString: '<input />'
  
  valueElement: ->
    e = $(@valueElementString).text("'#{@data}'")
    return e
    
  valueElementEditing: ->
    return $(@valueElementEditingString).val(@data)
  

class ArrayTreemaNode extends TreemaNode
  """
  Basic 'array' type node.
  """
  
  collection: true
  ordered: true
  
  valueElementString: '<span></span>'
  
  getChildren: ->
    ([key, value, @schema.items] for value, key in @data)

  valueElement: ->
    return $(@valueElementString).text("[#{@data.length}]")
    
class ObjectTreemaNode extends TreemaNode
  """
  Basic 'object' type node.
  """
  
  collection: true
  keyed: true
  
  getChildren: ->
    ([key, value, @schema.properties[key]] for key, value of @data)
    
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
  
  