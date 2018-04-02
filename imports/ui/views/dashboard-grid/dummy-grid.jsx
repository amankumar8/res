import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import RGL, {Responsive, WidthProvider} from 'react-grid-layout';
import {withTracker} from 'meteor/react-meteor-data';
import {Meteor} from 'meteor/meteor';
import {GridTiles} from  '/imports/api/grid-tiles/grid-tiles';
import {updateCardsPositions, removeCard} from '/imports/api/grid-tiles/methods';
import AssignedTasks from './cards/AssignedTasks';
import InReview from './cards/InReview';
import Messages from './cards/Messages';
import Projects from './cards/Projects';
import WorkedOn from './cards/WorkedOn';
import WorkerActivity from './cards/WorkerActivity';

const ReactGridLayout = WidthProvider(RGL);

class BasicLayout extends React.Component {
  constructor(props) {
    super(props);

    this.state = {layout: []};
    this.onLayoutChange = _.throttle(this.onLayoutChange, 600);

  }

  removeCard() {
    let id = this._id;
    removeCard.call({id: id}, (error, result) => {
      if (error) {
        console.log(error.message);
      } else {
        console.log('removed');
      }
    });
  }

  generateDOM() {
    return _.map(this.props.items, (item) => {
      if (item.content === 'Assigned tasks'){
        return (<div key={item._id}><AssignedTasks key={item._id} item={item} removeCard={this.removeCard.bind(item)}/></div>);
      }
      else if(item.content === 'InReview'){
        return (<div key={item._id}><InReview key={item._id} item={item} removeCard={this.removeCard.bind(item)}/></div>);
      }
      else if(item.content === 'Messages'){
        return (<div key={item._id}><Messages key={item._id} item={item} removeCard={this.removeCard.bind(item)}/></div>);
      }
      else if(item.content === 'Projects'){
        return (<div key={item._id}><Projects key={item._id} item={item} removeCard={this.removeCard.bind(item)}/></div>);
      }
      else if(item.content === 'WorkedOn'){
        return (<div key={item._id}><WorkedOn key={item._id} item={item} removeCard={this.removeCard.bind(item)}/></div>);
      }
      else if(item.content === 'WorkerActivity'){
        return (<div key={item._id}><WorkerActivity key={item._id} item={item} removeCard={this.removeCard.bind(item)}/></div>);
      }
    });
  }

  generateLayout(items) {
    return _.map(items, function (item, i) {
      return {x: item.x, y: item.y, w: item.w, h: item.h, i: item._id};
    });
  }

  componentWillReceiveProps(newProps) {
    const layout = this.generateLayout(newProps.items);
    this.setState({layout})

  }

  onLayoutChange(layout) {
    updateCardsPositions.call({gridItems: layout}, (error, result) => {
      if (error) {
        console.log(error.message);
      } else {
        console.log('changed');
      }
    });
  }

  render() {
    return (
      <ReactGridLayout layout={this.state.layout} onLayoutChange={this.onLayoutChange.bind(this)}
                       {...this.props}>
        {this.generateDOM()}
      </ReactGridLayout>
    );

  }
}
// BasicLayout.propTypes = {
//   onLayoutChange: PropTypes.func.isRequired
// };

export default withTracker(() => {
  Meteor.subscribe('userGridCards');
  let items = GridTiles.find({userId: Meteor.userId()}).fetch();
  return {
    className: "layout",
    items: items,
    rowHeight: 90,
    cols: 12
  };
})(BasicLayout);