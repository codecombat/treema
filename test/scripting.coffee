do ->
  expectOpen = (t) ->
    expect(t).toBeDefined()
    expect(t.isClosed()).toBeFalsy()

  expectClosed = (t) ->
    expect(t).toBeDefined()
    expect(t.isClosed()).toBeTruthy()

  schema =
    type: 'object',
    properties:
      name:
        type: 'string'
      info:
        type: 'object'
        properties:
          numbers:
            type: 'array',
            items:
              type: ['string', 'array']
  data = name: 'Thor', info: {numbers: ['401-401-1337', ['123-456-7890']]}
  treema = TreemaNode.make(null, {data: data, schema: schema})
  treema.build()
  console.log "Got data", data

  beforeEach ->
    treema.deselectAll()
    treema.close()

  describe 'openDeep', ->
    it 'opens everything by default', ->
      expectClosed(treema)
      treema.openDeep()
      expectOpen(treema)
      infoTreema = treema.childrenTreemas.info
      expectOpen(infoTreema)
      phoneTreema = infoTreema.childrenTreemas.numbers
      expectOpen(phoneTreema)

    it 'can open n levels deep', ->
      expectClosed(treema)
      treema.openDeep(2)
      expectOpen(treema)
      infoTreema = treema.childrenTreemas.info
      expectOpen(infoTreema)
      phoneTreema = infoTreema.childrenTreemas.numbers
      expectClosed(phoneTreema)
