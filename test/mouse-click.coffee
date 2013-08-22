describe 'Mouse click behavior', ->

  schema = {
    type: 'object',
    properties: {
      name: { type: 'string' }
      numbers: { type: 'array', items: { type: 'string' } }
    }
  }
  data = { name: 'Bob', numbers: ['401-401-1337', '123-456-7890'] }
  treema = TreemaNode.make(null, {data: data, schema: schema})
  treema.build()
  nameTreema = treema.childrenTreemas.name
  phoneTreema = treema.childrenTreemas.numbers
  
  shiftClick = ($el) ->
    event = jQuery.Event("click")
    event.shiftKey = true
    $el.trigger(event)
    
  metaClick = ($el) ->
    event = jQuery.Event("click")
    event.metaKey = true
    $el.trigger(event)
    
  it 'starts editing if you click the value', ->
    expect(nameTreema.isDisplaying()).toBeTruthy()
    nameTreema.$el.find('.treema-value').click()
    expect(nameTreema.isEditing()).toBeTruthy()
    nameTreema.display()
    
  it 'opens a collection if you click the value', ->
    expect(phoneTreema.isClosed()).toBeTruthy()
    phoneTreema.$el.find('.treema-value').click()
    expect(phoneTreema.isOpen()).toBeTruthy()
    phoneTreema.close()
    
  it 'selects and unselects the row if you click something other than the value', ->
    expect(nameTreema.isSelected()).toBeFalsy()
    nameTreema.$el.click()
    expect(nameTreema.isSelected()).toBeTruthy()
    nameTreema.$el.click()
    expect(nameTreema.isSelected()).toBeFalsy()

  it 'selects along all open rows if you shift click', ->
    phoneTreema.open()
    nameTreema.$el.click()
    shiftClick(phoneTreema.childrenTreemas[1].$el)
    expect(nameTreema.isSelected())
    expect(phoneTreema.isSelected())
    expect(phoneTreema.childrenTreemas[0].isSelected())
    expect(phoneTreema.childrenTreemas[1].isSelected())
    treema.deselectAll()
    phoneTreema.close()
    
  it 'keeps the clicked row selected if there are multiple selections to begin with', ->
    nameTreema.$el.click()
    shiftClick(phoneTreema.$el)
    expect(nameTreema.isSelected()).toBeTruthy()
    expect(phoneTreema.isSelected()).toBeTruthy()
    nameTreema.$el.click()
    expect(nameTreema.isSelected()).toBeTruthy()
    expect(phoneTreema.isSelected()).toBeFalsy()
    treema.deselectAll()
    
  it 'toggles the select state if you ctrl/meta click', ->
    nameTreema.$el.click()
    metaClick(phoneTreema.$el)
    expect(nameTreema.isSelected()).toBeTruthy()
    expect(phoneTreema.isSelected()).toBeTruthy()
    metaClick(nameTreema.$el)
    expect(nameTreema.isSelected()).toBeFalsy()
    expect(phoneTreema.isSelected()).toBeTruthy()
    treema.deselectAll()
