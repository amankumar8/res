import './loading.html';

Template.loading.onRendered(function() {
  this.setLoadingSrc = () => {
    const desktopWidth = 1200,
          mobileWidth = 600;

    const mobileVideoSrc = '/loading/loading.mp4',
          tabletVideoSrc = '/loading/loading.mp4',
          desktopVideoSrc = '/loading/loading.mp4';

    let currWidth = $(window).width();

    let $video = $('video');
    let $source = $('video source');;
    let src = $source.attr('src');
    if (currWidth >= desktopWidth) {
      $source.attr('src', desktopVideoSrc)
    }
    if (currWidth < desktopWidth && currWidth > mobileWidth) {
      $source.attr('src', tabletVideoSrc)
    }
    if (currWidth <= mobileWidth) {
      $source.attr('src', mobileVideoSrc)
    }
    if ($source.attr('src') !== src) {
      $video[0].load();
    }

  };

  this.setLoadingSrc();
  $(window).on('resize', this.setLoadingSrc);


  Materialize.fadeInImage('.loading-wrapper')
});


Template.loading.onDestroyed(function() {
  $(window).off('resize', this.setLoadingSrc);
});