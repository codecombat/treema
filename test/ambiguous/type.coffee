describe 'Schemas with multiple types', ->
  tabKeyPress = ($el) -> keyDown($el, 9)

  schema = {
    type: 'array',
    items: {
      "type": [
        "boolean",
        "integer",
        "number",
        "null",
        "string"
      ]
    }
  }
  data = []

  treema = TreemaNode.make(null, {data: data, schema: schema})
  treema.build()
  
  it 'chooses the first one in the type list', ->
    treema.addNewChild()
    newChild = treema.$el.find('.treema-node').data('instance')
    newChild.endExistingEdits()
    newChild.flushChanges()
    expect(treema.data[0]).toBe(false)
    