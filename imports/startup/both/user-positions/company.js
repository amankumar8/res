export const companyUserPositions = [
  {
    name: 'Owner',
    roles: ['company-owner', 'company-admin', 'company-manager', 'company-worker', 'company-observer'],
    propertyNameInCollection: 'workersIds',
    canBeAssignedBy: ['company-owner']
  },
  {
    name: 'Admin',
    roles: ['company-admin', 'company-manager', 'company-worker', 'company-observer'],
    propertyNameInCollection: 'workersIds',
    canBeAssignedBy: ['company-owner', 'company-admin']
  },
  {
    name: 'Manager',
    roles: ['company-manager', 'company-worker', 'company-observer'],
    propertyNameInCollection: 'workersIds',
    canBeAssignedBy: ['company-owner', 'company-admin']
  }, {
    name: 'Worker',
    roles: ['company-worker'],
    propertyNameInCollection: 'workersIds',
    canBeAssignedBy: ['company-owner', 'company-admin', 'company-manager']
  },
  {
    name: 'Observer',
    roles: ['company-observer'],
    propertyNameInCollection: 'workersIds',
    canBeAssignedBy: ['company-owner', 'company-admin', 'company-manager']
  }];