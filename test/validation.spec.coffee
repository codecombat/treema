describe 'showing errors', ->
  it 'does not go away when you close and open a collection', ->
    schema = {
      type: 'object',
      additionalProperties: false
    }
    data = { someProp: ['test', 1, 2, 3] }

    treema = $('<div></div>').treema({ schema:schema, data:data })
    treema.build()
    expect(treema.$el.find('.treema-error').length).toBe(1)
    window.treema = treema
    treema.childrenTreemas.someProp.open()
    expect(treema.$el.find('.treema-error').length).toBe(1)
    treema.childrenTreemas.someProp.close()
    expect(treema.$el.find('.treema-error').length).toBe(1)
