import './dashboard-grid.html';
import {Meteor} from 'meteor/meteor';
import {Template} from 'meteor/templating';
import React from 'react';
import BasicLayout from './dummy-grid';

Template.dashboardGrid.onRendered(function () {
});

Template.dashboardGrid.helpers({
  DummyGrid(){
    return BasicLayout;
  }
});

Template.dashboardGrid.events({
  'click .addCards': function (event, tmpl) {
    event.preventDefault();
    let parentNode = $('body')[0],
      onCardChange = function () {
      },
      modalData = {
        onCardChange: onCardChange
      };
    Blaze.renderWithData(Template.selectGridItemsModal, modalData, parentNode);
  }
});