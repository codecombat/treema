describe 'TV4 Interface', ->
  
  schema = { type: 'number' }
  data = 'NaN'
  treema = TreemaNode.make(null, {data: data, schema: schema})

  it 'can check data validity', ->
    expect(treema.isValid()).toBe false
    
  it 'returns errors', ->
    expect(treema.getErrors().length).toBe 1