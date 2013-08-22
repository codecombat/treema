# almost exactly the same as enter, except it keeps focus on a row that is invalid

describe 'Tab key press', ->
  tabKeyPress = ($el) -> keyDown($el, 9)
  
  schema = {
    type: 'object',
    properties: {
      name: { type: 'string' }
      numbers: { type: 'array', items: { type: 'string', minLength: 4 } }
      address: { type: 'string' }
    }
  }
  data = { name: 'Bob', numbers: ['401-401-1337', '123-456-7890'], 'address': 'Mars' }
  treema = TreemaNode.make(null, {data: data, schema: schema})
  treema.build()
  nameTreema = treema.childrenTreemas.name
  phoneTreema = treema.childrenTreemas.numbers
  addressTreema = treema.childrenTreemas.address
  
  afterEach ->
    treema.endExistingEdits()
    phoneTreema.close()
  
  it 'edits the last selected row', ->
    nameTreema.select()
    tabKeyPress(treema.$el)
    expect(nameTreema.isEditing()).toBeTruthy()

  it 'saves the current row and goes on to the next value in the collection if there is one', ->
    phoneTreema.open()
    phoneTreema.childrenTreemas[0].edit()
    phoneTreema.childrenTreemas[0].$el.find('input').val('4321')
    tabKeyPress(phoneTreema.childrenTreemas[0].$el)
    expect(phoneTreema.childrenTreemas[0].isDisplaying()).toBeTruthy()
    expect(phoneTreema.childrenTreemas[1].isEditing()).toBeTruthy()
    expect(treema.data.numbers[0]).toBe('4321')

  it 'traverses into and out of open collections', ->
    phoneTreema.open()
    nameTreema.edit()
    tabKeyPress(nameTreema.$el)
    expect(phoneTreema.childrenTreemas[0].isEditing()).toBeTruthy()
    tabKeyPress(phoneTreema.childrenTreemas[0].$el)
    expect(phoneTreema.childrenTreemas[1].isEditing()).toBeTruthy()
    tabKeyPress(phoneTreema.childrenTreemas[1].$el)
    expect(addressTreema.isEditing()).toBeTruthy()

  it 'skips over closed collections', ->
    nameTreema.edit()
    tabKeyPress(nameTreema.$el)
    expect(addressTreema.isEditing()).toBeTruthy()

  it 'shows errors and stays put when saving an invalid row', ->
    phoneTreema.open()
    phoneTreema.childrenTreemas[0].edit()
    phoneTreema.childrenTreemas[0].$el.find('input').val('1')
    tabKeyPress(phoneTreema.childrenTreemas[0].$el)
    expect(phoneTreema.childrenTreemas[1].isDisplaying()).toBeTruthy()
    expect(phoneTreema.childrenTreemas[0].isEditing()).toBeTruthy()
    expect(treema.data.numbers[0]).toBe('1')
    expect(treema.isValid()).toBeFalsy()

  it 'goes backwards if shift is pressed', ->
    phoneTreema.open()
    phoneTreema.childrenTreemas[1].edit()

    event = jQuery.Event("keydown")
    event.which = 9
    event.shiftKey = true
    phoneTreema.childrenTreemas[1].$el.trigger(event)

    expect(phoneTreema.childrenTreemas[1].isDisplaying()).toBeTruthy()
    expect(phoneTreema.childrenTreemas[0].isEditing()).toBeTruthy()

  it 'edits the first child in a collection if a collection is selected', ->
    phoneTreema.open()
    phoneTreema.select()
    tabKeyPress(phoneTreema.$el)
    expect(phoneTreema.childrenTreemas[0].isEditing()).toBeTruthy()
