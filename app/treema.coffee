class Treema
  schema: {}
  lastOutput: null
  
  constructor: (options) ->
    @schema = options.schema
    @data = options.data
    @options = options.options or {}
  
  isValid: ->
    false
    
  getErrors: ->
    []
    
  build: ->
    $('<div></div>')
    
  getData: ->
    @data
    
