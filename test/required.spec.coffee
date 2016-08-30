describe 'schema property "required"', ->
  treema = null
  beforeEach ->
    schema = {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "integer": { type: "integer" },
        "string": { type: "string" },
        "number": { type: "number" },
        "null": { type: "null" },
        "boolean": { type: "boolean" },
        "array": { type: "array", items: { type: 'number', default: 42 } },
        "object": { type: "object" },
        "def": { 'default': 1337 }
      },
      "required": ['integer', 'string', 'number', 'null','boolean','array','object','def']
    }
    data = {}
    treema = TreemaNode.make(null, {data: data, schema: schema})
    treema.build()

  it 'populates all required values with generic data', ->
    expect(treema.get('/integer')).toBe(0)
    expect(treema.get('/string')).toBe('')
    expect(treema.get('/number')).toBe(0)
    expect(treema.get('/null')).toBe(null)
    expect(treema.get('/boolean')).toBe(false)
    expect(JSON.stringify(treema.get('/array'))).toBe(JSON.stringify([]))
    expect(JSON.stringify(treema.get('/object'))).toBe(JSON.stringify({}))

  it 'populates required values with defaults', ->
    expect(treema.get('/def')).toBe(1337)
    treema.childrenTreemas['array'].addNewChild()
    expect(treema.$el.find('input').val()).toBe('42')
    
describe 'schema property "required"', ->
  it 'populates data from the object\'s default property', ->
    schema =
      type: 'object'
      default: { key1: 'object default' }
      required: ['key1']
    treema = $('<div></div>').treema({ schema:schema, data:{} })
    treema.build()
    expect(treema.data.key1).toBe('object default')

  it 'populates data based on the child schema type', ->
    schema =
      type: 'object'
      required: ['key2']
      properties:
        key2: { type: 'number' }
    treema = $('<div></div>').treema({ schema:schema, data:{} })
    treema.build()
    expect(treema.data.key2).toBe(0)

  it 'populates data from the child schema\'s default property', ->
    schema =
      type: 'object'
      required: ['key3']
      properties:
        key3: { default: 'inner default' }
    treema = $('<div></div>').treema({ schema:schema, data:{} })
    treema.build()
    expect(treema.data.key3).toBe('inner default')

  it 'populates data as an empty string if nothing else is available', ->
    schema =
      required: ['key4']
    treema = $('<div></div>').treema({ schema:schema, data:{} })
    treema.build()
    expect(treema.data.key4).toBe('')
