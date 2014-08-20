unless TreemaNode
  TreemaNode = {}

TreemaNode.utils = {}

TreemaNode.utils.populateDefaults = (rootData, rootSchema, tv4) ->
  if rootSchema.default and not rootData
    rootData = @deepClone(rootSchema.default)
    
  @walk rootData, rootSchema, tv4, (path, data, schema) =>
    def = schema.default
    return unless @type(def) is 'object' and @type(data) is 'object'
    for key, value of def
      data[key] ?= @deepClone(value)
      
  rootData

TreemaNode.utils.walk = (data, schema, tv4, callback, path='') ->
  workingSchemas = @buildWorkingSchemas(schema, tv4)
  workingSchema = @chooseWorkingSchema(data, workingSchemas, tv4)
  
  callback(path, data, workingSchema)
  
  # this actually works for both arrays and objects...
  if @type(data) in ['array', 'object']
    for key, value of data
      childPath = path.slice()
      childPath += '.' if childPath
      childPath += key
      childSchema = @getChildSchema(key, workingSchema)
      @walk(value, childSchema, tv4, callback, childPath)

TreemaNode.utils.getChildSchema = (key, schema) ->
  if @type(key) is 'string'
    for childKey, childSchema of schema.properties
      if childKey is key
        return childSchema 
    for childKey, childSchema of schema.patternProperties
      if key.match(new RegExp(childKey))
        return childSchema
    if typeof schema.additionalProperties is 'object'
      return schema.additionalProperties 
      
  if @type(key) is 'number'
    index = key
    if schema.items
      if Array.isArray(schema.items)
        if index < schema.items.length
          return schema.items[index]
        else if schema.additionalItems
          return schema.additionalItems
      else if schema.items
        return schema.items

  return {}

# Working schemas -----------------------------------------------------------

# Schemas can be flexible using combinatorial properties and references.
# But it simplifies logic if schema props like $ref, allOf, anyOf, and oneOf
# are flattened into a list of more straightforward user choices.
# These simplifications are called working schemas.

TreemaNode.utils.buildWorkingSchemas = (schema, tv4) ->
  schema ?= {}
  baseSchema = @resolveReference(schema, tv4)
  return [schema] unless schema.allOf or schema.anyOf or schema.oneOf
  baseSchema = @cloneSchema(baseSchema)
  allOf = baseSchema.allOf
  anyOf = baseSchema.anyOf
  oneOf = baseSchema.oneOf
  delete baseSchema.allOf if baseSchema.allOf?
  delete baseSchema.anyOf if baseSchema.anyOf?
  delete baseSchema.oneOf if baseSchema.oneOf?

  if allOf?
    for schema in allOf
      @combineSchemas baseSchema, @resolveReference(schema, tv4)

  workingSchemas = []
  singularSchemas = []
  singularSchemas = singularSchemas.concat(anyOf) if anyOf?
  singularSchemas = singularSchemas.concat(oneOf) if oneOf?

  for singularSchema in singularSchemas
    singularSchema = @resolveReference(singularSchema, tv4)
    newBase = @cloneSchema(baseSchema)
    @combineSchemas(newBase, singularSchema)
    workingSchemas.push(newBase)
    
  workingSchemas = [baseSchema] if workingSchemas.length is 0
  workingSchemas

TreemaNode.utils.chooseWorkingSchema = (data, workingSchemas, tv4) ->
  return workingSchemas[0] if workingSchemas.length is 1
  tv4 ?= @getGlobalTv4()
  for schema in workingSchemas
    result = tv4.validateMultiple(data, schema)
    return schema if result.valid
  return workingSchemas[0]

TreemaNode.utils.resolveReference = (schema, tv4, scrubTitle=false) ->
  return schema unless schema.$ref?
  tv4 ?= @getGlobalTv4()
  resolved = tv4.getSchema(schema.$ref)
  unless resolved
    console.warn('could not resolve reference', schema.$ref, tv4.getMissingUris())
  resolved ?= {}
  delete resolved.title if scrubTitle and resolved.title?
  resolved

TreemaNode.utils.getGlobalTv4 = ->
  if typeof window isnt 'undefined'
    return window.tv4
  if typeof global isnt 'undefined'
    return global.tv4

# UTILITY UTILITIES
# Normally I'd use jQuery or lodash for these, but this file should be completely library/context agnostic.
# These are fairly simplified because data is assumed to not include non-plain objects.

TreemaNode.utils.cloneSchema = (schema) ->
  clone = {}
  clone[key] = value for key, value of schema
  clone

TreemaNode.utils.combineSchemas = (schema1, schema2) ->
  for key, value of schema2
    schema1[key] = value 
  schema1
  
TreemaNode.utils.deepClone = (data) ->
  clone = data
  type = @type(data)
  if type is 'object'
    clone = {}
  if type is 'array'
    clone = []
  if type in ['object', 'array']
    for key, value of data
      clone[key] = @deepClone(value)
  return clone

# http://arcturo.github.io/library/coffeescript/07_the_bad_parts.html
TreemaNode.utils.type = do ->
  classToType = {}
  for name in "Boolean Number String Function Array Date RegExp Undefined Null".split(" ")
    classToType["[object " + name + "]"] = name.toLowerCase()

  (obj) ->
    strType = Object::toString.call(obj)
    classToType[strType] or "object"
