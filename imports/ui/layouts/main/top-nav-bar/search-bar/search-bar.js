import { addSearchQuery } from '/imports/api/users/methods';
import './search-bar.html';

Template.searchBar.onCreated(function () {
    this.inputFocused = new ReactiveVar(false);
    this.searchString = new ReactiveVar();
    this.searchHistoryValid = new ReactiveVar([]);

    this.autorun(() => {
        let searchHistory = Meteor.user() && Meteor.user().profile && Meteor.user().profile.searchHistory;
        let searchString = this.searchString.get();

        if (searchHistory) {
            if (searchString && searchString.length > 0) {
                let regExp = new RegExp(searchString, 'i');

                searchHistory = _.filter(searchHistory, function (item) {
                    return regExp.test(item);
                });
                this.searchHistoryValid.set(searchHistory.slice(-5));

            } else {
                this.searchHistoryValid.set(searchHistory.slice(-5));
            }
        }
    });

    this.formatQuery = function (value, pageTitle) {
        value = value.trim();
        let query = 'q=' + value;

        if (pageTitle === 'timetracker' || pageTitle === 'companies' ||
            pageTitle === 'projects' || pageTitle === 'users' || pageTitle === 'tasks') {

            query = query + '&c=' + pageTitle
        }

        return query;
    };
});

Template.searchBar.onRendered(function () {
    // clear search input when go away from search page
    this.autorun(() => {
        let routeName = Router.current().route.getName();
        if (routeName != 'searchPage') {
            this.$('#search').val('');
        }
    });
});

Template.searchBar.helpers({
    inputFocused() {
        return Template.instance().inputFocused.get();
    },

    searchHistory() {
        return Template.instance().searchHistoryValid.get();
    }
});

Template.searchBar.events({
    'submit #search-form': function (event, tmpl) {
        event.preventDefault();
        let $input = tmpl.$('#search');
        let value = $input.val();
        let pageTitle = tmpl.data.pageTitle.toLowerCase();

        let query = tmpl.formatQuery(value, pageTitle);

        if (value.trim().length > 0) {
            addSearchQuery.call({query: value}, function (err) {
                if (err) {
                    console.log(err);
                }
            });

            $input.blur();
            Router.go('searchPage', {}, {query: query})
        }
    },

    'input #search': function (event, tmpl) {
        let value = tmpl.$(event.currentTarget).val();

        if (value.trim().length > 0) {
            tmpl.searchString.set(value);
        } else {
            tmpl.searchString.set();
        }
    },

    'focus #search': function (event, tmpl) {
        tmpl.inputFocused.set(true);

        let value = tmpl.$(event.currentTarget).val();
        if (value && value.trim().length > 0) {
            tmpl.searchString.set(value);
        }
    },

    'blur #search': function (event, tmpl) {
        tmpl.inputFocused.set(false);
    },

    'mousedown .search-history-item': function (event, tmpl) {
        let value = this.toString();
        let pageTitle = tmpl.data.pageTitle.toLowerCase();

        let query = tmpl.formatQuery(value, pageTitle);

        tmpl.$('#search').val(value);
        Router.go('searchPage', {}, {query: query})
    }
});