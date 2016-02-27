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
    return {name: '...', link: '...', lsp: '...'};
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
    var link = this.state.link.trim();
    var lsp = this.state.lsp.trim();
    if (!link || !name || !lsp) {
      return;
    }
    this.props.onQuerySubmit({name: name, link: link, lsp: lsp});
    this.setState({name: '...', link: '...', lsp: '...'});
  },
  render: function() {
    return (
      <form className="queryForm form-horizontal" onSubmit={this.handleSubmit}>
        <br/>
        <div className="form-group">
          <div className="col-sm-offset-1 col-sm-10 input-group">
            <span className="input-group-addon">Name</span>
            <input type="text" className="form-control" value={this.state.name} placeholder="Name ..." onChange={this.handleNameChange} />
          </div>
        </div>
        <div className="form-group">
          <div className="col-sm-offset-1 col-sm-10 input-group">
            <span className="input-group-addon">Link</span>
            <input type="text" className="form-control" value={this.state.link} placeholder="Link ..." onChange={this.handleLinkChange} />
          </div>
        </div>
        <div className="form-group">
          <div className="col-sm-offset-1 col-sm-10 input-group">
            <span className="input-group-addon">LSP</span>
            <input type="text" className="form-control" value={this.state.lsp} placeholder="LSP ..." onChange={this.handleLSPChange} />
          </div>
        </div>
        <div className="form-group">
          <div className="col-sm-offset-1 col-sm-10">
            <button type="submit" value = "Post" className="btn btn-primary">Submit Query</button>
          </div>
        </div>
      </form>
    );
  }
});

var QueryList = React.createClass({
  render: function() {
    var queryExecutionHandler = this.props.onQuerySubmit;
    var queryNodes = this.props.queries.map(function(query) {
      return (
        <tr>
          <td>
            <Query name={query.name} key={query.id} link={query.link} lsp={query.lsp} onQuerySubmit={queryExecutionHandler}/>
          </td>
        </tr>
      );
    });
    return (
      <table className="querytList table-fixed table table-striped">
        <tbody>
          {queryNodes}
        </tbody>
      </table>
    );
  }
});

