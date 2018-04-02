import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import RGL, {Responsive, WidthProvider} from 'react-grid-layout';
import {withTracker} from 'meteor/react-meteor-data';
import {Meteor} from 'meteor/meteor';
import {GridTiles} from  '/imports/api/grid-tiles/grid-tiles';

class Projects extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <div className="db-card">
        <div className="top">
          <h4 className="left">Projects</h4>
          <div className="right">
            <a href=""><i className="material-icons">search</i></a>
            <a className="dropdown-button" href="#" data-activates='card-filter-3' data-beloworigin="true" data-alignment="right"><i className="material-icons">filter_list</i></a>
            <a href="" onClick={this.props.removeCard}><i className="material-icons">close</i></a>
            <div id='card-filter-3' className='dropdown-content'>
              <div className="head">Sort by</div>
              <div className="options">
                <a href="#">Progress</a>
                <a href="#">Time assigned</a>
                <a href="#">Total spending</a>
                <a href="#">Total spent</a>
              </div>
            </div>
          </div>
          <div className="summary">
            <a href="#"><i className="material-icons left">access_time</i> 25:40</a>
            <a href="#"><i className="material-icons left">assignment_turned_in</i> 57/92</a>
            <a href="#"><i className="material-icons left">attach_money</i> $2143</a>
            <a href="#"><i className="material-icons left">people</i> 25</a>
          </div>
        </div>
        <div className="main">
          <div className="row single">
            <div className="col">
              <h3>Fix a bug</h3>
              <div className="info left project">
                <p>Last updated : 4:25PM</p>
                <span href="#"><i className="material-icons left">access_time</i> 25:40</span>
                <span href="#"><i className="material-icons left">assignment_turned_in</i> 57/92</span>
                <span href="#"><i className="material-icons left">attach_money</i> $2143</span>
                <span href="#"><i className="material-icons left">people</i> 25</span>
              </div>
            </div>
          </div>

          <div className="row single">
            <div className="col">
              <h3>Landing page design</h3>
              <div className="info left project">
                <p>Last updated : 4:25PM</p>
                <span href="#"><i className="material-icons left">access_time</i> 25:40</span>
                <span href="#"><i className="material-icons left">assignment_turned_in</i> 57/92</span>
                <span href="#"><i className="material-icons left">attach_money</i> $2143</span>
                <span href="#"><i className="material-icons left">people</i> 25</span>
              </div>
            </div>
          </div>

          <div className="row single">
            <div className="col">
              <h3>PSD to HTML</h3>
              <div className="info left project">
                <p>Last updated : 4:25PM</p>
                <span href="#"><i className="material-icons left">access_time</i> 25:40</span>
                <span href="#"><i className="material-icons left">assignment_turned_in</i> 57/92</span>
                <span href="#"><i className="material-icons left">attach_money</i> $2143</span>
                <span href="#"><i className="material-icons left">people</i> 25</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  }
}

export default withTracker(() => {
  return {

  };
})(Projects);