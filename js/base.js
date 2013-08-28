var demosMade = 0;

function buildTreemaExample (el, schema, data) {
  el.addClass('treema-wrapper');
  
  // create the tabs
  var nav = $('<ul class="nav nav-tabs"></ul>');
  var treemaLink = $('<a>Treema</a>').attr('href', '#treema-'+demosMade);
  var dataLink = $('<a>Data</a>').attr('href', '#data-'+demosMade).addClass('is-data');
  var schemaLink = $('<a>Schema</a>').attr('href', '#schema-'+demosMade);
  var errorsLink = $('<a>Errors</a>').attr('href', '#errors-'+demosMade).addClass('is-errors');
  
  // add the tabs
  nav.append($('<li></li>').addClass('active').append(treemaLink));
  nav.append($('<li></li>').append(dataLink));
  nav.append($('<li></li>').append(schemaLink));
  nav.append($('<li></li>').append(errorsLink));

  // create and add the panes
  var content = $('<div></div>').addClass('tab-content');
  var treemaTab = $('<div></div>').addClass('tab-pane').addClass('active').attr('id', 'treema-'+demosMade);
  content.append(treemaTab);
  var dataTab = $('<pre></pre>').addClass('tab-pane').attr('id', 'data-'+demosMade);
  content.append(dataTab);
  var schemaTab = $('<pre></pre>').addClass('tab-pane').attr('id', 'schema-'+demosMade);
  schemaTab.text(JSON.stringify(schema, null, 2));
  content.append(schemaTab);
  var errorsTab = $('<pre></pre>').addClass('tab-pane').attr('id', 'errors-'+demosMade);
  content.append(errorsTab);

  // build and add the treema
  var treema = treemaTab.treema({schema: schema, data: data});
  treema.build();
  el.append(nav).append(content);

  // add tab click callbacks
  el.find('.nav a').click(function (e) {
    e.preventDefault();
    if ($(this).hasClass('is-data')) {
      dataTab.text(JSON.stringify(treema.data, null, 2));
    }
    if ($(this).hasClass('is-errors')) {
      errorsTab.text(JSON.stringify(treema.getErrors(), null, 2));
    }
    $(this).tab('show');
  });
  
  // so that each demo has unique ids
  demosMade += 1;
  return treema;
}

var makeFauxSearchTreemaNodeClass = function (url) {
  var FauxSearchTreemaNode = function () { this['super']('constructor').apply(this, arguments); };
  DatabaseSearchTreemaNode.extend(FauxSearchTreemaNode);
  FauxSearchTreemaNode.prototype.url = url;
  FauxSearchTreemaNode.prototype.formatDocument = function (doc) {
//    if (doc) { return doc.name || ""; }
//    return "";
    return doc.name;
  }; 
  FauxSearchTreemaNode.prototype.searchCallback = function (results) {
    // demo hack, since it's only using static resources
    var newResults = [];
    var term = this.lastTerm.toLowerCase();
    for (var result in results) {
      result = results[result];
      if (result.name.toLowerCase().indexOf(term) == -1) continue;
      newResults.push(result);
    }
    this['super']('searchCallback').apply(this, [newResults]);
  };
  return FauxSearchTreemaNode;
};