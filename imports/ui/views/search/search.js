import { TimeEntries } from '/imports/api/timeEntries/timeEntries';
import { Projects } from '/imports/api/projects/projects';
import { Tasks } from '/imports/api/tasks/tasks';
import { Companies } from '/imports/api/companies/companies';
import { Teams } from '/imports/api/teams/teams';

import './search.html';
import './tabs/all/all-search';
import './tabs/companies/companies-search';
import './tabs/projects/project-search';
import './tabs/tab-header/search-tab-header';
import './tabs/tasks/tasks-search';
import './tabs/teams/teams-search';
import './tabs/timetracker/timetracker-search';
import './tabs/users/users-search';

Template.search.onCreated(function () {
    this.tabs = [{
        title: 'ALL',
        template: 'allSearch'
    }, {
        title: 'COMPANIES',
        template: 'companiesSearch',
        collection: Companies.find({})
    }, {
        title: 'PROJECTS',
        template: 'projectsSearch',
        collection: Projects.find({})
    }, {
        title: 'TASKS',
        template: 'tasksSearch',
        collection: Tasks.find({})
    },{
        title: 'TIMETRACKER',
        template: 'timetrackerSearch',
        collection: TimeEntries.find({})
    },  {
        title: 'USERS',
        template: 'usersSearch',
        collection: Meteor.users.find({
            _id: {
                $ne: Meteor.userId()
            }
        })
    }, {
        title: 'TEAMS',
        template: 'teamsSearch',
        collection: Teams.find({})
    }];

    this.activeTab = new ReactiveVar(this.tabs[0].template);

    this.autorun(() => {
        let activeTab = this.activeTab.get();
        let searchString = Template.currentData().searchString.get();

        if (activeTab === 'allSearch') {
            this.subscribe('allSearch', searchString);
        }
        else {
            this.subscribe('searchTab', searchString, activeTab);
        }
    });
});

Template.search.onRendered(function () {
});

Template.search.helpers({
    tabs() {
        let tabs = Template.instance().tabs;
        $('.tabs').tabs();
        return _.reject(tabs, function (tab) {
            if (tab.collection) {
                return tab.collection.count() == 0
            }
            return false
        })
    },

    activeTab() {
        return Template.instance().activeTab.get();
    },

    allSearchData() {
        let tabs = Template.search.__helpers.get('tabs').call();
        return {
            pageParams: this,
            tabs: tabs.slice(1)
        }
    },

    isAllSearch(activeTab) {
        return activeTab === 'allSearch'
    },

    isHaveSearchResults() {
        let tabs = Template.instance().tabs;
        let flag = false;
        _.each(tabs, function (tab) {
            if(tab.collection && tab.collection.count() > 0){
                flag = true
            }
        });
        return flag;
    }
});

Template.search.events({
    'click .tab': function (event, tmpl) {
        event.preventDefault();
        let selectedTabName = $(event.currentTarget).attr('id');
        tmpl.activeTab.set(selectedTabName);
    }
});
