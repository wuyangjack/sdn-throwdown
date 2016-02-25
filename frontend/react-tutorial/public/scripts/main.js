var NetworkMap = React.createClass({

  initializeGoogleMap: function() {
    var map = new google.maps.Map(document.getElementById('googleMap'), {
        center: {lat: -34.397, lng: 150.644},
        zoom: 8
    });
  },

  componentDidMount: function() {
    this.initializeGoogleMap();
    //setInterval(this.loadCommentsFromServer, this.props.pollInterval);
  },

  render: function() {
    return (
      <div className="networkMap">
        <div id="googleMap"></div>
      </div>
    );
  }
});

ReactDOM.render(
  <NetworkMap />,
  document.getElementById('content')
);
