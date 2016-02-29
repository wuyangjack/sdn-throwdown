var RouterMarker = {
  new: function(json, map) {
    return {json: json, map: map};
  },

  draw: function(self) {

    var image = {
      url: 'images/router.png',
      // This marker is 20 pixels wide by 32 pixels high.
      size: new google.maps.Size(40, 40),
      // The origin for this image is (0, 0).
      origin: new google.maps.Point(0, 0),
      // The anchor for this image is the base of the flagpole at (0, 32).
      anchor: new google.maps.Point(20, 20)
    };

    var marker = new google.maps.Marker({
        position: {lat: self.json.coordinates[0], lng: self.json.coordinates[1]},
        map: self.map,
        icon: image,
        animation: google.maps.Animation.DROP
    });

    var info = new google.maps.InfoWindow({
      content: "<strong>" + self.json.hostname + "</strong>",
      maxWidth: 200
    });

    marker.addListener('mouseover', function() {
      info.open(self.map, marker);
    });

    marker.addListener('mouseout', function() {
      info.close();
    });

    self.marker = marker;
    return self;
  },

  delete: function(self) {
    if (self != null) {
      self.marker.setMap(null);
    }
    return self;
  },

  same: function(self, other) {
    if (other == null || self == null) {
      return false;
    }
    return JSON.stringify(self.json) === JSON.stringify(other.json);
  }
}

var LspPath = {
  new: function(json, map) {
    return {json: json, map: map};
  },

  name: function(self) {
    return self.json.name;
  },
 
  draw: function(self) {
    var nodes = self.json.ero;
    var paths = [];
    var scale = 3;
    var color = '#F00';

    var arrow = {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      strokeColor: color,
      fillColor: color,
      fillOpacity: 1,
      scale: scale
    };

    var dash = {
      path: 'M 0,-1 0,1',
      strokeColor: color,
      fillColor: color,
      strokeOpacity: 1,
      scale: scale
    };

    for (var i = 1; i < nodes.length; i++) {
      var a_node = LspPath.nodeCoordinates[nodes[i - 1]];
      var z_node = LspPath.nodeCoordinates[nodes[i]];

      var coordinates = [
        {lat: a_node[0], lng: a_node[1]},
        {lat: z_node[0], lng: z_node[1]}
      ];

      var color = '#FF0000';

      var path = new google.maps.Polyline({
        path: coordinates,
        strokeOpacity: 0,
        geodesic: true,
        icons: [
          {
            icon: arrow,
            offset: '0',
            repeat: '80px'
          },
          {
            icon: dash,
            offset: '0',
            repeat: '20px'
          }
        ],
      });

      path.setMap(self.map);
      /*
      var info = new google.maps.InfoWindow({
        content: "<strong>" + self.json.name + "</strong>",
        maxWidth: 200
      });

      path.addListener('mouseover', function() {
        info.open(self.map, path);
      });

      path.addListener('mouseout', function() {
        info.close();
      });
      */
      paths.push(path);
    }

    self.paths = paths;
    return self;
  },

  delete: function(self) {
    if (self != null) {
      for (var i = 0; i < self.paths.length; i++) {
        self.paths[i].setMap(null);
      }
    }
    return self;
  },

  same: function(self, other) {
    if (other == null || self == null) {
      return false;
    }
    return JSON.stringify(self.json) == JSON.stringify(other.json);
  } 
}

var LinkPath = {
  new: function(json, map, direction) {
    return {json: json, map: map, direction: direction};
  },

  name: function(self) {
    if (self.direction) {
      return self.json.ANode.nodeIndex + "_" + self.json.ZNode.nodeIndex;
    } else {
      return self.json.ZNode.nodeIndex + "_" + self.json.ANode.nodeIndex;
    }
  },

  draw: function(self) {
    var a_node = LinkPath.nodeCoordinates[self.json.ANode.nodeIndex];
    var z_node = LinkPath.nodeCoordinates[self.json.ZNode.nodeIndex];
    // color:
    /*
    var colors = ['#FF0000','#FF1100','#FF2200','#FF3300','#FF4400','#FF5500','#FF6600',
                  '#FF7700','#FF8800','#FF9900','#FFAA00','#FFBB00','#FFCC00','#FFDD00',
                  '#FFEE00','#FFFF00','#EEFF00','#DDFF00','#CCFF00','#BBFF00','#AAFF00',
                  '#99FF00','#88FF00','#77FF00','#66FF00','#55FF00','#44FF00','#33FF00',
                  '#22FF00','#11FF00','#00FF00'];
    */
    var colors = ['#FF0000', '#FF3300','#FF6600','#FF9900','#FFCC00','#FFFF00','#CCFF00','#99FF00','#66FF00','#33FF00','#00FF00'];

    var offset = 0;
    var coordinates = [
        {lat: a_node[0], lng: a_node[1]},
        {lat: z_node[0], lng: z_node[1]}
    ];

    if (self.direction) {
      if (self.json.status == 'Up') {
        var scale = Math.round((1 - parseFloat(self.json.AZUtility)) * 10);
        var color = colors[scale];
      } else {
        var color = '#000000';
      }
      var stroke_weight = parseFloat(self.json.AZlspCount) * 0.2 + 2;
    } else {
      if (self.json.status == 'Up') {
        var scale = Math.round((1 - parseFloat(self.json.ZAUtility)) * 10);
        var color = colors[scale];
      } else {
        var color = '#000000';
      }
      var stroke_weight = parseFloat(self.json.ZAlspCount) * 0.2 + 2;
    }
    var opacity = 0.6;
    var arrow = {
      path: self.direction ? google.maps.SymbolPath.FORWARD_CLOSED_ARROW : google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
      strokeColor: color,
      strokeOpacity: 0,
      fillColor: color,
      fillOpacity: opacity
    };

    var path = new google.maps.Polyline({
      path: coordinates,
      strokeColor: color,
      fillColor: color,
      strokeOpacity: opacity,
      strokeWeight: stroke_weight,
      icons: [
          {
            icon: arrow,
            offset: '50px',
            repeat: '100px'
          }
        ]
    });

    path.setMap(self.map);
    self.path = path;
    return self;
  },

  delete: function(self) {
    if (self != null) {
      self.path.setMap(null);
    }
    return self;
  },

  same: function(self, other) {
    if (other == null || self == null) {
      return false;
    }
    return JSON.stringify(self.json) == JSON.stringify(other.json) && self.direction == other.direction;
  } 
}

