export const JobsChecker = Match.Where(function (jobDocument) {

    if (jobDocument.salary && jobDocument.salary.min >= jobDocument.salary.max) {
        throw new Meteor.Error('validationError', 'Min salary should be less than max value! <id>salary-min</id>');
    }
    //TODO need to check and rewrite
    //else if (jobDocument.salary.type && !jobDocument.salary.min && !jobDocument.salary.max && !jobDocument.salary.hourlyRate && !jobDocument.salary.montlyRate && !jobDocument.salary.contractPrice) {
    //    throw new Meteor.Error('validationError', 'Salary amount required');
    //}
    return true;
});
