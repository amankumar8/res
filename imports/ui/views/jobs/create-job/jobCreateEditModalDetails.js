import './jobCreateEditModalDetails.html';
import {Jobs} from "../../../../api/jobs/jobs";

Template.jobCreateEditModalDetails.onRendered(function() {
  let $input = this.$('textarea');
  let $counterElement = $input.parent().find('span[class="character-counter"]');
  if ($counterElement.length) {
    return;
  }
  let itHasLengthAttribute = $input.attr('data-length') !== undefined;

  if(itHasLengthAttribute){
    $input.on('input', updateCounter);
    $input.on('focus', updateCounter);
    $input.on('blur', removeCounterElement);
    addCounterElement($input);
  }

  function updateCounter(){
    let maxLength     = 10000,
      minLength       = 140,
      actualLength      = +$(this).val().length,
      isValidLength     = actualLength <= maxLength && actualLength >= minLength;

    if (isValidLength) {
      $(this).parent().find('span[class="character-counter"]').html('<span id="currentCount">' + actualLength + '</span>' + '/' + (minLength + '-' + maxLength));
      document.getElementById('currentCount').style.color = 'green';
    } else {
      $(this).parent().find('span[class="character-counter"]').html('<span id="currentCount">' + actualLength + '</span>' + '/' + (minLength + '-' + maxLength));
      document.getElementById('currentCount').style.color = 'red';
    }
    addInputStyle(isValidLength, $(this));
  }

  function addCounterElement($input) {
    let $counterElement = $input.parent().find('span[class="character-counter"]');
    if ($counterElement.length) {
      return;
    }
    $counterElement = $('<span/>')
      .addClass('character-counter')
      .css('float','right')
      .css('font-size','12px')
      .css('height', 1);

    $input.parent().append($counterElement);
  }

  function removeCounterElement(){
    $('textarea').parent().find('span[class="character-counter"]').html('');
  }

  function addInputStyle(isValidLength, $input){
    let inputHasInvalidClass = $input.hasClass('invalid');
    if (isValidLength && inputHasInvalidClass) {
      $input.removeClass('invalid');
    }
    else if(!isValidLength && !inputHasInvalidClass){
      $input.removeClass('valid');
      $input.addClass('invalid');
    }
  }
});

Template.jobCreateEditModalDetails.helpers({
  getDescription() {
    const job = Jobs.findOne(Template.instance().data.jobId, {fields: {description: 1}});
    return job && job.description;
  }
});
