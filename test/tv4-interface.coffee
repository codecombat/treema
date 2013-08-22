describe 'TV4 Interface', ->
  
  schema = { type: 'number' }
  
  it 'can check data validity', ->
    treema = TreemaNode.make(null, {data: 'NaN', schema: schema})
    expect(treema.isValid()).toBe false
    
  it 'returns errors', ->
    treema = TreemaNode.make(null, {data: 'NaN', schema: schema})
    expect(treema.getErrors().length).toBe 1