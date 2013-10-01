describe 'readOnly in schema', ->

  schema = {
    type: 'object',
    properties: {
      name: { 
        type: 'string',
        readOnly: true
      },

      numbers: { 
        type: 'array', 
        items: { type: 'object' }, 
        readOnly: true 
      },
      
      tags: {
        type: 'array',
        items: { type: 'string', readOnly: true  } 
      },
      
      tags2: {
        type: 'array',
        items: { type: 'string' },
        readOnly: true
      }

      map: {
        type: 'object',
        readOnly: true
      }
    }
  }
  data = {
    name: 'Bob',
    numbers: [
      {'number':'401-401-1337', 'type':'Home'},
      {'number':'123-456-7890', 'type':'Work'}
    ],
    tags: ['Friend'],
    tags2: ['Friend'],
    map: {
      'string': 'String',
      'object': { 'key': 'value' }
    }
  }
  
  treema = TreemaNode.make(null, {data: data, schema: schema})
  treema.build()

  it 'prevents editing of readOnly non-collection properties', ->
    expect(treema.childrenTreemas.name.canEdit()).toBe(false)
    
  # arrays
    
  it 'prevents removing from readOnly arrays', ->
    treema.childrenTreemas.numbers.remove()
    expect(treema.data.numbers).not.toBeUndefined()
    
  it 'prevents adding items to readOnly arrays', ->
    expect(treema.childrenTreemas.numbers.canAddChild()).toBe(false)
  
  it 'prevents removing readOnly items from arrays which are not readOnly', ->
    treema.childrenTreemas.tags.open()
    treema.childrenTreemas.tags.childrenTreemas[0].remove()
    expect(treema.data.tags.length).toBe(1)
    
  it 'prevents editing non-collection items in readOnly arrays', ->
    treema.childrenTreemas.tags2.open()
    expect(treema.childrenTreemas.tags2.childrenTreemas[0].canEdit()).toBe(false)
    
  # objects

  it 'prevents removing from readOnly objects', ->
    treema.childrenTreemas.map.remove()
    expect(treema.data.map).not.toBeUndefined()

  it 'prevents adding to readOnly objects', ->
    expect(treema.childrenTreemas.map.canAddChild()).toBe(false)

  it 'prevents removing readOnly properties from objects which are not readOnly', ->
    treema.childrenTreemas.name.remove()
    treema.childrenTreemas.tags.childrenTreemas[0].remove()
    expect(treema.data.tags.length).toBe(1)

  it 'prevents editing non-collection properties in readOnly objects', ->
    treema.childrenTreemas.map.open()
    expect(treema.childrenTreemas.map.childrenTreemas.string.canEdit()).toBe(false)
    
