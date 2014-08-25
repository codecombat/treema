describe 'utilities', ->
  backupJQuery = $
  
  beforeEach ->
    window.jQuery = undefined
    window.$ = undefined
    
  afterEach ->
    window.jQuery = backupJQuery
    window.$ = backupJQuery
    
  describe 'tests', ->
    it 'run in an environment without jQuery', ->
      hadError = false
      try
        $('body')
      catch
        hadError = true
      expect(hadError).toBe(true)
      
  describe 'populateDefaults', ->
    it 'walks through data and applies schema defaults to data', ->
      schema = {
        type: 'object'
        default: { innerObject: {}, someProp: 1 }
        properties:
          innerObject: { default: { key1: 'value1', key2: 'value2' }}
      }
      
      data = null
      
      result = TreemaNode.utils.populateDefaults(data, schema)
      
      expect(result).toBeDefined()
      expect(result.innerObject).toBeDefined()
      expect(result.innerObject.key1).toBe('value1')
      expect(result.innerObject.key2).toBe('value2')
      
    it 'merges in default objects that are adjacent to extant data', ->
      schema = {
        type: 'object'
        properties:
          innerObject: { default: { key1: 'value1', key2: 'value2' }}
      }

      data = { innerObject: { key1: 'extantData' }}

      result = TreemaNode.utils.populateDefaults(data, schema)

      expect(result).toBeDefined()
      expect(result.innerObject).toBeDefined()
      expect(result.innerObject.key1).toBe('extantData')
      expect(result.innerObject.key2).toBe('value2')

      
    # In order to support the default structure below, would need to
    # make populateData a bit more complicated, with some custom merging logic.
    # Going to see if we can get away without it first.
      
#    it 'merges default objects from parent schemas down to child extant data', ->
#      schema = {
#        type: 'object'
#        default: { innerObject: { key1: 'value1', key2: 'value2' } }
#      }
#
#      data = { innerObject: { prop1: 'extantData' } }
#
#      result = TreemaNode.utils.populateDefaults(data, schema)
#
#      expect(result.innerObject).toBeDefined()
#      expect(result.innerObject.prop1).toBe('extantData')
#      expect(result.innerObject.prop2).toBe('2')
      
  describe 'walk', ->
    it 'calls a callback on every piece of data in a JSON object, providing path, data and working schema', ->
      schema = {
        type: 'object'
        properties:
          key1: { title: 'Number 1' }
          key2: { title: 'Number 2' }
      }
      
      data = { key1: 1, key2: 2 }
      
      paths = []
      values = []
      
      TreemaNode.utils.walk data, schema, null, (path, data, schema) ->
        paths.push(path)
        values.push(data)
        
      expect(paths.length).toBe(3)
      
      expect('' in paths).toBe(true)
      expect('key1' in paths).toBe(true)
      expect('key2' in paths).toBe(true)
      
      expect(data in values).toBe(true)
      expect(data.key1 in values).toBe(true)
      expect(data.key2 in values).toBe(true)
  
  describe 'getChildSchema', ->
    it 'returns child schemas from properties', ->
      schema = { properties: { key1: { title: 'some title' } }}
      childSchema = TreemaNode.utils.getChildSchema('key1', schema)
      expect(childSchema.title).toBe('some title')
      
    it 'returns child schemas from additionalProperties', ->
      schema = { additionalProperties: { title: 'some title' } }
      childSchema = TreemaNode.utils.getChildSchema('key1', schema)
      expect(childSchema.title).toBe('some title')
      
    it 'returns child schemas from patternProperties', ->
      schema = { patternProperties: { '^[a-z]+$': { title: 'some title' } }}
      childSchema = TreemaNode.utils.getChildSchema('key', schema)
      expect(childSchema.title).toBe('some title')
      childSchema = TreemaNode.utils.getChildSchema('123', schema)
      expect(childSchema.title).toBeUndefined()

    it 'returns child schemas from an items schema', ->
      schema = { items: { title: 'some title' } }
      childSchema = TreemaNode.utils.getChildSchema(0, schema)
      expect(childSchema.title).toBe('some title')

    it 'returns child schemas from an items array of schemas', ->
      schema = { items: [{ title: 'some title' }] }
      childSchema = TreemaNode.utils.getChildSchema(0, schema)
      expect(childSchema.title).toBe('some title')
      childSchema = TreemaNode.utils.getChildSchema(1, schema)
      expect(childSchema.title).toBeUndefined()
      
    it 'returns child schemas from additionalItems', ->
      schema = { items: [{ title: 'some title' }], additionalItems: { title: 'another title'} }
      childSchema = TreemaNode.utils.getChildSchema(1, schema)
      expect(childSchema.title).toBe('another title')

  describe 'buildWorkingSchemas', ->
    it 'returns the same single schema if there are no combinatorials or references', ->
      schema = {}
      workingSchemas = TreemaNode.utils.buildWorkingSchemas(schema)
      expect(workingSchemas[0] is schema).toBeTruthy()
      
    it 'combines allOf into a single schema', ->
      schema = { title: 'title', allOf: [ { description: 'description' }, { type: 'number' } ]}
      workingSchemas = TreemaNode.utils.buildWorkingSchemas(schema)
      expect(workingSchemas.length).toBe(1)
      workingSchema = workingSchemas[0]
      expect(workingSchema.title).toBe('title')
      expect(workingSchema.description).toBe('description')
      expect(workingSchema.type).toBe('number')
      
    it 'creates a separate working schema for each anyOf', ->
      schema = { title: 'title', anyOf: [{ type: 'string' }, { type: 'number' }]}
      workingSchemas = TreemaNode.utils.buildWorkingSchemas(schema)
      expect(workingSchemas.length).toBe(2)
      types = (schema.type for schema in workingSchemas)
      expect('string' in types).toBe(true)
      expect('number' in types).toBe(true)

    it 'creates a separate working schema for each oneOf', ->
      schema = { title: 'title', oneOf: [{ type: 'string' }, { type: 'number' }]}
      workingSchemas = TreemaNode.utils.buildWorkingSchemas(schema)
      expect(workingSchemas.length).toBe(2)
      types = (schema.type for schema in workingSchemas)
      expect('string' in types).toBe(true)
      expect('number' in types).toBe(true)
      
    # Eventually might want more advanced behaviors, like smartly combining types from "allOf" or "oneOf" schemas.
    # But for now this more naive combination behavior will do.