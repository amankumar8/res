import { VZ } from '/imports/startup/both/namespace';
import { Teams } from '/imports/api/teams/teams';
import { archiveTeams } from '/imports/api/teams/methods';

import './all-teams.html';

Template.allTeams.onCreated(function () {
    this.checkedTeams = new ReactiveArray([]);
    this.updateDataTableSelectAllCtrl = function(table) {
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
    this.autorun(() => {
        Template.currentData();
    });
});

Template.allTeams.onRendered(function () {
    let self = this;
    $('#teams-table').DataTable({
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
    let table = $('#teams-table').DataTable();

    table.on('draw', function(e) {
        self.autorun(function () {
            self.checkedTeams.list();
        });
        // self.updateDataTableSelectAllCtrl(table);
    });
    this.autorun(() => {
        this.checkedTeams.list();
        this.updateDataTableSelectAllCtrl(table);
    });
});

Template.allTeams.helpers({
    teams() {
        return Teams.find({archived: false}).fetch();
        // return _.sortBy(teams, function (team) {
        //     return team.name.toLowerCase();
        // });
    },
    formatIsPrivate(isPrivate) {
        return isPrivate ? 'Yes' : 'No';
    },
    userName(userId){
        return Meteor.users.findOne({_id: userId}, {
            fields: {profile: 1, roles: 1, emails: 1}
        }).profile.fullName;
    },
    isChecked() {
        let id = this._id;
        let checkedTeams = Template.instance().checkedTeams.list();
        let index = checkedTeams.indexOf(id);
        return index !== -1;
    },
    isCheckedTeams() {
        return Template.instance().checkedTeams.list().length > 0;
    },
    checkedCount() {
        return Template.instance().checkedTeams.list().length
    },
  isCompanyAccount(){
    let user = Meteor.user();
    return user && user.profile && user.profile.selectedCompanyId;
  }
});

Template.allTeams.events({
    'click #select-all': function (event, tmpl) {
        event.preventDefault();
        let allChecked = $('tbody input[type="checkbox"]', '#teams-table').prop('checked', this.checked);
        let isAllChecked = $(event.currentTarget).prop('checked');
        let checkedTeams = tmpl.checkedTeams.list();
        if (isAllChecked) {

            _.each(allChecked, function(element, elementIndex, list) {
                let index = checkedTeams.indexOf($(element).attr('id'));
                if (index == -1) {
                    checkedTeams.push($(element).attr('id'));
                }
            });
        }
        else {
            _.each(allChecked, function(element, elementIndex, list) {
                let index = checkedTeams.indexOf($(element).attr('id'));
                if (index !== -1) {
                    checkedTeams.remove($(element).attr('id'));
                }
            });
        }
    },
    'click [name=table-item]': function (event, tmpl) {
        const id = this._id;
        let checkedTeams = tmpl.checkedTeams.list();
        let index = checkedTeams.indexOf(id);
        if (index == -1) {
            checkedTeams.push(id);
        }
        else {
            checkedTeams.remove(id);
        }
    },
    'click #table_search': function (event, tmpl) {
        event.preventDefault();
        $('#teams-table_filter').toggleClass('active');
        $('#table_search').toggleClass('active');
    },
    'click .remove': function (event, tmpl) {
        event.preventDefault();
        tmpl.checkedTeams.clear();
    },
    'click #archive-teams': function (event, tmpl) {
        event.preventDefault();
        let checkedTeams = tmpl.checkedTeams.array();
        Session.set('teamsFormChanged',  false);
        archiveTeams.call({teamIds: checkedTeams}, function (error, result) {
            if(!error){
                VZ.notify('Archived');
                tmpl.checkedTeams.clear();
                Session.set('teamsFormChanged',  true);
            }
            else {
                VZ.notify(error.message);
                Session.set('teamsFormChanged',  true);
            }
        });
    },
    'click .add-new': function(event, template) {
      ga('send', 'event', 'create-team', 'vezio-work');
      return true;
    }
});
