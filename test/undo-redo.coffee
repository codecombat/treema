describe 'Undo-redo behavior', ->
  schema = {
    type: 'object',
    properties: {
      name: { type: 'string' }
      numbers: { type: 'array', items: { type: ['string', 'array'] } }
      address: { type: 'string' }
      completed: { type: 'boolean' }
    }
  }
  data = { name: 'Bob', numbers: ['401-401-1337', '123-456-7890', '456-7890-123'], address: 'Mars', completed: false }
  originalData = jQuery.extend(true, {}, data)

  treema = TreemaNode.make(null, {data: data, schema: schema})
  treema.build()
  nameTreema = treema.childrenTreemas.name
  numbersTreema = treema.childrenTreemas.numbers
  addressTreema = treema.childrenTreemas.address
  completedTreema = treema.childrenTreemas.completed

  it 'does nothing when there are no actions to be undone', ->
    treema.undo()
    expect(treema.data).toEqual(originalData)
    treema.redo()
    expect(treema.data).toEqual(originalData)
    treema.set '/', jQuery.extend(true, {}, originalData)

  # Edit actions---------------------------------------------------------------------
  it 'reverts a set object property', ->
    path = '/name'
    treema.set '/name', 'Alice'
    treema.undo()
    expect(treema.data).toEqual(originalData)
    treema.redo()
    expect(treema.get(path)).toEqual('Alice')
    treema.set '/', jQuery.extend(true, {}, originalData)

  it 'reverts a set array element', ->
    path = '/numbers/1'
    treema.set path, '1'
    treema.undo()
    expect(treema.data).toEqual(originalData)
    treema.redo()
    expect(treema.get(path)).toEqual('1')
    treema.set '/', jQuery.extend(true, {}, originalData)

  it 'reverts a toggled boolean value', ->
    completedTreema.toggleValue()
    treema.undo()
    expect(treema.data).toEqual(originalData)
    treema.redo()
    expect(treema.get('/completed')).toBe(true)
    treema.set '/', jQuery.extend(true, {}, originalData)

  # Insert actions---------------------------------------------------------------------
  it 'reverts an element inserted into an array', ->
    path = '/numbers'
    treema.insert path, '1' 
    treema.undo()
    expect(treema.data).toEqual(originalData)
    treema.redo()
    numbersData = treema.get path
    expect(numbersData[numbersData.length-1]).toEqual('1')
    treema.set '/', jQuery.extend(true, {}, originalData)
  
  # Delete actions----------------------------------------------------------------------
  it 'reverts a deleted object property', ->
    path = '/name'
    treema.delete path
    treema.undo()
    expect(treema.data).toEqual(originalData)
    treema.redo()
    expect(treema.get(path)).toBe(undefined)
    treema.set '/', jQuery.extend(true, {}, originalData)

  it 'reverts a element deleted from the middle of an array', ->
    path = '/numbers/1'
    treema.delete path
    treema.undo()
    expect(treema.data).toEqual(originalData)
    treema.redo()
    expect(treema.data).toNotEqual(originalData)
    treema.set '/', jQuery.extend(true, {}, originalData)    

  #Combinations of actions
  it 'reverts a series of edit, insert and delete actions', ->
    treema.set '/name', 'Alice'
    treema.insert '/numbers', '1'
    treema.delete '/numbers'

    treema.undo()
    expect(treema.get('/numbers')).toBeDefined()
    treema.undo()
    expect(treema.get('/numbers')).toEqual(numbersTreema.data)
    treema.undo()
    expect(treema.data).toEqual(originalData)

    treema.redo()
    expect(treema.get('/name')).toBe('Alice')
    treema.redo()
    numbersData = treema.get '/numbers'
    expect(numbersData[numbersData.length-1]).toEqual('1')
    treema.redo()
    expect(treema.get('/numbers')).toBeUndefined()
