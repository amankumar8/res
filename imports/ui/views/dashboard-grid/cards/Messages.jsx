import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import RGL, {Responsive, WidthProvider} from 'react-grid-layout';
import {withTracker} from 'meteor/react-meteor-data';
import {Meteor} from 'meteor/meteor';
import {GridTiles} from  '/imports/api/grid-tiles/grid-tiles';

class Messages extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <div className="db-card">
        <div className="top">
          <h4 className="left">Messages</h4>
          <div className="right">
            <a href=""><i className="material-icons">refresh</i></a>
            <a href="" onClick={this.props.removeCard}><i className="material-icons">close</i></a>
          </div>
          <div className="summary">
            <a href="#">3 unread messages</a>
          </div>
        </div>
        <div className="main">
          <div className="message-single">
            <a href="" className="image"><img src="images/pic1.png" alt=""/></a>
            <div className="message">
              <h4><a href="">Can you finish the task today</a></h4>
              <span>2 minutes ago</span>
            </div>
          </div>
          <div className="message-single">
            <a href="" className="image"><img src="images/pic1.png" alt=""/></a>
            <div className="message">
              <h4><a href="">Hello, how is going?</a></h4>
              <span>30 minutes ago</span>
            </div>
          </div>
          <div className="message-single">
            <a href="" className="image">PR</a>
            <div className="message">
              <h4><a href="">I will let you know when it finished</a></h4>
              <span>2 days ago</span>
            </div>
          </div>
          <div className="message-single">
            <a href="" className="image"><img src="images/pic1.png" alt=""/></a>
            <div className="message">
              <h4><a href="">Okay</a></h4>
              <span>1 month ago</span>
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
})(Messages);