do ($ = jQuery) ->
  $.fn[TreemaNode.pluginName] = (options) ->
    return null if @length is 0
    element = $(@[0])
    return TreemaNode.make(element, options)
