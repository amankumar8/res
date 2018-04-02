import { Template } from 'meteor/templating';
import {Companies} from "../../../../api/companies/companies";
import { SocialMediaController } from './socialMediaComponents/SocialMediaController';
import './socialMediaComponents/socialMediaInput';
import './socialMediaComponents/socialMediaView';
import './companyCreateEditModalDetails.html'

Template.companyCreateEditModalDetails.onCreated(function () {
    const modal = this.data.modalTemplate;

    modal.SocialMediaControllerInstance = new SocialMediaController();
});

Template.companyCreateEditModalDetails.onRendered(function () {
    const modal = this.data.modalTemplate;
    modal.SocialMediaControllerInstance.startWorking()
});

Template.companyCreateEditModalDetails.helpers({
    socialMedia () {
        const company = Companies.findOne(Template.instance().data.companyId, {fields: {socialMedias: 1, socialMedia: 1}});
        if (company && (company.socialMedia || company.socialMedias)) {
            return company && company.socialMedia;
        } else {
            return [];
        }

    },
    getSocialMediaController() {
        const template = Template.instance();
        const modal = template.data.modalTemplate;
        return modal.SocialMediaControllerInstance;
    },
    tempData() {
        return Template.instance().data.companyId;
    }
});