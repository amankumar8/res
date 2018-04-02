import { Template } from 'meteor/templating';
import './annuallySalaryChooser.html'
import noUiSlider from 'nouislider';

Template.annuallySalaryChooser.onRendered(function() {
  const salaryData = Template.instance().data;
  const slider = this.find('#annuallySalaryRange');
  const minimalAnnuallySalary = 0;
  const maximumAnnuallySalary = 200000;
  const startSalaryLowerRange = (salaryData && salaryData.min) || 15000;
  const startSalaryUpperRange = (salaryData && salaryData.max) || 45000;
  noUiSlider.create(slider, {
    start: [startSalaryLowerRange, startSalaryUpperRange],
    connect: true,
    step: 100,
    tooltips: true,
    pips: {
      mode: 'range',
      density: 10
    },
    range: {
      min: minimalAnnuallySalary,
      max: maximumAnnuallySalary
    },
    format: wNumb({
      prefix: '$',
      decimals: 0
    })
  });
});
