// import { removeAllUsers } from '/imports/api/users/methods';
// Meteor.startup(function () {
//     Router.map(function () {
//         this.route('drop-users', {
//             where: 'server',
//             path: '/drop-users',
//             action: function (token) {
//                 let obj = {};
//                 removeAllUsers.call('removeAllUsers');
//                 obj.users = Meteor.users.find().count();
//                 let data = JSON.stringify(obj);
//                 this.response.writeHead(200, {'Content-Type': 'application/json'});
//                 this.response.end(data)
//             }
//         });
//     });
// });