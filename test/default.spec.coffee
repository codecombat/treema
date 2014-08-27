describe 'defaults', ->
  
  it 'shows properties for object nodes which are specified in a default object that are not included in the data', ->
    data = { }
    schema = { default: { key: 'value' } }
    treema = TreemaNode.make(null, {data: data, schema: schema})
    treema.build()
    expect(treema.childrenTreemas.key).toBeDefined()

  it 'does not put default data into the containing data object', ->
    data = { }
    schema = { default: { key: 'value' } }
    treema = TreemaNode.make(null, {data: data, schema: schema})
    treema.build()
    expect(treema.data.key).toBeUndefined()

  it 'puts data into the containing data object when its value is changed', ->
    data = { }
    schema = { default: { key: 'value' } }
    treema = TreemaNode.make(null, {data: data, schema: schema})
    treema.build()
    treema.set('key', 'testValue')
    expect(treema.data.key).toBe('testValue')
    expect(treema.childrenTreemas.key.integrated).toBe(true)
    expect(treema.$el.find('.treema-node').length).toBe(1)
  
  it 'keeps a default node around when you delete one with backup default data', ->
    data = { key: 'setValue' }
    schema = { default: { key: 'value' } }
    treema = TreemaNode.make(null, {data: data, schema: schema})
    treema.build()
    treema.delete('key')
    expect(treema.data.key).toBeUndefined()
    expect(treema.childrenTreemas.key).toBeDefined()
    expect(treema.childrenTreemas.key.integrated).toBe(false)
    expect(Object.keys(treema.data).length).toBe(0)

  it 'integrates up the chain when setting an inner default value', ->
    data = { }
    schema = { default: { innerObject: { key1: 'value1', key2: 'value2' } } }
    treema = TreemaNode.make(null, {data: data, schema: schema})
    treema.build()
    treema.childrenTreemas.innerObject.open()
    treema.childrenTreemas.innerObject.childrenTreemas.key1.set('', 'newValue')
    expect(JSON.stringify(treema.data)).toBe(JSON.stringify({innerObject: {key1: 'newValue'}}))
    
  it 'takes defaultData from the make options', ->
    data = { }
    schema = { }
    treema = TreemaNode.make(null, {data: data, schema: schema, defaultData: { key: 'value' }})
    treema.build()
    expect(treema.childrenTreemas.key).toBeDefined()
