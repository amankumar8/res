formatChartLabel = function (value) {
  let ms = value * 60 * 60 * 1000;
  let hours = parseInt(moment.duration(ms).asHours());
  if (hours < 10) {
    hours = '0' + hours;
  }
  return hours + moment.utc(ms).format(':mm:ss')
};