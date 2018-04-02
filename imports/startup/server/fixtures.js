import { SyncedCron } from 'meteor/percolate:synced-cron';
import { Countries } from '/imports/api/countries/countries';
import { Skills } from '/imports/api/skills/skills';
import { Industries } from '/imports/api/industries/industries';
import { Positions } from '/imports/api/positions/positions';
import { BankCredentials } from '/imports/api/bankCredentials/bankCredentials';
import { PublicHolidays } from '/imports/api/publicHolidays/publicHolidays';
import {_recountAllUserTasks, _recountIndividualTasks} from '/imports/api/tasksCountCalculations';
import moment from 'moment';
import { Companies } from '/imports/api/companies/companies';
import { Projects } from '/imports/api/projects/projects';
import {Tasks} from '/imports/api/tasks/tasks';
import {getCollectionData} from '/imports/api/android-app-helpers/methods';

WebApp.connectHandlers.use('/packages/materialize_materialize/fonts', function (req, res) {
    const url = req.originalUrl.replace('/fonts/', '/dist/fonts/');
    res.statusCode = 301;
    res.setHeader('Location', url);
    res.end();
});

Meteor.startup(function () {
    if(Meteor.isServer){
        SyncedCron.start();
        fillCountries();
        fillSkills();
        fillIndustries();
        fillPositions();
        _recountAllUserTasks();
        _recountIndividualTasks();
        // addBankCredentials();
        fillCountriesInPublicHolidays();
        // fixRoles();
        setDefaultHardLimit();
    }
});

function fillCountries() {
    let countriesList = JSON.parse(Assets.getText('countries.json'));
    let countriesCodes = _.keys(countriesList.countries);
    let countries = Countries.find().fetch();
    if (countries.length > 0 && !countries[0].continentCode && !countries[1].continentCode && !countries[2].continentCode) {
        _.each(countries, function (element) {
            _.each(countriesCodes, function (element1) {
                if (element.countryCode == element1) {
                    let country = countriesList.countries[element1];
                    Countries.update({_id: element._id}, {$set: {continentCode: country.continent}})
                }
            });
        });
        console.log('Countries updated with continent code');
    }
}

function fillSkills() {
    if(Skills.find().count() <= 0){
        let skillsList = JSON.parse(Assets.getText('skills.json'));
        for (let i = 0; i < skillsList.length; i++){
            // console.log(skillsList[i]);
            Skills.insert(skillsList[i]);
        }
        console.log('Skills inserted');
    }
}

function fillIndustries() {
    if(Industries.find().count() <= 0){
        let industriesList = JSON.parse(Assets.getText('industries.json'));
        for (let i = 0; i < industriesList.length; i++){
            Industries.insert(industriesList[i]);
        }
        console.log('Industries inserted');
    }
}

function fillPositions() {
    if(Positions.find().count() <= 0){
        let positionsList = JSON.parse(Assets.getText('positions.json'));
        for (let i = 0; i < positionsList.length; i++){
            Positions.insert(positionsList[i]);
        }
        console.log('Positions inserted');
    }
}

function addBankCredentials() {
    let allUsers = Meteor.users.find().fetch();
    for(let i = 0; i < allUsers.length; i++){
        if(allUsers[i].profile  && allUsers[i].profile.fullName){
            BankCredentials.insert({
                name: allUsers[i].profile && allUsers[i].profile.fullName,
                recipientEmail: allUsers[i].emails && allUsers[i].emails[0] && allUsers[i].emails[0].address,
                receiverType: 'personal',
                targetCurrency: 'USD',
                addressFirstLine: '1 City Road',
                addressPostCode: 'N1 1ZZ/90210',
                addressCity: 'London',
                addressState: 'Tex',
                addressCountryCode: 'gbr',
                abartn: '111000025',
                accountNumber: '12345678',
                accountType: 'checking',
                userId: allUsers[i]._id,
                createdAt: new Date(),
                updatedAt: new Date
            });
        }
    }
}

function fillCountriesInPublicHolidays() {
  const publicHolidays = PublicHolidays.find().fetch();
  if (publicHolidays.length <= 0) {
    const countriesWithHolidaysCalendarIds = JSON.parse(Assets.getText('countriesWithGCalendar.json')).countries;
    for (let countryCode in countriesWithHolidaysCalendarIds) {
      const googleCalendarId = countriesWithHolidaysCalendarIds[countryCode].googleHolidaysCalendarId;
      const data = {
        countryCode,
        googleCalendarId: googleCalendarId || 'en.japanese#holiday@group.v.calendar.google.com',
        weekends: [6,7],
        holidays: [],
        currentYear: moment().year().toString()
      };
      PublicHolidays.insert(data);
    }
  }
}

function fixRoles() {
  let companies = Companies.find().fetch();
  let projects = Projects.find().fetch();

  companies.forEach((company) => {
    let ownerId = company.ownerId;
    let companyId = company._id;
    if(!Roles.userIsInRole(ownerId, ['company-owner'], companyId)){
      Roles.addUsersToRoles(ownerId, 'company-owner', companyId);
    }
  });

  projects.forEach((project) => {
    let ownerId = project.ownerId;
    let projectId = project._id;

    if(!Roles.userIsInRole(ownerId, ['project-owner'], projectId)){
      Roles.addUsersToRoles(ownerId, 'project-owner', projectId);
    }
    let assignedUsersIds = project.assignedUsersIds || [];

    assignedUsersIds.forEach((userId) => {
      if(!Roles.userIsInRole(userId, ['project-worker'], projectId)){
        Roles.addUsersToRoles(userId, 'project-worker', projectId);
      }
    });
  });
  console.log('roles updated');
}
function setDefaultHardLimit() {
  let tasks = Tasks.find({hardLimit: {$exists: false}}).fetch();
  let tasksIds = tasks.map((task) => {
    return task._id;
  });
  Tasks.update({_id: {$in: tasksIds}}, {$set: {hardLimit: 0}}, {multi: true});
}