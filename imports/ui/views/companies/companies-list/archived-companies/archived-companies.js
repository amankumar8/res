import './archived-companies.html';
import { VZ } from '/imports/startup/both/namespace';
import {Meteor} from 'meteor/meteor'
import {restoreCompanies} from '/imports/api/companies/methods';

Template.archivedCompanies.onCreated(function () {
  this.checkedCompanies = new ReactiveArray([]);
  this.updateDataTableSelectAllCtrl = (table) => {
    let $chkboxAll = $('tbody input[type="checkbox"]', table.table().container());
    let $chkboxChecked = $('tbody input[type="checkbox"]:checked', table.table().container());
    let chkboxSelectAll = $('thead input[name="select-all"]', table.table().container()).get(0);
    if ($chkboxChecked.length === 0) {
      chkboxSelectAll.checked = false;
      if ('indeterminate' in chkboxSelectAll) {
        chkboxSelectAll.indeterminate = false;
      }
    }
    else if ($chkboxChecked.length === $chkboxAll.length) {
      chkboxSelectAll.checked = true;
      if ('indeterminate' in chkboxSelectAll) {
        chkboxSelectAll.indeterminate = false;
      }
    }
    else {
      chkboxSelectAll.checked = true;
      if ('indeterminate' in chkboxSelectAll) {
        chkboxSelectAll.indeterminate = true;
      }
    }
  };
});
Template.archivedCompanies.onRendered(function () {
  let table = $('#archived-companies-table').DataTable({
    responsive:true,
    "dom": '<"top"f>rt<"bottom"pil><"clear">',
    "oLanguage": {
      "sInfo": "_START_-_END_ of _TOTAL_",
      "sLengthMenu": '<span>Rows per page:</span><select class="browser-default">' +
      '<option value="10">10</option>' +
      '<option value="20">20</option>' +
      '<option value="30">30</option>' +
      '<option value="40">40</option>' +
      '<option value="50">50</option>' +
      '<option value="-1">All</option>' +
      '</select></div>'
    },
    'columnDefs': [{
      'targets': 3,
      'searchable': false,
      'orderable': false
    }],
    processing: false,
    scrollX: true
  });

  table.on('draw', (e) => {
    this.autorun(() => {
      this.checkedCompanies.list();
    });

  });
  this.autorun(() => {
    this.checkedCompanies.list();
    this.updateDataTableSelectAllCtrl(table);
  });
});


Template.archivedCompanies.helpers({
  userName(userId){
    let user = Meteor.users.findOne({_id: userId}, {
      fields: {profile: 1, roles: 1, emails: 1}
    });
    return user && user.profile && user.profile.fullName;
  },
  isChecked() {
    const id = this._id;
    let checkedCompanies = Template.instance().checkedCompanies.list();
    let index = checkedCompanies.indexOf(id);
    return index !== -1;
  },

  formatLocation(location) {
    if (location && location.city && location.country) {
      return location.city + ', ' + location.country;
    }
  },
  formatIsPrivate(isPrivate) {
    return isPrivate ? 'Yes' : 'No';
  },
  isCheckedCompanies() {
    return Template.instance().checkedCompanies.list().length > 0;
  },
  checkedCount() {
    return Template.instance().checkedCompanies.list().length
  }
});

Template.archivedCompanies.events({
  'click #select-all'(event, tmpl) {
    event.preventDefault();
    let allChecked = $('tbody input[type="checkbox"]', '#archived-companies-table').prop('checked', this.checked);
    let isAllChecked = $(event.currentTarget).prop('checked');
    let checkedCompanies = tmpl.checkedCompanies.list();
    if (isAllChecked) {

      _.each(allChecked, function(element, elementIndex, list) {
        let index = checkedCompanies.indexOf($(element).attr('id'));
        if (index == -1) {
          checkedCompanies.push($(element).attr('id'));
        }
      });
    }
    else {
      _.each(allChecked, function(element, elementIndex, list) {
        let index = checkedCompanies.indexOf($(element).attr('id'));
        if (index !== -1) {
          checkedCompanies.remove($(element).attr('id'));
        }
      });
    }
  },
  'click [name=table-item]'(event, tmpl) {
    const id = this._id;
    let checkedCompanies = tmpl.checkedCompanies.list();
    let checked = $(event.currentTarget).prop('checked');
    let index = checkedCompanies.indexOf(id);
    if (index == -1) {
      checkedCompanies.push(id);
    }
    else {
      checkedCompanies.remove(id);
    }
  },
  'click #table_search'(event, tmpl) {
    event.preventDefault();
    $('#archived-companies-table_filter').toggleClass('active');
    $('#table_search').toggleClass('active');
  },
  'click .remove'(event, tmpl) {
    event.preventDefault();
    tmpl.checkedCompanies.clear();
  },
  'click #restore-companies'(event, tmpl) {
    event.preventDefault();
    let checkedCompanies = tmpl.checkedCompanies.array();
    Session.set('companiesFormChanged',  false);
    restoreCompanies.call({companyIds: checkedCompanies}, function (error, result) {
      if(!error){
        VZ.notify('Restored');
        tmpl.checkedCompanies.clear();
        Session.set('companiesFormChanged',  true);
      }
      else {
        VZ.notify(error.message);
        Session.set('companiesFormChanged',  true);
      }
    });
  }
});