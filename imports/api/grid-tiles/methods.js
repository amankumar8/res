import {GridTiles} from  '/imports/api/grid-tiles/grid-tiles';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

export const updateGrid = new ValidatedMethod({
  name: 'grid.updateGrid',
  validate: null,
  run({gridItems}) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('grid.updateGrid.notLoggedIn', 'Must be logged in.');
    }
    let userGridItems = GridTiles.find({userId: userId}).fetch();

    let userGridItemsNames = userGridItems.map((item) => {
      return item.content;
    });

    let removedItems = _.difference(userGridItemsNames, gridItems);
    GridTiles.remove({userId: userId, content: {$in: removedItems}});

    let addedItems = _.difference(gridItems, userGridItemsNames);

    addedItems.forEach((name) => {
      let x = 0;
      let y = Infinity;
      let currnetGridItems = GridTiles.find({userId: userId}).fetch();
      let firstCol = _.filter(currnetGridItems, (item) => {
        return item.x === 0;
      });
      let secondCol = _.filter(currnetGridItems, (item) => {
        return item.x === 5;
      });

      if(firstCol.length === 1 && secondCol.length === 0){
        x = 5;
      }
      if(firstCol.length % 2 === 0 && secondCol.length % 2 === 0){
        x = 0;
      }
      if((firstCol.length % 2 !== 0 && firstCol.length !== 1) && (secondCol.length % 2 === 0 && secondCol.length !== 0)){
        x = 5;
      }
      if(firstCol.length % 2 === 0 && (secondCol.length % 2 !== 0 && secondCol.length === 1)){
        x = 5;
      }
      if(firstCol.length % 2 !== 0 && secondCol.length % 2 !== 0){
        x = 0;
      }
      GridTiles.insert({userId: userId, content: name,  w: 5, h: 4, x: x, y: y});
    });
  }
});

export const updateCardsPositions = new ValidatedMethod({
  name: 'grid.updateCardsPositions',
  validate: null,
  run({gridItems}) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('grid.updateCardsPositions.notLoggedIn', 'Must be logged in.');
    }
    gridItems.forEach((item) => {
      GridTiles.update({_id: item.i}, {$set:{x: item.x, y: item.y, h: item.h, w: item.w}});
    });
  }
});

export const removeCard = new ValidatedMethod({
  name: 'grid.removeCard',
  validate: null,
  run({id}) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('grid.updateCardsPositions.notLoggedIn', 'Must be logged in.');
    }
      GridTiles.remove({_id: id});
  }
});