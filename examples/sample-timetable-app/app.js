/** @jsx React.DOM */

// ListView render a list of train schedule
// from a given source to destination
var ListView = React.createClass({
  render: function () {
    var createListItem = function (item) {
      return (
        <tr>
          <td>
            <b>{item.trainNumber}</b>
          </td>
          <td>
            {item.time}
          </td>
          <td>
            <b>{item.duration}</b>
          </td>
        </tr>);
    };
    return (
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Train no:</th>
            <th>Schedule</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
            {this.props.schedule.map(createListItem)}
        </tbody>
      </table>
      );
  }
});

// InfoView renders a friendly label when there are no
// schedule available from a give source to destination
var InfoView = React.createClass({
  render: function () {
    return (
      <div className="alert alert-info">
      Please select different stations.
      </div>
      );
  }
});

// SelectionView renders two select inputs that show a 
// list of available stations
var SelectionView = React.createClass({
  //called when either of the select inputs
  //value get changed
  handleSelectionChange: function (ev) {
    //get the current from and to values
    var fromSelection = this.refs.fromSelection.getDOMNode().value;
    var toSelection = this.refs.toSelection.getDOMNode().value;

    //Call the parent onChange callback
    //to notify the current 'from' and 'to' selections
    this.props.onChange({
      ev: ev,
      from: fromSelection,
      to: toSelection
    });
  },
  render: function () {
    var stationsMap = function (station) {
      return <option value={station.id}>{station.name}</option>;
    };
    return (
      <div className="row padded-container">
        <div className="col-xs-6">
          From :
          <select ref="fromSelection" className="form-control" onChange={this.handleSelectionChange}>
            {this.props.stations.map(stationsMap)}
          </select>
        </div>
        <div className="col-xs-6">
          To :
          <select ref="toSelection" className="form-control" onChange={this.handleSelectionChange}>
            {this.props.stations.map(stationsMap)}
          </select>
        </div>
      </div>
      );
  }
});


//ContainerView is a stateful view which renders
// list and selection view.
// When from/to selections change, its responsible
// for updating the state and re-rendering the schedule.
var ContainerView = React.createClass({
  getInitialState: function () {
    //props.dataService points to the mock service api
    var _service = this.props.dataService;
    return {schedule: [], stations: _service.getStationsList()};
  },
  handleChange: function (payload) {
    //props.dataService points to the mock service api
    var _service = this.props.dataService;
    this.setState({
      schedule: _service.getSchedule(payload.from, payload.to)
    });
  },
  getListView: function (schedule) {
    if (schedule.length > 0) {
      return  (<ListView schedule={schedule}/>);
    }
    return (<InfoView/>);
  },
  render: function () {
    var currentSchedule = this.state.schedule;
    var currentStations = this.state.stations;

    return (
      <div className="container jumbotron">
        <div className="row">
          <div className="col-xs-12 text-center">
            <h3>C-Train Timetable</h3>
          </div>
          <div className="col-xs-12">
            <SelectionView onChange={this.handleChange} stations={currentStations}/>
          </div>
          <div className="col-xs-12">
            {this.getListView(currentSchedule)}
          </div>
        </div>
      </div>
      );
  }
});


/*Some random mock/stub data provider service no way related to React*/
var StubService = function () {
  var _stubStations = [
    {id: 1, name: "San Fransisco"},
    {id: "2", name: "Sunnyvale"}
  ];
  var _stubSchedule = {
    "1-1": [],
    "1-2": [
      {trainNumber: "#255", time: "10:30 AM - 11:30 AM", duration: "1h"},
      {trainNumber: "#808", time: "10:40 AM - 12:10 PM", duration: "1h 30m"}
    ],
    "2-1": [
      {trainNumber: "#190", time: "9:30 AM - 10:00 AM", duration: "30m"},
      {trainNumber: "#777", time: "10:40 AM - 12:40 PM", duration: "2h"}
    ],
    "2-2": []
  };
  return {
    getStationsList: function () {
      return _stubStations;
    },
    getSchedule: function (from, to) {
      var query = from + "-" + to;
      return _stubSchedule[query];
    }
  };
}();

/*Render the main container view*/
React.renderComponent(<ContainerView dataService={StubService} />, document.body);
