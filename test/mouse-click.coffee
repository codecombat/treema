describe 'Mouse click behavior', ->

  treema = nameTreema = phoneTreema = null
  schema = {
    type: 'object',
    properties: {
      name: { type: 'string' }
      numbers: { type: 'array', items: { type: 'string' } }
    }
  }
  
  beforeEach ->
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
    expect(nameTreema.isDisplaying()).toBe(true)
    nameTreema.$el.find('.treema-value').click()
    expect(nameTreema.isEditing()).toBe(true)
    
  it 'opens a collection if you click the value', ->
    expect(phoneTreema.isClosed()).toBe(true)
    phoneTreema.$el.find('.treema-value').click()
    expect(phoneTreema.isOpen()).toBe(true)
    
  it 'selects and unselects the row if you click something other than the value', ->
    expect(nameTreema.isSelected()).toBe(false)
    nameTreema.$el.click()
    expect(nameTreema.isSelected()).toBe(true)
    nameTreema.$el.click()
    expect(nameTreema.isSelected()).toBe(false)

  it 'selects along all open rows if you shift click', ->
    phoneTreema.open()
    nameTreema.$el.click()
    shiftClick(phoneTreema.childrenTreemas[0].$el)
    expect(nameTreema.isSelected()).toBe(true)
    expect(phoneTreema.isSelected()).toBe(true)
    expect(phoneTreema.childrenTreemas[0].isSelected()).toBe(true)
    expect(phoneTreema.childrenTreemas[1].isSelected()).toBe(false)
    
  it 'keeps the clicked row selected if there are multiple selections to begin with', ->
    nameTreema.$el.click()
    shiftClick(phoneTreema.$el)
    expect(nameTreema.isSelected()).toBe(true)
    expect(phoneTreema.isSelected()).toBe(true)
    nameTreema.$el.click()
    expect(nameTreema.isSelected()).toBe(true)
    expect(phoneTreema.isSelected()).toBe(false)
    
  it 'toggles the select state if you ctrl/meta click', ->
    nameTreema.$el.click()
    metaClick(phoneTreema.$el)
    expect(nameTreema.isSelected()).toBe(true)
    expect(phoneTreema.isSelected()).toBe(true)
    metaClick(nameTreema.$el)
    expect(nameTreema.isSelected()).toBe(false)
    expect(phoneTreema.isSelected()).toBe(true)
