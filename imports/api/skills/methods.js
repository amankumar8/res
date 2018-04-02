import {Skills} from  '/imports/api/skills/skills';
import {SkillsSchema} from './skills';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

export const addSkill = new ValidatedMethod({
    name: 'skills.addSkill',
    validate: SkillsSchema.validator(),
    run(skillDoc) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('skills.addSkill.notLoggedIn',
                'Must be logged in.');
        }
        return Skills.insert(skillDoc);
    }
});

export const deleteSkill = new ValidatedMethod({
    name: 'skills.deleteSkill',
    validate: SkillsSchema.validator(),
    run(skillId) {
        const userId = this.userId;
        if (!userId) {
            throw new Meteor.Error('skills.deleteSkill.notLoggedIn',
                'Must be logged in.');
        }
        Skills.remove(skillId);
    }
});