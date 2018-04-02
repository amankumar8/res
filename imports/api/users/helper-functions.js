export const fillAssignedUsersMap = function (assignedUsers, allPositionsForThisEntity) {
    let assignedUsersMap = {};

    allPositionsForThisEntity.forEach(function (position) {
        let usersForThisPositionIds = [];
        assignedUsers.forEach(function (userWithPositions) {
            let hasCurrentPosition =
                _.find(userWithPositions.positions, function (assignedPosition) {
                    return assignedPosition.title == position.title;
                });
            if (hasCurrentPosition) {
                usersForThisPositionIds.push(userWithPositions._id);
            }
        });
        if (assignedUsersMap[position.propertyNameInCollection]) {
            assignedUsersMap[position.propertyNameInCollection] =
                _.uniq(_.union(assignedUsersMap[position.propertyNameInCollection],
                    usersForThisPositionIds));
        } else {
            assignedUsersMap[position.propertyNameInCollection] = usersForThisPositionIds;
        }
    });
    return assignedUsersMap;
};

// this is a slightly scary code, but it's works
export const changeUserRoles = function (targetEntityId, assignedUsersBeforeChanges,
                                                assignedUsersAfterChanges, availablePositions) {

    let checkWhetherRoleCanBeChanged = function (assignedUsersSetOne,
                                                 assignedUsersSetTwo) {
        assignedUsersSetOne.forEach(function (userFromSetOne) {
            let userAfterChanges = _.find(assignedUsersSetTwo, function (userFromSetTwo) {
                return userFromSetTwo._id == userFromSetOne._id;
            });

            let positionsNamesBefore = _.map(userFromSetOne.positions, function (position) {
                return position.name;
            });
            let positionsNamesAfter = !!userAfterChanges ?
                _.map(userAfterChanges.positions, function (position) {
                    return position.name;
                }) : [];
            let addedPositionsNames = _.difference(positionsNamesAfter, positionsNamesBefore);
            let removedPositionsNames = _.difference(positionsNamesBefore, positionsNamesAfter);
            let changedPositionsNames = _.union(addedPositionsNames, removedPositionsNames);

            if (changedPositionsNames.length > 0) {
                if (userFromSetOne._id == Meteor.userId()) {
                    throw new Meteor.Error('You can\'t change your own role!');
                }

                changedPositionsNames.forEach(function (changedPositionName) {
                    let changedPosition = _.find(availablePositions, function (availablePosition) {
                        return availablePosition.name == changedPositionName;
                    });
                    let whoCanChangeThisPosition = changedPosition.canBeAssignedBy; // array with roles
                    let canBeChanged = Roles.userIsInRole(Meteor.userId(), whoCanChangeThisPosition, targetEntityId);
                    if (!canBeChanged) {
                        throw new Meteor.Error('You can\'t assign or reject this user!');
                    }
                });
            }
        });
    };

    let removeRolesFromUser = function (targetEntityId, assignedUsersBeforeChanges) {
        assignedUsersBeforeChanges.forEach(function (assignedUserBefore) {
            let rolesBefore = [];
            assignedUserBefore.positions.forEach(function (positionBefore) {
                rolesBefore = _.union(rolesBefore, positionBefore.roles);
            });
            Roles.removeUsersFromRoles(assignedUserBefore._id, rolesBefore, targetEntityId);
        });
    };
    let addRolesToUser = function (targetEntityId, assignedUsersAfterChanges) {
        assignedUsersAfterChanges.forEach(function (assignedUser) {
            let roles = [];
            assignedUser.positions.forEach(function (position) {
                roles = _.union(roles, position.roles);
            });
            Roles.addUsersToRoles(assignedUser._id, roles, targetEntityId);
        });
    };

    // checking entities that was changed or removed
    checkWhetherRoleCanBeChanged(assignedUsersBeforeChanges, assignedUsersAfterChanges);
    // checking entities that was changed or added (yes, I know that it's a little crutch bike)
    checkWhetherRoleCanBeChanged(assignedUsersAfterChanges, assignedUsersBeforeChanges);

    //(another one crutch bike; maybe, I'll rewrite this in future)
    // I removing roles that was before
    removeRolesFromUser(targetEntityId, assignedUsersBeforeChanges);
    // and adding roles that are now
    addRolesToUser(targetEntityId, assignedUsersAfterChanges);
};

export const searchChanges = function (after, before) {

    let userIdsBefore = _.map(before, function (obj) {
        return obj._id;
    });

    let userIdsAfter = _.map(after, function(obj) {
        return obj._id;
    });

    let addedUsers = _.difference(userIdsAfter, userIdsBefore);
    let removedUsers = _.difference(userIdsBefore, userIdsAfter);

    let stayedUsers = _.intersection(userIdsBefore, userIdsAfter);
    let changedUsers = [];
    _.each(stayedUsers, function (id) {
        let userBefore = _.find(before, function (obj) {
            return obj._id === id
        });

        let userAfter = _.find(after, function (obj) {
            return obj._id === id
        });

        if(userBefore.positions.length != userAfter.positions.length){
            let privilege = userBefore.positions.length > userAfter.positions.length ? "unassigned" : "assigned";

            changedUsers.push({
                id: id,
                privilege: privilege
            });
        }
    });

    return {
        addedUsers: addedUsers,
        removedUsers: removedUsers,
        changedUsers: changedUsers
    }
};