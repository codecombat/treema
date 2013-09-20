describe '"N" key press', ->
  nKeyPress = ($el) -> keyDown($el, 78)
  enterKeyPress = ($el) -> keyDown($el, 13)

  schema = {
    type: 'array',
    maxItems: 3,
    items: { type: 'string' }
  }
  data = ['401-401-1337', '123-456-7890']
  treema = TreemaNode.make(null, {data: data, schema: schema})
  treema.build()

  it 'creates a new row for the currently selected collection', ->
    treema.childrenTreemas[0].select()
    expect(treema.childrenTreemas[2]).toBeUndefined()
    nKeyPress(treema.childrenTreemas[0].$el)
    expect(treema.childrenTreemas[2]).not.toBeUndefined('')
    enterKeyPress(treema.$el.find('input').val('410-555-1023'))
    expect(treema.childrenTreemas[2]).not.toBeUndefined()
    treema.childrenTreemas[2].display()
    treema.childrenTreemas[2].select()
    expect(treema.childrenTreemas[2]).not.toBeUndefined()
    
  it 'does not create a new row when there\'s no more space', ->
    expect(treema.data.length).toBe(3)
    nKeyPress(treema.childrenTreemas[0].$el)
    expect(treema.data.length).toBe(3)