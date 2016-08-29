do __init = ->

  TreemaNode.setNodeSubclass 'string', class StringNode extends TreemaNode
    valueClass: 'treema-string'
    @inputTypes = ['color', 'date', 'datetime', 'datetime-local',
                   'email', 'month', 'range', 'search',
                   'tel', 'text', 'time', 'url', 'week']

    buildValueForDisplay: (valEl, data) -> @buildValueForDisplaySimply(valEl, "\"#{data}\"")

    buildValueForEditing: (valEl, data) ->
      input = @buildValueForEditingSimply(valEl, data)
      input.attr('maxlength', @workingSchema.maxLength) if @workingSchema.maxLength
      input.attr('type', @workingSchema.format) if @workingSchema.format in StringNode.inputTypes

    saveChanges: (valEl) -> 
      oldData = @data
      @data = $('input', valEl).val()
      super(oldData)


  TreemaNode.setNodeSubclass 'number', class NumberNode extends TreemaNode
    valueClass: 'treema-number'

    buildValueForDisplay: (valEl, data) -> @buildValueForDisplaySimply(valEl, JSON.stringify(data))

    buildValueForEditing: (valEl, data) ->
      input = @buildValueForEditingSimply(valEl, JSON.stringify(data), 'number')
      input.attr('max', @workingSchema.maximum) if @workingSchema.maximum
      input.attr('min', @workingSchema.minimum) if @workingSchema.minimum

    saveChanges: (valEl) -> 
      oldData = @data
      @data = parseFloat($('input', valEl).val())
      super(oldData)


  TreemaNode.setNodeSubclass 'integer', class IntegerNode extends TreemaNode
    valueClass: 'treema-integer'
    
    buildValueForDisplay: (valEl, data) -> @buildValueForDisplaySimply(valEl, JSON.stringify(data))

    buildValueForEditing: (valEl, data) ->
      input = @buildValueForEditingSimply(valEl, JSON.stringify(data), 'number')
      input.attr('max', @workingSchema.maximum) if @workingSchema.maximum
      input.attr('min', @workingSchema.minimum) if @workingSchema.minimum

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
    
    buildValueForDisplay: (valEl, data) ->
      @buildValueForDisplaySimply(valEl, JSON.stringify(data))
      @keepFocus()

    buildValueForEditing: (valEl, data) ->
      input = @buildValueForEditingSimply(valEl, JSON.stringify(data))
      $('<span></span>').text(JSON.stringify(@data)).insertBefore(input)
      input.focus()

    toggleValue: (newValue=null) ->
      oldData = @getData()
      @data = not @data
      @data = newValue if newValue?
      valEl = @getValEl().empty()
      if @isDisplaying() then @buildValueForDisplay(valEl, @getData()) else @buildValueForEditing(valEl, @getData())
      @addTrackedAction {'oldData':oldData, 'newData':@data, 'path':@getPath(), 'action':'edit'}
      @keepFocus()
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
    collection: true
    ordered: true
    directlyEditable: false
    sort: false

    getChildren: ->
      ({
        key: key
        value: value
        schema: @getChildSchema(key)
      } for value, key in @getData())

    buildValueForDisplay: (valEl, data) ->
      text = []
      return unless data
      for child, index in data[..2]
        helperTreema = TreemaNode.make(null, {schema: TreemaNode.utils.getChildSchema(index, @workingSchema), data:child}, @)
        val = $('<div></div>')
        helperTreema.buildValueForDisplay(val, helperTreema.getData())
        text.push(val.text())
      text.push('...') if data.length > 3

      empty = if @workingSchema.title? then "(empty #{@workingSchema.title})" else '(empty)'
      text = if text.length then text.join(' | ') else empty
      @buildValueForDisplaySimply(valEl, text)

    buildValueForEditing: (valEl, data) -> @buildValueForEditingSimply(valEl, JSON.stringify(data))

    canAddChild: ->
      return false if @settings.readOnly or @workingSchema.readOnly
      return false if @workingSchema.additionalItems is false and @getData().length >= @workingSchema.items.length
      return false if @workingSchema.maxItems? and @getData().length >= @workingSchema.maxItems
      return true

    addNewChild: ->
      return unless @canAddChild()
      @open() if @isClosed()
      new_index = Object.keys(@childrenTreemas).length
      schema = TreemaNode.utils.getChildSchema(new_index, @workingSchema)
      newTreema = TreemaNode.make(undefined, {schema: schema}, @, new_index)
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
      @data.sort(@sortFunction) if @data and @sort
      super(arguments...)

    close: ->
      super(arguments...)
      valEl = @getValEl().empty()
      @buildValueForDisplay(valEl, @getData())

    # auto sorting methods

    sortFunction: (a, b) ->
      return 1 if a > b
      return -1 if a < b
      return 0

  window.TreemaArrayNode = ArrayNode  # TODO: how should we be making these available?

  TreemaNode.setNodeSubclass 'object', class ObjectNode extends TreemaNode
    valueClass: 'treema-object'
    collection: true
    keyed: true
    directlyEditable: false

    getChildren: ->
      # order based on properties object first
      children = []
      keysAccountedFor = []
      if @workingSchema.properties
        for key of @workingSchema.properties
          defaultData = @getDefaultDataForKey(key)

          if $.type(@getData()[key]) is 'undefined'
            if defaultData?
              keysAccountedFor.push(key)
              children.push({
                key: key, 
                schema: @getChildSchema(key)
                defaultData: defaultData
              })
            continue
            
          keysAccountedFor.push(key)
          schema = @getChildSchema(key)
          children.push({
            key: key
            value: @getData()[key]
            schema: schema
            defaultData: defaultData
          })

      for key, value of @getData()
        continue if key in keysAccountedFor
        keysAccountedFor.push(key)
        children.push({
          key: key
          value: value
          schema: @getChildSchema(key)
          defaultData: @getDefaultDataForKey(key)
        })

      if $.isPlainObject(@defaultData)
        for key of @defaultData
          continue if key in keysAccountedFor
          keysAccountedFor.push(key)
          children.push({
            key: key
            schema: @getChildSchema(key)
            defaultData: @getDefaultDataForKey(key)
          })

      if $.isPlainObject(@workingSchema.default)
        for key of @workingSchema.default
          continue if key in keysAccountedFor
          keysAccountedFor.push(key)
          children.push({
            key: key
            schema: @getChildSchema(key)
            defaultData: @getDefaultDataForKey(key)
          })

      children

    getDefaultDataForKey: (key) ->
      childDefaultData = @defaultData?[key] ? @workingSchema.default?[key]
      if $.isArray(childDefaultData) then childDefaultData = $.extend(true, [], childDefaultData)
      if $.isPlainObject(childDefaultData) then childDefaultData = $.extend(true, {}, childDefaultData)
      childDefaultData

    buildValueForDisplay: (valEl, data) ->
      text = []
      return unless data

      displayValue = data[@workingSchema.displayProperty]
      if displayValue
        text = displayValue
        return @buildValueForDisplaySimply(valEl, text)

      i = 0
      schema = @workingSchema or @schema
      for key, value of data
        continue if value is undefined
          
        if i is 3
          text.push('...')
          break
        i += 1

        childSchema = @getChildSchema(key)
        name = childSchema.title or key
        if $.isPlainObject(value) or $.isArray(value)
          text.push "#{name}"
          continue

        valueString = value
        valueString = JSON.stringify(value) unless $.type(value) is 'string'
        valueString = 'undefined' if typeof value is 'undefined'
        valueString = valueString[..20] + ' ...' if valueString.length > 20
        text.push "#{name}=#{valueString}"

      empty = if @workingSchema.title? then "(empty #{@workingSchema.title})" else '(empty)'
      text = if text.length then text.join(', ') else empty
      @buildValueForDisplaySimply(valEl, text)

    populateData: ->
      super()
      TreemaNode.utils.populateRequireds(@data, @workingSchema, @tv4)

    close: ->
      super(arguments...)
      @buildValueForDisplay(@getValEl().empty(), @getData())

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
      return false if @settings.readOnly or @workingSchema.readOnly
      return false if @workingSchema.maxProperties? and Object.keys(@getData()).length >= @workingSchema.maxProperties
      return true if @workingSchema.additionalProperties isnt false
      return true if @workingSchema.patternProperties?
      return true if @childPropertiesAvailable().length
      return false

    childPropertiesAvailable: ->
      schema = @workingSchema or @schema
      return [] unless schema.properties
      properties = []
      data = @getData()
      for property, childSchema of schema.properties
        continue if data?[property]?
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
      if @workingSchema.properties
        for child_key, child_schema of @workingSchema.properties
          key = child_key if child_schema.title is key
      key

    canAddProperty: (key) ->
      return true unless @workingSchema.additionalProperties is false
      return true if @workingSchema.properties?[key]?
      if @workingSchema.patternProperties?
        for pattern of @workingSchema.patternProperties
          return true if RegExp(pattern).test(key)
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
        if newTreema.collection
          children = newTreema.getChildren()
          if children.length
            newTreema.open()
            child = newTreema.childrenTreemas[children[0]['key']]
            child?.select()
          else
            newTreema.addNewChild()

      @addTrackedAction {'data':newTreema.data, 'path':newTreema.getPath(), 'parentPath':@getPath(), action:'insert'}
      @updateMyAddButton()

    findObjectInsertionPoint: (key) ->
      # Object children should be in the order of the schema.properties objects as much as possible
      return @getAddButtonEl() unless @workingSchema.properties?[key]
      allProps = Object.keys(@workingSchema.properties)
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
