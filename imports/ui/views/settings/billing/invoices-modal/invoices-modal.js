import { VZ } from '/imports/startup/both/namespace';
import * as pdfmake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { TimeEntries } from '/imports/api/timeEntries/timeEntries';
import { Contracts } from '/imports/api/contracts/contracts';
import { Companies } from '/imports/api/companies/companies';
import './invoices-modal.html';

Template.invoicesModal.onCreated(function () {
    let dateRangeObj = {
        date: moment().toDate(),
        range: 'Weekly'
    };
    this.dateRange = new ReactiveVar(dateRangeObj);
    this.userId = new ReactiveVar('');
    this.magic = new ReactiveVar(false);

    this.timeSummary = (userId) => {
        let oneHour = 1000 * 60 * 60;
        let rangeObj = this.dateRange.get();
        let start = moment(rangeObj.date).startOf(VZ.dateRanges[rangeObj.range]).toDate();
        let end = moment(rangeObj.date).endOf(VZ.dateRanges[rangeObj.range]).toDate();
        let totalSpent = 0;

        let totalMiliSeconds = 0;
        TimeEntries.find({
            userId: userId,
            _isActive: false,
            startDate: {
                $gte: start,
                $lte: end
            }
        }).forEach(function (entry) {
            let diff = moment(entry.endDate).diff(entry.startDate);
            let timeEntryDuration  = entry.endDate - entry.startDate;

            totalMiliSeconds += diff;
            let earned = timeEntryDuration * entry.paymentRate / oneHour;
            totalSpent += earned;
        });

        let hours = parseInt(moment.duration(totalMiliSeconds).asHours());
        hours = hours < 10 ? '0' + hours : hours;
        return {worked: hours + moment.utc(totalMiliSeconds).format(':mm'),
            earned: totalSpent}
    };
    this.autorun(() => {
        let dateRange = this.dateRange.get();
        let userId = this.userId.get();
        let workTimeSub = this.subscribe('userRangeWorkTime', dateRange, [userId]);
        let contractsSub = this.subscribe('ownerContracts', true);
        if(workTimeSub.ready() && contractsSub.ready()){
            this.magic.set(true);
        }
    });
});
Template.invoicesModal.onRendered(function () {
    let self = this;
    this.$('.modal').modal();
    this.$('.modal').modal('open');
    this.$('select').material_select();

    this.$('.modal-overlay').on('click', function () {
        removeTemplate(self.view);
    });
    document.addEventListener('keyup', function (e) {
        if (e.keyCode == 27) {
            removeTemplate(self.view);
        }
    });
    this.autorun(() => {
        this.magic.get();
        let contracts = Contracts.find({employerId: Meteor.userId()}).fetch();
        let workerIds = _.map(contracts, function (contract) {
            return contract.workerId;
        });
        workerIds = _.uniq(workerIds);
        let users = Meteor.users.find({_id: {$in: workerIds}}).fetch();
        if (users.length > 0) {
            setTimeout(function () {
                self.$('select').material_select();
            }, 300);
        }
    });
});
Template.invoicesModal.onDestroyed(function () {
    $('.modal-overlay').remove();
});

Template.invoicesModal.helpers({
    contractedUsers() {
        let contracts = Contracts.find({employerId: Meteor.userId()}).fetch();
        let workerIds = _.map(contracts, function (contract) {
            return contract.workerId;
        });
        workerIds = _.uniq(workerIds);
        return Meteor.users.find({_id: {$in: workerIds}}).fetch();
    },
    pickerRange() {
        let dateRange = Template.instance().dateRange.get();
        let start = moment(dateRange.date).startOf(VZ.dateRanges[dateRange.range]).format('Do MMM YYYY');
        let end = moment(dateRange.date).endOf(VZ.dateRanges[dateRange.range]).format('Do MMM YYYY');
        return start + ' - ' + end;
    }
});

