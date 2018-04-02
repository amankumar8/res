import { periodMover } from './periodMover.js';

export const oneSecond = 1000;
export const oneMinute = 60 * oneSecond;
export const oneHour = 60 * oneMinute;

export function addZero(number) {
  return number < 10 ? `0${number}` : `${number}`;
}

export {
  periodMover
};
