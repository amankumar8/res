import {VZ} from '/imports/startup/both/namespace';
import {archiveJobs} from '/imports/api/jobs/methods';
import {updateSelectedJobId} from '/imports/api/users/methods';
import { Jobs } from '/imports/api/jobs/jobs';

import './all-jobs.html';
import '../create-job/jobCreateEditModalActions';
import '../create-job/jobCreateEditModalAside';
import '../create-job/jobCreateEditModalDetails';
import '../create-job/jobCreateEditModalHead';

import '../create-job/jobCreateModalCentre';

Template.allJobs.onCreated(function () {
    this.checkedJobs = new ReactiveArray([]);
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
    this.autorun(() => {
        Template.currentData();
    });
});
Template.allJobs.onRendered(function () {
    let self = this;
    $('select').material_select();
    $('#jobs-table').DataTable({
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
            'targets': 6,
            'searchable': false,
            'orderable': false
        }],
        processing: false,
        scrollX: true
    });
    let table = $('#jobs-table').DataTable();

    table.on('draw', function (e) {
        self.autorun(function () {
            self.checkedJobs.list();
        });
    });
    this.autorun(() => {
        this.checkedJobs.list();
        this.updateDataTableSelectAllCtrl(table);
    });
});
Template.allJobs.helpers({
    isChecked() {
        let id = this._id;
        let checkedJobs = Template.instance().checkedJobs.list();
        let index = checkedJobs.indexOf(id);
        return index !== -1;
    },
    isCheckedJobs() {
        return Template.instance().checkedJobs.list().length > 0;
    },
    checkedCount() {
        return Template.instance().checkedJobs.list().length;
    },
    applicantsCount() {
        let _id = this._id;
        let job = Jobs.findOne({_id: _id}, {fields: {applicantsIds: 1, hiredApplicantsIds: 1, shortlistedApplicantsIds: 1, invitedUserIds: 1}});
        let countApplications = 0;
        let countHiredApplicants = 0;
        let countShortlistedApplicants = 0;
        let countInvitedApplicants = 0;
        if (job && job.applicantsIds) {
            countApplications = job.applicantsIds.length;
        }
        if (job && job.hiredApplicantsIds) {
            countHiredApplicants = job.hiredApplicantsIds.length;
        }
        if (job && job.shortlistedApplicantsIds) {
            countShortlistedApplicants = job.shortlistedApplicantsIds.length;
        }
        if (job && job.invitedUserIds) {
            countInvitedApplicants = job.invitedUserIds.length;
        }
        return countApplications + countShortlistedApplicants + countHiredApplicants + countInvitedApplicants;
    },
    statusColor(status) {
        return status == 'Opened' ? 'opened' : status == 'Closed' ? 'closed' : status == 'Will expire soon' ? 'expiring' : '';
    },
    viewsCount() {
        return this.viewerIds.length;
    }
});

Template.allJobs.events({
    'click #select-all': function (event, tmpl) {
        event.preventDefault();
        let allChecked = $('tbody input[type="checkbox"]', '#jobs-table').prop('checked', this.checked);
        let isAllChecked = $(event.currentTarget).prop('checked');
        let checkedJobs = tmpl.checkedJobs.list();
        if (isAllChecked) {
            _.each(allChecked, function (element, elementIndex, list) {
                let index = checkedJobs.indexOf($(element).attr('id'));
                if (index == -1) {
                    checkedJobs.push($(element).attr('id'));
                }
            });
        }
        else {
            _.each(allChecked, function (element, elementIndex, list) {
                let index = checkedJobs.indexOf($(element).attr('id'));
                if (index !== -1) {
                    checkedJobs.remove($(element).attr('id'));
                }
            });
        }
    },
    'click [name=table-item]': function (event, tmpl) {
        let id = this._id;
        let checkedJobs = tmpl.checkedJobs.list();
        let index = checkedJobs.indexOf(id);
        if (index == -1) {
            checkedJobs.push(id);
        }
        else {
            checkedJobs.remove(id);
        }
    },
    'click #table_search': function (event, tmpl) {
        event.preventDefault();
        $('#jobs-table_filter').toggleClass('active');
        $('#table_search').toggleClass('active');
    },
    'click .remove': function (event, tmpl) {
        event.preventDefault();
        tmpl.checkedJobs.clear();
    },
    'click #archive-jobs': function (event, tmpl) {
        event.preventDefault();
        let checkedJobs = tmpl.checkedJobs.array();
        Session.set('jobsFormChanged', false);
        archiveJobs.call({jobsIds: checkedJobs}, (err, res) => {
            if (!err) {
                VZ.notify('Archived');
                tmpl.checkedJobs.clear();
                Session.set('jobsFormChanged', true);
            } else {
                VZ.notify(error.message);
            }
        });
    },
    'click .add-new': function (event, template) {
        let user = Meteor.users.findOne({_id: Meteor.userId()});
        let selectedCompanyId = user && user.profile && user.profile.selectedCompanyId;
        if (selectedCompanyId) {
            const modalData = {
                generalTemplate: 'jobCreateModalCentre'
            };
            Blaze.renderWithData(Template.centreCreateModal, modalData, $('body')[0]);
            ga('send', 'event', 'post-new-job', 'vezio-work');
            return true;
        }
    },
    'click tbody td:first-child': function (event, template) {
        if (hasClass(event.target, "filled-in") === false &&
            event.target instanceof HTMLLabelElement === false) {
            let selectedJobId = this._id;

            updateSelectedJobId.call({selectedJobId}, function (error, result) {
                if (error) {
                    VZ.notify(error.message);
                }
            });
        }
    },
    'mouseover tbody td:first-child': function (event, template) {
        if (hasClass(event.target, "filled-in") === false &&
            event.target instanceof HTMLLabelElement === false) {
            document.body.style.cursor="pointer";
        }
    }

});

function hasClass(element, classToFind) {
    return element.className.split(" ").indexOf(classToFind) !== -1;

}