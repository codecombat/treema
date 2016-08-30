describe 'Delete key press', ->
  deleteKeyPress = ($el) -> keyDown($el, 8)

  schema = {
    type: 'object',
    properties: {
      name: { type: 'string' }
      numbers: { type: 'array', items: { type: ['string', 'array'] } }
      address: { type: 'string' }
    }
  }
  original_data = { name: 'Bob', numbers: ['401-401-1337', ['123-456-7890']], 'address': 'Mars' }
  treema = nameTreema = addressTreema = phoneTreema = null
  
  rebuild = ->
    copy = $.extend(true, {}, original_data)
    treema = TreemaNode.make(null, {data: copy, schema: schema})
    treema.build()
    
    nameTreema = treema.childrenTreemas.name
    addressTreema = treema.childrenTreemas.address
    phoneTreema = treema.childrenTreemas.numbers

  expectOneSelected = (t) ->
    selected = treema.getSelectedTreemas()
    expect(selected.length).toBe(1)
    expect(selected[0]).toBe(t)

  beforeEach ->
    rebuild()
  
  it 'does nothing when nothing is selected', ->
    deleteKeyPress(treema.$el)
    expect(treema.data.name).toBe(original_data.name)
    expect(treema.data.address).toBe(original_data.address)
  
  it 'removes a selected row', ->
    nameTreema.select()
    deleteKeyPress(treema.$el)
    expect(treema.data.name).toBeUndefined()
    expect(treema.childrenTreemas.name).toBeUndefined()
    expect(treema.childrenTreemas.address).toBeTruthy()
  
  it 'removes all selected rows', ->
    nameTreema.select()
    addressTreema.toggleSelect()
    deleteKeyPress(treema.$el)
    expect(treema.data.name).toBeUndefined()
    expect(treema.data.address).toBeUndefined()
    expect(treema.childrenTreemas.name).toBeUndefined()
    expect(treema.childrenTreemas.address).toBeUndefined()

  xit 'removes single elements of a collection one at a time, then the collection itself', ->
    phoneTreema.open()
    phoneTreema.childrenTreemas[1].open()
    phoneTreema.childrenTreemas[0].select()
    expect(treema.data.numbers.length).toBe(2)

    # deletes '401...', selects ['123...'] (which is now at index 0)
    # stays at the same level, does not enter the open collection
    deleteKeyPress(treema.$el)
    expect(treema.data.numbers.length).toBe(1)
    expectOneSelected(phoneTreema.childrenTreemas[0])

    # deletes ['123...'], selects numbers
    # when there are no more elements, goes to the parent
    deleteKeyPress(treema.$el)
    expect(treema.data.numbers.length).toBe(0)
    expectOneSelected(phoneTreema)

    # deletes numbers, selects address
    # when there's an element the one just deleted, it goes down
    deleteKeyPress(treema.$el) 
    expect(treema.data.numbers).toBeUndefined()
    expectOneSelected(addressTreema)

    # deletes address, selects name
    # when there's no element after the one just deleted, it goes up
    deleteKeyPress(treema.$el) 
    expect(treema.data.address).toBeUndefined()
    expectOneSelected(nameTreema)

    # deletes name, nothing more to select
    # when there are no more elements, select nothing
    deleteKeyPress(treema.$el) 
    expect(treema.data.name).toBeUndefined()
    expect(treema.getSelectedTreemas().length).toBe(0)
    expect(Object.keys(treema.data).length).toBe(0)
    
  it 'removes a row if it\'s being edited and there\'s nothing in the focused input', ->
    nameTreema.edit()
    nameTreema.$el.find('input').val('')
    deleteKeyPress(nameTreema.$el.find('input'))
    expect(treema.data.name).toBeUndefined()
    expectOneSelected(phoneTreema)

  it 'performs normally if a focused input has value', ->
    nameTreema.edit()
    deleteKeyPress(nameTreema.$el.find('input'))
    expect(treema.data.name).toBeTruthy()
