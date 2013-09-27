describe 'TreemaNode.insert', ->
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

  it 'appends data to the end of an array', ->
    expect(treema.insert('/numbers', {'number':'4321'})).toBeTruthy()
    numbers = treema.get('/numbers')
    expect(numbers.length).toBe(3)
    expect(numbers[2].number).toBe('4321')

  it 'returns false for paths that are not arrays', ->
    expect(treema.insert('/numbers/0', 'boom')).toBeFalsy()
    
  it 'returns false for paths that do not exist', ->
    expect(treema.insert('/numbahs', 'boom')).toBeFalsy()