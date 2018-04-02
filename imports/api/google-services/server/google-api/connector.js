export const GoogleApi = function () {
    let privateInfo = Meteor.settings.private.GOOGLE;
    let jwtClient = new googleapis.auth.JWT(privateInfo.client_email, null, privateInfo.private_key, privateInfo.scope, null);
    let authorize = Meteor.wrapAsync(jwtClient.authorize, jwtClient);
    let self = this;
    try {
        let tokens = authorize();
        self.token = tokens.access_token;
        console.log('Authorized with google. Token:', tokens.access_token);
    } catch (err) {
        console.error('Google auth error:', err);
    }
};