do ->
  TreemaNode.setNodeSubclass 'point2d', class Point2DNode extends TreemaNode
    valueClass: 'treema-point2d'
    getDefaultValue: -> {x:0, y:0}

    buildValueForDisplay: (valEl) -> @buildValueForDisplaySimply(valEl, "(#{@data.x}, #{@data.y})")

    buildValueForEditing: (valEl) ->
      xInput = $('<input />').val(@data.x).attr('placeholder', 'x')
      yInput = $('<input />').val(@data.y).attr('placeholder', 'y')
      valEl.append('(').append(xInput).append(', ').append(yInput).append(')')
      valEl.find('input:first').focus().select()

    saveChanges: (valEl) ->
      @data.x = parseFloat(valEl.find('input:first').val())
      @data.y = parseFloat(valEl.find('input:last').val())

  TreemaNode.setNodeSubclass 'point3d', class Point3DNode extends TreemaNode
    valueClass: 'treema-point3d'
    getDefaultValue: -> {x:0, y:0, z:0}

    buildValueForDisplay: (valEl) ->
      @buildValueForDisplaySimply(valEl, "(#{@data.x}, #{@data.y}, #{@data.z})")

    buildValueForEditing: (valEl) ->
      xInput = $('<input />').val(@data.x).attr('placeholder', 'x')
      yInput = $('<input />').val(@data.y).attr('placeholder', 'y')
      zInput = $('<input />').val(@data.z).attr('placeholder', 'z')
      valEl.append('(').append(xInput).append(', ').append(yInput).append(', ').append(zInput).append(')')
      valEl.find('input:first').focus().select()

    saveChanges: ->
      inputs = @getInputs()
      @data.x = parseFloat($(inputs[0]).val())
      @data.y = parseFloat($(inputs[1]).val())
      @data.z = parseFloat($(inputs[2]).val())


  class DatabaseSearchTreemaNode extends TreemaNode
    valueClass: 'treema-search'
    searchValueTemplate: '<input placeholder="Search" /><div class="treema-search-results"></div>'
    url: null
    lastTerm: null

    buildValueForDisplay: (valEl) ->
      val = if @data then @formatDocument(@data) else 'None'
      @buildValueForDisplaySimply(valEl, val)

    formatDocument: (doc) ->
      return doc if $.isString(doc)
      JSON.stringify(doc)

    buildValueForEditing: (valEl) ->
      valEl.html(@searchValueTemplate)
      input = valEl.find('input')
      input.focus().keyup @search
      input.attr('placeholder', @formatDocument(@data)) if @data

    search: =>
      term = @getValEl().find('input').val()
      return if term is @lastTerm
      @getSearchResultsEl().empty() if @lastTerm and not term
      return unless term
      @lastTerm = term
      @getSearchResultsEl().empty().append('Searching')
      $.ajax(@url+'?term='+term, {dataType: 'json', success: @searchCallback})

    searchCallback: (results) =>
      container = @getSearchResultsEl().detach().empty()
      first = true
      for result, i in results
        row = $('<div></div>').addClass('treema-search-result-row')
        text = @formatDocument(result)
        continue unless text?
        row.addClass('treema-search-selected') if first
        first = false
        row.text(text)
        row.data('value', result)
        container.append(row)
      if not results.length
        container.append($('<div>No results</div>'))
      @getValEl().append(container)

    getSearchResultsEl: -> @getValEl().find('.treema-search-results')
    getSelectedResultEl: -> @getValEl().find('.treema-search-selected')

    saveChanges: ->
      selected = @getSelectedResultEl()
      return unless selected.length
      @data = selected.data('value')

    onDownArrowPressed: (e) ->
      @navigateSearch(1)
      e.preventDefault()

    onUpArrowPressed: (e) ->
      e.preventDefault()
      @navigateSearch(-1)

    navigateSearch: (offset) ->
      selected = @getSelectedResultEl()
      func = if offset > 0 then 'next' else 'prev'
      next = selected[func]('.treema-search-result-row')
      return unless next.length
      selected.removeClass('treema-search-selected')
      next.addClass('treema-search-selected')

    onClick: (e) ->
      newSelection = $(e.target).closest('.treema-search-result-row')
      return super(e) unless newSelection.length
      @getSelectedResultEl().removeClass('treema-search-selected')
      newSelection.addClass('treema-search-selected')
      @saveChanges()
      @display()

    shouldTryToRemoveFromParent: ->
      return if @data?
      selected = @getSelectedResultEl()
      return not selected.length

  # Source: http://coffeescriptcookbook.com/chapters/functions/debounce

  debounce = (func, threshold, execAsap) ->
    timeout = null
    (args...) ->
      obj = this
      delayed = ->
        func.apply(obj, args) unless execAsap
        timeout = null
      if timeout
        clearTimeout(timeout)
      else if (execAsap)
        func.apply(obj, args)
      timeout = setTimeout delayed, threshold || 100

  DatabaseSearchTreemaNode.prototype.search = debounce(DatabaseSearchTreemaNode.prototype.search, 200)
  window.DatabaseSearchTreemaNode = DatabaseSearchTreemaNode


  TreemaNode.setNodeSubclass 'ace', class AceNode extends TreemaNode
    valueClass: 'treema-ace'

    getDefaultValue: -> ''

    buildValueForDisplay: (valEl) ->
      @editor?.destroy()
      pre = $('<pre></pre>').text(@data)
      valEl.append(pre)

    buildValueForEditing: (valEl) ->
      d = $('<div></div>').text(@data)
      valEl.append(d)
      @editor = ace.edit(d[0])
      @editor.setReadOnly(false)
      @editor.getSession().setMode(@schema.aceMode) if @schema.aceMode?
      @editor.getSession().setTabSize(@schema.aceTabSize) if @schema.aceTabSize?
      @editor.setTheme(@schema.aceTheme) if @schema.aceTheme?
      valEl.find('textarea').focus()

    saveChanges: ->
      @data = @editor.getValue()

    onTabPressed: ->
    onEnterPressed: ->

  TreemaNode.setNodeSubclass 'long-string', class LongStringNode extends TreemaNode
    valueClass: 'treema-long-string'

    getDefaultValue: -> ''

    buildValueForDisplay: (valEl) ->
      text = @data
      text = text.replace(/\n/g, '<br />')
      valEl.append($("<div></div>").html(text))

    buildValueForEditing: (valEl) ->
      input = $('<textarea />')
      input.val(@data) unless @data is null
      valEl.append(input)
      input.focus().select()
      input.blur @onEditInputBlur
      input

    saveChanges: (valEl) ->
      input = valEl.find('textarea')
      @data = input.val()