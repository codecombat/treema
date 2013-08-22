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
   