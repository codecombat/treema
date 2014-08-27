describe 'schema property "required"', ->
  treema = null
  beforeEach ->
    schema = {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "0": { type: "integer" },
        "1": { type: "string" },
        "2": { type: "number" },
        "3": { type: "null" },
        "4": { type: "boolean" },
        "5": { type: "array", items: { type: 'number', default: 42 } },
        "6": { type: "object" },
        "7": { 'default': 1337 }
      },
      "required": ['0', '1', '2', '3','4','5','6','7']
    }
    data = {}
    treema = TreemaNode.make(null, {data: data, schema: schema})
    treema.build()

  it 'populates all required values with generic data', ->
    expect(treema.get('/0')).toBe(0)
    expect(treema.get('/1')).toBe('')
    expect(treema.get('/2')).toBe(0)
    expect(treema.get('/3')).toBe(null)
    expect(treema.get('/4')).toBe(false)
    expect(JSON.stringify(treema.get('/5'))).toBe(JSON.stringify([]))
    expect(JSON.stringify(treema.get('/6'))).toBe(JSON.stringify({}))

  it 'populates required values with defaults', ->
    expect(treema.get('/7')).toBe(1337)
    treema.childrenTreemas['5'].addNewChild()
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
