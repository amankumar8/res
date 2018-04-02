import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import {Contacts} from '/imports/api/companies/companies';

Template.companyFormContactSearch.onCreated(function () {
  this.currentInput = new ReactiveVar('');
});

Template.companyFormContactSearch.helpers({
  guesses() {
    const input = Template.instance().currentInput.get();
    if(input.length > 0) {
      const companyId = Template.instance().data.companyId;
      const inputRegex = new RegExp(input);
      const result = Contacts.find({
        $and: [{
          companiesRelated: {
            $ne: companyId
          }
        },{
          $or: [
            {
              firstName: {
                $regex: input,
                $options: 'i'
              }
            },
            {
              lastName: {
                $regex: input,
                $options: 'i'
              }
            },
            {
              email: {
                $regex: input,
                $options: 'i'
              }
            }
          ]
        }]
      }, {
        limit: 5
      }).fetch().map(contact => {
        if (inputRegex.test(contact.firstName) === true) {
          contact.guess = contact.firstName;
        } else if (inputRegex.test(contact.lastName) === true) {
          contact.guess = contact.lastName;
        } else if (inputRegex.test(contact.email) === true) {
          contact.guess = contact.email;
        }
        return contact;
      });
      return result;
    } else {
      return [];
    }
  }
});

Template.companyFormContactSearch.events({
  'keyup #existing-contact-search': function (event, template) {
    template.currentInput.set(event.target.value);
  },
  'click li': function (event, template) {
    template.data.getElement('#firstName').dataset.id = this._id;
    template.data.getElement('#firstName').value = this.firstName;
    template.data.getElement('#lastName').value = this.lastName;
    template.data.getElement('#email').value = this.email || "";
    template.data.getElement('#phone').value = this.phone || "";
    template.data.getElement('#firstName').disabled = true;
    template.data.getElement('#lastName').disabled = true;
    template.data.getElement('#email').disabled = true;
    template.data.getElement('#phone').disabled = true;
    template.currentInput.set('');
    template.find('#existing-contact-search').value = "";
  }
});
