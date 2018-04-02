import { SALARY_TYPE } from '/imports/api/jobs/jobs';
import { Companies } from '/imports/api/companies/companies';

export let sortByHourlyRate = function (users, order) {
    if(order === 'asc'){
        users.sort(function(a, b) {
            return a.profile.hourlyRate - b.profile.hourlyRate;
        });
    } else {
        users.sort(function(a, b) {
            return b.profile.hourlyRate - a.profile.hourlyRate;
        });
    }
};

export let sortByUserName = function (users, order) {
    if(order === 'asc'){
        users.sort(function (a,b) {
            if (a.profile.fullName < b.profile.fullName)
                return 1;
            if (a.profile.fullName > b.profile.fullName)
                return -1;
            return 0;
        });
    } else {
        users.sort(function (a,b) {
            if (a.profile.fullName < b.profile.fullName)
                return -1;
            if (a.profile.fullName > b.profile.fullName)
                return 1;
            return 0;
        });
    }
};

export let sortBySalary = function (jobs, order) {
    if(order === 'asc'){
        jobs.sort(function(a, b) {
            return a.salaryRate - b.salaryRate;
        });
    }
    else {
        jobs.sort(function(a, b) {
            return b.salaryRate - a.salaryRate;
        });
    }
};

export let sortByCompanyName = function (jobs, order) {
    if(order === 'asc'){
        jobs.sort(function (a,b) {
            if (a.companyName < b.companyName)
                return 1;
            if (a.companyName > b.companyName)
                return -1;
            return 0;
        });
    }
    else {
        jobs.sort(function (a,b) {
            if (a.companyName < b.companyName)
                return -1;
            if (a.companyName > b.companyName)
                return 1;
            return 0;
        });
    }
};

export let resizeWindow = function (limit) {
    this.$('.dropdown-button').dropdown();

    let lastScrollTop = 0;
    let loadOnScroll = _.debounce(function (event) {
        if ($(window).scrollTop() + $(window).height() > $(document).height() - 1) { // to detect scroll event
            let scrollTop = $(this).scrollTop();
            if (scrollTop > lastScrollTop) {
                limit.set(limit.get() + 5);
            }
            lastScrollTop = scrollTop;
        }
    }, 500);
    $(window).scroll(loadOnScroll);

    const windowSize = $(window).height();
    const documentSize = $(document).height();
    if (documentSize <= windowSize) {
        limit.set(limit.get() + 15);
    }
    $(window).resize(function () {
        const windowSize = $(window).height();
        const documentSize = $(document).height();
        if (documentSize <= windowSize) {
            limit.set(limit.get() + 5);
        }
    });
};

export let removeTagFilter = function (tmpl) {
    let newQuery = tmpl.data.query;
    let id = tmpl.data.scope._id;
    let arrayName = tmpl.data.scope.arrayName;

    if (newQuery[arrayName]) {
        if (arrayName == 'country') {
            let code = tmpl.data.scope.countryCode;
            newQuery[arrayName] = _.reject(newQuery[arrayName], function (item){
                return item == code;
            });
        }
        newQuery[arrayName] = _.reject(newQuery[arrayName], function (item){
            return item == id;
        });
    }

    Meteor.setTimeout(function () {
        Router.go('talentSearch', {}, {query: newQuery});
    }, 10);
};

export let filterItem = function (event, tmpl, keyPropertyName, type) {
    let checked = tmpl.$(event.currentTarget).prop('checked');
    let arrayName = tmpl.data.arrayName;
    let query = tmpl.data.query;

    if (query[arrayName]) {
        if (checked) {
            query[arrayName].push(keyPropertyName);
        }
        else {
            query[arrayName] = _.reject(query[arrayName], function (item) {
                return item == keyPropertyName;
            });
        }
    }
    else {
        query[arrayName] = [];
        query[arrayName].push(keyPropertyName);
    }
    if (type === 'company') {
        Router.go('companiesSearch', {}, {query: query});
    } else if (type === 'talent') {
        Router.go('talentSearch', {}, {query: query});
    } else {
        Router.go('jobsSearch', {}, {query: query});
    }

};

