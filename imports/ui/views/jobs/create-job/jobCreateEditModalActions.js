import { VZ } from '/imports/startup/both/namespace';
import { Skills } from '/imports/api/skills/skills';
import {createJob, editJob} from '/imports/api/jobs/methods';

import './jobCreateEditModalActions.html';

Template.jobCreateEditModalActions.events({

  'click #save': _.debounce(function (event, template) {
    const modal = template.data.modalTemplate;
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const ownerId = modal.currentOwnerVar.get();
    const user = Meteor.users.findOne({_id: Meteor.userId()});
    let companyId = user && user.profile && user.profile.selectedCompanyId;
    const contractType = getContractType(modal);
    const salary = getSalaryAccordingToType(modal);
    const skillsIds = getSkillsIds(modal);
    const workerLocation = getWorkerLocation(modal);
    const equity = +document.getElementById('equity').value;
    const data = {
      title,
      description,
      ownerId,
      companyId,
      contractType,
      salary,
      skillsIds,
      workerLocation,
      equity
      //positionId
    };
    checkJob(data);
      if (template.data.modalTemplate.data && template.data.modalTemplate.data.asideTemplateData && template.data.modalTemplate.data.asideTemplateData.jobId) {
          data._id = template.data.modalTemplate.data.asideTemplateData.jobId;
          editJob.call(data, (err, res) => {
              if (err) {
                  let message = err.reason || err.message;
                  VZ.notify(message);
              } else {
                  VZ.notify('Job  ' + title + '  successfully updated!');
                  $('.modal').modal('close');
                  Blaze.remove(template.view);
              }
          });
      } else {
          createJob.call(data, (err, res) => {
              if (err) {
                  let message = err.reason || err.message;
                  VZ.notify(message);
              } else {
                  VZ.notify('Job  ' + title + '  successfully created!');
                  $('.modal').modal('close');
                  Blaze.remove(template.view);
              }
          });
      }


  }, 1000)
});

function checkJob(job) {
  if(!job) {
    throw `job data is not defined: ${job}`;
  } else if(!job.companyId) {
    VZ.notify('company is required');
    throw 'company is required';
  } else if(!job.title) {
    VZ.notify('title is required');
    throw 'title is required';
  } else if(!job.contractType) {
    VZ.notify('contract type is required');
    throw 'contract type is required';
  } else if(!job.salary) {
    VZ.notify('salary is required');
    throw 'salary is required';
  } else if(job.salary && job.salary.monthlyRate && isNaN(job.salary.monthlyRate) === true) {
    VZ.notify('Salary rate must be valid number');
    throw 'salary rate must be valid number';
  } else if(job.salary && job.salary.monthlyRate && parseFloat(job.salary.monthlyRate) <= 0) {
    VZ.notify('salary rate must be positive number');
    throw 'salary rate must be positive number';
  } else if(job.salary && job.salary.hourlyRate && isNaN(job.salary.hourlyRate) === true) {
    VZ.notify('Salary rate must be valid number');
    throw 'salary rate must be valid number';
  } else if(job.salary && job.salary.hourlyRate && parseFloat(job.salary.hourlyRate) <= 0) {
    VZ.notify('salary rate must be positive number');
    throw 'salary rate must be positive number';
  } else if(job.salary && job.salary.contractPrice && isNaN(job.salary.contractPrice) === true) {
    VZ.notify('Salary rate must be valid number');
    throw 'salary rate must be valid number';
  } else if(job.salary && job.salary.contractPrice && parseFloat(job.salary.contractPrice) <= 0) {
    VZ.notify('salary rate must be positive number');
    throw 'salary rate must be positive number';
  } else if(!job.ownerId) {
    VZ.notify('owner is required');
    throw 'owner is required';
  } else if(!job.workerLocation) {
    VZ.notify('Worker location is required');
    throw 'worker location is required';
  } else if(job.equity && isNaN(parseFloat(job.equity)) === true) {
    VZ.notify('Equity must be a valid number');
    throw 'equity must be a valid number';
  } else if(job.equity && (job.equity < 0 || job.equity > 100)) {
    VZ.notify('equity must be float number between 0 and 90');
    throw 'equity must be float number between 0 and 90'
  }
}

function getContractType(template) {
  const contractTypeCheckedElements = Array.from(document.getElementsByName("contract-type")).filter(input => {
    return input.checked === true;
  });
  return contractTypeCheckedElements.length === 1 && contractTypeCheckedElements[0].value;
}

function getSalaryAccordingToType(template) {
  const currentSalaryType = template.currentSalaryTypeVar.get();
  if(currentSalaryType === 'Annual') {
    const salaryRangeElement = document.getElementById('annuallySalaryRange');
    const salaryRange = salaryRangeElement.noUiSlider.get();
    return {
      type: currentSalaryType,
      min: +salaryRange[0].replace('$',''),
      max: +salaryRange[1].replace('$','')
    }
  } else if(currentSalaryType === 'Monthly') {
    const monthlyRate = +parseFloat(document.getElementById('salaryMonthlyRate').value).toFixed(2);
    return {type: currentSalaryType, monthlyRate};
  } else if(currentSalaryType === 'Hourly') {
    const hourlyRate = +parseFloat(document.getElementById('salaryHourlyRate').value).toFixed(2);
    return {type: currentSalaryType, hourlyRate};
  } else if(currentSalaryType === 'Fixed-price') {
    const contractPrice = +parseFloat(document.getElementById('salaryFixedPrice').value).toFixed(2);
    return {type: currentSalaryType, contractPrice};
  } else if(currentSalaryType === 'Undisclosed') {
    return {type: currentSalaryType};
  }
}

function getSkillsIds(modal) {
  const skillsLabels = $('.chips').material_chip('data');
  return skillsLabels.map(label => {
    const skill = Skills.findOne({label: label.tag}, {fields: {_id: 1}});
    return skill && skill._id;
  });
}

function getWorkerLocation(template) {
  const workerLocationRestrictionCheckedElements = Array.from(document.getElementsByName("workerLocation")).filter(input => {
    return input.checked === true;
  });
  if(workerLocationRestrictionCheckedElements.length !== 1) {
    VZ.notify('worker location is required');
    throw 'worker location is required';
  }
  const isRestricted =  workerLocationRestrictionCheckedElements[0].value === 'restricted';
  if(isRestricted === true) {
    const continent = document.getElementById('continent').value;
    if(!continent) {
      VZ.notify('select continent');
      throw 'select continent';
    }
    const result = {
      isRestricted,
      continent
    };
    const notRestrictCountries = document.getElementById('notRestrictCountries').checked;
    if(notRestrictCountries === false) {
      const country = document.getElementById('country').value;
      if(!country) {
        VZ.notify('select country');
        throw 'select country';
      }
      return Object.assign(result, {country});
    } else {
      return result;
    }
  } else {
    return {isRestricted};
  }
}
