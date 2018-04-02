Router.map(function () {
  this.route('videoShare', {
    path: '/:url',
    layoutTemplate: 'voidLayout',
    template: 'videoShare'
  });
});
