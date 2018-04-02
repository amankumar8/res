import chai from 'chai';
import sinon from 'sinon';
import deepFreeze from 'deepfreeze';
import sinonChai from 'sinon-chai';
chai.should();
chai.use(sinonChai);
const expect = chai.expect;

export {
  chai,
  sinon,
  expect,
  deepFreeze
}

