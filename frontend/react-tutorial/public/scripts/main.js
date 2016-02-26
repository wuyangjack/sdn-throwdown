var RouterMarker = {
  new: function(json, map) {
    return {json: json, map: map};
  },

  draw: function(self) {

    var image = {
      url: '/router.png',
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

    var offset = 0;
    var coordinates;
    var icons = [];
    var arrow = {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
    };
    if (self.direction) {
      coordinates = [
        {lat: a_node[0] + offset, lng: a_node[1] + offset},
        {lat: z_node[0] + offset, lng: z_node[1] + offset}
      ];
      icons =[
        {icon: arrow, offset: '33%'},
        {icon: arrow, offset: '66%'},
      ];
    } else {
      coordinates = [
        {lat: z_node[0] - offset, lng: z_node[1] - offset},
        {lat: a_node[0] - offset, lng: a_node[1] - offset}
      ];
      icons =[
        {icon: arrow, offset: '33%'},
        {icon: arrow, offset: '66%'},
      ];
    }

    //LinkPath.circle(a_node, z_node);

    if (self.json.status == 'Up') {
      var color = '#FF0000';
    } else {
      var color = '#000000';
    }
    var path = new google.maps.Polyline({
      path: coordinates,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 1.0,
      strokeWeight: 2,
      icons: icons
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
      linkPaths: {}
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

    // update links
    var links = this.state.topology.links;
    var linkPaths = this.state.linkPaths;
    var direction = this.state.direction;

    //console.log(linkPaths);
    _.mapObject(linkPaths, function(linkPath, name) {
      //console.log(linkPath);
      LinkPath.delete(linkPath);
    });

    _.map(links, function(link) {
      var pt_new = LinkPath.new(link, map, direction);
      var name = LinkPath.name(pt_new);
      pt_new = LinkPath.draw(pt_new);
      linkPaths[name] = pt_new;
    });

    this.state.direction = !this.state.direction;

    /*
    _.map(links, function(link) {
      for (var i = 0; i < directions.length; i++) {
        var pt_new = LinkPath.new(link, map, directions[i]);
        var name = LinkPath.name(pt_new);
        var pt_old = linkPaths[name];

        // update marker if necessary
        if (false == LinkPath.same(pt_new, pt_old)) {
          console.log("updated link path");
          pt_old = LinkPath.delete(pt_old);
          pt_new = LinkPath.draw(pt_new);
          linkPaths[name] = pt_new;
        } else {
          //console.log("ingore link path");
        }
      }
    });
    */
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
