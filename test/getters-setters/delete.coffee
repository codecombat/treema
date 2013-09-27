describe 'TreemaNode.delete', ->
  schema = {
    type: 'object',
    properties: {
      name: { type: 'string' }
      numbers: { type: 'array', items: { type: 'object' } }
    }
  }
  data = { name: 'Bob', numbers: [
    {'number':'401-401-1337', 'type':'Home'},
    {'number':'123-456-7890', 'type':'Work'}
  ]}

  treema = TreemaNode.make(null, {data: data, schema: schema})
  treema.build()

  it 'removes objects from an array', ->
    expect(treema.delete('/numbers/0')).toBeTruthy()
    numbers = treema.get('/numbers')
    expect(numbers.length).toBe(1)
    expect(numbers[0].type).toBe('Work')
  
  it 'removes properties from an object', ->
    expect(treema.delete('/numbers/0/type')).toBeTruthy()
    expect(treema.get('/numbers').type).toBeUndefined()
    expect(treema.get('/numbers/type')).toBeUndefined()