var QueryForm = React.createClass({
  getInitialState: function() {
    return {name: '', link: '...', lsp: '...'};
  },
  handleNameChange: function(e) {
    this.setState({name: e.target.value});
  },
  handleLinkChange: function(e) {
    this.setState({link: e.target.value});
  },
  handleLSPChange: function(e) {
    this.setState({lsp: e.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var name = this.state.name.trim();
    var link = this.state.link_editor.getValue();
    var lsp = '...';
    if (this.props.single != 'true') {
      lsp = this.state.lsp_editor.getValue();
    }
    if (!link || !name || !lsp) {
      return;
    }
    this.props.onQuerySubmit({name: name, link: link, lsp: lsp});
    this.setState({name: '...', link: '...', lsp: '...'});
  },

  componentDidMount: function() {
    var link_editor = ace.edit("link");
    var SQLScriptMode = ace.require("ace/mode/sql").Mode;
    link_editor.session.setMode(new SQLScriptMode());
    link_editor.setTheme("ace/theme/chrome");
    link_editor.setOptions({ maxLines: Infinity });
    this.state.link_editor = link_editor;
    if (this.props.single != 'true') {
      var lsp_editor = ace.edit("lsp");
      lsp_editor.session.setMode(new SQLScriptMode());
      lsp_editor.setTheme("ace/theme/chrome");
      lsp_editor.setOptions({ maxLines: Infinity });
      this.state.lsp_editor = lsp_editor;
    }
  },
  render: function() {
    if (this.props.single != 'true') {
      return (
        <form className="queryForm" onSubmit={this.handleSubmit}>
          <div className="col-xs-10">
            <input type="text" className="form-control" value={this.state.name} placeholder="New Query" onChange={this.handleNameChange} />
          </div>
          <div>
            <button type="submit" value = "Post" className="btn btn-default" aria-label="Left Align">
              <span className="glyphicon glyphicon-plus" aria-hidden="true"></span>
            </button>
          </div>
          <br/>
          <div className="col-xs-12">
            <div className="panel panel-default">
              <div id="link">SELECT * FROM Link_</div>
            </div>
          </div>
          <div className="col-xs-12">
            <div className="panel panel-default">
              <div id="lsp">SELECT * FROM Lsp_</div>
            </div>
          </div>
        </form>
      );    
    } else {
      return (
        <form className="queryForm" onSubmit={this.handleSubmit}>
          <div className="col-xs-10">
            <input type="text" className="form-control" value={this.state.name} placeholder="New Query" onChange={this.handleNameChange} />
          </div>
          <div>
            <button type="submit" value = "Post" className="btn btn-default" aria-label="Left Align">
              <span className="glyphicon glyphicon-plus" aria-hidden="true"></span>
            </button>
          </div>
          <br/>
          <div className="col-xs-12">
            <div className="panel panel-default">
              <div id="link">SELECT * FROM Link_</div>
            </div>
          </div>
        </form>
      );
    }

  }
});

var QueryList = React.createClass({
  render: function() {
    var queryExecutionHandler = this.props.onQuerySubmit;
    var single = this.props.single;
    var height = this.props.height;
    var queryNodes = this.props.queries.map(function(query) {
      return (
        <tr>
          <td>
            <Query name={query.name} key={query.id} link={query.link} lsp={query.lsp} single={single} height={height} onQuerySubmit={queryExecutionHandler}/>
          </td>
        </tr>
      );
    });
    return (
      <table className="querytList table table-striped">
        <tbody>
          {queryNodes}
        </tbody>
      </table>
    );
  }
});

var Query = React.createClass({
  getInitialState: function() {
    var uuid = Date.now();
    var linkid = Date.now() + "@";
    var lspid = Date.now() + "#";
    return {uuid: uuid, linkid: linkid, lspid: lspid};
  },

  handleSubmit: function(e) {
    e.preventDefault();
    this.props.onQuerySubmit({name: this.props.name, link: this.props.link, lsp: this.props.lsp, single: this.props.single});
  },

  componentDidMount: function() {
    var link_editor = ace.edit(this.state.linkid.toString());
    var SQLScriptMode = ace.require("ace/mode/sql").Mode;
    link_editor.session.setMode(new SQLScriptMode());
    link_editor.setTheme("ace/theme/chrome");
    link_editor.setOptions({ maxLines: Infinity });
    this.state.link_editor = link_editor;
    if (this.props.single != 'true') {
      var lsp_editor = ace.edit(this.state.lspid.toString());
      lsp_editor.session.setMode(new SQLScriptMode());
      lsp_editor.setTheme("ace/theme/chrome");
      lsp_editor.setOptions({ maxLines: Infinity });
      this.state.lsp_editor = lsp_editor;
    }
  },

  render: function() {
    var scopeLink = {
      width: '100%',
      height: this.props.height
    }
    var scopeLsp = {
      width: '100%',
      height: this.props.height
    }
    if (this.props.single != 'true') {
      return (
        <div className="query">
          <h5 className="queryName">
            {this.props.name}
          </h5>
          <button type="button" className="btn btn-default" aria-label="Left Align" data-toggle="collapse" data-target={"#" + this.state.uuid}>
            <span className="glyphicon glyphicon-triangle-bottom" aria-hidden="true"></span>
          </button>
          <button type="button" className="btn btn-default" aria-label="Left Align" onClick={this.handleSubmit}>
            <span className="glyphicon glyphicon-play" aria-hidden="true"></span>
          </button>
          <button type="button" className="btn btn-default" aria-label="Left Align" onClick={this.handleDelete}>
            <span className="glyphicon glyphicon-trash" aria-hidden="true"></span>
          </button>
          <br/>
          <br/>
          <div id={this.state.uuid} className="collapse">
            <div className="panel panel-default">
              <div id={this.state.linkid.toString()} style={scopeLink}>{this.props.link}</div>
            </div>
            <div className="panel panel-default">
              <div id={this.state.lspid.toString()} style={scopeLsp}>{this.props.lsp}</div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="query">
          <h5 className="queryName">
            {this.props.name}
          </h5>
          <button type="button" className="btn btn-default" aria-label="Left Align" data-toggle="collapse" data-target={"#" + this.state.uuid}>
            <span className="glyphicon glyphicon-triangle-bottom" aria-hidden="true"></span>
          </button>
          <button type="button" className="btn btn-default" aria-label="Left Align" onClick={this.handleSubmit}>
            <span className="glyphicon glyphicon-play" aria-hidden="true"></span>
          </button>
          <button type="button" className="btn btn-default" aria-label="Left Align" onClick={this.handleDelete}>
            <span className="glyphicon glyphicon-trash" aria-hidden="true"></span>
          </button>
          <br/>
          <br/>
          <div id={this.state.uuid} className="collapse">
            <div className="panel panel-default">
              <div id={this.state.linkid.toString()} style={scopeLink}>{this.props.link}</div>
            </div>
          </div>
        </div>
      );
    }
  }
});

var ResultTable = React.createClass({
  render: function() {
    var json = this.props.content;
    if (_.isEmpty(json)) {
      return(<div/>);
    } else {
      var num_col = Object.keys(json).length;
      var ths = [];
      for (var i = 0; i < num_col; i++) {
        ths.push(<th className="col-md-{{12 / num_col}}">{Object.keys(json)[i]}</th>);
      }
      var r = Object.keys(json)[0];
      var num_row = json[r].length;
      var trs = [];
      for (var i = 0; i < num_row; i++) {
        var tds = [];
        for (var j = 0; j < num_col; j++) {
          var formatted = json[Object.keys(json)[j]][i];
          if (Object.keys(json)[j] == "Utilization") {
            formatted = Math.round(formatted * 100);
            if (formatted >= 70) {
              tds.push(<td className="col-md-{{12 / num_col}} danger-value"><strong>{formatted + "%"}</strong></td>);
            } else {
              tds.push(<td className="col-md-{{12 / num_col}}">{formatted + "%"}</td>);
            }
          } else if (Object.keys(json)[j] == "Status") {
            if (this.props.name == "linkStatistics" && formatted == "Down") {
              tds.push(<td className="col-md-{{12 / num_col}} danger-value"><strong>{formatted}</strong></td>);
            } else if (this.props.name == "lspStatistics" && formatted != "Active") {
              tds.push(<td className="col-md-{{12 / num_col}} danger-value"><strong>{formatted}</strong></td>);              
            } else {
              tds.push(<td className="col-md-{{12 / num_col}}">{formatted}</td>);
            }
          } else if (Object.keys(json)[j] == "LSP Count") {
            if (formatted >= 20) {
              tds.push(<td className="col-md-{{12 / num_col}} danger-value"><strong>{formatted}</strong></td>);
            } else {
              tds.push(<td className="col-md-{{12 / num_col}}">{formatted}</td>);
            }
          } else if (Object.keys(json)[j] == "Link") {
            var from = formatted.substring(0, 1);
            var to = formatted.substring(2, 3);
            var abb_from = ResultTable.nodeNames[from].substring(0, 3);
            var abb_to = ResultTable.nodeNames[to].substring(0, 3);
            if (ResultTable.nodeNames[from] == "TAMPA") {
              abb_from = "TPA";
            }
            if (ResultTable.nodeNames[to] == "TAMPA") {
              abb_to = "TPA";
            }
            formatted = abb_from + "-" + abb_to;
            tds.push(<td className="col-md-{{12 / num_col}}">{formatted}</td>);
          } else if (Object.keys(json)[j] == "Route") {
            formatted = formatted.substring(1,formatted.length - 1);
            var nodes = formatted.split(", ");
            formatted = ResultTable.nodeNames[nodes[0]].substring(0, 3);
            for (var k = 1; k < nodes.length; k++) {
              if (ResultTable.nodeNames[nodes[k]] == "TAMPA") {
                formatted = formatted + "-" + "TPA";
              } else {
                formatted = formatted + "-" + ResultTable.nodeNames[nodes[k]].substring(0, 3);
              }
            }
            tds.push(<td className="col-md-{{12 / num_col}}">{formatted}</td>);            
          } else if (Object.keys(json)[j] == "Real Latency") {
            if (formatted == "99999" || formatted == "9999") {
              tds.push(<td className="col-md-{{12 / num_col}}">NaN</td>);                        
            } else {
              formatted = Math.round(formatted*100)/100;
              if (formatted >= 300) {
                tds.push(<td className="col-md-{{12 / num_col}} danger-value"><strong>{formatted + " ms"}</strong></td>);
              } else {
                tds.push(<td className="col-md-{{12 / num_col}}">{formatted + " ms"}</td>);
              }
            }
          } else if (Object.keys(json)[j] == "Free") {
            formatted = Math.round(formatted*100)/100;
            if (formatted <= 0.3) {
              tds.push(<td className="col-md-{{12 / num_col}} danger-value"><strong>{formatted + " Gbps"}</strong></td>);                                    
            } else {
              tds.push(<td className="col-md-{{12 / num_col}}">{formatted + " Gbps"}</td>);              
            }
          } else if (Object.keys(json)[j] == "Geo Latency") {
            tds.push(<td className="col-md-{{12 / num_col}}">{formatted + " ms"}</td>);                                                
          } else {
            tds.push(<td className="col-md-{{12 / num_col}}">{formatted}</td>);                                                            
          }
        }
        trs.push(<tr>{tds}</tr>);
      }
      return (
        <table className="resultTable table table-striped">
          <thead>
            <tr>
              {ths}
            </tr>
          </thead>
          <tbody>
            {trs}
          </tbody>
        </table>
      );
    }
  }
});

// var QueryHistory = React.createClass({
//   rawMarkup: function() {
//     var rawMarkup = marked(this.props.children.toString(), {sanitize: true});
//     return { __html: rawMarkup };
//   },

//   render: function() {
//     return (
//       <div className="comment">
//         <h2 className="commentAuthor">
//           {this.props.author}
//         </h2>
//         <span dangerouslySetInnerHTML={this.rawMarkup()} />
//       </div>
//     );
//   }
// });

var NetworkStateService = {
  executeSql: function(object, query, callback) {
    // prevent sql injection
    //console.log("executing sql: " + query)
    $.ajax({
      url: 'api/sql',
      dataType: 'json',
      data: { 
        query: query,
        type: 'stream'
      },
      cache: false,
      success: function(result) {
        callback(object, result);
      }.bind(this),
      error: function(xhr, status, err) {
        console.error('api/sql', status, err.toString());
        callback(object, {});
      }.bind(this)
    });
  },

  uniqueState: function (jsons, attribute) {
    var items = NetworkStateService.filterState(jsons, attribute);
    return _.uniq(items);
  },

  groupState: function (jsons, attribute) {
      return _.groupBy(jsons, function (item) { return item[attribute] });
  },

  filterState: function (jsons, attribute) {
    return $.map(jsons, function (json) { return json[attribute]; })
  },

  cleanState: function (jsons, attribute, filter) {
    return $.map(jsons, function (json) { 
      if (_.indexOf(filter, json[attribute]) != -1) {
        return json;
      }
    })
  },

  formatState: function (jsons, attribute, formatter) {
    return $.map(jsons, function (json) { 
      json[attribute] = formatter(json[attribute]);
      return json;
    })
  },
}

var NetworkMap = React.createClass({
  getInitialState: function() {
    return {
      topology: {
          nodes: []
      },
      routerMarkers: {},
      linkPaths: {},
      lspPaths: {},
      queries: [],
      lspFilterQuery: '...',
      linkFilterQuery: '...',
      lspFilter: [],
      linkFilter: [],
      linkUtilization: {},
      linkStatus: {},
      linkLspCount: {},
      linkStatistics: {},
      //linkStatisticsFormatters: {},
      lspRoute: {},
      lspStatus: {},
      lspLatency: {},
      lspRealLatency: {},
      lspFreeUtilization: {},
      lspStatistics: {},
      //lspStatisticsFormatters: {},
    };
  },

  drawTables: function() {
    var linkFilter = this.state.linkFilter;
    var lspFilter = this.state.lspFilter;

    var linkStatistics = {};
    linkStatistics['Link'] = linkFilter;

    var linkUtilization = NetworkStateService.cleanState(this.state.linkUtilization, 'key', linkFilter);
    linkStatistics['Utilization'] = NetworkStateService.filterState(linkUtilization, 'value');

    // TODO: format index into city
    var linkStatus = NetworkStateService.cleanState(this.state.linkStatus, 'key', linkFilter); 
    linkStatistics['Status'] = NetworkStateService.filterState(linkStatus, 'value');



    var linkLspCount = NetworkStateService.cleanState(this.state.linkLspCount, 'key', linkFilter); 
    linkStatistics['LSP Count'] = NetworkStateService.filterState(linkLspCount, 'value');

    this.state.linkStatistics = linkStatistics;

    var lspStatistics = {};
    lspStatistics['LSP'] = lspFilter;

    var lspStatus = NetworkStateService.cleanState(this.state.lspStatus, 'key', lspFilter); 
    lspStatistics['Status'] = NetworkStateService.filterState(lspStatus, 'value');

    var lspLatency = NetworkStateService.cleanState(this.state.lspLatency, 'key', lspFilter); 
    lspStatistics['Geo Latency'] = NetworkStateService.filterState(lspLatency, 'value');

    var lspRealLatency = NetworkStateService.cleanState(this.state.lspRealLatency, 'key', lspFilter); 
    lspStatistics['Real Latency'] = NetworkStateService.filterState(lspRealLatency, 'value');

    var lspFreeUtilization = NetworkStateService.cleanState(this.state.lspFreeUtilization, 'key', lspFilter); 
    lspStatistics['Free'] = NetworkStateService.filterState(lspFreeUtilization, 'value');

    var lspRoute = NetworkStateService.cleanState(this.state.lspRoute, 'key', lspFilter); 
    lspStatistics['Route'] = NetworkStateService.filterState(lspRoute, 'value');

    this.state.lspStatistics = lspStatistics;

    this.setState(this.state);
  },

  drawTopology: function() {
    var map = this.state.map;

    // update routers
    var routers = this.state.topology.nodes;
    var routerMarkers = this.state.routerMarkers;
    var nodeCoordinates = {};
    var nodeNames = {};

    _.map(routers, function(router) {
      var name = router.hostname;
      nodeCoordinates[router.index] = router.coordinates;
      nodeNames[router.index] = router.hostname;

      var rm_new = RouterMarker.new(router, map);
      var rm_old = routerMarkers[name];

      // update marker if necessary
      if (false == RouterMarker.same(rm_new, rm_old)) {
        //console.log("updated router marker");
        rm_old = RouterMarker.delete(rm_old);
        rm_new = RouterMarker.draw(rm_new);
        routerMarkers[name] = rm_new;
      } else {
        //console.log("ingore router marker");
      }
    });

    // update coordinates
    LinkPath.nodeCoordinates = nodeCoordinates;
    LspPath.nodeCoordinates = nodeCoordinates;
    LinkPath.nodeNames = nodeNames;
    LspPath.nodeNames = nodeNames;
    ResultTable.nodeNames = nodeNames;
    NetworkGraph.nodeNames = nodeNames;

    // update links
    var links = this.state.topology.links;
    var linkPaths = this.state.linkPaths;
    var direction = this.state.direction;
    var linkFilter = this.state.linkFilter;
    //console.log(linkFilter);

    _.mapObject(linkPaths, function(linkPath, name) {
      LinkPath.delete(linkPath);
    });

    _.map(links, function(link) {
      var pt_new = LinkPath.new(link, map, direction);
      var name = LinkPath.name(pt_new);
      if (_.indexOf(linkFilter, name) != -1) {
        pt_new = LinkPath.draw(pt_new);
        linkPaths[name] = pt_new;
      }
    });

    // update LSPs
    var lsps = this.state.topology.lsps;
    var lspPaths = this.state.lspPaths;
    var lspFilter = this.state.lspFilter;
    //console.log(lspFilter);
   
    _.map(lsps, function(lsp) {
      var lp_new = LspPath.new(lsp, map);
      var name = LspPath.name(lp_new);
      var lp_old = lspPaths[name];
      if (_.indexOf(lspFilter, name) != -1) {
        // update marker if necessary
        if (false == LspPath.same(lp_new, lp_old)) {
          //console.log("updated lsp path: " + name);
          lp_old = LspPath.delete(lp_old);
          lp_new = LspPath.draw(lp_new);
          lspPaths[name] = lp_new;
        } else {
          //console.log("ingore lsp path: " + name);
        }
      } else {
        // hide marker
        //console.log("hide lsp path: " + name)
        lp_old = LspPath.delete(lp_old);
        delete lspPaths[name];
      }
    });
  },

  loadTopologyFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(topology) {
        if (this.isMounted()) {
          this.state.topology = topology;
          this.state.direction = !this.state.direction;
          this.setState(this.state);
        }
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, "loading topology failure: " + err.toString());
      }.bind(this)
    });
  },

  loadQueriesFromServer: function() {
    $.ajax({
      url: this.props.query_url,
      dataType: 'json',
      cache: false,
      success: function(queries) {
        if (this.isMounted()) {
          this.state.queries = queries;
          this.setState(this.state);
        }
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.query_url, status, err.toString());
      }.bind(this)
    });
  },

  loadFiltersFromServer: function() {
    NetworkStateService.executeSql(this, this.state.lspFilterQuery, function(obj, data) {
      if (obj.isMounted()) {
        data = NetworkStateService.uniqueState(data, 'key');
        obj.state.lspFilter = data;
        obj.setState(obj.state);
      }
    });

    NetworkStateService.executeSql(this, this.state.linkFilterQuery, function(obj, data) {
      if (obj.isMounted()) {
        data = NetworkStateService.uniqueState(data, 'key');
        obj.state.linkFilter = data;
        obj.setState(obj.state);
      }
    });

    NetworkStateService.executeSql(this, "SELECT * FROM LinkUtilization_", function(obj, data) {
      if (obj.isMounted()) {
        obj.state.linkUtilization = data;
        obj.setState(obj.state);
      }
    });

    NetworkStateService.executeSql(this, "SELECT * FROM LinkStatus_", function(obj, data) {
      if (obj.isMounted()) {
        obj.state.linkStatus = data;
        obj.setState(obj.state);
      }
    });

    NetworkStateService.executeSql(this, "SELECT * FROM LinkLspCount_", function(obj, data) {
      if (obj.isMounted()) {
        obj.state.linkLspCount = data;
        obj.setState(obj.state);
      }
    });

    NetworkStateService.executeSql(this, "SELECT * FROM LspRoute_", function(obj, data) {
      if (obj.isMounted()) {
        obj.state.lspRoute = data;
        obj.setState(obj.state);
      }
    });

    NetworkStateService.executeSql(this, "SELECT * FROM LspStatus_", function(obj, data) {
      if (obj.isMounted()) {
        obj.state.lspStatus = data;
        obj.setState(obj.state);
      }
    });

    NetworkStateService.executeSql(this, "SELECT * FROM LspLatency_", function(obj, data) {
      if (obj.isMounted()) {
        obj.state.lspLatency = data;
        obj.setState(obj.state);
      }
    });

    NetworkStateService.executeSql(this, "SELECT * FROM LspRealLatency_", function(obj, data) {
      if (obj.isMounted()) {
        obj.state.lspRealLatency = data;
        obj.setState(obj.state);
      }
    });

    NetworkStateService.executeSql(this, "SELECT * FROM LspFreeUtilization_", function(obj, data) {
      if (obj.isMounted()) {
        obj.state.lspFreeUtilization = data;
        obj.setState(obj.state);
      }
    });

    this.drawTables();
  },

  handleQuerySubmit: function(query) {
    var query_history = this.state.queries;
    query.id = Date.now();
    var newQueries = query_history.concat([query]);
    this.state.queries = newQueries;
    this.setState(this.state);
    console.log(query);
    $.ajax({
      url: this.props.query_url,
      dataType: 'json',
      type: 'POST',
      data: query,
      success: function(queries) {
        this.state.queries = queries;
        this.setState(this.state);
      }.bind(this),
      error: function(xhr, status, err) {
        this.state.queries = query_history;
        this.setState(this.state);
        console.error(this.props.query_url, status, err.toString());
      }.bind(this)
    });
  },

  handleQueryExecute: function(query) {
    console.log(query);
    this.state.lspFilterQuery = query.lsp;
    this.state.linkFilterQuery = query.link;
    this.setState(this.state);
  },

  initializeGoogleMap: function() {
    // canvas
    var map = new google.maps.Map(document.getElementById('googleMap'), {
        center: {lat: 35, lng: -95},
        zoom: 4,
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.SATELLITE
    });
    map.setOptions({draggable: false, zoomControl: false, scrollwheel: false, disableDoubleClickZoom: true});
    this.state.map = map;
    this.state.direction = true;
    this.setState(this.state);
  },

  componentDidMount: function() {
    this.initializeGoogleMap();
    this.loadQueriesFromServerInterval = setInterval(this.loadQueriesFromServer, this.props.pollInterval);
    this.loadTopologyFromServerInterval = setInterval(this.loadTopologyFromServer, this.props.pollInterval);
    this.loadFiltersFromServerInterval = setInterval(this.loadFiltersFromServer, this.props.pollInterval);
  },

  componentWillUnmount () {
    this.loadQueriesFromServerInterval && clearInterval(this.loadQueriesFromServerInterval);
    this.loadQueriesFromServerInterval = false;
    this.loadTopologyFromServerInterval && clearInterval(this.loadTopologyFromServerInterval);
    this.loadTopologyFromServerInterval = false;
    this.loadFiltersFromServerInterval && clearInterval(this.loadFiltersFromServerInterval);
    this.loadFiltersFromServerInterval = false;   
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    return true;
  },

  render: function() {
    var scope = {
      style1: {
        height: 240
      },
      style2: {
        height: 500
      }
    };
    this.drawTopology();

    return (
      <div>
          <div className="col-md-8">
            <div className="networkMap">
              <div className="panel panel-default">
                <div className="panel-body">
                  <div id="googleMap">
                </div>
              </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="panel panel-default">
              <div className="panel-body">
                <div className="pre-scrollable" style={scope.style2}>
                  <QueryForm single='false' onQuerySubmit={this.handleQuerySubmit} />
                  <QueryList queries={this.state.queries} single='false' height='30px' onQuerySubmit={this.handleQueryExecute} />
                </div>
              </div>
            </div>
            <br/>
          </div>
          <div className="col-md-8">
            <div className="panel panel-default">
              <div className="panel-body">
                <div className="pre-scrollable" style={scope.style1}>
                  <ResultTable name="lspStatistics" content={this.state.lspStatistics}/>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="panel panel-default">
              <div className="panel-body">
                <div className="pre-scrollable" style={scope.style1}>
                  <ResultTable name="linkStatistics" content={this.state.linkStatistics}/>
                </div>
              </div>
            </div>
          </div>
      </div>
    );
  }
});

