describe 'TreemaNode.set', ->
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

  it 'sets immediate values', ->
    expect(treema.set('/name', 'Bobby')).toBeTruthy()
    expect(treema.get('/name')).toBe('Bobby')
    
  it 'can search an object within an array', ->
    expect(treema.set('/numbers/type=Home/number', '1234')).toBeTruthy()
    expect(treema.get('/numbers/type=Home/number')).toBe('1234')
    
  it 'can set new properties', ->
    expect(treema.set('/numbers/0/daytime', true)).toBeTruthy()
    expect(treema.get('/numbers/0/daytime')).toBe(true)
 
  it 'updates the visuals of the node and all its parents', ->
    treema.childrenTreemas.numbers.open()
    treema.childrenTreemas.numbers.childrenTreemas[0].open()
    expect(treema.set('/numbers/0/type', 'Cell')).toBeTruthy()
    t = treema.childrenTreemas.numbers.$el.find('> .treema-row > .treema-value').text()
    expect(t.indexOf('Home')).toBe(-1)

  it 'affects the base data', ->
    expect(treema.data['numbers'][0]['daytime']).toBe(true)