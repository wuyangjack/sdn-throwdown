var RouterMarker = {
  new: function(json, map) {
    return {json: json, map: map};
  },

  draw: function(self) {
    var image = 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png';
    var marker = new google.maps.Marker({
        position: {lat: self.json.coordinates[0], lng: self.json.coordinates[1]},
        map: self.map,
        icon: image
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

// TODO: visualize links

var NetworkMap = React.createClass({
  getInitialState: function() {
    return {
      topology: {
          nodes: []
      },
      routerMarkers: {

      }
    };
  },

  drawTopology: function() {
    var map = this.state.map;
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