export let shouldShowCheckedTemplate = function (tmpl, val) {
    let query = tmpl.data.query;
    let property = val[tmpl.data.keyPropertyName];
    let arrayName = tmpl.data.arrayName;
    let array = query[arrayName];
    return _.isArray(array) ? _.find(array, function (item) {
        return item == property
    }) : false;
};

export let getCollection = function (key) {
    switch (key) {
        case 'jobType':
            return JobTypes;
            break;
        case 'jobSkill':
            return Skills;
            break;
        case 'country':
            return Countries;
            break;
        default:
            return false;
    }
};

export let sortByFilters = function (jobs, filters) {
    if(filters){
        if(filters.sortOrder){
            _.each(jobs, function (job) {
                let salary = job.salary;
                let salaryRate = 0;
                if (salary) {
                    switch (salary.type) {
                        case SALARY_TYPE.FIXED_PRICE:
                            salaryRate = salary.contractPrice;
                            break;
                        case SALARY_TYPE.HOURLY:
                            salaryRate = salary.hourlyRate ;
                            break;
                        case SALARY_TYPE.ANNUAL:
                            salaryRate = salary.min;
                            break;
                        case SALARY_TYPE.MONTHLY:
                            salaryRate = salary.montlyRate;
                            break;
                    }
                    job.salaryRate = salaryRate;
                }
            });
            sortBySalary(jobs, filters.sortOrder);
        }
        else if(filters.companySortOrder){
            _.each(jobs, function (job) {
                let company = Companies.findOne({_id: job.companyId});
                job.companyName = company.name;
            });
            sortByCompanyName(jobs, filters.companySortOrder);
        }
    }
};

export let sortByFiltersWorkers = function (users, filters) {
    if(filters){
        if(filters.sortOrder){
            sortByHourlyRate(users, filters.sortOrder);
        } else if(filters.companySortOrder){
            sortByUserName(users, filters.companySortOrder);
        }
    }
};

export let inputJobTitle = function (tmpl) {
    let value = tmpl.$('#job-title').val().trim();
    let query = _.clone(tmpl.query.get());
    let reg = {$regex: value, $options: 'gi'};
    query.title = reg;
    tmpl.query.set(query);
};

export let inputWorkerName = function (tmpl) {
    let value = tmpl.$('#job-title').val().trim();
    tmpl.query.set(value);
};

export let tagArray = function (query) {
    let resultArray = [];
    _.each(query, function (val, key) {
        if (_.isArray(val)) {
            // let collectionName = self.getCollectionName(key);
            let collection = getCollection(key);
            _.each(query[key], function (elem) {
                let obj;
                obj = collection.findOne({_id: elem});

                if (obj) {
                    obj.keyPropertyName = 'label';
                    obj.arrayName = key;
                    resultArray.push(obj);
                }
            });
        }
    });
    return resultArray;
};

export let itemsInArrayTemplate = function(tmpl) {
    let query = {};
    let inputFilter = tmpl.inputValue.get();

    if (inputFilter && inputFilter.trim().length > 0) {
        let regExp = new RegExp(inputFilter.trim(), 'i');
        query.label = {$regex: regExp}
    }
    return tmpl.collection.find(query);
};

export let workerLocationTemplate = function(job) {
    let location;
    if (job && job.workerLocation) {
        if (job.workerLocation.continent === 'NA' && !job.workerLocation.country) {
            location = 'North America';
        }
        else if (job.workerLocation.isRestricted) {
            location = job.workerLocation.country !== 'anywhere' ? job.workerLocation.country ? job.workerLocation.country : job.workerLocation.continent : '-';
        }
        else {
            location = 'Anywhere';
        }
        return location;
    }
    else {
        return '-';
    }
};

export let sendNotification = function(title, options) {
    if (!("Notification" in window)) {
        //alert('Your browser not allow HTML Notifications, just update it.');
    } else if (Notification.permission === "granted") {
        //let notification = new Notification(title, options);
        return new Notification(title, options);
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {});
    } else {}
};