var formatTime = function (unix_timestamp) {
    return new Date(unix_timestamp * 1000).format("UTC:mm/dd HH:MM")
}

var drawTimeSeries = function (id, labels, values, times, labelTextX, labelTextY, legends) {
    var chart = c3.generate({
        bindto: '#' + id,
        size: {
        },
        data: {
            xs: {},
            columns: [],
            type: 'area-spline'
        },
        axis: {
            y: {
                //label: {
                //    text: labelTextY,
                //    position: 'outer-middle'
                //}
            },
            x: {
                label: {
                    text: labelTextX,
                    position: 'outer-middle'
                },
                tick: {
                  format: function function_name(unix_timestamp) {
                    var date = new Date(unix_timestamp * 1000);
                    return date.getHours().toString() + ":" + date.getMinutes().toString();
                  },
                }
            }
        },
        grid: {
            x: {
                show: true
            },
            y: {
                show: true
            }
        },
        legend: {
            show: true
        }
    });

    var xy = {};
    var datas = [];
    for (var i = 0; i < labels.length; i++) {
        var labelX = labels[i] + "X";
        times[labels[i]].unshift(labelX);
        values[labels[i]].unshift(labels[i])
        datas.push(times[labels[i]]);
        datas.push(values[labels[i]]);
        xy[labels[i]] = labelX;
    }
    chart.load({
        xs: xy,
        columns: datas,
    });
    return chart;
}