Template.invoicesModal.events({
    'change .dateRange-select': function (event, tmpl) {
        let range = tmpl.$(event.currentTarget).val();
        if (range) {
            let dateRange = tmpl.dateRange.get();
            dateRange.range = range;
            tmpl.dateRange.set(dateRange);
        }
    },

    'click .pick-prev-range': function (event, tmpl) {
        let dateRange = tmpl.dateRange.get();
        let range = VZ.dateRanges[dateRange.range];
        if (range === 'isoweek') {
            range = 'week'
        }
        dateRange.date = moment(dateRange.date).subtract(1, range).toDate();
        tmpl.dateRange.set(dateRange);
    },

    'click .pick-next-range': function (event, tmpl) {
        let dateRange = tmpl.dateRange.get();
        let range = VZ.dateRanges[dateRange.range];
        if (range === 'isoweek') {
            range = 'week'
        }
        dateRange.date = moment(dateRange.date).add(1, range).toDate();
        tmpl.dateRange.set(dateRange);
    },
    'change #users-select': function (event, tmpl) {
        event.preventDefault();
        let userId = tmpl.$('#users-select option:selected').val();
        tmpl.userId.set(userId);
    },
    'click .save': function (event, tmpl) {
        event.preventDefault();
        let dateRange = tmpl.dateRange.get();
        let userId = tmpl.userId.get();
        if(!userId){
            VZ.notify('Select user');
            return;
        }
        let start = moment(dateRange.date).startOf(VZ.dateRanges[dateRange.range]).toDate();
        let end = moment(dateRange.date).endOf(VZ.dateRanges[dateRange.range]).toDate();

        let query = {
            userId: userId,
            _isActive: false,
            startDate: {
                $gte: start,
                $lte: end
            }
        };
        let timeEntries =  TimeEntries.find(query).fetch();
        if(timeEntries.length == 0){
            VZ.notify('No entries found');
            return;
        }
        let timeSummary = tmpl.timeSummary(userId);
        let user = Meteor.users.findOne({_id: userId});
        let currentUser = Meteor.users.findOne({_id: Meteor.userId()});
        let currentUserName = currentUser && currentUser.profile && currentUser.profile.fullName;

        let contract = Contracts.findOne({workerId: userId, employerId: Meteor.userId(), status: 'active'});
        if(contract && !contract.companyId){
            VZ.notify('Contract '+contract.name + ' don\'t have company attached!');
            return;
        }
        let contractId = contract && contract._id;
        let company = Companies.findOne({_id: contractId});

        let noCompanyMessage = 'Contract don\'t have company id';
        let companyName = company && company.name || noCompanyMessage;
        let companyCity = company && company.city || noCompanyMessage;
        let companyCountry= company && company.country || noCompanyMessage;
        let companyZip = company && company.zip;
        let companyAddress= company && company.address;
        let totalAddress = companyAddress +', '+companyZip;
        let rate = contract && contract.paymentInfo && contract.paymentInfo.rate;
        rate = rate.toFixed(2);
        let userName = user && user.profile && user.profile.fullName;
        let formatedStart = moment(start).format('L');
        let formatedEnd = moment(end).format('L');
        let earned = timeSummary.earned.toFixed(2);
        let fileName = userName + ' ' + formatedStart + ' - ' + formatedEnd;
        fileName = fileName.toString();
        let content = '('+userId+') '+userName + ' - ' + timeSummary.worked + ' hrs @ $'+rate+'/hr' + ' - ' + formatedStart+ ' - ' +formatedEnd;
        content = content.toString();

        let docDefinition = {
            content: [
                {
                    columns: [
                        {
                            width: '*',
                            text: [{text:'From:\n', bold:true},{ text: ' '+userName, color:'#333', fontSize:10},
                                {text:'\n\nBill to:\n', bold:true},
                                {text:' '+companyName+'\nAttn: '+currentUserName+' \n'+companyCity+' \n'+totalAddress+'+\n'+companyCountry+' ', color:'#333', fontSize:10}]
                        },
                        {
                            width: '*',
                            text: ''
                        },
                        {
                            width: '*',
                            text: [
                                {text:'I N V O I C E \n\n', alignment: 'right', fontSize:30, color:'#333'},
                                {text:'INVOICE : V12345 \n', alignment: 'right', color:'#333', fontSize:10},
                                {text:'DATE : '+moment().format('MMMM D YYYY')+'\n', alignment: 'right', color:'#333', fontSize:10},
                                {text:'TOTAL AMOUNT : $'+earned+'\n', alignment: 'right', color:'#333', fontSize:10},
                                {text:'TOTAL DUE : $'+earned, alignment: 'right', bold:true, color:'#333', fontSize:10},
                            ]
                        },
                    ],

                    // optional space between columns
                    columnGap: 10
                },
                {
                },

                {
                    text:'\n\n\n',
                },

                {
                    table: {
                        // headers are automatically repeated if the table spans over multiple pages
                        // you can declare how many rows should be treated as headers
                        headerRows: 1,
                        widths: [ '*', 'auto' ],

                        body: [
                            [ 'DESCRIPTION/MEMO', 'AMOUNT'],
                            [ {text: content, fontSize:10}, {text: earned, fontSize:10}],
                            [ { text: 'TOTAL AMOUNT', bold: true }, '$'+earned]
                        ]
                    }
                },

                {
                    text: [ { text: '\n Invoice created via Vez.io', alignment:'right' }]
                },

            ]};
        pdfMake.createPdf(docDefinition).download(fileName);
    },
    'click .cancel': function (event, tmpl) {
        event.preventDefault();
        tmpl.$('#edit-profile-modal').modal('close');
        removeTemplate(tmpl.view);
    }
});

let removeTemplate = function (view) {
    setTimeout(function () {
        Blaze.remove(view);
    }, 500);
};