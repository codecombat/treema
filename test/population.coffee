describe 'Treema populating values', ->
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