export const projectUserPositions = [
  {
    name: 'Owner',
    roles: ['project-owner', 'project-admin', 'project-manager', 'project-worker', 'project-observer'],
    propertyNameInCollection: 'assignedUsersIds',
    canBeAssignedBy: ['project-owner']
  },
  {
    name: 'Admin',
    roles: ['project-admin', 'project-manager', 'project-worker', 'project-observer'],
    propertyNameInCollection: 'assignedUsersIds',
    canBeAssignedBy: ['project-owner', 'project-admin']
  },
  {
    name: 'Manager',
    roles: ['project-manager', 'project-worker', 'project-observer'],
    propertyNameInCollection: 'assignedUsersIds',
    canBeAssignedBy: ['project-owner', 'project-admin', 'project-manager']
  }, {
    name: 'Worker',
    roles: ['project-worker'],
    propertyNameInCollection: 'assignedUsersIds',
    canBeAssignedBy: ['project-owner', 'project-admin', 'project-manager']
  },
  {
    name: 'Observer',
    roles: ['project-observer'],
    propertyNameInCollection: 'assignedUsersIds',
    canBeAssignedBy: ['project-owner', 'project-admin', 'project-manager']
  }];