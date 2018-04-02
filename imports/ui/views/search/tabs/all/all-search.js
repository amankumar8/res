import './all-search.html';

Template.allSearch.onRendered(function () {
});

Template.allSearch.helpers({
    tabs() {
        let data = this;
        let tabs = this.tabs;

        if(this.pageParams.category){
            return _.sortBy(tabs, function(tab){
                return tab.title.toLocaleLowerCase() != data.pageParams.category
            });
        }
        return this.tabs
    },
    
    tabData() {
        return {
            pageParams: this.pageParams,
            showHeader: true
        }
    }
});