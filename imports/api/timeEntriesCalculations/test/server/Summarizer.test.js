import moment from 'moment';
import StubCollections from 'meteor/hwillson:stub-collections';
import { expect } from '../testSetup';
import summarizer from '../../server/Summarizer';
import { TimeEntries } from '../../../timeEntries/timeEntries.js';
import { Projects } from '../../../projects/projects.js';
import { Tasks } from '../../../tasks/tasks.js';
import { Contracts } from '../../../contracts/contracts.js';
import { oneHour } from '../../server/helpers/index';

const epsilon = 0.000001;

describe('Summarizer class', function() {
  this.timeout(5000);
  beforeEach(function () {
    StubCollections.add([Meteor.users, Projects, Tasks, Contracts, TimeEntries]);
    StubCollections.stub();
  });

  describe('calculateActualState method', function () {
    beforeEach(function () {
      Meteor.users.insert({ _id: '1', profile: { isArchived: false, isBlocked: false } });
      Meteor.users.insert({ _id: '9', profile: { isArchived: false, isBlocked: false } });
      Projects.insert({ _id: '2', assignedUsersIds: ['1', '9'] });
      Tasks.insert({ _id: '3', projectId: '2', membersIds: ['1', '9'] });
      Tasks.insert({ _id: '6', projectId: '2', membersIds: ['1'] });
      Contracts.insert({ _id: '4', workerId: '1', projectIds: ['2'] });
      Contracts.insert({ _id: '10', workerId: '9', projectIds: ['2'] });
      TimeEntries.insert({
        _id: '5',
        userId: '1',
        projectId: '2',
        taskId: '3',
        contractId: '4',
        startDate: 0,
        endDate: oneHour,
        paymentType: 'hourly',
        paymentRate: 5,
        _isActive: false,
        _done: true
      });
      TimeEntries.insert({
        _id: '8',
        userId: '9',
        projectId: '2',
        taskId: '3',
        contractId: '10',
        startDate: oneHour,
        endDate:  3 * oneHour,
        paymentType: 'hourly',
        paymentRate: 5,
        _isActive: false,
        _done: true
      });
      TimeEntries.insert({
        _id: '7',
        userId: '1',
        projectId: '2',
        taskId: '6',
        contractId: '4',
        startDate: 3 * oneHour,
        endDate: 6 * oneHour,
        paymentType: 'hourly',
        paymentRate: 8,
        _isActive: false,
        _done: true
      });
      summarizer.calculateActualState();
    });

    it('should set userIds property to be not empty array', function () {
      expect(summarizer.userIds).to.be.an('array').that.is.not.empty;
    });

    it('should update contract with trackingInfo property', function () {
      const contract = Contracts.findOne({});

      expect(contract.trackingInfo).to.not.be.undefined;
    });

    it('should update project with trackingInfo property', function () {
      const project = Projects.findOne({});

      expect(project.trackingInfo).to.not.be.undefined;
    });

    it('should update task with trackingInfo property', function () {
      const task = Tasks.findOne({});

      expect(task.trackingInfo).to.not.be.undefined;
    });

    it('should calculate project tracked time in contract', function () {
      const contract = Contracts.findOne({ _id: '4' });
      const tracked = contract.trackingInfo.allTime[0].tracked;

      expect(tracked).to.be.a('number').that.is.equal(4 * oneHour);
    });

    it('should calculate project earned amount in contract', function () {
      const contract = Contracts.findOne({ _id: '4' });
      const earned = contract.trackingInfo.allTime[0].earned;

      expect(earned).to.be.a('number').that.is.equal(29);
    });

    it('should calculate allUsers time in project', function () {
      const project = Projects.findOne({});
      const trackedAllUsersAllTime = project.trackingInfo.allUsers.allTime.tracked;

      expect(trackedAllUsersAllTime).to.be.a('number').that.is.equal(6 * oneHour);
    });

    it('should calculate allUsers earned amount in project', function () {
      const project = Projects.findOne({});
      const earnedAllUsersAllTime = project.trackingInfo.allUsers.allTime.earned;

      expect(earnedAllUsersAllTime).to.be.a('number').that.is.equal(39);
    });

    it('should calculate individual time in project', function () {
      const project = Projects.findOne({});
      const firstUserInfo = project.trackingInfo.individual.find(track => track.userId === '1');
      const trackedUserAllTime = firstUserInfo.allTime.tracked;

      expect(trackedUserAllTime).to.be.a('number').that.is.equal(4 * oneHour);
    });

    it('should calculate individual earned amount in project', function () {
      const project = Projects.findOne({});
      const firstUserInfo = project.trackingInfo.individual.find(track => track.userId === '1');
      const earnedUserAllTime = firstUserInfo.allTime.earned;

      expect(earnedUserAllTime).to.be.a('number').that.is.equal(29);
    });

    it('should calculate allUsers time in task', function () {
      const task = Tasks.findOne({ _id: '3'});
      const trackedAllUsersAllTime = task.trackingInfo.allUsers.allTime.tracked;

      expect(trackedAllUsersAllTime).to.be.a('number').that.is.equal(3 * oneHour);
    });

    it('should calculate allUsers earned amount in task', function () {
      const task = Tasks.findOne({ _id: '3' });
      const earnedAllUsersAllTime = task.trackingInfo.allUsers.allTime.earned;

      expect(earnedAllUsersAllTime).to.be.a('number').that.is.equal(15);
    });

    it('should calculate individual time in task', function () {
      const task = Tasks.findOne({ _id: '3' });
      const firstUserInfo = task.trackingInfo.individual.find(track => track.userId === '1');
      const trackedUserAllTime = firstUserInfo.allTime.tracked;

      expect(trackedUserAllTime).to.be.a('number').that.is.equal(1 * oneHour);
    });

    it('should calculate individual earned amount in task', function () {
      const task = Tasks.findOne({ _id: '3' });
      const firstUserInfo = task.trackingInfo.individual.find(track => track.userId === '1');
      const earnedUserAllTime = firstUserInfo.allTime.earned;

      expect(earnedUserAllTime).to.be.a('number').that.is.equal(5);
    });

    afterEach(function () {
      Meteor.users.remove({});
      Projects.remove({});
      Tasks.remove({});
      Contracts.remove({});
      TimeEntries.remove({});
    });
  });

  describe('_calculateForAll method', function () {
    beforeEach(function () {
      Projects.insert({ _id: '1' });
      Projects.insert({ _id: '2' });
      Tasks.insert({ _id: '3', projectId: '1' });
      Tasks.insert({ _id: '4', projectId: '2' });
      TimeEntries.insert({
        _id: '2',
        projectId: '1',
        taskId: '3',
        startDate: 0,
        endDate: 3 * oneHour,
        paymentType: 'hourly',
        paymentRate: 5,
        _isActive: false,
        _done: true
      });
      TimeEntries.insert({
        _id: '3',
        projectId: '2',
        taskId: '4',
        startDate: 3 * oneHour,
        endDate: 4 * oneHour,
        paymentType: 'hourly',
        paymentRate: 10,
        _isActive: false,
        _done: true
      });
    });

    it('should return allUsers time in projects', function () {
      const { projectsAllTracking } = summarizer._calculateForAll();
      const firstProjectTrack = projectsAllTracking.allTime.find(track => track.projectId === '1');
      const trackedAllUsersAllTime = firstProjectTrack.tracked;

      expect(trackedAllUsersAllTime).to.be.a('number').that.is.equal(3 * oneHour);
    });

    it('should return allUsers earned amount in projects', function () {
      const { projectsAllTracking } = summarizer._calculateForAll();
      const secondProjectTrack = projectsAllTracking.allTime.find(track => track.projectId === '2');
      const earnedAllUsersAllTime = secondProjectTrack.earned;

      expect(earnedAllUsersAllTime).to.be.a('number').that.is.equal(10);
    });

    it('should return allUsers time in tasks', function () {
      const { tasksAllTracking } = summarizer._calculateForAll();
      const secondTaskTrack = tasksAllTracking.allTime.find(track => track.taskId === '4');
      const trackedAllUsersAllTime = secondTaskTrack.tracked;

      expect(trackedAllUsersAllTime).to.be.a('number').that.is.equal(oneHour);
    });

    it('should return allUsers earned amount in task', function () {
      const { tasksAllTracking } = summarizer._calculateForAll();
      const firstTaskTrack = tasksAllTracking.allTime.find(track => track.taskId === '3');
      const earnedAllUsersAllTime = firstTaskTrack.earned;

      expect(earnedAllUsersAllTime).to.be.a('number').that.is.equal(15);
    });

    afterEach(function () {
      Projects.remove({});
      Tasks.remove({});
      TimeEntries.remove({});
    });
  });

  describe('_calculateForEach method', function () {
    beforeEach(function () {
      Meteor.users.insert({ _id: '1' });
      Meteor.users.insert({ _id: '2' });
      Projects.insert({ _id: '3', assignedUsersIds: ['1'] });
      Projects.insert({ _id: '4', assignedUsersIds: ['1', '2'] });
      Tasks.insert({ _id: '5', projectId: '3', membersIds: ['1'] });
      Tasks.insert({ _id: '6', projectId: '4', membersIds: ['1'] });
      Tasks.insert({ _id: '7', projectId: '4', membersIds: ['2'] });
      TimeEntries.insert({
        _id: '8',
        projectId: '3',
        taskId: '5',
        userId: '1',
        startDate: 0,
        endDate: oneHour,
        paymentType: 'hourly',
        paymentRate: 5,
        _isActive: false,
        _done: true
      });
      TimeEntries.insert({
        _id: '9',
        projectId: '4',
        taskId: '6',
        userId: '1',
        startDate: oneHour,
        endDate: 2 * oneHour,
        paymentType: 'hourly',
        paymentRate: 5,
        _isActive: false,
        _done: true
      });
      TimeEntries.insert({
        _id: '10',
        projectId: '4',
        taskId: '7',
        userId: '2',
        startDate: 4 * oneHour,
        endDate: 6 * oneHour,
        paymentType: 'hourly',
        paymentRate: 8,
        _isActive: false,
        _done: true
      });
      TimeEntries.insert({
        _id: '11',
        projectId: '4',
        taskId: '7',
        userId: '2',
        startDate: 10 * oneHour,
        endDate: 15 * oneHour,
        paymentType: 'hourly',
        paymentRate: 12,
        _isActive: false,
        _done: true
      });

      summarizer.userIds = ['1', '2'];
    });

    it('should return user time in projects', function () {
      const { projectsTracking } = summarizer._calculateForEach().find(track => track.userId === '1');
      const trackedUserAllTimeFirstProject = projectsTracking.allTime.find(track => track.projectId === '3');
      const trackedUserProject = trackedUserAllTimeFirstProject.tracked;

      expect(trackedUserProject).to.be.a('number').that.is.equal(oneHour);
    });

    it('should return user earned amount in projects', function () {
      const { projectsTracking } = summarizer._calculateForEach().find(track => track.userId === '2');
      const trackedUserAllTimeSecondProject = projectsTracking.allTime.find(track => track.projectId === '4');
      const earnedUserProject = trackedUserAllTimeSecondProject.earned;

      expect(earnedUserProject).to.be.a('number').that.is.equal(76);
    });

    it('should return user time in tasks', function () {
      const { tasksTracking } = summarizer._calculateForEach().find(track => track.userId === '1');
      const trackedUserAllTimeSecondTask = tasksTracking.allTime.find(track => track.taskId === '6');
      const trackedUserTask = trackedUserAllTimeSecondTask.tracked;

      expect(trackedUserTask).to.be.a('number').that.is.equal(oneHour);
    });

    it('should return user earned amount in tasks', function () {
      const { tasksTracking } = summarizer._calculateForEach().find(track => track.userId === '2');
      const trackedUserAllTimeThirdTask = tasksTracking.allTime.find(track => track.taskId === '7');
      const earnedUserTask = trackedUserAllTimeThirdTask.earned;

      expect(earnedUserTask).to.be.a('number').that.is.equal(76);
    });

    afterEach(function () {
      Meteor.users.remove({});
      Projects.remove({});
      Tasks.remove({});
      TimeEntries.remove({});
    });
  });

  describe('_saveInProjects method', function () {
    beforeEach(function () {
      Projects.insert({ _id: '1', assignedUsersIds: ['3'] });
      Projects.insert({ _id: '2', assignedUsersIds: ['3', '4'] });
      const allTracks = {
        projectsAllTracking: {
          allTime: [
            { projectId: '1', tracked: oneHour, earned: 5 },
            { projectId: '2', tracked: 4 * oneHour, earned: 20 }
          ]
        }
      };
      const individualTracks = [
        {
          userId: '3',
          projectsTracking: {
            userId: '3',
            allTime: [
              { projectId: '1', tracked: oneHour, earned: 5 },
              { projectId: '2', tracked: oneHour, earned: 5 }
            ]
          }
        },
        {
          userId: '4',
          projectsTracking: {
            userId: '4',
            allTime: [
              { projectId: '2', tracked: 3 * oneHour, earned: 15 }
            ]
          }
        }
      ];
      summarizer._saveInProjects(allTracks, individualTracks);
    });

    it('should save allUsers time in projects', function () {
      const firstProject = Projects.findOne({ _id: '1' });
      const trackedAllUsers = firstProject.trackingInfo.allUsers.allTime.tracked;

      expect(trackedAllUsers).to.be.a('number').that.is.equal(oneHour);
    });

    it('should save allUsers earned amount in projects', function () {
      const secondProject = Projects.findOne({ _id: '2' });
      const earnedAllUsers = secondProject.trackingInfo.allUsers.allTime.earned;

      expect(earnedAllUsers).to.be.a('number').that.is.equal(20);
    });

    it('should save individual time in projects', function () {
      const firstProject = Projects.findOne({ _id: '1' });
      const trackedFirstUser = firstProject.trackingInfo.individual.find(track => track.userId === '3');
      const trackedUserProject = trackedFirstUser.allTime.tracked;

      expect(trackedUserProject).to.be.a('number').that.is.equal(oneHour);
    });

    it('should save individual earned amount in projects', function () {
      const secondProject = Projects.findOne({ _id: '2' });
      const trackedSecondUser = secondProject.trackingInfo.individual.find(track => track.userId === '4');
      const earnedUserProject = trackedSecondUser.allTime.earned;

      expect(earnedUserProject).to.be.a('number').that.is.equal(15);
    });

    afterEach(function () {
      Projects.remove({});
    });
  });

  describe('_saveInTasks method', function () {
    beforeEach(function () {
      Tasks.insert({ _id: '1' });
      Tasks.insert({ _id: '2' });
      const allTracks = {
        tasksAllTracking: {
          allTime: [
            { taskId: '1', tracked: 5 * oneHour, earned: 15 },
            { taskId: '2', tracked: 7 * oneHour, earned: 70 }
          ]
        }
      };
      const individualTracks = [
        {
          userId: '3',
          tasksTracking: {
            userId: '3',
            allTime: [
              { taskId: '1', tracked: 3 * oneHour, earned: 9 },
              { taskId: '2', tracked: 4 * oneHour, earned: 40 }
            ]
          }
        },
        {
          userId: '4',
          tasksTracking: {
            userId: '4',
            allTime: [
              { taskId: '1', trakced: 2 * oneHour, earned: 6 },
              { taskId: '2', tracked: 3 * oneHour, earned: 30 }
            ]
          }
        }
      ];
      summarizer._saveInTasks(allTracks, individualTracks);
    });

    it('should save allUsers time in tasks', function () {
      const firstTask = Tasks.findOne({ _id: '1' });
      const trackedAllUsers = firstTask.trackingInfo.allUsers.allTime.tracked;

      expect(trackedAllUsers).to.be.a('number').that.is.equal(5 * oneHour);
    });

    it('should save allUsers earned amount in tasks', function () {
      const secondTask = Tasks.findOne({ _id: '2' });
      const earnedAllUsers = secondTask.trackingInfo.allUsers.allTime.earned;

      expect(earnedAllUsers).to.be.a('number').that.is.equal(70);
    });

    it('should save individual time in tasks', function () {
      const firstTask = Tasks.findOne({ _id: '1' });
      const trackedFirstUserTask = firstTask.trackingInfo.individual.find(track => track.userId === '3');
      const trackedUserTask = trackedFirstUserTask.allTime.tracked;

      expect(trackedUserTask).to.be.a('number').that.is.equal(3 * oneHour);
    });

    it('should save individual earned amount in tasks', function () {
      const secondTask = Tasks.findOne({ _id: '2' });
      const trackedSecondUserTask = secondTask.trackingInfo.individual.find(track => track.userId === '4');
      const earnedUserTask = trackedSecondUserTask.allTime.earned;

      expect(earnedUserTask).to.be.a('number').that.is.equal(30);
    });

    afterEach(function () {
      Tasks.remove({});
    });
  });

  describe('_saveInContracts method', function () {
    beforeEach(function () {
      Contracts.insert({ _id: '1', workerId: '2', projectIds: ['3', '4'] });
      Contracts.insert({ _id: '5', workerId: '6', projectIds: ['4'] });
      const individualTracks = [
        {
          userId: '2',
          projectsTracking: {
            userId: '2',
            allTime: [
              { projectId: '3', tracked: 10 * oneHour, earned: 50 },
              { projectId: '4', tracked: 4 * oneHour, earned: 40 }
            ],
            thisMonth: [],
            thisWeek: []
          }
        },
        {
          userId: '6',
          projectsTracking: {
            userId: '6',
            allTime: [
              { projectId: '4', tracked: 25 * oneHour, earned: 125 }
            ],
            thisMonth: [],
            thisWeek: []
          }
        }
      ];
      summarizer.userIds = ['2', '6'];
      summarizer._saveInContracts(individualTracks);
    });

    it('should save individual user time for projects in contracts', function () {
      const firstContract = Contracts.findOne({ _id: '1' });
      const trackedContractProject = firstContract.trackingInfo.allTime.find(track => track.projectId === '3');
      const trackedContract = trackedContractProject.tracked;

      expect(trackedContract).to.be.a('number').that.is.equal(10 * oneHour);
    });

    it('should save individual user earned amount for projects in contracts', function () {
      const secondContract = Contracts.findOne({ _id: '5' });
      const trackedContractProject = secondContract.trackingInfo.allTime.find(track => track.projectId === '4');
      const earnedContract = trackedContractProject.earned;

      expect(earnedContract).to.be.a('number').that.is.equal(125);
    });

    afterEach(function () {
      Contracts.remove({});
    });
  });

  describe('_calculateTrackingProjectsAll', function () {
    const firstProjectAllTimeTE = {
      _id: '4',
      projectId: '1',
      startDate: 0,
      endDate: 4 * oneHour,
      paymentType: 'hourly',
      paymentRate: 5,
      _isActive: false,
      _done: true
    };
    const firstProjectLastMonthTE = {
      _id: '5',
      projectId: '1',
      startDate: moment().subtract('1', 'month').startOf('month').toDate(),
      endDate: moment().subtract('1', 'month').startOf('month').add(5,'hour').toDate(),
      paymentType: 'hourly',
      paymentRate: 5,
      _isActive: false,
      _done: true
    };
    const secondProjectThisMonthTE = {
      _id: '6',
      projectId: '2',
      startDate:  moment().startOf('month').toDate(),
      endDate: moment().startOf('month').add(8, 'hours').toDate(),
      paymentType: 'hourly',
      paymentRate: 10,
      _isActive: false,
      _done: true
    };
    const secondProjectLastWeekTE = {
      _id: '7',
      projectId: '2',
      startDate:  moment().subtract(1, 'week').startOf('isoweek').toDate(),
      endDate: moment().subtract(1, 'week').startOf('isoweek').add(4, 'hours').toDate(),
      paymentType: 'hourly',
      paymentRate: 10,
      _isActive: false,
      _done: true
    };
    const firstProjectThisWeekTE = {
      _id: '8',
      projectId: '1',
      startDate:  moment().startOf('isoweek').toDate(),
      endDate: moment().startOf('isoweek').add(7, 'hours').toDate(),
      paymentType: 'hourly',
      paymentRate: 10,
      _isActive: false,
      _done: true
    };
    const firstProjectYesterdayTE = {
      _id: '9',
      projectId: '1',
      startDate:  moment().subtract(1, 'day').startOf('day').toDate(),
      endDate: moment().subtract(1, 'day').startOf('day').add(6, 'hours').toDate(),
      paymentType: 'hourly',
      paymentRate: 10,
      _isActive: false,
      _done: true
    };
    const secondProjectTodayTE = {
      _id: '10',
      projectId: '2',
      startDate:  moment().startOf('day').toDate(),
      endDate: moment().startOf('day').add(5, 'hours').toDate(),
      paymentType: 'hourly',
      paymentRate: 10,
      _isActive: false,
      _done: true
    };
    beforeEach(function () {
      Projects.insert({ _id: '1' });
      Projects.insert({ _id: '2' });
      Projects.insert({ _id: '3' });
     summarizer.itemIds = ['1', '2', '3'];
     summarizer.itemIdFieldName = 'projectId';
    });

    it('should add project, which tracked zero time, to excludedProjects', function () {
      TimeEntries.insert(firstProjectAllTimeTE);
      TimeEntries.insert(secondProjectThisMonthTE);
      summarizer._calculateTrackingProjectsAll();

      expect(summarizer.excludedProjects.includes('3')).to.be.true;
      expect(summarizer.excludedProjects.length).to.be.equal(1);
    });

    it('should calculate project time for allTime', function () {
      TimeEntries.insert(firstProjectAllTimeTE);
      const projectsTracks = summarizer._calculateTrackingProjectsAll();
      const firstProjectTrack = projectsTracks.allTime.find(track => track.projectId === '1');
      const trackedProject = firstProjectTrack.tracked;

      expect(trackedProject).to.be.a('number').that.is.equal(4 * oneHour);
    });

    it('should calculate project earned amount for allTime', function () {
      TimeEntries.insert(secondProjectThisMonthTE);
      const projectTracks = summarizer._calculateTrackingProjectsAll();
      const secondProjectTrack = projectTracks.allTime.find(track => track.projectId === '2');
      const earnedProject = secondProjectTrack.earned;

      expect(earnedProject).to.be.a('number').that.is.equal(80);
    });

    it('should calculate project time for lastMonth', function () {
      TimeEntries.insert(firstProjectLastMonthTE);
      const projectTracks = summarizer._calculateTrackingProjectsAll();
      const firstProjectTrack = projectTracks.lastMonth.find(track => track.projectId === '1');
      const trackedProject = firstProjectTrack.tracked;

      expect(trackedProject).to.be.a('number').that.is.equal(5 * oneHour);
    });

    it('should calculate project earned amount for lastMonth', function () {
      TimeEntries.insert(firstProjectLastMonthTE);
      const projectTracks = summarizer._calculateTrackingProjectsAll();
      const firstProjectTrack = projectTracks.lastMonth.find(track => track.projectId === '1');
      const earnedProject = firstProjectTrack.earned;

      expect(earnedProject).to.be.a('number').that.is.equal(25);
    });

    it('should calculate project time for thisMonth', function () {
      TimeEntries.insert(secondProjectThisMonthTE);
      const projectTracks = summarizer._calculateTrackingProjectsAll();
      const secondProjectTrack = projectTracks.thisMonth.find(track => track.projectId === '2');
      const trackedProject = secondProjectTrack.tracked;

      expect(trackedProject).to.be.a('number').that.is.equal(8 * oneHour);
    });

    it('should calculate project earned amount for thisMonth', function () {
      TimeEntries.insert(secondProjectThisMonthTE);
      const projectTracks = summarizer._calculateTrackingProjectsAll();
      const secondProjectTrack = projectTracks.thisMonth.find(track => track.projectId === '2');
      const earhedProject = secondProjectTrack.earned;

      expect(earhedProject).to.be.a('number').that.is.equal(80);
    });

    it('should calculate project time for lastWeek', function () {
      TimeEntries.insert(secondProjectLastWeekTE);
      const projectTracks = summarizer._calculateTrackingProjectsAll();
      const secondProjectTrack = projectTracks.lastWeek.find(track => track.projectId === '2');
      const trackedProject = secondProjectTrack.tracked;

      expect(trackedProject).to.be.a('number').that.is.equal(4 * oneHour);
    });

    it('should calculate project earned amount for lastWeek', function () {
      TimeEntries.insert(secondProjectLastWeekTE);
      const projectTracks = summarizer._calculateTrackingProjectsAll();
      const secondProjectTrack = projectTracks.lastWeek.find(track => track.projectId === '2');
      const earnedProject = secondProjectTrack.earned;

      expect(earnedProject).to.be.a('number').that.is.equal(40);
    });

    it('should calculate project time for thisWeek', function () {
      TimeEntries.insert(firstProjectThisWeekTE);
      const projectTracks = summarizer._calculateTrackingProjectsAll();
      const firstProjectTrack = projectTracks.thisWeek.find(track => track.projectId === '1');
      const trackedProject = firstProjectTrack.tracked;

      expect(trackedProject).to.be.a('number').that.is.equal(7 * oneHour);
    });

    it('should calculate project earned amount for thisWeek', function () {
      TimeEntries.insert(firstProjectThisWeekTE);
      const projectTracks = summarizer._calculateTrackingProjectsAll();
      const firstProjectTrack = projectTracks.thisWeek.find(track => track.projectId === '1');
      const earnedProject = firstProjectTrack.earned;

      expect(earnedProject).to.be.a('number').that.is.equal(70);
    });

    it('should calculate project time for yesterday', function () {
      TimeEntries.insert(firstProjectYesterdayTE);
      const projectTracks = summarizer._calculateTrackingProjectsAll();
      const firstProjectTrack = projectTracks.yesterday.find(track => track.projectId === '1');
      const trackedProject = firstProjectTrack.tracked;

      expect(trackedProject).to.be.a('number').that.is.equal(6 * oneHour);
    });

    it('should calculate project earned amount for yesterday', function () {
      TimeEntries.insert(firstProjectYesterdayTE);
      const projectTracks = summarizer._calculateTrackingProjectsAll();
      const firstProjectTrack = projectTracks.yesterday.find(track => track.projectId === '1');
      const earnedProject = firstProjectTrack.earned;

      expect(earnedProject).to.be.a('number').that.is.equal(60);
    });

    it('should calculate project time for today', function () {
      TimeEntries.insert(secondProjectTodayTE);
      const projectTracks = summarizer._calculateTrackingProjectsAll();
      const secondProjectTrack = projectTracks.today.find(track => track.projectId === '2');
      const trackedProject = secondProjectTrack.tracked;

      expect(trackedProject).to.be.a('number').that.is.equal(5 * oneHour);
    });

    it('should calculate project eared amount for today', function () {
      TimeEntries.insert(secondProjectTodayTE);
      const projectTracks = summarizer._calculateTrackingProjectsAll();
      const secondProjectTrack = projectTracks.today.find(track => track.projectId === '2');
      const earnedProject = secondProjectTrack.earned;

      expect(earnedProject).to.be.a('number').that.is.equal(50);
    });

    afterEach(function () {
      Projects.remove({});
      TimeEntries.remove({});
      summarizer.itemIds = [];
      summarizer.itemIdFieldName = '';
      summarizer.excludedProjects = [];
    });
  });

  describe('_calculateTrackingTasksAll method', function () {
    const firstTaskAllTimeTE = {
      _id: '3',
      taskId: '1',
      startDate: 0,
      endDate: 9 * oneHour,
      paymentType: 'hourly',
      paymentRate: 5,
      _isActive: false,
      _done: true
    };
    const firstTaskLastMonthTE = {
      _id: '4',
      taskId: '1',
      startDate: moment().subtract(1, 'month').startOf('month').toDate(),
      endDate: moment().subtract(1, 'month').startOf('month').add(6, 'hour').toDate(),
      paymentType: 'hourly',
      paymentRate: 8,
      _isActive: false,
      _done: true
    };
    const secondTaskThisMonthTE = {
      _id: '5',
      taskId: '2',
      startDate: moment().startOf('month').toDate(),
      endDate: moment().startOf('month').add(8, 'hour').toDate(),
      paymentType: 'hourly',
      paymentRate: 6,
      _isActive: false,
      _done: true
    };
    const firstTaskLastWeekTE = {
      _id: '6',
      taskId: '1',
      startDate: moment().subtract(1, 'week').startOf('isoweek').toDate(),
      endDate: moment().subtract(1, 'week').startOf('isoweek').add(5, 'hour').toDate(),
      paymentType: 'hourly',
      paymentRate: 12,
      _isActive: false,
      _done: true
    };
    const secondTaskThisWeekTE = {
      _id: '7',
      taskId: '2',
      startDate: moment().startOf('isoweek').toDate(),
      endDate: moment().startOf('isoweek').add(8, 'hour').toDate(),
      paymentType: 'hourly',
      paymentRate: 10,
      _isActive: false,
      _done: true
    };
    const secondTaskYesterdayTE = {
      _id: '8',
      taskId :'2',
      startDate: moment().subtract(1, 'day').startOf('day').toDate(),
      endDate: moment().subtract(1, 'day').startOf('day').add(3, 'hour').toDate(),
      paymentType: 'hourly',
      paymentRate: 6,
      _isActive: false,
      _done: true
    };
    const firstTaskTodayTE = {
      _id: '9',
      taskId: '1',
      startDate: moment().startOf('day').toDate(),
      endDate: moment().startOf('day').add(5, 'hour').toDate(),
      paymentType: 'hourly',
      paymentRate: 3,
      _isActive: false,
      _done: true
    };
    beforeEach(function () {
      Tasks.insert({ _id: '1' });
      Tasks.insert({ _id: '2' });
      Tasks.insert({ _id: '10' });
      summarizer.itemIds = ['1', '2', '10'];
      summarizer.itemIdFieldName = 'taskId';
    });

    it('should add task with no tracked time to excludedTasks', function () {
      TimeEntries.insert(firstTaskAllTimeTE);
      TimeEntries.insert(secondTaskThisMonthTE);
      summarizer._calculateTrackingTasksAll();

      expect(summarizer.excludedTasks.includes('10')).to.be.true;
      expect(summarizer.excludedTasks.length).to.be.equal(1);
    });

    it('should calculate tasks time for allTime', function () {
      TimeEntries.insert(firstTaskAllTimeTE);
      const taskTracks = summarizer._calculateTrackingTasksAll();
      const firstTaskTrack = taskTracks.allTime.find(track => track.taskId === '1');
      const trackedTask = firstTaskTrack.tracked;

      expect(trackedTask).to.be.a('number').that.is.equal(9 * oneHour);
    });

    it('should calculate tasks earned amount for allTime', function () {
      TimeEntries.insert(secondTaskThisMonthTE);
      const taskTracks = summarizer._calculateTrackingTasksAll();
      const secondTaskTrack = taskTracks.allTime.find(track => track.taskId === '2');
      const earnedTask = secondTaskTrack.earned;

      expect(earnedTask).to.be.a('number').that.is.equal(48);
    });

    it('should calculate tasks time for lastMonth', function () {
      TimeEntries.insert(firstTaskLastMonthTE);
      const taskTracks = summarizer._calculateTrackingTasksAll();
      const firstTaskTrack = taskTracks.lastMonth.find(track => track.taskId === '1');
      const trackedTask = firstTaskTrack.tracked;

      expect(trackedTask).to.be.a('number').that.is.equal(6 * oneHour);
    });

    it('should calculate tasks earned amount for lastMonth', function () {
      TimeEntries.insert(firstTaskLastMonthTE);
      const taskTracks = summarizer._calculateTrackingTasksAll();
      const firstTaskTrack = taskTracks.lastMonth.find(track => track.taskId === '1');
      const earnedTask = firstTaskTrack.earned;

      expect(earnedTask).to.be.a('number').that.is.equal(48);
    });

    it('should calculate tasks time for thisMonth', function () {
      TimeEntries.insert(secondTaskThisMonthTE);
      const taskTracks = summarizer._calculateTrackingTasksAll();
      const secondTaskTrack = taskTracks.thisMonth.find(track => track.taskId === '2');
      const trackedTask = secondTaskTrack.tracked;

      expect(trackedTask).to.be.a('number').that.is.equal(8 * oneHour);
    });

    it('should calculate tasks earned amount for thisMonth', function () {
      TimeEntries.insert(secondTaskThisMonthTE);
      const taskTracks = summarizer._calculateTrackingTasksAll();
      const secondTaskTrack = taskTracks.thisMonth.find(track => track.taskId === '2');
      const earnedTask = secondTaskTrack.earned;

      expect(earnedTask).to.be.a('number').that.is.equal(48);
    });

    it('should calculate tasks time for lastWeek', function () {
      TimeEntries.insert(firstTaskLastWeekTE);
      const taskTracks = summarizer._calculateTrackingTasksAll();
      const firstTaskTrack = taskTracks.lastWeek.find(track => track.taskId === '1');
      const trackedTask = firstTaskTrack.tracked;

      expect(trackedTask).to.be.a('number').that.is.equal(5 * oneHour);
    });

    it('should calculate tasks earned amount for lastWeek', function () {
      TimeEntries.insert(firstTaskLastWeekTE);
      const taskTracks = summarizer._calculateTrackingTasksAll();
      const firstTaskTrack = taskTracks.lastWeek.find(track => track.taskId === '1');
      const earnedTask = firstTaskTrack.earned;

      expect(earnedTask).to.be.a('number').that.is.equal(60);
    });

    it('should calculate tasks time for thisWeek', function () {
      TimeEntries.insert(secondTaskThisWeekTE);
      const taskTracks = summarizer._calculateTrackingTasksAll();
      const secondTaskTrack = taskTracks.thisWeek.find(track => track.taskId === '2');
      const trackedTask = secondTaskTrack.tracked;

      expect(trackedTask).to.be.a('number').that.is.equal(8 * oneHour);
    });

    it('should calculate tasks earned amount for thisWeek', function () {
      TimeEntries.insert(secondTaskThisWeekTE);
      const taskTracks = summarizer._calculateTrackingTasksAll();
      const secondTaskTrack = taskTracks.thisWeek.find(track => track.taskId === '2');
      const earnedTask = secondTaskTrack.earned;

      expect(earnedTask).to.be.a('number').that.is.equal(80);
    });

    it('should calculte tasks time for yesterday', function () {
      TimeEntries.insert(secondTaskYesterdayTE);
      const taskTracks = summarizer._calculateTrackingTasksAll();
      const secondTaskTrack = taskTracks.yesterday.find(track => track.taskId === '2');
      const trackedTask = secondTaskTrack.tracked;

      expect(trackedTask).to.be.a('number').that.is.equal(3 * oneHour);
    });

    it('should calculate tasks earned amount for yesterday', function () {
      TimeEntries.insert(secondTaskYesterdayTE);
      const taskTracks = summarizer._calculateTrackingTasksAll();
      const secondTaskTrack = taskTracks.yesterday.find(track => track.taskId === '2');
      const earnedTask = secondTaskTrack.earned;

      expect(earnedTask).to.be.a('number').that.is.equal(18);
    });

    it('should calculate tasks time for today', function () {
      TimeEntries.insert(firstTaskTodayTE);
      const taskTracks = summarizer._calculateTrackingTasksAll();
      const firstTaskTrack = taskTracks.today.find(track => track.taskId === '1');
      const trackedTask = firstTaskTrack.tracked;

      expect(trackedTask).to.be.a('number').that.is.equal(5 * oneHour);
    });

    it('should calculate tasks earned amount for today', function () {
      TimeEntries.insert(firstTaskTodayTE);
      const taskTracks = summarizer._calculateTrackingTasksAll();
      const firstTaskTrack = taskTracks.today.find(track => track.taskId === '1');
      const earnedTask = firstTaskTrack.earned;

      expect(earnedTask).to.be.a('number').that.is.equal(15);
    });

    afterEach(function () {
      Tasks.remove({});
      TimeEntries.remove({});
      summarizer.itemIds = [];
      summarizer.itemIdFieldName = '';
      summarizer.excludedTasks = [];
    });
  });

  describe('_calculateTrackingProjects method', function () {
    const firstProjectAllTimeTE = {
      _id: '4',
      projectId: '1',
      userId: '11',
      startDate: 0,
      endDate: 12 * oneHour,
      paymentType: 'hourly',
      paymentRate: 12,
      _isActive: false,
      _done: true
    };
    const secondProjectLastMonthTE = {
      _id: '5',
      projectId: '2',
      userId: '11',
      startDate: moment().subtract(1, 'month').startOf('month').toDate(),
      endDate: moment().subtract(1, 'month').startOf('month').add(8, 'hour').toDate(),
      paymentType: 'hourly',
      paymentRate: 10,
      _isActive: false,
      _done: true
    };
    const secondProjectThisMonthTE = {
      _id: '6',
      projectId: '2',
      userId: '11',
      startDate: moment().startOf('month').toDate(),
      endDate: moment().startOf('month').add(10, 'hour').toDate(),
      paymentType: 'hourly',
      paymentRate: 5,
      _isActive: false,
      _done: true
    };
    const firstProjectLastWeekTE = {
      _id: '7',
      projectId: '1',
      userId: '11',
      startDate: moment().subtract(1, 'week').startOf('isoweek').toDate(),
      endDate: moment().subtract(1, 'week').startOf('isoweek').add(5, 'hour').toDate(),
      paymentType: 'hourly',
      paymentRate: 8,
      _isActive: false,
      _done: true
    };
    const secondProjectThisWeekTE = {
      _id: '8',
      projectId: '2',
      userId: '11',
      startDate: moment().startOf('isoweek').toDate(),
      endDate: moment().startOf('isoweek').add(7, 'hour').toDate(),
      paymentType: 'hourly',
      paymentRate: 12,
      _isActive: false,
      _done: true
    };
    const firstProjectYesterdayTE = {
      _id: '9',
      projectId: '1',
      userId: '11',
      startDate: moment().subtract(1, 'day').startOf('day').toDate(),
      endDate: moment().subtract(1, 'day').startOf('day').add(6, 'hour').toDate(),
      paymentType: 'hourly',
      paymentRate: 3,
      _isActive: false,
      _done: true
    };
    const firstProjectTodayTE = {
      _id: '10',
      projectId: '1',
      userId: '11',
      startDate: moment().startOf('day').toDate(),
      endDate: moment().startOf('day').add(5, 'hour').toDate(),
      paymentType: 'hourly',
      paymentRate: 13,
      _isActive: false,
      _done: true
    };
    const thirdProjectAllTimeTE = {
      _id: '12',
      projectId: '3',
      userId: '11',
      startDate: 0,
      endDate: 18 * oneHour,
      paymentType: 'hourly',
      paymentRate: 100,
      _isActive: false,
      _done: true
    };
    beforeEach(function () {
      Projects.insert({ _id: '1', assignedUsersIds: ['11'] });
      Projects.insert({ _id: '2', assignedUsersIds: ['11'] });
      Projects.insert({ _id: '3', assignedUsersIds: ['11'] });
      summarizer.excludedProjects = ['3'];
    });

    it('should not calculate projects from excludedProjects', function () {
      TimeEntries.insert(thirdProjectAllTimeTE);
      const userId = '11';
      const projectTracks = summarizer._calculateTrackingProjects(userId);
      const thirdProjectTrack = projectTracks.allTime.find(track => track.projectId === '3');

      expect(thirdProjectTrack).to.be.undefined;
    });

    it('should have userId set in returned object', function () {
      TimeEntries.insert(firstProjectAllTimeTE);
      const userId = '11';
      const projectTracks = summarizer._calculateTrackingProjects(userId);

      expect(projectTracks.userId).to.be.equal(userId);
    });

    it('should calculate project time for allTime', function () {
      TimeEntries.insert(firstProjectAllTimeTE);
      const userId = '11';
      const projectTracks = summarizer._calculateTrackingProjects(userId);
      const firstProjectTrack = projectTracks.allTime.find(track => track.projectId === '1');
      const trackedProject = firstProjectTrack.tracked;

      expect(trackedProject).to.be.a('number').that.is.equal(12 * oneHour);
    });

    it('should calculate projects earned amount for allTime', function () {
      TimeEntries.insert(firstProjectAllTimeTE);
      const userId = '11';
      const projectTracks = summarizer._calculateTrackingProjects(userId);
      const firstProjectTrack = projectTracks.allTime.find(track => track.projectId === '1');
      const earnedProject = firstProjectTrack.earned;

      expect(earnedProject).to.be.a('number').that.is.equal(144);
    });

    it('should calculate projects time for lastMonth', function () {
      TimeEntries.insert(secondProjectLastMonthTE);
      const userId = '11';
      const projectTracks = summarizer._calculateTrackingProjects(userId);
      const secondProjectTrack = projectTracks.lastMonth.find(track => track.projectId === '2');
      const trackedProject = secondProjectTrack.tracked;

      expect(trackedProject).to.be.a('number').that.is.equal(8 * oneHour);
    });

    it('should calculate projects earned amount for lastMonth', function () {
      TimeEntries.insert(secondProjectLastMonthTE);
      const userId = '11';
      const projectTracks = summarizer._calculateTrackingProjects(userId);
      const secondProjectTrack = projectTracks.lastMonth.find(track => track.projectId === '2');
      const earnedProject = secondProjectTrack.earned;

      expect(earnedProject).to.be.a('number').that.is.equal(80);
    });

    it('should calculate projects time for thisMonth', function () {
      TimeEntries.insert(secondProjectThisMonthTE);
      const userId = '11';
      const projectTracks = summarizer._calculateTrackingProjects(userId);
      const secondProjectTrack = projectTracks.thisMonth.find(track => track.projectId === '2');
      const trackedProject = secondProjectTrack.tracked;

      expect(trackedProject).to.be.a('number').that.is.equal(10 * oneHour);
    });

    it('should calculate projects earned amount for thisMonth', function () {
      TimeEntries.insert(secondProjectThisMonthTE);
      const userId = '11';
      const projectTracks = summarizer._calculateTrackingProjects(userId);
      const secondProjectTrack = projectTracks.thisMonth.find(track => track.projectId === '2');
      const earnedProject = secondProjectTrack.earned;

      expect(earnedProject).to.be.a('number').that.is.equal(50);
    });

    it('should calculate projects time for lastWeek', function () {
      TimeEntries.insert(firstProjectLastWeekTE);
      const userId = '11';
      const projectTracks = summarizer._calculateTrackingProjects(userId);
      const firstProjectTrack = projectTracks.lastWeek.find(track => track.projectId === '1');
      const trackedProject = firstProjectTrack.tracked;

      expect(trackedProject).to.be.a('number').that.is.equal(5 * oneHour);
    });

    it('should calculate projects earned amount for lastWeek', function () {
      TimeEntries.insert(firstProjectLastWeekTE);
      const userId ='11';
      const projectTracks = summarizer._calculateTrackingProjects(userId);
      const firstProjectTrack = projectTracks.lastWeek.find(track => track.projectId === '1');
      const earnedProject = firstProjectTrack.earned;

      expect(earnedProject).to.be.a('number').that.is.equal(40);
    });

    it('should calculate projects time for thisWeek', function () {
      TimeEntries.insert(secondProjectThisWeekTE);
      const userId = '11';
      const projectTracks = summarizer._calculateTrackingProjects(userId);
      const secondProjectTrack = projectTracks.thisWeek.find(track => track.projectId === '2');
      const trackedProject = secondProjectTrack.tracked;

      expect(trackedProject).to.be.a('number').that.is.equal(7 * oneHour);
    });

    it('should calculate projects earned amount for thisWeek', function () {
      TimeEntries.insert(secondProjectThisWeekTE);
      const userId = '11';
      const projectTracks = summarizer._calculateTrackingProjects(userId);
      const secondProjectTrack = projectTracks.thisWeek.find(track => track.projectId === '2');
      const earnedProject = secondProjectTrack.earned;

      expect(earnedProject).to.be.a('number').that.is.equal(84);
    });

    it('should calculate projects time for yesterday', function () {
      TimeEntries.insert(firstProjectYesterdayTE);
      const userId = '11';
      const projectTracks = summarizer._calculateTrackingProjects(userId);
      const firstProjectTrack = projectTracks.yesterday.find(track => track.projectId === '1');
      const trackedProject = firstProjectTrack.tracked;

      expect(trackedProject).to.be.a('number').that.is.equal(6 * oneHour);
    });

    it('should calculate projects earned amount for yesterday', function () {
      TimeEntries.insert(firstProjectYesterdayTE);
      const userId = '11';
      const projectTracks = summarizer._calculateTrackingProjects(userId);
      const firstProjectTrack = projectTracks.yesterday.find(track => track.projectId === '1');
      const earnedProject = firstProjectTrack.earned;

      expect(earnedProject).to.be.a('number').that.is.equal(18);
    });

    it('should calculate projects time for today', function () {
      TimeEntries.insert(firstProjectTodayTE);
      const userId = '11';
      const projectTracks = summarizer._calculateTrackingProjects(userId);
      const firstProjectTrack = projectTracks.today.find(track => track.projectId === '1');
      const trackedProject = firstProjectTrack.tracked;

      expect(trackedProject).to.be.a('number').that.is.equal(5 * oneHour);
    });

    it('should calculate projects earned amount for today', function () {
      TimeEntries.insert(firstProjectTodayTE);
      const userId = '11';
      const projectTracks = summarizer._calculateTrackingProjects(userId);
      const firstProjectTrack = projectTracks.today.find(track => track.projectId === '1');
      const earnedProject = firstProjectTrack.earned;

      expect(earnedProject).to.be.a('number').that.is.equal(65);
    });

    afterEach(function () {
      Projects.remove({});
      TimeEntries.remove({});
      summarizer.excludedProjects = [];
    });
  });

  describe('_calculateTrackingTasks method', function () {
    let thirdTaskAllTimeTE = {
      _id: '9',
      projectId: '6',
      taskId: '3',
      userId: '8',
      startDate: 0,
      endDate: 20 * oneHour,
      paymentType: 'hourly',
      paymentRate: 150,
      _isActive: false,
      _done: true
    };
    let firstTaskAllTimeTE = {
      _id: '10',
      projectId: '6',
      taskId: '1',
      userId: '8',
      startDate: 0,
      endDate: 8 * oneHour,
      paymentType: 'hourly',
      paymentRate: 5,
      _isActive: false,
      _done: true
    };
    let firstTaskLastMonthTE = {
      _id: '11',
      projectId: '6',
      taskId: '1',
      userId: '8',
      startDate: moment().subtract(1, 'month').startOf('month').toDate(),
      endDate: moment().subtract(1, 'month').startOf('month').add(7, 'hour').toDate(),
      paymentType: 'hourly',
      paymentRate: 10,
      _isActive: false,
      _done: true
    };
    let firstTaskThisMonthTE = {
      _id: '12',
      projectId: '6',
      taskId: '1',
      userId: '8',
      startDate: moment().startOf('month').toDate(),
      endDate: moment().startOf('month').add(4, 'hour').toDate(),
      paymentType: 'hourly',
      paymentRate: 4,
      _isActive: false,
      _done: true
    };
    let firstTaskLastWeekTE = {
      _id: '13',
      projectId: '6',
      taskId: '1',
      userId: '8',
      startDate: moment().subtract(1, 'week').startOf('isoweek').toDate(),
      endDate: moment().subtract(1, 'week').startOf('isoweek').add(9, 'hour').toDate(),
      paymentType: 'hourly',
      paymentRate: 15,
      _isActive: false,
      _done: true
    };
    let secondTaskThisWeekTE = {
      _id: '14',
      projectId: '6',
      taskId: '2',
      userId: '8',
      startDate: moment().startOf('isoweek').toDate(),
      endDate: moment().startOf('isoweek').add(3, 'hours').toDate(),
      paymentType: 'hourly',
      paymentRate: 9,
      _isActive: false,
      _done: true
    };
    let secondTaskYesterdayTE = {
      _id: '15',
      projectId: '6',
      taskId: '2',
      userId: '8',
      startDate: moment().subtract(1, 'day').startOf('day').toDate(),
      endDate: moment().subtract(1, 'day').startOf('day').add(2, 'hour').toDate(),
      paymentType: 'hourly',
      paymentRate: 14,
      _isActive: false,
      _done: true
    };
    let secondTaskTodayTE = {
      _id: '16',
      projectId: '6',
      taskId: '2',
      userId: '8',
      startDate: moment().startOf('day').toDate(),
      endDate: moment().startOf('day').add(6, 'hour').toDate(),
      paymentType: 'hourly',
      paymentRate: 6,
      _isActive: false,
      _done: true
    };
    beforeEach(function () {
      Tasks.insert({ _id: '1', projectId: '6', membersIds: ['8'] });
      Tasks.insert({ _id: '2', projectId: '6', membersIds: ['8'] });
      Tasks.insert({ _id: '3', projectId: '6', membersIds: ['8'] });
      Tasks.insert({ _id: '4', projectId: '7', membersIds: ['8'] });
      summarizer.excludedTasks = ['3'];
      summarizer.excludedProjects = ['7'];
    });

    it('should not count tasks from project in excludedProjects', function () {
      const userId = '8';
      const taskTracks = summarizer._calculateTrackingTasks(userId);
      const fourthTaskTrack = taskTracks.allTime.find(track => track.taskId === '4');

      expect(fourthTaskTrack).to.be.undefined;
      expect(taskTracks.allTime.length).to.be.equal(2);
    });

    it('should not count tasks from excludedTasks', function () {
      TimeEntries.insert(thirdTaskAllTimeTE);
      const userId = '8';
      const taskTracks = summarizer._calculateTrackingTasks(userId);
      const thirdTaskTrack = taskTracks.allTime.find(track => track.taskId === '3');

      expect(thirdTaskTrack).to.be.undefined;
      expect(taskTracks.allTime.length).to.be.equal(2);
    });

    it('should set userId in returned object', function () {
      const userId = '8';
      const taskTracks = summarizer._calculateTrackingTasks(userId);

      expect(taskTracks.userId).to.be.equal(userId);
    });

    it('should calculate tasks time for allTime', function () {
     TimeEntries.insert(firstTaskAllTimeTE);
     const userId = '8';
     const taskTracks = summarizer._calculateTrackingTasks(userId);
     const firstTaskTrack = taskTracks.allTime.find(track => track.taskId === '1');
     const trackedTask = firstTaskTrack.tracked;

     expect(trackedTask).to.be.a('number').that.is.equal(8 * oneHour);
    });

    it('should claculate tasks earned amount for allTime', function () {
      TimeEntries.insert(firstTaskAllTimeTE);
      const userId = '8';
      const taskTracks = summarizer._calculateTrackingTasks(userId);
      const firstTaskTrack = taskTracks.allTime.find(track => track.taskId === '1');
      const earnedTask = firstTaskTrack.earned;

      expect(earnedTask).to.be.a('number').that.is.equal(40);
    });

    it('should calculate tasks time for lastMonth', function () {
      TimeEntries.insert(firstTaskLastMonthTE);
      const userId = '8';
      const taskTracks = summarizer._calculateTrackingTasks(userId);
      const firstTaskTrack = taskTracks.lastMonth.find(track => track.taskId === '1');
      const trackedTask = firstTaskTrack.tracked;

      expect(trackedTask).to.be.a('number').that.is.equal(7 * oneHour);
    });

    it('should calculate tasks earned amount for lastMonth', function () {
      TimeEntries.insert(firstTaskLastMonthTE);
      const userId = '8';
      const taskTracks = summarizer._calculateTrackingTasks(userId);
      const firstTaskTrack = taskTracks.lastMonth.find(track => track.taskId === '1');
      const earnedTask = firstTaskTrack.earned;

      expect(earnedTask).to.be.a('number').that.is.equal(70);
    });

    it('should calculate tasks time for thisMonth', function () {
      TimeEntries.insert(firstTaskThisMonthTE);
      const userId = '8';
      const taskTracks = summarizer._calculateTrackingTasks(userId);
      const firstTaskTrack = taskTracks.thisMonth.find(track => track.taskId === '1');
      const trackedTask = firstTaskTrack.tracked;

      expect(trackedTask).to.be.a('number').that.is.equal(4 * oneHour);
    });

    it('should calculate tasks earned amount for thisMonth', function () {
      TimeEntries.insert(firstTaskThisMonthTE);
      const userId = '8';
      const taskTracks = summarizer._calculateTrackingTasks(userId);
      const firstTaskTrack = taskTracks.thisMonth.find(track => track.taskId === '1');
      const earnedTask = firstTaskTrack.earned;

      expect(earnedTask).to.be.a('number').that.is.within(16 - epsilon, 16 + epsilon);
    });

    it('should calculate tasks time for lastWeek', function () {
      TimeEntries.insert(firstTaskLastWeekTE);
      const userId = '8';
      const taskTracks = summarizer._calculateTrackingTasks(userId);
      const firstTaskTrack = taskTracks.lastWeek.find(track => track.taskId === '1');
      const trackedTask = firstTaskTrack.tracked;

      expect(trackedTask).to.be.a('number').that.is.equal(9 * oneHour);
    });

    it('should calculate tasks earned amount for lastWeek', function () {
      TimeEntries.insert(firstTaskLastWeekTE);
      const userId = '8';
      const taskTracks = summarizer._calculateTrackingTasks(userId);
      const firstTaskTrack = taskTracks.lastWeek.find(track => track.taskId === '1');
      const earnedTask = firstTaskTrack.earned;

      expect(earnedTask).to.be.a('number').that.is.equal(135);
    });

    it('should calculate tasks time for thisWeek', function () {
      TimeEntries.insert(secondTaskThisWeekTE);
      const userId = '8';
      const taskTracks = summarizer._calculateTrackingTasks(userId);
      const secondTaskTrack = taskTracks.thisWeek.find(track => track.taskId === '2');
      const trackedTask = secondTaskTrack.tracked;

      expect(trackedTask).to.be.a('number').that.is.equal(3 * oneHour);
    });

    it('should calculate tasks earned amount for thisWeek', function () {
      TimeEntries.insert(secondTaskThisWeekTE);
      const userId = '8';
      const taskTracks = summarizer._calculateTrackingTasks(userId);
      const secondTaskTrack = taskTracks.thisWeek.find(track => track.taskId === '2');
      const earnedTask = secondTaskTrack.earned;

      expect(earnedTask).to.be.a('number').that.is.within(27 - epsilon, 27 + epsilon);
    });

    it('should calculate tasks time for yesterday', function () {
      TimeEntries.insert(secondTaskYesterdayTE);
      const userId = '8';
      const taskTracks = summarizer._calculateTrackingTasks(userId);
      const secondTaskTrack = taskTracks.yesterday.find(track => track.taskId === '2');
      const trackedTask = secondTaskTrack.tracked;

      expect(trackedTask).to.be.a('number').that.is.equal(2 * oneHour);
    });

    it('should calculate tasks earned amount for yesterday', function () {
      TimeEntries.insert(secondTaskYesterdayTE);
      const userId = '8';
      const taskTracks = summarizer._calculateTrackingTasks(userId);
      const secondTaskTrack = taskTracks.yesterday.find(track => track.taskId === '2');
      const earnedTask = secondTaskTrack.earned;

      expect(earnedTask).to.be.a('number').that.is.equal(28);
    });

    it('should calculate tasks time for today', function () {
      TimeEntries.insert(secondTaskTodayTE);
      const userId = '8';
      const taskTracks = summarizer._calculateTrackingTasks(userId);
      const secondTaskTrack = taskTracks.today.find(track => track.taskId === '2');
      const trackedTask = secondTaskTrack.tracked;

      expect(trackedTask).to.be.a('number').that.is.equal(6 * oneHour);
    });

    it('should calculate tasks earned amount for today', function () {
      TimeEntries.insert(secondTaskTodayTE);
      const userId = '8';
      const taskTracks = summarizer._calculateTrackingTasks(userId);
      const secondTaskTrack = taskTracks.today.find(track => track.taskId === '2');
      const earnedTask = secondTaskTrack.earned;

      expect(earnedTask).to.be.a('number').that.is.equal(36);
    });

    afterEach(function () {
      Tasks.remove({});
      TimeEntries.remove({});
      summarizer.excludedProjects = [];
      summarizer.exculdedTasks = [];
    });
  });

  describe('_clearQuery method', function () {
    it('should set timeEntriesQuery to default value', function () {
      const defaultValue = { _isActive: false, _done: true };
      summarizer.timeEntriesQuery = {};
      summarizer._clearQuery();
      expect(summarizer.timeEntriesQuery).to.be.deep.equal(defaultValue);
    });

    it('should return summarizer instance itself', function () {
      const result = summarizer._clearQuery();

      expect(result).to.be.deep.equal(summarizer);
    });
  });

  describe('_projects method', function () {
    it('should set itemIds property', function () {
      const projectIds = ['1', '2', '3'];

      summarizer._projects(projectIds);

      expect(summarizer.itemIds).to.be.deep.equal(projectIds);
    });

    it('should set itemIdFieldName property to projectId', function () {
      summarizer.itemIdFieldName = '';
      const projectIds = [];

      summarizer._projects(projectIds);

      expect(summarizer.itemIdFieldName).to.be.equal('projectId');
    });

    it('should return summarizer instance itself', function () {
      const projectIds = [];

      const result = summarizer._projects(projectIds);

      expect(result).to.be.deep.equal(summarizer);
    });
  });

  describe('_tasks method', function () {
    it('should set itemIds property', function () {
      const taskIds = ['6', '7', '8'];

      summarizer._tasks(taskIds);

      expect(summarizer.itemIds).to.be.deep.equal(taskIds);
    });

    it('should set itemIdFieldName property to taskId', function () {
      summarizer.itemIdFieldName = '';
      const taskIds = [];

      summarizer._tasks(taskIds);

      expect(summarizer.itemIdFieldName).to.be.equal('taskId');
    });

    it('should return summarizer instance itself', function () {
      const taskIds = [];

      const result = summarizer._tasks(taskIds);

      expect(result).to.be.deep.equal(summarizer);
    });
  });

  describe('_user method', function () {
    it('should set timeEntriesQuery.userId property', function () {
      summarizer.timeEntriesQuery = {};
      const userId = '1';

      summarizer._user(userId);

      expect(summarizer.timeEntriesQuery.userId).to.be.equal(userId);
    });

    it('should return summarizer instance itself', function () {
      const userId = '';

      const result = summarizer._user(userId);

      expect(result).to.be.deep.equal(summarizer);
    });
  });

  describe('_today method', function () {
    it('should set timeEntriesQuery.startDate property', function () {
      const startDate = { $gte: moment().startOf('day').toDate() };

      summarizer._today();

      expect(summarizer.timeEntriesQuery.startDate).to.be.deep.equal(startDate);
    });

    it('should return summarizer instance itself', function () {
      const result = summarizer._today();

      expect(result).to.be.deep.equal(summarizer);
    });
  });

  describe('_yesterday method', function () {
    it('should set timeEntriesQuery.startDate property', function () {
      const startDate = {
        $gte: moment().subtract(1, 'day').startOf('day').toDate(),
        $lt: moment().startOf('day').toDate()
      };

      summarizer._yesterday();

      expect(summarizer.timeEntriesQuery.startDate).to.be.deep.equal(startDate);
    });

    it('should return summarizer instance itself', function () {
      const result = summarizer._yesterday();

      expect(result).to.be.deep.equal(summarizer);
    });
  });

  describe('_thisWeek method', function () {
    it('should set timeEntriesQuery.startDate property', function () {
      const startDate = {
        $gte: moment().startOf('isoweek').toDate(),
        $lt: moment().add(1, 'week').startOf('isoweek').toDate()
      };

      summarizer._thisWeek();

      expect(summarizer.timeEntriesQuery.startDate).to.be.deep.equal(startDate);
    });

    it('should return summarizer instance itself', function () {
      const result = summarizer._thisWeek();

      expect(result).to.be.deep.equal(summarizer);
    });
  });

  describe('_lastWeek methd', function () {
    it('should set timeEntriesQuery.startDate property', function () {
      const startDate = {
        $gte: moment().subtract(1, 'week').startOf('isoweek').toDate(),
        $lt: moment().startOf('isoweek').toDate()
      };

      summarizer._lastWeek();

      expect(summarizer.timeEntriesQuery.startDate).to.be.deep.equal(startDate);
    });

    it('should return summarizer instance itself', function () {
      const result = summarizer._lastWeek();

      expect(result).to.be.deep.equal(summarizer);
    });
  });

  describe('_thisMonth method', function () {
    it('should set timeEntriesQuery.startDate property', function () {
      const startDate = {
        $gte: moment().startOf('month').toDate(),
        $lt: moment().add(1, 'month').startOf('month').toDate()
      };

      summarizer._thisMonth();

      expect(summarizer.timeEntriesQuery.startDate).to.be.deep.equal(startDate);
    });

    it('should return summarizer instance itself', function () {
      const result = summarizer._thisMonth();

      expect(result).to.be.deep.equal(summarizer);
    });
  });

  describe('_lastMonth method', function () {
    it('should set timeEntriesQuery.startDate property', function () {
      const startDate = {
        $gte: moment().subtract(1, 'month').startOf('month').toDate(),
        $lt: moment().startOf('month').toDate()
      };

      summarizer._lastMonth();

      expect(summarizer.timeEntriesQuery.startDate).to.be.deep.equal(startDate);
    });

    it('should return summarizer instance itself', function () {
      const result = summarizer._lastMonth();

      expect(result).to.be.deep.equal(summarizer);
    });
  });

  describe('_allTime method', function () {
    it('should return summarizer instance itself', function () {
      const result = summarizer._allTime();

      expect(result).to.be.deep.equal(summarizer);
    });
  });

  describe('_calculate method', function () {
    beforeEach(function() {
      TimeEntries.insert({
        _id: '1',
        projectId: '2',
        taskId: '3',
        startDate: 0,
        endDate: 5 * oneHour,
        paymentType: 'hourly',
        paymentRate: 5,
        _isActive: false,
        _done: true
      });
      TimeEntries.insert({
        _id: '4',
        projectId: '2',
        taskId: '5',
        startDate: 6 * oneHour,
        endDate: 12 * oneHour,
        paymentType: 'hourly',
        paymentRate: 8,
        _isActive: false,
        _done: true
      });
      TimeEntries.insert({
        _id: '6',
        projectId: '7',
        taskId: '8',
        startDate: 18 * oneHour,
        endDate: 22 * oneHour,
        paymentType: 'hourly',
        paymentRate: 12,
        _isActive: false,
        _done: true
      });
      TimeEntries.insert({
        _id: '9',
        projectId: '7',
        taskId: '10',
        startDate: 25 * oneHour,
        endDate: 30 * oneHour,
        paymentType: 'hourly',
        paymentRate: 1,
        _isActive: false,
        _done: true
      });
    });

    it('should return array of results for projects', function () {
      const projectIds = ['2', '7'];
      summarizer._clearQuery()._projects(projectIds)._allTime();

      const result = summarizer._calculate();

      expect(result.length).to.be.equal(projectIds.length);
      expect(result.find(track => track.projectId === '2')).to.not.be.undefined;
      expect(result.find(track => track.projectId === '7')).to.not.be.undefined;
    });

    it('should return array of result for tasks', function () {
      const taskIds = ['3', '5'];
      summarizer._clearQuery()._tasks(taskIds)._allTime();

      const result = summarizer._calculate();

      expect(result.length).to.be.equal(taskIds.length);
      expect(result.find(track => track.taskId === '3')).to.not.be.undefined;
      expect(result.find(track => track.taskId === '5')).to.not.be.undefined;
    });

    it('should calculate time for projects', function () {
      const projectIds = ['2'];
      summarizer._clearQuery()._projects(projectIds)._allTime();

      const result = summarizer._calculate();

      expect(result[0].projectId).to.be.equal('2');
      expect(result[0].tracked).to.be.a('number').that.is.equal(11 * oneHour);
    });

    it('should calculate earned amount for projects', function () {
      const projectIds = ['7'];
      summarizer._clearQuery()._projects(projectIds)._allTime();

      const result = summarizer._calculate();

      expect(result[0].projectId).to.be.equal('7');
      expect(result[0].earned).to.be.a('number').that.is.equal(53);
    });

    it('should calculate time for tasks', function () {
      const taskIds = ['8'];
      summarizer._clearQuery()._tasks(taskIds)._allTime();

      const result = summarizer._calculate();

      expect(result[0].taskId).to.be.equal('8');
      expect(result[0].tracked).to.be.a('number').that.is.equal(4 * oneHour);
    });

    it('should calculate earned amount for tasks', function () {
      const taskIds = ['10'];
      summarizer._clearQuery()._tasks(taskIds)._allTime();

      const result = summarizer._calculate();

      expect(result[0].taskId).to.be.equal('10');
      expect(result[0].earned).to.be.a('number').that.is.equal(5);
    });

    afterEach(function () {
      TimeEntries.remove({});
    });
  });

  afterEach(function () {
    StubCollections.restore();
  });
});

