import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const Jobs = new Mongo.Collection('vj-jobs');

export const SALARY_TYPE = {
    FIXED_PRICE: 'Fixed-price',
    HOURLY: 'Hourly',
    ANNUAL: 'Annual',
    MONTHLY: 'Monthly'
};

Jobs.allow({
    insert: (userId, doc) => userId == 'wh8or4SeGKKr5WTDs',
    update: (userId, doc) => userId == 'wh8or4SeGKKr5WTDs',
    remove: (userId, doc) => false
});

Jobs.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

export const JobsSchema = new SimpleSchema({
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },

    title: {
        type: String,
        min: 3,
        max: 50
    },
    contractType: {
        type: String
    },

    skillsIds: {
        type: Array,
        minCount: 1,
        maxCount: 7
    },
    'skillsIds.$': {
        type: String
    },

    salary: {
        type: Object
        // optional: true
    },
    'salary.type': {
        type: String

    },
    'salary.hourlyRate': {
        type: Number,
        min: 3,
        decimal: true,
        optional: true
    },
    'salary.monthlyRate': {
        type: Number,
        min: 3,
        decimal: true,
        optional: true
    },
    'salary.contractPrice': {
        type: Number,
        min: 3,
        decimal: true,
        optional: true
    },
    'salary.min': {
        type: Number,
        min: 0,
        optional: true
    },
    'salary.max': {
        type: Number,
        min: 1,
        optional: true
    },
    companyId: {
        type: String,
        optional: true
    },

    equity: {
        type: Number,
        min: 0,
        max: 100,
        optional: true
    },


    description: {
        type: String,
        // min: 500
        min: 100,
        max: 5000
    },

     isDraft: {
        type: Boolean,
        optional: true
    },
    isArchived: {
        type: Boolean,
        optional: true
    },
    ownerId: {
        type: String,
        optional: true
    },

    createdAt: {
        type: Date,
        optional: true
    },
    expireAt: {
        type: Date,
        optional: true
    },
    viewerIds: {
        type: [String],
        min: 0,
        optional: true
    },
    applicantsIds: {
        type: Array,
        optional: true
    },
    'applicantsIds.$': {
        type: String
    },
    hiredApplicantsIds: {
        type: Array,
        optional: true
    },
    'hiredApplicantsIds.$': {
        type: String
    },
    shortlistedApplicantsIds: {
        type: Array,
        optional: true
    },
    'shortlistedApplicantsIds.$': {
        type: String
    },
    archivedApplicantsIds: {
        type: Array,
        optional: true
    },
    'archivedApplicantsIds.$': {
        type: String
    },
    status: {
        type: String,
        min: 5,
        optional: true
    },
    workerLocation: {
        type: Object,
        optional: true
    },
    'workerLocation.isRestricted':{
        type: Boolean,
        optional: true
    },
    'workerLocation.continent':{
        type: String,
        optional: true
    },
    'workerLocation.country':{
        type: String,
        optional: true
    },
    categoryId: {
        type: String,
        optional: true
    },
    createdBy: {
        type: String,
        optional: true
    },
    modifiedBy: {
        type: String,
        optional: true
    },
    modifiedAt: {
        type: Date,
        optional: true
    },
    userSavedJobIds: {
        type: [String],
        optional: true
    },
    invitedUserIds: {
        type: [String],
        optional: true
    }
});

JobsSchema.messages({

    "minString title": "[label] must be at least [min] characters",
    "maxString title": "[label] cannot exceed [max] characters",
    "minString description": "[label] must be at least [min] characters",
    "maxString description": "[label] cannot exceed [max] characters",
    "required contractType": "Contract type is required",
    "required salary.type": "Salary type is required",
    "minCount skillsIds": "You must specify at least [minCount] skills",

    "expectedNumber equity": "[label] equity must be a number!",
    "required equity": "Equity required"
});


Jobs.helpers({
    // A list is considered to be private if it has a userId set
    salaryInString() {
        let salary = this.salary;
        let salaryInfo = 'Undisclosed';
        if (salary) {
            switch (salary.type) {
                case SALARY_TYPE.FIXED_PRICE:
                    salaryInfo = salary.contractPrice + '$' + ' Fixed price';
                    break;
                case SALARY_TYPE.HOURLY:
                    salaryInfo = salary.hourlyRate + '$' + '/h';
                    break;
                case SALARY_TYPE.ANNUAL:
                    salaryInfo = salary.min / 1000 + 'k' + '$' + '-' + salary.max / 1000 + 'k' + '$' + ' Annually';
                    break;
                case SALARY_TYPE.MONTHLY:
                    salaryInfo = salary.montlyRate + '$' + ' Monthly';
                    break;
            }
        }
        return salaryInfo;
    },
    equityString() {
        return this.equity;
    },
    categoryClassName() {
        let industry = Industries.findOne(this.categoryId);     //this indicate
        // console.log("HALA -", industry.categoryClassName());
        return industry.categoryClassName();
    },
    categoryName() {
        let industry = Industries.findOne(this.categoryId);
        return industry.name;

    }
});