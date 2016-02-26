var RouterMarker = {
  new: function(json, map) {
    return {json: json, map: map};
  },

  draw: function(self) {
    //var image = 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png';
    var image = '/router.png';
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
  new: function(json, map) {
    return {json: json, map: map};
  },

  draw: function(self) {
    var a_node = self.json.ANode.coordinates;
    var z_node = self.json.ZNode.coordinates;

    var coordinates = [
      {lat: a_node[0], lng: a_node[1]},
      {lat: z_node[0], lng: z_node[1]}
    ];

    if (self.json.status == 'Up') {
      var color = '#FF0000';
    } else {
      var color = '#000000';
    }

    var arrow = {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
    };

    // var p1 = {lat: a_node[0], lng: a_node[1]};
    // var p2 = {lat: z_node[0], lng: z_node[1]};
    // var coordinates = [p1];
    // for (var i = 0; i < 10; i++) {
    //   var x = a_node[0] + (z_node[0] - a_node[0]) * i / 10;
    //   var y = a_node[1] + (z_node[1] - a_node[1]) * i / 10;
    //   y = y * (1 + (5 - Math.abs(i - 5)) / 100);
    //   coordinates.push({lat: x, lng: y});
    // }
    // coordinates.push(p2);

    var path = new google.maps.Polyline({
      path: coordinates,
      strokeColor: color,
      strokeOpacity: 1.0,
      strokeWeight: 2,
      icons: [{
        icon: arrow,
        offset: '50%'
      }],
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
    return JSON.stringify(self.json) === JSON.stringify(other.json);
  } 
}

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

    _.map(routers, function(router) {
      var name = router.hostname;
      var rm_new = RouterMarker.new(router, map);
      var rm_old = routerMarkers[name];

      // update marker if necessary
      if (false == RouterMarker.same(rm_new, rm_old)) {
        console.log("updated router marker");
        rm_old = RouterMarker.delete(rm_old);
        rm_new = RouterMarker.draw(rm_new);
        routerMarkers[name] = rm_new;
      } else {
        console.log("ingore router marker");
      }
    });

    // update links
    var links = this.state.topology.links;
    var linkPaths = this.state.linkPaths;

    _.map(links, function(link) {
      var name = link.index;
      var pt_new = LinkPath.new(link, map);
      var pt_old = linkPaths[name];

      // update marker if necessary
      if (false == LinkPath.same(pt_new, pt_old)) {
        console.log("updated link path");
        pt_old = LinkPath.delete(pt_old);
        pt_new = LinkPath.draw(pt_new);
        linkPaths[name] = pt_new;
      } else {
        console.log("ingore link path");
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
        zoom: 4
    });
    this.state.map = map;
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
  <NetworkMap url="/api/topology" pollInterval={2000} />,
  document.getElementById('content')
);
