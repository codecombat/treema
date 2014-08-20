describe 'Change callback', ->
  tabKeyPress = ($el) -> keyDown($el, 9)
  deleteKeyPress = ($el) -> keyDown($el, 8)

  fired = nameTreema = numbersTreema = tagsTreema = treema = null

  beforeEach ->
    schema = {
      type: 'object',
      properties: {
        name: { type: 'string' }
        numbers: { type: 'array', items: { type: 'object' } }
        tags: { type: 'array', items: { type: 'string' } }
      }
    }
    data = {
      name: 'Bob',
      numbers: [
        {'number':'401-401-1337', 'type':'Home'},
        {'number':'123-456-7890', 'type':'Work'}
      ],
      tags: ['Friend'],
    }
  
    treema = TreemaNode.make(null, {
      data: data
      schema: schema
      callbacks:
        change: ->
          fired.f = true
    })
    treema.build()
    nameTreema = treema.childrenTreemas.name
    numbersTreema = treema.childrenTreemas.numbers
    tagsTreema = treema.childrenTreemas.tags
    fired = {f:false}

  it 'fires when editing a field', ->
    valEl = nameTreema.getValEl()
    valEl.click()
    valEl.find('input').val('Boom').blur()
    expect(fired.f).toBe(true)
    
  it 'fires when you use set()', ->
    nameTreema.set('/', 'Foo')
    expect(fired.f).toBe(true)
    
  it 'fires when you use insert()', ->
    treema.insert('/numbers', {})
    expect(fired.f).toBe(true)
    
  it 'fires when you use delete()', ->
    treema.delete('/numbers/2') 
    expect(fired.f).toBe(true)
    
  it 'does not fire when set() fails', ->
    nameTreema.set('/a/b/c/d/e', 'Foo')
    expect(fired.f).toBe(false)

  it 'does not fire when insert() fails', ->
    treema.insert('//a/b/c/d/e', {})
    expect(fired.f).toBe(false)

  it 'does not fire when delete() fails', ->
    treema.delete('//a/b/c/d/e')
    expect(fired.f).toBe(false)
    
  it 'fires when you add a new property to an object', ->
    treema.$el.find('.treema-add-child').click()
    expect(fired.f).toBe(false)
    tabKeyPress(treema.$el.find('input').val('red'))
    expect(fired.f).toBe(false)
    tabKeyPress(treema.$el.find('input').val('blue'))
    expect(fired.f).toBe(true)
    
  it 'fires when you add an object to an array', ->
    oldDataLength = numbersTreema.data.length
    numbersTreema.open()
    numbersTreema.$el.find('.treema-add-child').click()
    newDataLength = numbersTreema.data.length
    expect(oldDataLength).not.toBe(newDataLength)
    expect(fired.f).toBe(true)
    
  it 'fires when you add a non-collection to an array', ->
    tagsTreema.open()
    tagsTreema.$el.find('.treema-add-child').click()
    expect(fired.f).toBe(false)
    tabKeyPress(treema.$el.find('input').val('Star'))
    expect(fired.f).toBe(true)
 
  it 'fires when you delete an element in an array', ->
    tagsTreema.open()
    tagsTreema.$el.find('.treema-add-child').click()
    tabKeyPress(treema.$el.find('input').val('Star'))
    treema.endExistingEdits()
    tagTreema = tagsTreema.childrenTreemas[0]
    tagTreema.select()
    deleteKeyPress(treema.$el)
    expect(fired.f).toBe(true)

  it 'fires when you delete a property in an object', ->
    nameTreema.select()
    deleteKeyPress(treema.$el)
    expect(fired.f).toBe(true)
    
   