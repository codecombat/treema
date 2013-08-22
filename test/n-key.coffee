#describe '"N" key press', ->
#  nKeyPress = ($el) -> keyDown($el, 78)
#
#  schema = {
#    type: 'array',
#    maxItems: 2,
#    items: { type: 'string' }
#  }
#  data = ['401-401-1337', '123-456-7890']
#  treema = TreemaNode.make(null, {data: data, schema: schema})
#  treema.build()
#
#  it 'creates a new row for the currently selected', ->
#    nameTreema.select()
#    enterKeyPress(treema.$el)
#    expect(nameTreema.isEditing()).toBeTruthy()
#
#  it 'saves the current row and goes on to the next value in the collection if there is one', ->
#    phoneTreema.open()
#    phoneTreema.childrenTreemas[0].edit()
#    phoneTreema.childrenTreemas[0].$el.find('input').val('4321')
#    enterKeyPress(phoneTreema.childrenTreemas[0].$el)
#    expect(phoneTreema.childrenTreemas[0].isDisplaying()).toBeTruthy()
#    expect(phoneTreema.childrenTreemas[1].isEditing()).toBeTruthy()
#    expect(treema.data.numbers[0]).toBe('4321')
#
#  it 'traverses into and out of open collections', ->
#    phoneTreema.open()
#    nameTreema.edit()
#    enterKeyPress(nameTreema.$el)
#    expect(phoneTreema.childrenTreemas[0].isEditing()).toBeTruthy()
#    enterKeyPress(phoneTreema.childrenTreemas[0].$el)
#    expect(phoneTreema.childrenTreemas[1].isEditing()).toBeTruthy()
#    enterKeyPress(phoneTreema.childrenTreemas[1].$el)
#    expect(addressTreema.isEditing()).toBeTruthy()
#
#  it 'skips over closed collections', ->
#    nameTreema.edit()
#    enterKeyPress(nameTreema.$el)
#    expect(addressTreema.isEditing()).toBeTruthy()
#
#  it 'shows errors and moves on when saving an invalid row', ->
#    phoneTreema.open()
#    phoneTreema.childrenTreemas[0].edit()
#    phoneTreema.childrenTreemas[0].$el.find('input').val('1')
#    enterKeyPress(phoneTreema.childrenTreemas[0].$el)
#    expect(phoneTreema.childrenTreemas[0].isDisplaying()).toBeTruthy()
#    expect(phoneTreema.childrenTreemas[1].isEditing()).toBeTruthy()
#    expect(treema.data.numbers[0]).toBe('1')
#    expect(treema.isValid()).toBeFalsy()
#
#  it 'goes backwards if shift is pressed', ->
#    phoneTreema.open()
#    phoneTreema.childrenTreemas[1].edit()
#
#    event = jQuery.Event("keydown")
#    event.which = 13
#    event.shiftKey = true
#    phoneTreema.childrenTreemas[1].$el.trigger(event)
#
#    expect(phoneTreema.childrenTreemas[1].isDisplaying()).toBeTruthy()
#    expect(phoneTreema.childrenTreemas[0].isEditing()).toBeTruthy() 