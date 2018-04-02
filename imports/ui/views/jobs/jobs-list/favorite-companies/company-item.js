/**
 * Created by polaris on 7/29/17.
 */
import './company-item.html';

//import '../company-details-modal/company-details-modal';
import { Jobs } from '/imports/api/jobs/jobs';

Template.companyItemNew.helpers ({
    companyName(){
        return this.name.charAt(0);
    },
    companyDescription(){
        let description = this.description;
        return description.length > 100 ? description.substr(0, text.lastIndexOf(' ', 97)) + '...' : description;
    },

    companyLocation(){
        let location = this.location;
        if (location && location.country) {
            return location.country;
        }
        else {
            return '-';
        }
    },
    website(){
        let contacts = this.contacts;
        if (contacts && contacts.website) {
            return {
                link: contacts.website,
                name: contacts.website.replace('http:', '').replace('https:', '').replace(/(\/)+/g, '')
            }
        }
        else {
            return {
                link: '',
                name: '-'
            }
        }
    },
    relatedJobsCount() {
        return Jobs.find({companyId: this._id, isArchived: false}).count();
    }
});