var Query = React.createClass({
  handleSubmit: function(e) {
    e.preventDefault();
    this.props.onQuerySubmit({link: this.props.link, lsp: this.props.lsp});
  },

  render: function() {
    return (
      <div className="query">
        <h4 className="queryName">
          {this.props.name}
        </h4>
        <br/>
        {this.props.link}
        <br/>
        {this.props.lsp}
        <button type="button" className="btn btn-default" aria-label="Left Align" onClick={this.handleSubmit}>
          <span className="glyphicon glyphicon-play" aria-hidden="true"></span>
        </button>
      </div>
    );
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
          tds.push(<td className="col-md-{{12 / num_col}}">{json[Object.keys(json)[j]][i]}</td>);
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
        query: query
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
      lspRoute: {},
      lspStatus: {},
      lspLatency: {},
      lspStatistics: {},
    };
  },

  drawTables: function() {
    var linkFilter = this.state.linkFilter;
    var lspFilter = this.state.lspFilter;

    var linkStatistics = {};
    linkStatistics['Name'] = linkFilter;

    var linkUtilization = NetworkStateService.cleanState(this.state.linkUtilization, 'key', linkFilter); 
    linkStatistics['Utilization'] = NetworkStateService.filterState(linkUtilization, 'value');

    var linkStatus = NetworkStateService.cleanState(this.state.linkStatus, 'key', linkFilter); 
    linkStatistics['Status'] = NetworkStateService.filterState(linkStatus, 'value');

    var linkLspCount = NetworkStateService.cleanState(this.state.linkLspCount, 'key', linkFilter); 
    linkStatistics['LSP Count'] = NetworkStateService.filterState(linkLspCount, 'value');

    this.state.linkStatistics = linkStatistics;

    var lspStatistics = {};
    lspStatistics['Name'] = lspFilter;

    var lspRoute = NetworkStateService.cleanState(this.state.lspRoute, 'key', lspFilter); 
    lspStatistics['Route'] = NetworkStateService.filterState(lspRoute, 'value');

    var lspStatus = NetworkStateService.cleanState(this.state.lspStatus, 'key', lspFilter); 
    lspStatistics['Status'] = NetworkStateService.filterState(lspStatus, 'value');

    var lspLatency = NetworkStateService.cleanState(this.state.lspLatency, 'key', lspFilter); 
    lspStatistics['Geographic Latency'] = NetworkStateService.filterState(lspLatency, 'value');

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
      nodeNames[router.index] = router.coordinates;

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
        this.state.topology = topology;
        this.state.direction = !this.state.direction;
        this.setState(this.state);
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
        this.state.queries = queries;
        this.setState(this.state);
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.query_url, status, err.toString());
      }.bind(this)
    });
  },

  loadFiltersFromServer: function() {
    NetworkStateService.executeSql(this, this.state.lspFilterQuery, function(obj, data) {
      data = NetworkStateService.uniqueState(data, 'key');
      obj.state.lspFilter = data;
      obj.setState(obj.state);
    });

    NetworkStateService.executeSql(this, this.state.linkFilterQuery, function(obj, data) {
      data = NetworkStateService.uniqueState(data, 'key');
      obj.state.linkFilter = data;
      obj.setState(obj.state);
    });

    NetworkStateService.executeSql(this, "SELECT * FROM LinkUtilization_", function(obj, data) {
      obj.state.linkUtilization = data;
      obj.setState(obj.state);
    });

    NetworkStateService.executeSql(this, "SELECT * FROM LinkStatus_", function(obj, data) {
      obj.state.linkStatus = data;
      obj.setState(obj.state);
    });

    NetworkStateService.executeSql(this, "SELECT * FROM LinkLspCount_", function(obj, data) {
      obj.state.linkLspCount = data;
      obj.setState(obj.state);
    });

    NetworkStateService.executeSql(this, "SELECT * FROM LspRoute_", function(obj, data) {
      obj.state.lspRoute = data;
      obj.setState(obj.state);
    });

    NetworkStateService.executeSql(this, "SELECT * FROM LspStatus_", function(obj, data) {
      obj.state.lspStatus = data;
      obj.setState(obj.state);
    });

    NetworkStateService.executeSql(this, "SELECT * FROM LspLatency_", function(obj, data) {
      obj.state.lspLatency = data;
      obj.setState(obj.state);
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
        disableDefaultUI: true
    });
    map.setOptions({draggable: false, zoomControl: false, scrollwheel: false, disableDoubleClickZoom: true});
    this.state.map = map;
    this.state.direction = true;
    this.setState(this.state);
  },

  componentDidMount: function() {
    this.initializeGoogleMap();
    setInterval(this.loadQueriesFromServer, this.props.pollInterval);
    setInterval(this.loadTopologyFromServer, this.props.pollInterval);
    setInterval(this.loadFiltersFromServer, this.props.pollInterval);
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    return true;
  },

  render: function() {
    var scope = {
         style: {
             height: 240
         }
    };
    this.drawTopology();

    return (
      <div>
          <div className="col-md-8">
            <div className="networkMap">
              <br/>
              <div className="panel panel-default">
                <div className="panel-body">
                  <div id="googleMap">
                </div>
              </div>
              </div>
            </div>
            <div className="panel panel-default">
              <div className="panel-body">
                <div className="pre-scrollable" style={scope.style}>
                  <ResultTable content={this.state.lspStatistics}/>
                </div>
              </div>
            </div>
            <div className="panel panel-default">
              <div className="panel-body">
                <div className="pre-scrollable" style={scope.style}>
                  <ResultTable content={this.state.linkStatistics}/>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <br/>
            <div className="panel panel-default">
              <div className="panel-heading">
                <h3 className="panel-title">New Query</h3>
              </div>
              <div className="panel-body">
                <QueryForm onQuerySubmit={this.handleQuerySubmit} />
              </div>
            </div>
            <div className="panel panel-default">
              <div className="panel-heading">
                <h3 className="panel-title">Queries History</h3>
              </div>
              <div className="panel-body">
                <QueryList queries={this.state.queries} onQuerySubmit={this.handleQueryExecute} />
              </div>
            </div>
            <br/>
          </div>
      </div>
    );
  }
});

ReactDOM.render(
  <NetworkMap url="/api/topology" query_url="/api/sqls" pollInterval={1000}/>,
  document.getElementById('content')
);
