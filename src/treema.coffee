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
    
  onClick: (e) ->
    return if e.target.nodeName in ['INPUT', 'TEXTAREA']
    value = $(e.target).closest('.treema-value')
    if value.length
      if @collection then @open() else @toggleEdit()
    @toggleOpen() if $(e.target).hasClass('treema-toggle')
    
  toggleEdit: (toClass) ->
    valEl = $('.treema-value', @$el)
    wasEditing = valEl.hasClass('edit')
    valEl.toggleClass('read edit') unless toClass and valEl.hasClass(toClass)
    
    if valEl.hasClass('read')
      @saveChanges(valEl) if wasEditing
      valEl.empty()
      @setValueForReading(valEl)
      
    if valEl.hasClass('edit')
      valEl.empty()
      @setValueForEditing(valEl)
      TreemaNode.lastEditing?.toggleEdit('read') if TreemaNode.lastEditing isnt @
      TreemaNode.lastEditing = @

  getChildren: -> [] # should be list of key-value-schema tuples 
    
  toggleOpen: ->
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
    ([key, value, @schema.items] for value, key in @data)

  setValueForReading: (valEl) ->
    valEl.append($('<span></span>').text("[#{@data.length}]"))
    
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

console.log('make treema!')

makeTreema = (schema, data, options, child) ->
  NodeClass = TreemaNodeMap[schema.format]
  unless NodeClass
    NodeClass = TreemaNodeMap[schema.type]
  unless NodeClass
    return null
    
  return new NodeClass(schema, data, options, child)
  
console.log('done!')