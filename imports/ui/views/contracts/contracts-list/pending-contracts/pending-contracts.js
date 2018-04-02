import { VZ } from '/imports/startup/both/namespace';
import { Contracts } from '/imports/api/contracts/contracts';
import { deleteContracts, deleteContract} from '/imports/api/contracts/methods';
import './pending-contracts.html';


Template.pendingContracts.onCreated(function () {
    this.checkedContracts = new ReactiveArray([]);
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
});
Template.pendingContracts.onRendered(function () {
    let self = this;
    let table = $('#active-contracts-table').DataTable({
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
            self.checkedContracts.list();
        });
    });
    this.autorun(() => {
        this.checkedContracts.list();
        this.updateDataTableSelectAllCtrl(table);
    });
});
Template.pendingContracts.helpers({
  userName(userId){
    let user = Meteor.users.findOne({_id: userId}, {
      fields: {profile: 1, roles: 1, emails: 1}
    });
    return user && user.profile && user.profile.fullName;
  },
    contracts() {
        return Contracts.find({status: 'pending'});
    },
    isChecked() {
        let id = this._id;
        let checkedTasks = Template.instance().checkedContracts.list();
        let index = checkedTasks.indexOf(id);
        return index !== -1;
    },
    isCheckedContracts() {
        return Template.instance().checkedContracts.list().length > 0;
    },
    checkedCount() {
        return Template.instance().checkedContracts.list().length
    }
});

Template.pendingContracts.events({
    'click #select-all': function (event, tmpl) {
        event.preventDefault();
        let allChecked = $('tbody input[type="checkbox"]', '#active-contracts-table').prop('checked', this.checked);
        let isAllChecked = $(event.currentTarget).prop('checked');
        let checkedContracts = tmpl.checkedContracts.list();
        if (isAllChecked) {

            _.each(allChecked, function(element, elementIndex, list) {
                let index = checkedContracts.indexOf($(element).attr('id'));
                if (index == -1) {
                    checkedContracts.push($(element).attr('id'));
                }
            });
        }
        else {
            _.each(allChecked, function(element, elementIndex, list) {
                let index = checkedContracts.indexOf($(element).attr('id'));
                if (index !== -1) {
                    checkedContracts.remove($(element).attr('id'));
                }
            });
        }
    },
    'click [name=table-item]': function (event, tmpl) {
        let id = this._id;
        let checkedContracts = tmpl.checkedContracts.list();
        let index = checkedContracts.indexOf(id);
        if (index == -1) {
            checkedContracts.push(id);
        }
        else {
            checkedContracts.remove(id);
        }
    },
    'click #table_search': function (event, tmpl) {
        event.preventDefault();
        $('#active-contracts-table_filter').toggleClass('active');
        $('#table_search').toggleClass('active');
    },
    'click .remove': function (event, tmpl) {
        event.preventDefault();
        tmpl.checkedContracts.clear();
    },
    'click #delete-contarct': function (event, tmpl) {
        event.preventDefault();
        let contractId = this.data._id;
        deleteContract.call({contractId}, function (error, result) {
            if(!error){
                VZ.notify('Deleted');
            }
            else {
                VZ.notify(error.message);
            }
        });
    },
    'click #delete-contacts': function (event, tmpl) {
        event.preventDefault();
        let checkedContractsIds = tmpl.checkedContracts.array();
        Session.set('contractsFormChanged',  false);
        deleteContracts.call({contractIds: checkedContractsIds}, function (error, result) {
            if(!error){
                VZ.notify('Archived');
                tmpl.checkedContracts.clear();
                Session.set('contractsFormChanged',  true);
            }
            else {
                VZ.notify(error.message);
                Session.set('contractsFormChanged',  true);
            }
        });
    }
});