var NetworkGraph = React.createClass({
  getInitialState: function() {
    return {
      queries: [],
      sqlName: 'Name',
      sqlQuery: '...',
      sqlData: [],
    };
  },

  drawGraph: function() {
    if (_.isEmpty(this.state.sqlData) == false) {
      // Replace all link keys with their respective link names in this json: sqlData
      // the index to name is available in NetworkGraph.nodeNames
      var len = Object.keys(this.state.sqlData).length;
      for (var i = 0; i < len; i++) {
        var ln = this.state.sqlData[i].key;
        if (ln.length == 3) {
          var from = ln.substring(0, 1);
          var to = ln.substring(2, 3);
          var abb_from = ResultTable.nodeNames[from].substring(0, 3);
          var abb_to = ResultTable.nodeNames[to].substring(0, 3);
          if (ResultTable.nodeNames[from] == "TAMPA") {
            abb_from = "TPA";
          }
          if (ResultTable.nodeNames[to] == "TAMPA") {
            abb_to = "TPA";
          }
          this.state.sqlData[i].key = abb_from + "-" + abb_to;
        }
      }

      var streams = NetworkStateService.groupState(this.state.sqlData, "key");
      var labels = _.map(streams, function(stream, key) {
        return key;
      });
      var values = _.mapObject(streams, function(stream, key) {
        return NetworkStateService.filterState(stream, 'value');
      });
      var times = _.mapObject(streams, function(stream, key) {
        return NetworkStateService.filterState(stream, 'time');
      });
      drawTimeSeries('graph', labels, values, times, 'Time', 'Utilization', null);
    }
  },

  loadQueriesFromServer: function() {
    $.ajax({
      url: this.props.query_url,
      dataType: 'json',
      cache: false,
      success: function(queries) {
        if (this.isMounted()) {
          this.state.queries = queries;
          this.setState(this.state);
        }
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.query_url, status, err.toString());
      }.bind(this)
    });
  },

  loadSqlQueryFromServer: function() {
    NetworkStateService.executeSql(this, this.state.sqlQuery, function(obj, data) {
      if (obj.isMounted()) {
        obj.state.sqlData = data;
        obj.setState(obj.state);
      }
    });
  },

  handleQuerySubmit: function(query) {
    var query_history = this.state.queries;
    query.id = Date.now();
    var newQueries = query_history.concat([query]);
    this.state.graph_name = query.name;
    this.state.queries = newQueries;
    this.setState(this.state);
    $.ajax({
      url: this.props.query_url,
      dataType: 'json',
      type: 'POST',
      data: query,
      success: function(queries) {
        this.state.queries = queries;
        this.setState(this.state);
      }.bind(this),
      error: function(xhr, status, err) {
        this.state.queries = query_history;
        this.setState(this.state);
        console.error(this.props.query_url, status, err.toString());
      }.bind(this)
    });
  },

  handleQueryExecute: function(query) {
    console.log(query);
    this.state.sqlQuery = query.link;
    this.setState(this.state);
  },

  componentDidMount: function() {
    this.loadQueriesFromServerInterval = setInterval(this.loadQueriesFromServer, this.props.pollInterval);
    this.loadSqlQueryFromServerInterval = setInterval(this.loadSqlQueryFromServer, this.props.pollInterval);
  },

  componentWillUnmount () {
    this.loadQueriesFromServerInterval && clearInterval(this.loadQueriesFromServerInterval);
    this.loadQueriesFromServerInterval = false;
    this.loadSqlQueryFromServerInterval && clearInterval(this.loadSqlQueryFromServerInterval);
    this.loadSqlQueryFromServerInterval = false;
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    return true;
  },

  render: function() {
    var scope = {
      style1: {
        height: 240
      },
      style2: {
        height: 500
      }
    };
    this.drawGraph();

    return (
      <div>
          <div className="col-md-8">
            <div className="networkGraph">
              <div className="panel panel-default">
                <div className="panel-body">
                  <div id="graph">
                  <div>{this.state.graph_name}</div>
                </div>
              </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="panel panel-default">
              <div className="panel-body">
                <div className="pre-scrollable" style={scope.style2}>
                  <QueryForm single='true' onQuerySubmit={this.handleQuerySubmit} />
                  <QueryList queries={this.state.queries} single='true' height='30px' onQuerySubmit={this.handleQueryExecute} />
                </div>
              </div>
            </div>
            <br/>
          </div>
      </div>
    );
  }
});

