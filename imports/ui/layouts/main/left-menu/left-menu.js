import './menu-item/menu-item';
import './left-menu.html';

Template.leftMenu.onCreated(function () {
  this.categories = new ReactiveVar([]);

  this.autorun(() => {
    let userId = Meteor.userId();
    let user = Meteor.users.findOne({_id: userId});
    if (user && user.profile && user.profile.selectedCompanyId) {
      this.categories.set([
        {
          title: 'Project Management',
          items: [
            {
              link: Router.path('projects'),
              icon: 'work',
              title: 'Projects'
            }
          ]
        },
        {
          title: 'Work History',
          items: [

            {
              link: Router.path('screenshots', {screenshotsDate: moment().format('YYYY-MM-DD'), timeZone: 'current'}),
              icon: 'wallpaper',
              title: 'Screenshots'
            }
          ]
        },
        {
          title: 'Company Management',
          items: [
            {
              link: Router.path('companies'),
              icon: 'business',
              title: 'Companies'
            },
            {
              link: Router.path('userJobs'),
              icon: 'view_list',
              title: 'Jobs'
            },
            {
              link: Router.path('teams', {visibility: 'public'}),
              icon: 'group',
              title: 'Teams'
            },
            {
              link: Router.path('contracts'),
              icon: 'insert_drive_file',
              title: 'Contracts'
            }
          ]
        },
        {
          title: 'Reports',
          items: [
            {
              link: Router.path('timeTrackerReports'),
              icon: 'insert_chart',
              title: 'Reports'
            }
          ]
        },
        {
          title: 'Users Management',
          items: [
            {
              link: Router.path('users-management'),
              icon: 'directions_walk',
              title: 'Roles'
            }
          ]
        }
      ]);
    }
    else {
      this.categories.set([
        {
          title: 'Project Management',
          items: [
            {
              link: Router.path('projects'),
              icon: 'work',
              title: 'Projects'
            }
          ]
        },
        {
          title: 'Work History',
          items: [

            {
              link: Router.path('screenshots', {screenshotsDate: moment().format('YYYY-MM-DD'), timeZone: 'current'}),
              icon: 'wallpaper',
              title: 'Screenshots'
            }
          ]
        },
        {
          title: 'Company Management',
          items: [
            {
              link: Router.path('companies'),
              icon: 'business',
              title: 'Companies'
            },
            {
              link: Router.path('userJobs'),
              icon: 'view_list',
              title: 'Jobs'
            },
            {
              link: Router.path('teams', {visibility: 'public'}),
              icon: 'group',
              title: 'Teams'
            },
            {
              link: Router.path('contracts'),
              icon: 'insert_drive_file',
              title: 'Contracts'
            }
          ]
        },
        {
          title: 'Reports',
          items: [
            {
              link: Router.path('timeTrackerReports'),
              icon: 'insert_chart',
              title: 'Reports'
            }
          ]
        }
      ])
    }
  });
});

Template.leftMenu.onRendered(function () {
  $('.button-collapse').on('click', function (e) {
    $(this).toggleClass('open'); //you can list several class names
    e.preventDefault();
  });
  $('.button-collapse').on('click', function (e) {
    $('#slide-out').toggleClass('slided'); //you can list several class names
    e.preventDefault();
  });
  $('.button-collapse').on('click', function (e) {
    $('.content-section').toggleClass('slided');
    //you can list several class names
    e.preventDefault();
  });
    this.$('.hastip').tooltipsy({
      offset: [10, 0],
      delay: 0,
      css: {
        'padding': '2px 15px',
        'font-size': '12px',
        'font-weight': '500',
        'border-radius': '4px',
        'max-width': '150px',
        'color': '#fff',
        'background-color': '#8b8b8b',
        'text-shadow': 'none'
      }
    });
  this.autorun(() => {
    this.categories.get();
    setTimeout(() => {
        this.$('.hastip.directions_walk').tooltipsy({
          offset: [10, 0],
          delay: 0,
          css: {
            'padding': '2px 15px',
            'font-size': '12px',
            'font-weight': '500',
            'border-radius': '4px',
            'max-width': '150px',
            'color': '#fff',
            'background-color': '#8b8b8b',
            'text-shadow': 'none'
          }
        });
    }, 500);
  });

  this.autorun(() => {
    this.categories.get();
    let userId = Meteor.userId();
    let user  = Meteor.users.findOne({_id: userId});
    let selectedCompanyId = user && user.profile && user.profile.selectedCompanyId;
    setTimeout(() => {
      if(selectedCompanyId){
        this.$('.hastip.directions_walk').data('tooltipsy').destroy();
      }
    }, 200);
  });
});

Template.leftMenu.helpers({
  categories() {
    let categories = Template.instance().categories.get();
    return categories;
  },
  fixedMenuItems() {
    return [
      {
        link: Router.path('settings'),
        icon: 'settings',
        title: 'Settings'
      },
      {
        link: '#',
        icon: 'help',
        title: 'Help & Feedback'
      }
    ]
  }
});
