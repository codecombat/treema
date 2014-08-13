do __init = ->

  TreemaNode.setNodeSubclass 'string', class StringNode extends TreemaNode
    valueClass: 'treema-string'
    getDefaultValue: -> ''
    @inputTypes = ['color', 'date', 'datetime', 'datetime-local',
                   'email', 'month', 'range', 'search',
                   'tel', 'text', 'time', 'url', 'week']

    buildValueForDisplay: (valEl) -> @buildValueForDisplaySimply(valEl, "\"#{@data}\"")

    buildValueForEditing: (valEl) ->
      input = @buildValueForEditingSimply(valEl, @data)
      input.attr('maxlength', @schema.maxLength) if @schema.maxLength
      input.attr('type', @schema.format) if @schema.format in StringNode.inputTypes

    saveChanges: (valEl) -> 
      oldData = @data
      @data = $('input', valEl).val()
      super(oldData)


  TreemaNode.setNodeSubclass 'number', class NumberNode extends TreemaNode
    valueClass: 'treema-number'
    getDefaultValue: -> 0

    buildValueForDisplay: (valEl) -> @buildValueForDisplaySimply(valEl, JSON.stringify(@data))

    buildValueForEditing: (valEl) ->
      input = @buildValueForEditingSimply(valEl, JSON.stringify(@data), 'number')
      input.attr('max', @schema.maximum) if @schema.maximum
      input.attr('min', @schema.minimum) if @schema.minimum

    saveChanges: (valEl) -> 
      oldData = @data
      @data = parseFloat($('input', valEl).val())
      super(oldData)


  TreemaNode.setNodeSubclass 'integer', class IntegerNode extends TreemaNode
    valueClass: 'treema-integer'
    getDefaultValue: -> 0

    buildValueForDisplay: (valEl) -> @buildValueForDisplaySimply(valEl, JSON.stringify(@data))

    buildValueForEditing: (valEl) ->
      input = @buildValueForEditingSimply(valEl, JSON.stringify(@data), 'number')
      input.attr('max', @schema.maximum) if @schema.maximum
      input.attr('min', @schema.minimum) if @schema.minimum

    saveChanges: (valEl) -> 
      oldData = @data
      @data = parseInt($('input', valEl).val())
      super(oldData)



  TreemaNode.setNodeSubclass 'null', NullNode = class NullNode extends TreemaNode
    valueClass: 'treema-null'
    editable: false
    buildValueForDisplay: (valEl) -> @buildValueForDisplaySimply(valEl, 'null')



  TreemaNode.setNodeSubclass 'boolean', class BooleanNode extends TreemaNode
    valueClass: 'treema-boolean'
    getDefaultValue: -> false

    buildValueForDisplay: (valEl) -> 
      @buildValueForDisplaySimply(valEl, JSON.stringify(@data))
      @select()

    buildValueForEditing: (valEl) ->
      input = @buildValueForEditingSimply(valEl, JSON.stringify(@data))
      $('<span></span>').text(JSON.stringify(@data)).insertBefore(input)
      input.focus()

    toggleValue: (newValue=null) ->
      oldData = @data
      @data = not @data
      @data = newValue if newValue?
      valEl = @getValEl().empty()
      if @isDisplaying() then @buildValueForDisplay(valEl) else @buildValueForEditing(valEl)
      @addTrackedAction {'oldData':oldData, 'newData':@data, 'path':@getPath(), 'action':'edit'}
      @select()
      @flushChanges()

    onSpacePressed: -> @toggleValue()
    onFPressed: -> @toggleValue(false)
    onTPressed: -> @toggleValue(true)
    saveChanges: -> 
    onClick: (e) ->
      value = $(e.target).closest('.treema-value')
      return super(e) unless value.length
      @toggleValue() if @canEdit()



  TreemaNode.setNodeSubclass 'array', class ArrayNode extends TreemaNode
    valueClass: 'treema-array'
    getDefaultValue: -> []
    collection: true
    ordered: true
    directlyEditable: false
    sort: false

    getChildren: ->
      ([key, value, @getChildSchema(key)] for value, key in @data)

    getChildSchema: (index) ->
      schema = @workingSchema or @schema
      return {} unless schema.items? or schema.additionalItems?
      return @resolveReference(schema.items, true) if $.isPlainObject(schema.items)
      return @resolveReference(schema[index], true) if index  < schema.length
      return @resolveReference(schema.additionalItems, true) if $.isPlainObject(schema.additionalItems)
      return {}

    buildValueForDisplay: (valEl) ->
      text = []
      return unless @data
      for child, index in @data[..2]
        helperTreema = TreemaNode.make(null, {schema: @getChildSchema(index), data:child}, @)
        val = $('<div></div>')
        helperTreema.buildValueForDisplay(val)
        text.push(val.text())
      text.push('...') if @data.length > 3

      empty = if @schema.title? then "(empty #{@schema.title})" else '(empty)'
      text = if text.length then text.join(' | ') else empty
      @buildValueForDisplaySimply(valEl, text)

    buildValueForEditing: (valEl) -> @buildValueForEditingSimply(valEl, JSON.stringify(@data))

    canAddChild: ->
      return false if @settings.readOnly or @schema.readOnly
      return false if @schema.additionalItems is false and @data.length >= @schema.items.length
      return false if @schema.maxItems? and @data.length >= @schema.maxItems
      return true

    addNewChild: ->
      return unless @canAddChild()
      @open() if @isClosed()
      new_index = Object.keys(@childrenTreemas).length
      schema = @getChildSchema(new_index)
      newTreema = TreemaNode.make(undefined, {schema: schema}, @, new_index)
      newTreema.justCreated = true
      newTreema.tv4 = @tv4
      childNode = @createChildNode(newTreema)
      @addTrackedAction {'data':newTreema.data, 'path':newTreema.getPath(), 'parentPath':@getPath(), 'action':'insert'}
      @getAddButtonEl().before(childNode)
      if newTreema.canEdit()
        newTreema.edit()
      else
        newTreema.select()
        @integrateChildTreema(newTreema)
        newTreema.flushChanges()
      newTreema

    open: ->
      @data.sort(@sortFunction) if @sort
      super(arguments...)
      shouldShorten = @buildValueForDisplay is ArrayNode.prototype.buildValueForDisplay
      shouldShorten = false
      if shouldShorten
        valEl = @getValEl().empty()
        @buildValueForDisplaySimply(valEl, '[...]') if shouldShorten

    close: ->
      super(arguments...)
      valEl = @getValEl().empty()
      @buildValueForDisplay(valEl)

    # auto sorting methods

    sortFunction: (a, b) ->
      return 1 if a > b
      return -1 if a < b
      return 0

  window.TreemaArrayNode = ArrayNode  # TODO: how should we be making these available?

  TreemaNode.setNodeSubclass 'object', class ObjectNode extends TreemaNode
    valueClass: 'treema-object'
    getDefaultValue: ->
      d = {}
      return d unless @schema?.properties
      for childKey, childSchema of @schema.properties
        d[childKey] = childSchema.default if childSchema.default
      d

    collection: true
    keyed: true
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
      schema = @workingSchema or @schema
      for key, child_schema of schema.properties
        return @resolveReference(child_schema, true) if key is key_or_title or child_schema.title is key_or_title
      for key, child_schema of schema.patternProperties
        re = new RegExp(key)
        return @resolveReference(child_schema, true) if key_or_title.match(re)
      return @resolveReference(schema.additionalProperties, true) if $.isPlainObject(schema.additionalProperties)
      return {}

    buildValueForDisplay: (valEl) ->
      text = []
      return unless @data

      displayValue = @data[@schema.displayProperty]
      if displayValue
        text = displayValue
        return @buildValueForDisplaySimply(valEl, text)

      i = 0
      schema = @workingSchema or @schema
      for key, value of @data
        if i is 3
          text.push('...')
          break
        i += 1

        name = @getChildSchema(key).title or key
        if $.isPlainObject(value) or $.isArray(value)
          text.push "#{name}"
          continue

        valueString = value
        valueString = JSON.stringify(value) unless $.type(value) is 'string'
        valueString = 'undefined' if typeof value is 'undefined'
        valueString = valueString[..20] + ' ...' if valueString.length > 20
        text.push "#{name}=#{valueString}"

      empty = if @schema.title? then "(empty #{@schema.title})" else '(empty)'
      text = if text.length then text.join(', ') else empty
      @buildValueForDisplaySimply(valEl, text)

    buildValueForEditing: (valEl) -> @buildValueForEditingSimply(valEl, JSON.stringify(@data))

    populateData: ->
      super()
      return unless @schema.required
      for key in @schema.required
        continue if @data[key]?
        helperTreema = TreemaNode.make(null, {schema: @getChildSchema(key)}, @)
        helperTreema.populateData()
        @data[key] = helperTreema.data

    open: ->
      super(arguments...)
      shouldShorten = @buildValueForDisplay is ObjectNode.prototype.buildValueForDisplay
      shouldShorten = false
      if shouldShorten
        valEl = @getValEl().empty()
        @buildValueForDisplaySimply(valEl, '{...}') if shouldShorten

    close: ->
      super(arguments...)
      valEl = @getValEl().empty()
      @buildValueForDisplay(valEl)

    # adding children ---------------------------------------------------------

    addNewChild: ->
      return unless @canAddChild()
      @open() unless @isRoot()
      @deselectAll()
      properties = @childPropertiesAvailable()
      keyInput = $(@newPropertyTemplate)
      keyInput.blur @cleanupAddNewChild
      keyInput.keydown (e) =>
        @originalTargetValue = $(e.target).val()
      keyInput.autocomplete?(source: properties, minLength: 0, delay: 0, autoFocus: true, select: @onAutocompleteSelect)
      @getAddButtonEl().before(keyInput).hide()
      keyInput.focus()
      keyInput.autocomplete('search')
      true
      
    onAutocompleteSelect: (e, ui) =>
      $(e.target).val(ui.item.value)
      @tryToAddNewChild(e, true)

    canAddChild: ->
      return false if @settings.readOnly or @schema.readOnly
      return false if @schema.maxProperties? and Object.keys(@data).length >= @schema.maxProperties
      return true if @schema.additionalProperties isnt false
      return true if @schema.patternProperties?
      return true if @childPropertiesAvailable().length
      return false

    childPropertiesAvailable: ->
      schema = @workingSchema or @schema
      return [] unless schema.properties
      properties = []
      for property, childSchema of schema.properties
        continue if @data[property]?
        continue if childSchema.format is 'hidden'
        continue if childSchema.readOnly
        properties.push(childSchema.title or property)
      properties.sort()

    # event handling when adding a new property -------------------------------

    onDeletePressed: (e) ->
      return super(e) unless @addingNewProperty()
      if not $(e.target).val()
        @cleanupAddNewChild()
        e.preventDefault()
        @$el.find('.treema-add-child').focus()

    onEscapePressed: ->
      @cleanupAddNewChild()

    onTabPressed: (e) ->
      return super(e) unless @addingNewProperty()
      e.preventDefault()
      @tryToAddNewChild(e, false)

    onEnterPressed: (e) ->
      return super(e) unless @addingNewProperty()
      @tryToAddNewChild(e, true)

    # new property behavior ---------------------------------------------------

    tryToAddNewChild: (e, aggressive) ->
      # empty input keep on moving on
      if (not @originalTargetValue) and (not aggressive)
        offset = if e.shiftKey then -1 else 1
        @cleanupAddNewChild()
        @$el.find('.treema-add-child').focus()
        @traverseWhileEditing(offset)
        return

      keyInput = $(e.target)
      key = @getPropertyKey($(e.target))

      # invalid input, stay put and show an error
      if key.length and not @canAddProperty(key)
        @clearTemporaryErrors()
        @showBadPropertyError(keyInput)
        return

      # if this is a prop we already have, just edit that instead
      if @childrenTreemas[key]?
        @cleanupAddNewChild()
        treema = @childrenTreemas[key]
        return if treema.canEdit() then treema.toggleEdit() else treema.select()

      # otherwise add the new child
      @cleanupAddNewChild()
      @addNewChildForKey(key)

    getPropertyKey: (keyInput) ->
      key = keyInput.val()
      if @schema.properties
        for child_key, child_schema of @schema.properties
          key = child_key if child_schema.title is key
      key

    canAddProperty: (key) ->
      return true unless @schema.additionalProperties is false
      return true if @schema.properties[key]?
      if @schema.patternProperties?
        return true if RegExp(pattern).test(key) for pattern of @schema.patternProperties
      return false

    showBadPropertyError: (keyInput) ->
      keyInput.focus()
      tempError = @createTemporaryError('Invalid property name.')
      tempError.insertAfter(keyInput)
      return

    addNewChildForKey: (key) ->
      schema = @getChildSchema(key)
      newTreema = TreemaNode.make(null, {schema: schema}, @, key)
      childNode = @createChildNode(newTreema)
      @findObjectInsertionPoint(key).before(childNode)
      if newTreema.canEdit()
        newTreema.edit()
      else
        @integrateChildTreema(newTreema)
        # new treemas may already have children from default
        children = newTreema.getChildren()
        if children.length
          newTreema.open()
          child = newTreema.childrenTreemas[children[0][0]]
          child.select()
        else
          newTreema.addNewChild()

      @addTrackedAction {'data':newTreema.data, 'path':newTreema.getPath(), 'parentPath':@getPath(), action:'insert'}
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

    # adding utilities --------------------------------------------------------

    cleanupAddNewChild: =>
      @$el.find('.treema-new-prop').remove()
      @getAddButtonEl().show()
      @clearTemporaryErrors()

    addingNewProperty: -> document.activeElement is @$el.find('.treema-new-prop')[0]

  window.TreemaObjectNode = ObjectNode  # TODO: how should we be making these available?

  TreemaNode.setNodeSubclass 'any', class AnyNode extends TreemaNode

    helper: null

    constructor: (splat...) ->
      super(splat...)
      @updateShadowMethods()

    buildValueForEditing: (valEl) -> @buildValueForEditingSimply(valEl, JSON.stringify(@data))
    saveChanges: (valEl) ->
      oldData = @data
      @data = $('input', valEl).val()
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
      super(oldData)
      @updateShadowMethods()
      @rebuild()

    updateShadowMethods: ->
      # This node takes on the behaviors of the other basic nodes.
      NodeClass = TreemaNode.getNodeClassForSchema({type:$.type(@data)})
      @helper = new NodeClass(@schema, {data: @data, options: @options}, @parent)
      @helper.tv4 = @tv4
      for prop in ['collection', 'ordered', 'keyed', 'getChildSchema', 'getChildren', 'getChildSchema',
                   'buildValueForDisplay', 'addNewChild', 'childPropertiesAvailable']
        @[prop] = @helper[prop]

    rebuild: ->
      oldEl = @$el
      if @parent
        newNode = @parent.createChildNode(@)
      else
        newNode = @build()
      @$el = newNode

    onClick: (e) ->
      return if e.target.nodeName in ['INPUT', 'TEXTAREA']
      clickedValue = $(e.target).closest('.treema-value').length  # Clicks are in children of .treema-value nodes
      usedModKey = e.shiftKey or e.ctrlKey or e.metaKey
      return @toggleEdit() if clickedValue and not usedModKey
      super(e)
