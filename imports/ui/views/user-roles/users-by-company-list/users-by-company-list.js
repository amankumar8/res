import './users-by-company-list.html';
import {Companies} from '/imports/api/companies/companies';

Template.usersByCompanyList.onCreated(function () {
  this.checkedUsers = new ReactiveArray([]);
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
  this.getHidestRole = (userRoles) => {
    let ownerIndex = _.indexOf(userRoles, 'company-owner');
    let adminIndex = _.indexOf(userRoles, 'company-admin');
    let managerIndex = _.indexOf(userRoles, 'company-manager');
    let workerIndex = _.indexOf(userRoles, 'company-worker');
    let observerIndex = _.indexOf(userRoles, 'company-observer');

    if(ownerIndex != -1){
      return 'company-owner';
    }
    else if(adminIndex != -1){
      return 'company-admin';
    }
    else if(managerIndex != -1){
      return 'company-manager';
    }
    else if(workerIndex != -1){
      return 'company-worker';
    }
    else if(observerIndex != -1){
      return 'company-observer';
    }
    else {
      return '';
    }
  };
});
Template.usersByCompanyList.onRendered(function () {
  let self = this;
  let table = $('#active-users-table').DataTable({
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
    processing: false,
    scrollX: true
  });

  table.on('draw', function(e) {
    self.autorun(function () {
      self.checkedUsers.list();
    });
  });
  this.autorun(() => {
    this.checkedUsers.list();
    this.updateDataTableSelectAllCtrl(table);
  });
});
Template.usersByCompanyList.helpers({
  userName(userId){
    let user = Meteor.users.findOne({_id: userId}, {
      fields: {profile: 1, roles: 1, emails: 1}
    });
    return user && user.profile && user.profile.fullName;
  },
  users() {
    let currentUser = Meteor.user();
    let selectedCompanyId = currentUser && currentUser.profile && currentUser.profile.selectedCompanyId;
    let company = Companies.findOne({_id: selectedCompanyId});
    let ownerId = company && company.ownerId;
    let users = Roles.getUsersInRole(['company-owner', 'company-admin', 'company-manager', 'company-worker', 'company-worker'], selectedCompanyId).fetch();
    users = _.reject(users, (user) => {
      return user._id === ownerId;
    });
    return users;
  },
  isChecked() {
    let id = this._id;
    let checkedTasks = Template.instance().checkedUsers.list();
    let index = checkedTasks.indexOf(id);
    return index !== -1;
  },
  isCheckedUsers() {
    return Template.instance().checkedUsers.list().length > 0;
  },
  checkedCount() {
    return Template.instance().checkedUsers.list().length
  },
  userName() {
    let user = this;
    return user.profile && user.profile.fullName;
  },
  userRole() {
    let tmpl = Template.instance();
    let currentUser = Meteor.user();
    let selectedCompanyId = currentUser && currentUser.profile && currentUser.profile.selectedCompanyId;
    let user = this;
    let roles = Roles.getRolesForUser(user._id, selectedCompanyId);
    return tmpl.getHidestRole(roles);
  },
  currentCompanyId () {
    let userId = Meteor.userId();
    let user = Meteor.users.findOne({_id: userId});
    return user && user.profile && user.profile.selectedCompanyId;
  },
  canEditCompany() {
    let user = Meteor.user();
    let selectedCompanyId = user && user.profile && user.profile.selectedCompanyId;
    return Roles.userIsInRole(user._id, ['company-owner', 'company-admin'], selectedCompanyId);
  }
});

Template.usersByCompanyList.events({
  'click #select-all': function (event, tmpl) {
    event.preventDefault();
    let allChecked = $('tbody input[type="checkbox"]', '#active-users-table').prop('checked', this.checked);
    let isAllChecked = $(event.currentTarget).prop('checked');
    let checkedUsers = tmpl.checkedUsers.list();
    if (isAllChecked) {

      _.each(allChecked, function(element, elementIndex, list) {
        let index = checkedUsers.indexOf($(element).attr('id'));
        if (index == -1) {
          checkedUsers.push($(element).attr('id'));
        }
      });
    }
    else {
      _.each(allChecked, function(element, elementIndex, list) {
        let index = checkedUsers.indexOf($(element).attr('id'));
        if (index !== -1) {
          checkedUsers.remove($(element).attr('id'));
        }
      });
    }
  },
  'click [name=table-item]': function (event, tmpl) {
    let id = this._id;
    let checkedUsers = tmpl.checkedUsers.list();
    let index = checkedUsers.indexOf(id);
    if (index == -1) {
      checkedUsers.push(id);
    }
    else {
      checkedUsers.remove(id);
    }
  },
  'click #table_search': function (event, tmpl) {
    event.preventDefault();
    $('#active-users-table_filter').toggleClass('active');
    $('#table_search').toggleClass('active');
  },
  'click .remove': function (event, tmpl) {
    event.preventDefault();
    tmpl.checkedUsers.clear();
  }
});
