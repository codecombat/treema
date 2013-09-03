describe 'Initialization', ->

  schema = { type: 'object', properties: { name: { type: 'string', 'default': 'Untitled'} } }
  data = { }
  el = $('<div></div>')

  treema = TreemaNode.make(null, {data: data, schema: schema})

  it 'creates an $el if none is given', ->
    expect(treema.$el).toBeDefined()

  it 'uses the jQuery element given', ->
    elTreema = TreemaNode.make(el, {data: data, schema: schema})
    expect(elTreema.$el).toBe(el)

  it 'grabs default data from an object schema', ->
    noDataTreema = TreemaNode.make(null, {schema: schema})
    expect(noDataTreema.data.name).toBe('Untitled')

  it 'opens up root collection nodes by default', ->
    treema.build()
    expect(treema.isOpen()).toBeTruthy()

describe 'Schemaless', ->

  schema = type: 'object'
  data =
    errors: []
    warnings: [
      {
        userInfo: {}
        id: "jshint_W099"
        message: "Mixed spaces and tabs."
        level: "warning"
        type: "transpile"
        ranges: [[[8, 0], [8, 3]]]
      }
    ]
    infos: []
  el = $('<div></div>')
  treema = TreemaNode.make(el, {data: data, schema: schema})

  it 'initializes when given data for an empty schema', ->
    expect(treema.$el).toBeDefined()

describe 'Object.prototype properties', ->

  Object.prototype.hahaEatIt = ->
  schema = type: 'object'
  data = {}
  treema = TreemaNode.make(null, {data: data, schema: schema})
  it 'survives adding Object.prototype functions', ->
    expect(treema.$el).toBeDefined()
