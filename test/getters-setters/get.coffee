describe 'TreemaNode.get', ->
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
  nameTreema = treema.childrenTreemas.name

  it 'gets immediate values', ->
    expect(treema.get('/name')).toBe('Bob')
    
  it 'can search on object keys within an array', ->
    expect(treema.get('/numbers/type=Work').number).toBe('123-456-7890')
    
  it 'can start from a child', ->
    expect(nameTreema.get('/')).toBe('Bob')
    
  it 'returns undefined for invalid paths', ->
    expect(treema.get('waffles')).toBeUndefined()
 