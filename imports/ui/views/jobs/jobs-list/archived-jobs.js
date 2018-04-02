import {VZ} from '/imports/startup/both/namespace';
import './archived-jobs.html';
import {restoreJobs} from '/imports/api/jobs/methods';

Template.archivedJobs.onCreated(function () {
    this.archivedCheckedJobs = new ReactiveArray([]);
    this.updateDataTableSelectAllCtrl = function (table) {
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
    this.autorun(() =>{
        Template.currentData();
    });
});
Template.archivedJobs.onRendered(function () {
    let self = this;
    $('select').material_select();
    $('#archived-jobs-table').DataTable({
        // data: self.data.projects,
        responsive: true,
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
        "bRetrieve": true,
        "bDestroy": true,
        'columnDefs': [{
            'targets': 4,
            'searchable': false,
            'orderable': false
        }],
        processing: false,
        scrollX: true
    });
    let table = $('#archived-jobs-table').DataTable();

    table.on('draw', function (e) {
        self.autorun(function () {
            self.archivedCheckedJobs.list();
        });
    });
    this.autorun(() => {
        this.archivedCheckedJobs.list();
        this.updateDataTableSelectAllCtrl(table);
    });
});
Template.archivedJobs.helpers({
    isChecked() {
        let id = this._id;
        let archivedCheckedJobs = Template.instance().archivedCheckedJobs.list();
        let index = archivedCheckedJobs.indexOf(id);
        return index !== -1;
    },
    isCheckedJobs() {
        return Template.instance().archivedCheckedJobs.list().length > 0;
    },
    checkedCount() {
        return Template.instance().archivedCheckedJobs.list().length;
    },
    applicantsCount(applicantsIds) {
        return applicantsIds.length;
    },
    statusColorA(status) {
        return status == 'Opened' ? 'opened' : status == 'Closed' ? 'closed' : status == 'Will expire soon' ? 'expiring' : '';
    },
    viewsCountA() {
        return this.viewerIds.length;
    }
});

Template.archivedJobs.events({
    'click #select-all': function (event, tmpl) {
        event.preventDefault();
        let allChecked = $('tbody input[type="checkbox"]', '#archived-jobs-table').prop('checked', this.checked);
        let isAllChecked = $(event.currentTarget).prop('checked');
        let archivedCheckedJobs = tmpl.archivedCheckedJobs.list();
        if (isAllChecked) {
            _.each(allChecked, function (element, elementIndex, list) {
                let index = archivedCheckedJobs.indexOf($(element).attr('id'));
                if (index == -1) {
                    archivedCheckedJobs.push($(element).attr('id'));
                }
            });
        }
        else {
            _.each(allChecked, function (element, elementIndex, list) {
                let index = archivedCheckedJobs.indexOf($(element).attr('id'));
                if (index !== -1) {
                    archivedCheckedJobs.remove($(element).attr('id'));
                }
            });
        }
    },
    'click [name=table-item]': function (event, tmpl) {
        let id = this._id;
        let archivedCheckedJobs = tmpl.archivedCheckedJobs.list();
        let index = archivedCheckedJobs.indexOf(id);
        if (index == -1) {
            archivedCheckedJobs.push(id);
        }
        else {
            archivedCheckedJobs.remove(id);
        }
    },
    'click #table_search': function (event, tmpl) {
        event.preventDefault();
        $('#archived-jobs-table_filter').toggleClass('active');
        $('#table_search').toggleClass('active');
    },
    'click .remove': function (event, tmpl) {
        event.preventDefault();
        tmpl.archivedCheckedJobs.clear();
    },
    'click #archive-jobs': function (event, tmpl) {
        event.preventDefault();
        let archivedCheckedJobs = tmpl.archivedCheckedJobs.array();
        Session.set('jobsFormChanged', false);
        restoreJobs.call({jobsIds: archivedCheckedJobs}, (err, res) => {
            if (!err) {
                VZ.notify('Restored');
                tmpl.archivedCheckedJobs.clear();
                Session.set('jobsFormChanged', true);
            } else {
                VZ.notify(error.message);
            }
        });
    }
});