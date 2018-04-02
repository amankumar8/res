import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import RGL, {Responsive, WidthProvider} from 'react-grid-layout';
import {withTracker} from 'meteor/react-meteor-data';
import {Meteor} from 'meteor/meteor';
import {GridTiles} from  '/imports/api/grid-tiles/grid-tiles';

class WorkerActivity extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <div className="db-card worker-activity">
        <div className="top">
          <h4 className="left">Worker activity</h4>
          <div className="right">
            <a href=""><i className="material-icons">keyboard_arrow_left</i></a>
            <a href=""><i className="material-icons disabled">keyboard_arrow_right</i></a>
            <a href=""><i className="material-icons">more_vert</i></a>
            <a href="" onClick={this.props.removeCard}><i className="material-icons">close</i></a>
          </div>
          <div className="summary">
            <a href="#">Spent : $576</a>
            <a href="#">Time : 125:40:00</a>
            <a href="#">Workers : 11</a>
          </div>
        </div>
        <div className="main">
          <table>
            <thead>
            <tr>
            <th>Worker</th>
            <th>M</th>
            <th>T</th>
            <th>W</th>
            <th>T</th>
            <th>F</th>
            <th>S</th>
            <th>S</th>
            <th className="bold right-align">Total</th>
            <th className="red-text right-align">Income</th>
            </tr>
            </thead>
            <tbody>
            <tr>
              <td><span className="image">PR</span></td>
              <td>2:40</td>
              <td>3:30</td>
              <td>4:00</td>
              <td>1:50</td>
              <td>4:20</td>
              <td>7:45</td>
              <td>6:37</td>
              <td className="bold right-align">30:42</td>
              <td className="red-text right-align">$152</td>
            </tr>
            <tr>
              <td><span className="image"><img src="images/pic1.png" alt=""/></span></td>
              <td>2:40</td>
              <td>3:30</td>
              <td>4:00</td>
              <td>1:50</td>
              <td>4:20</td>
              <td>7:45</td>
              <td>6:37</td>
              <td className="bold right-align">30:42</td>
              <td className="red-text right-align">$152</td>
            </tr>
            <tr>
              <td><span className="image"><img src="images/pic2.png" alt=""/></span></td>
              <td>2:40</td>
              <td>3:30</td>
              <td>4:00</td>
              <td>1:50</td>
              <td>4:20</td>
              <td>7:45</td>
              <td>6:37</td>
              <td className="bold right-align">30:42</td>
              <td className="red-text right-align">$152</td>
            </tr>
            <tr>
              <td><span className="image">PR</span></td>
              <td>2:40</td>
              <td>3:30</td>
              <td>4:00</td>
              <td>1:50</td>
              <td>4:20</td>
              <td>7:45</td>
              <td>6:37</td>
              <td className="bold right-align">30:42</td>
              <td className="red-text right-align">$152</td>
            </tr>
            <tr>
              <td><span className="image">PR</span></td>
              <td>2:40</td>
              <td>3:30</td>
              <td>4:00</td>
              <td>1:50</td>
              <td>4:20</td>
              <td>7:45</td>
              <td>6:37</td>
              <td className="bold right-align">30:42</td>
              <td className="red-text right-align">$152</td>
            </tr>
            <tr>
              <td><span className="image"><img src="images/pic3.png" alt=""/></span></td>
              <td>2:40</td>
              <td>3:30</td>
              <td>4:00</td>
              <td>1:50</td>
              <td>4:20</td>
              <td>7:45</td>
              <td>6:37</td>
              <td className="bold right-align">30:42</td>
              <td className="red-text right-align">$152</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    );

  }
}

export default withTracker(() => {
  return {

  };
})(WorkerActivity);