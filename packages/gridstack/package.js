Package.describe({
  name: 'vezio:gridstack',
  summary: 'Adds gridstack.js',
  version: '1.0.0',
});

Package.onUse(function (api) {
  api.versionsFrom(['METEOR@1.0']);

  api.use('jquery', 'client');
  api.use('underscore', 'client');

  api.addFiles('gridstack.js', 'client');
  api.addFiles('jquery-ui.js', 'client');

  api.addFiles('gridstack.min.css', 'client');
  api.addFiles('gridstack-extra.min.css', 'client');
});