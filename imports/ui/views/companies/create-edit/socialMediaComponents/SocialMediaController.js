import { ReactiveVar } from 'meteor/reactive-var';
import { socialMediaList } from './utils/utils.js';

export class SocialMediaController {
  constructor() {
    this.isInitialized = false;
    this.isWorking = new ReactiveVar(false);
    this.allowedTypes = new ReactiveVar(socialMediaList, (a, b) => a.length === b.length);
    this._collection = new ReactiveVar();
  }

  get initialized() {
    return this.isInitialized;
  }

  set initialized(value) {
    this.isInitialized = value;
  }

  get working() {
    return this.isWorking.get();
  }

  set collection(_collection) {
    this._collection =  _collection;
  }

  get socialMedia() {
    return this._collection.find({}, { fields: { _id: 0 } }).fetch();
  }

  get currentlyAllowedTypes() {
    return this.allowedTypes.get();
  }

  set currentlyAllowedTypes(value) {
    this.allowedTypes.set(value);
  }

  removeFromAllowedTypes(typeToRemove) {
    const currentTypes = this.allowedTypes.get().filter(type => type !== typeToRemove);
    this.allowedTypes.set(currentTypes);
  }

  addToAllowedTypes(typeToAdd) {
    const currentTypes = Array.from(this.allowedTypes.get());
    currentTypes.push(typeToAdd);
    this.allowedTypes.set(currentTypes);
  }

  startWorking() {
    this.isWorking.set(true);
  }

  reset() {
    this._collection.remove({});
    this.allowedTypes.set(socialMediaList);
    this.isInitialized = false;
    this.isWorking.set(false);
  }
}
