import {GridTiles} from  '/imports/api/grid-tiles/grid-tiles';

Meteor.publish('userGridCards', function () {
  const userId = this.userId;
  if(!userId){
    return this.ready();
  }
  return GridTiles.find({userId: userId});
});