var NavBar = React.createClass({
  render: function() {
    var mapClass = "";
    var graphClass = "";
    if (this.props.active == 'map') {
      mapClass = "active";
    } else {
      graphClass = "active";
    }
    return (
      <nav className="navbar navbar-default">
        <div className="container-fluid">
          <div className="navbar-header">
            <a className="navbar-brand" href="">
              <img alt="Brand" src="images/penn_logo_noname.png" height="120%" />
            </a>
          </div>
          <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
            <ul className="nav navbar-nav">
              <li className={mapClass}><a href="" onClick={this.props.showMap}>Map</a></li>
              <li className={graphClass}><a href="" onClick={this.props.showGraph}>Graph</a></li>
            </ul>
          </div>
        </div>
      </nav>
    );
  }
});

var PennApp = React.createClass({
  getInitialState: function() {
    return {show: 'map'};
  },

  showMap: function(e) {
    e.preventDefault();
    this.state.show = 'map';
    this.setState(this.state);
  },

  showGraph: function(e) {
    e.preventDefault();
    this.state.show = 'graph';
    this.setState(this.state);
  },

  render: function() {
    if (this.state.show == 'map') {
      return (
        <div>
          <NavBar active='map' showGraph={this.showGraph} showMap={this.showMap} />
          <NetworkMap url="/api/topology" query_url="/api/sqls" pollInterval={1000}/>
        </div>
      );
    } else {
      return (
        <div>
          <NavBar active='graph' showGraph={this.showGraph} showMap={this.showMap} />
          <NetworkGraph query_url="/api/graphs" pollInterval={5000}/>
        </div>
      );
    }
  }
});

ReactDOM.render(
  <PennApp/>,
  document.getElementById('content')
);

