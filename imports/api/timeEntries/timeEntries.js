import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const TimeEntries = new Mongo.Collection('vz-time-entries');

TimeEntries.allow({
    insert: (userId, doc) => true,
    update: (userId, doc) => true,
    remove: (userId, doc) => false
});

TimeEntries.deny({
    insert: () => true,
    update: () => true,
    remove: () => true
});

export const editTimeEntrySchema = new SimpleSchema({
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },
    message: {
        type: String,
        optional: true
    },
    projectId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },
    startDate: {
        type: Date,
        optional: true
    },
    endDate: {
        type: Date,
        optional: true
    },
    _totalMinutes: {
        type: Number,
        optional: true
    },
    tags: {
        type: [String]
    },
    workingDaysThisMonth: {
      type: Number,
      optional: true
    },

    workingTimeLeft: {
      type: Number,
      optional: true
    }
});
export const permin = new SimpleSchema({
    keyboard: {
        type: Number
    },

    mouse: {
        type: Number
    },

    time: {
        type: Date
    }
});

export const clientStartTrackingSchema = new SimpleSchema({
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },
    clientAppId: {
        type: Number,
        optional: true
    },
    userId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },
    projectId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },
    taskId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },
    contractId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },
    paymentType: {
        type: String
    },
    paymentRate: {
        type: Number,
        decimal: true
    },
    countKeyboardEvents: {
        type: Number
    },
    countMouseEvents: {
        type: Number
    },
    countEventsPerMin: {
        type: [permin]
    },
    message: {
        type: String
    },
    workingDaysThisMonth: {
      type: Number,
      optional: true
    },
    workingTimeLeft: {
      type: Number,
      optional: true
    }
});

export const startTrackingSiteSchema = new SimpleSchema({
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },
    clientAppId: {
        type: Number,
        optional: true
    },
    contractId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },
    message: {
        type: String
    },
    projectId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },
    tags: {
        type: [String],
        optional: true
    },
    paymentType: {
        type: String,
        optional: true
    },

    paymentRate: {
        type: Number,
        decimal: true,
        optional: true
    },
    _done: {
        type: Boolean
    },
    _initiatedByDesktopApp: {
        type: Boolean
    },

    _trackedByDesktopApp: {
        type: Boolean
    },
    workingDaysThisMonth: {
      type: Number,
      optional: true
    },

    workingTimeLeft: {
      type: Number,
      optional: true
    }
});

export const TimeEntrySchema = new SimpleSchema({
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },

    message: {
        type: String
    },

    startDate: {
        type: Date,
        optional: true
    },

    endDate: {
        type: Date,
        optional: true
    },

    userId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },

    projectId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },

    taskId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },

    contractId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    },

    paymentType: {
        type: String,
        optional: true
    },

    paymentRate: {
        type: Number,
        decimal: true,
        optional: true
    },

    tags: {
        type: [String],
        optional: true
    },

    _done: {
        type: Boolean
    },

    _isManual: {
        type: Boolean,
        defaultValue: false,
        optional: true
    },

    _totalMinutes: {
        type: Number,
        optional: true
    },

    _isActive: {
        type: Boolean,
        defaultValue: true
    },

    _initiatedByDesktopApp: {
        type: Boolean
    },

    _trackedByDesktopApp: {
        type: Boolean
    },

    countKeyboardEvents: {
        type: Number,
        optional: true
    },

    countMouseEvents: {
        type: Number,
        optional: true
    },

    countEventsPerMin: {
        type: [permin],
        optional: true
    },
    clientAppId: {
        type: Number,
        optional: true
    },
    workingDaysThisMonth: {
      type: Number,
      optional: true
    },

    workingTimeLeft: {
      type: Number,
      optional: true
    }
});

const startDateSchema = new SimpleSchema({
    $gte: {
        type: Date
    },
    $lte: {
        type: Date
    }
});

const projectIdSchema = new SimpleSchema({
    $in: {
        type: [String],
        regEx: SimpleSchema.RegEx.Id
    }
});

export const screensPublicationSchema = new SimpleSchema({
    startDate: {
        type: startDateSchema
    },
    projectId: {
        type: projectIdSchema,
        optional: true
    },
    userId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
    }
});

const dateRangeSchema = new SimpleSchema({
    date: {
        type: Date
    },
    range: {
        type: String
    }
});

export const userRangeWorkTimeCardPubSchema = new SimpleSchema({
    dateRange: {
        type: dateRangeSchema
    },
    ids: {
        type: [String],
        regEx: SimpleSchema.RegEx.Id
    },
    messageFilter: {
        type: String,
        optional: true
    }
});

export const dashboardWorkerActivityCardSchema = new SimpleSchema({
  dateRange: {
    type: dateRangeSchema
  },
  companyId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    optional: true
  }
});

export const rangeWorkTimePubSchema = new SimpleSchema({
    dateRange: {
        type: dateRangeSchema
    },
    messageFilter: {
        type: String,
        optional: true
    }
});