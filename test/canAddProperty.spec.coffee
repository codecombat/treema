describe 'canAddProperty', ->
  it 'works when properties is not defined, additionalProperties is false, and patternProperties is defined', ->
    schema = {
      "type": "object",
      "patternProperties": {
        "^[a-z]+$": {}
      },
      "additionalProperties": false
    }
    data = {}
    treema = TreemaNode.make(null, {data: data, schema: schema})
    treema.build()
    expect(treema.canAddProperty('test')).toBe(true)
    expect(treema.canAddProperty('1234')).toBe(false)
