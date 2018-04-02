import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import RGL, {Responsive, WidthProvider} from 'react-grid-layout';
import {withTracker} from 'meteor/react-meteor-data';
import {Meteor} from 'meteor/meteor';
import {GridTiles} from  '/imports/api/grid-tiles/grid-tiles';

class WorkedOn extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <div className="db-card">
        <div className="top">
          <h4 className="left">Worked on</h4>
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
            <a href="#">Spent : $875</a>
            <a href="#">Time : 157:33:15</a>
            <a href="#">Activity : 87%</a>
          </div>
        </div>
        <div className="main">
          <div className="row single">
            <div className="col s6">
              <h3>Dashboard "Worked on" card redesign</h3>
              <div className="info left">
                <span>VEZ-6</span>
                <span>Prem Regmi</span>
                <span>77%</span>
              </div>
            </div>
            <div className="col s6 right-align">
              <div className="info right-top">
                <span>$300 spent</span>
                <span><i className="material-icons left">av_timer</i> 20:10:00</span>
              </div>
              <div className="info right-bottom">
                <span><i className="material-icons left">check</i> 1 hour ago</span>
              </div>
            </div>
          </div>
          <div className="row single">
            <div className="col s7">
              <h3>Dashboard "Worked on" card redesign</h3>
              <div className="info left">
                <span>VEZ-6</span>
                <span>Paru</span>
                <span>77%</span>
              </div>
            </div>
            <div className="col s5 right-align">
              <div className="info">
                <span>$300 spent</span>
                <span><i className="material-icons left">av_timer</i> 20:10:00</span>
              </div>
              <div className="info right-bottom">
                <span><i className="material-icons left">check</i> 1 hour ago</span>
              </div>
            </div>
          </div>
          <div className="row single">
            <div className="col s7">
              <h3>Dashboard "Worked on" card redesign</h3>
              <div className="info left">
                <span>VEZ-6</span>
                <span>Pacific</span>
                <span>77%</span>
              </div>
            </div>
            <div className="col s5 right-align">
              <div className="info">
                <span>$300 spent</span>
                <span><i className="material-icons left">av_timer</i> 20:10:00</span>
              </div>
              <div className="info right-bottom">
                <span><i className="material-icons left">check</i> 1 hour ago</span>
              </div>
            </div>
          </div>
          <div className="row single">
            <div className="col s7">
              <h3>Dashboard "Worked on" card redesign</h3>
              <div className="info left">
                <span>VEZ-6</span>
                <span>Pratikshya</span>
                <span>77%</span>
              </div>
            </div>
            <div className="col s5 right-align">
              <div className="info">
                <span>$300 spent</span>
                <span><i className="material-icons left">av_timer</i> 20:10:00</span>
              </div>
              <div className="info right-bottom">
                <span><i className="material-icons left">check</i> 1 hour ago</span>
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
})(WorkedOn);