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
/*
var QueryForm = React.createClass({
  getInitialState: function() {
    return {author: '', text: ''};
  },
  handleAuthorChange: function(e) {
    this.setState({author: e.target.value});
  },
  handleTextChange: function(e) {
    this.setState({text: e.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var author = this.state.author.trim();
    var text = this.state.text.trim();
    if (!text || !author) {
      return;
    }
    this.props.onCommentSubmit({author: author, text: text});
    this.setState({author: '', text: ''});
  },
  render: function() {
    return (
      <form className="queryForm" onSubmit={this.handleSubmit}>
        <input
          type="text"
          placeholder="Your name"
          value={this.state.author}
          onChange={this.handleAuthorChange}
        />
        <input
          type="text"
          placeholder="Say something..."
          value={this.state.text}
          onChange={this.handleTextChange}
        />
        <input type="submit" value="Post" />
      </form>
    );
  }
});
*/

// TODO: visualize links

var NetworkMap = React.createClass({
  getInitialState: function() {
    return {
      topology: {
          nodes: []
      },
      routerMarkers: {},
      linkPaths: {},
      lspPaths: {}
    };
  },

  drawTopology: function() {
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

    this.state.direction = !this.state.direction;

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

  },

  loadTopologyFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(topology) {
        this.state.topology = topology;
        this.setState(this.state);
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, "loading topology failure: " + err.toString());
      }.bind(this)
    });
  },

  initializeGoogleMap: function() {
    // canvas
    var map = new google.maps.Map(document.getElementById('googleMap'), {
        center: {lat: 37, lng: -100},
        zoom: 5
    });
    this.state.map = map;
    this.state.direction = true;
    this.setState(this.state);
  },

  componentDidMount: function() {
    this.initializeGoogleMap();
    setInterval(this.loadTopologyFromServer, this.props.pollInterval);
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    return true;
  },

  render: function() {
    this.drawTopology();

    return (
      <div className="networkMap">
        <div id="googleMap"></div>
      </div>
    );
  }
});

ReactDOM.render(
  <NetworkMap url="/api/topology" pollInterval={1000} />,
  document.getElementById('content')
);
