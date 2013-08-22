describe 'TV4 Interface', ->
  
  schema = { type: 'number' }
  
  it 'can check data validity', ->
    treema = TreemaNode.make(null, {data: 'NaN', schema: schema})
    console.log(treema.isValid())
    expect(treema.isValid()).toBe false