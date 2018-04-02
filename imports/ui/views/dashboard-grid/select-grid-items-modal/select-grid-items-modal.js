import './select-grid-items-modal.html';
import {updateGrid} from '/imports/api/grid-tiles/methods';
import { VZ } from '/imports/startup/both/namespace';
import {GridTiles} from  '/imports/api/grid-tiles/grid-tiles';

Template.selectGridItemsModal.onCreated(function () {
  this.closeModal = () => {
    this.$('.modal').modal('close');
    setTimeout(() => {
      Blaze.remove(this.view);
    }, 500);
  };
});
Template.selectGridItemsModal.onRendered(function () {
  let self = this;

  this.$('.modal').modal();
  this.$('.modal').modal('open');
  $('.modal-overlay').on('click', function () {
    removeTemplate(self.view);
  });
  document.addEventListener('keyup', function (e) {
    if (e.keyCode == 27) {
      removeTemplate(self.view);
    }
  });

});
Template.selectGridItemsModal.onDestroyed(function () {
  $('.modal-overlay').remove();
});

Template.selectGridItemsModal.helpers({
  cards() {
    return ['Assigned tasks', 'InReview', 'Messages', 'Projects', 'WorkedOn', 'WorkerActivity'];
  },
  isChecked () {
    let content = this.valueOf();
    let userCards = GridTiles.find({userId: Meteor.userId()}).fetch();
    let userCardsNames = userCards.map((card) => {
      return card.content;
    });
    return _.indexOf(userCardsNames, content) !== -1;
  }
});

Template.selectGridItemsModal.events({
  'click #save'(event, tmpl) {
    event.preventDefault();
    let checkedItems = [];
     $('input.filled-in:checkbox:checked').each(function() {
       checkedItems.push($(this).prop('id'));
    });

    updateGrid.call({gridItems: checkedItems}, function (error, result) {
      if(error){
        VZ.notify(error.message);
      }
      else {
        tmpl.closeModal();
        tmpl.data.onCardChange();
      }
    });
  },
  'click #close-modal'(event, tmpl){
    tmpl.closeModal();
  }
});

let removeTemplate = function (view) {
  setTimeout(function () {
    Blaze.remove(view);
  }, 500);
};
