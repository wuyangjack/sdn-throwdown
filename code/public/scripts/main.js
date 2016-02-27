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
    return self.json.lspIndex + self.json.name;
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
    return self.json.index + (self.direction ? "AZ" : "ZA");
  },
  /*
  circle: function(p1, p2) {
    var pm = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
    var distance = Math.sqrt(Math.abs(p1[0] - p2[0])^2 + Math.abs(p1[0] - p2[0])^2);
    console.log(pm);
    console.log(distance);
    return pm;
  },
  */
  draw: function(self) {
    var a_node = LinkPath.nodeCoordinates[self.json.ANode.nodeIndex];
    var z_node = LinkPath.nodeCoordinates[self.json.ZNode.nodeIndex];
    // color:
    var colors = ['#FF0000','#FF1100','#FF2200','#FF3300','#FF4400','#FF5500','#FF6600',
                  '#FF7700','#FF8800','#FF9900','#FFAA00','#FFBB00','#FFCC00','#FFDD00',
                  '#FFEE00','#FFFF00','#EEFF00','#DDFF00','#CCFF00','#BBFF00','#AAFF00',
                  '#99FF00','#88FF00','#77FF00','#66FF00','#55FF00','#44FF00','#33FF00',
                  '#22FF00','#11FF00','#00FF00'];

    var offset = 0;
    var coordinates = [
        {lat: a_node[0], lng: a_node[1]},
        {lat: z_node[0], lng: z_node[1]}
    ];

    if (self.direction) {
      if (self.json.status == 'Up') {
        var scale = Math.round((1 - parseFloat(self.json.AZUtility)) * 30);
        var color = colors[scale];
      } else {
        var color = '#FF0000';
      }
      var stroke_weight = parseFloat(self.json.AZlspCount) * 0.2 + 2;
    } else {
      if (self.json.status == 'Up') {
        var scale = Math.round((1 - parseFloat(self.json.ZAUtility)) * 30);
        var color = colors[scale];
      } else {
        var color = '#FF0000';
      }
      var stroke_weight = parseFloat(self.json.ZAlspCount) * 0.2 + 2;
    }
    console.log(self.direction);
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

    /*
    var info = new google.maps.InfoWindow({
      content: "<strong>" + self.json.index + "</strong>",
      maxWidth: 200
    });

    path.addListener('mouseover', function() {
      info.open(self.map, path);
    });

    path.addListener('mouseout', function() {
      info.close();
    });
    */
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
    return {name: '', link: '', lsp: ''};
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
    this.setState({name: '', link: '', lsp: ''});
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
    var queryNodes = this.props.queries.map(function(query) {
      return (
        <tr>
          <td>
            <Query name={query.name} key={query.id}>
              {query.link}
              <br/>
              {query.lsp}
            </Query>
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
  render: function() {
    return (
      <div className="query">
        <a href="#">
          <h4 className="queryName">
            {this.props.name}
          </h4>
        </a>
        {this.props.children}
      </div>
    );
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

var NetworkMap = React.createClass({
  getInitialState: function() {
    return {
      topology: {
          nodes: []
      },
      routerMarkers: {},
      linkPaths: {},
      lspPaths: {},
      queries: []
    };
  },

  drawTopology: function() {
    console.log("draw")
    console.log(this.state);
    var map = this.state.map;

    // update routers
    var routers = this.state.topology.nodes;
    var routerMarkers = this.state.routerMarkers;
    var nodeCoordinates = {};

    _.map(routers, function(router) {
      var name = router.hostname;
      nodeCoordinates[router.index] = router.coordinates;

      var rm_new = RouterMarker.new(router, map);
      var rm_old = routerMarkers[name];

      // update marker if necessary
      if (false == RouterMarker.same(rm_new, rm_old)) {
        console.log("updated router marker");
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

    _.mapObject(linkPaths, function(linkPath, name) {
      LinkPath.delete(linkPath);
    });

    _.map(links, function(link) {
      var pt_new = LinkPath.new(link, map, direction);
      var name = LinkPath.name(pt_new);
      pt_new = LinkPath.draw(pt_new);
      linkPaths[name] = pt_new;
    });

    // update LSPs
    var lsps = this.state.topology.lsps;
    var lspPaths = this.state.lspPaths;

    _.map(lsps, function(lsp) {
      if (lsp.name == 'GROUP_FIVE_NY_SF_LSP2') {
        var lp_new = LspPath.new(lsp, map);
        var name = LspPath.name(lp_new);
        var lp_old = lspPaths[name];

        // update marker if necessary
        if (false == LspPath.same(lp_new, lp_old)) {
          console.log("updated lsp path");
          lp_old = LspPath.delete(lp_old);
          lp_new = LspPath.draw(lp_new);
          lspPaths[name] = lp_new;
        } else {
          //console.log("ingore lsp path");
        }
      }
    });

    console.log("draw done")
  },

  loadTopologyFromServer: function() {
    console.log("@@@");
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

  initializeGoogleMap: function() {
    // canvas
    var map = new google.maps.Map(document.getElementById('googleMap'), {
        center: {lat: 37, lng: -95},
        zoom: 4
    });
    this.state.map = map;
    this.state.direction = true;
    this.setState(this.state);
  },

  componentDidMount: function() {
    this.initializeGoogleMap();
    this.loadQueriesFromServer();
    setInterval(this.loadQueriesFromServer, this.props.pollInterval);
    setInterval(this.loadTopologyFromServer, this.props.pollInterval);
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    return true;
  },

  render: function() {
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
                <QueryList queries={this.state.queries} />
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
