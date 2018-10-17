
function calendarHeatmap() {
  // defaults
  var width = 1100;
  var height = 110;
  var legendWidth = 150;
  var selector = 'body';
  var SQUARE_LENGTH = 5;
  var SQUARE_WIDTH = 2;
  var SQUARE_HEIGHT = 20;
  var SQUARE_PADDING = 0;
  var MONTH_LABEL_PADDING = 6;
  var now = moment().endOf('day').toDate();
  var yearAgo = moment().startOf('day').subtract(1, 'year').toDate();
  var startDate = null;
  var counterMap= {};
  var gapMap = {};
  var data = [];
  var max = null;
  var colorRange = ['#cc0000', '#37baab'];
  var tooltipEnabled = true;
  var tooltipUnit = 'pill';
  var legendEnabled = true;
  var onClick = null;
  var weekStart = 0; //0 for Sunday, 1 for Monday
  var locale = {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    days: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    No: 'No',
    on: 'on',
    Less: 'Gap',
    More: 'Covered'
  };
  var v = Number(d3.version.split('.')[0]);

  // setters and getters
  chart.data = function (value) {
    if (!arguments.length) { return data; }
    data = value;

    counterMap= {};
    gapMap= {};

    data.forEach(function (element, index) {
        var key= moment(element.date).format( 'YYYY-MM-DD' );
        var counter= counterMap[key] || 0;
        counterMap[key]= counter + element.count;
        gapMap[key]= element.gap;
    });

    return chart;
  };

  chart.max = function (value) {
    if (!arguments.length) { return max; }
    max = value;
    return chart;
  };

  chart.selector = function (value) {
    if (!arguments.length) { return selector; }
    selector = value;
    return chart;
  };

  chart.startDate = function (value) {
    if (!arguments.length) { return startDate; }
    yearAgo = value;
    now = moment(value).endOf('day').add(1, 'year').toDate();
    return chart;
  };

  chart.colorRange = function (value) {
    if (!arguments.length) { return colorRange; }
    colorRange = value;
    return chart;
  };

  chart.tooltipEnabled = function (value) {
    if (!arguments.length) { return tooltipEnabled; }
    tooltipEnabled = value;
    return chart;
  };

  chart.tooltipUnit = function (value) {
    if (!arguments.length) { return tooltipUnit; }
    tooltipUnit = value;
    return chart;
  };

  chart.legendEnabled = function (value) {
    if (!arguments.length) { return legendEnabled; }
    legendEnabled = value;
    return chart;
  };

  chart.onClick = function (value) {
    if (!arguments.length) { return onClick(); }
    onClick = value;
    return chart;
  };

  chart.locale = function (value) {
    if (!arguments.length) { return locale; }
    locale = value;
    return chart;
  };

  function chart() {

    d3.select(chart.selector()).selectAll('svg.calendar-heatmap').remove(); // remove the existing chart, if it exists

    var dateRange = ((d3.time && d3.time.days) || d3.timeDays)(yearAgo, now); // generates an array of date objects within the specified range
    var monthRange = ((d3.time && d3.time.months) || d3.timeMonths)(moment(yearAgo).startOf('month').toDate(), now); // it ignores the first month if the 1st date is after the start of the month
    var firstDate = moment(dateRange[0]);
    if (chart.data().length == 0) {
      max = 0;
    } else if (max === null) {
      max = d3.max(chart.data(), function (d) { return d.count; }); // max data value
    }

    var tooltip;
    var dayRects;

    drawChart();

    function drawChart() {
      var svg = d3.select(chart.selector())
        .style('position', 'relative')
        .append('svg')
        .attr('width', width)
        .attr('class', 'calendar-heatmap')
        .attr('height', height)
        .style('padding', '36px 0');

      dayRects = svg.selectAll('.day-cell')
        .data(dateRange);  //  array of days for the last yr

      var enterSelection = dayRects.enter().append('rect')
        .attr('class', 'day-cell')
        .attr('width', SQUARE_WIDTH)
        .attr('height', SQUARE_HEIGHT) 
        .attr('fill', function(d) { 
          return ((medGap(d) ? chart.colorRange()[0] : chart.colorRange()[1])) 
        })
        .attr('x', function (d, i) {
          return i * (SQUARE_WIDTH + SQUARE_PADDING);
        })
        .attr('y', function (d, i) {
          var gap = (medGap(d) ? 2 : 1);
          return MONTH_LABEL_PADDING + (gap * (SQUARE_HEIGHT + SQUARE_PADDING));
        });

      if (typeof onClick === 'function') {
        (v === 3 ? enterSelection : enterSelection.merge(dayRects)).on('click', function(d) {
          var count = countForDate(d);
          onClick({ date: d, count: count});
        });
      }

      if (chart.tooltipEnabled()) {
        (v === 3 ? enterSelection : enterSelection.merge(dayRects)).on('mouseover', function(d, i) {
          tooltip = d3.select(chart.selector())
            .append('div')
            .attr('class', 'day-cell-tooltip')
            .html(tooltipHTMLForDate(d))
            .style('left', function () { return i * SQUARE_WIDTH + 'px'; })
            .style('top', function () {
              var yPosition = () => {if(medGap(d) ? 2 : 1);};
              return ((SQUARE_HEIGHT + SQUARE_PADDING) + MONTH_LABEL_PADDING * 2 + 'px');  
            });
        })
        .on('mouseout', function (d, i) {
          tooltip.remove();
        });
      }

      if (chart.legendEnabled()) {

        var legendGroup = svg.append('g');
        legendGroup.selectAll('.calendar-heatmap-legend')
            .data(chart.colorRange())
            .enter()
          .append('rect')
            .attr('class', 'calendar-heatmap-legend')
            .attr('width', SQUARE_WIDTH*4)
            .attr('height', SQUARE_HEIGHT)
            .attr('x', function (d, i) { return (width - legendWidth) + (i + 1) * 13; })
            .attr('y', height + SQUARE_PADDING)
            .attr('fill', function (d) { return d; });

        legendGroup.append('text')
          .attr('class', 'calendar-heatmap-legend-text calendar-heatmap-legend-text-less')
          .attr('x', width - legendWidth - 20)
          .attr('y', height + SQUARE_HEIGHT)
          .text(locale.Less);

        legendGroup.append('text')
          .attr('class', 'calendar-heatmap-legend-text calendar-heatmap-legend-text-more')
          .attr('x', (width - legendWidth + SQUARE_PADDING) + (colorRange.length + 1) * 14)
          .attr('y', height + SQUARE_HEIGHT)
          .text(locale.More);
      }

      dayRects.exit().remove();
      var monthLabels = svg.selectAll('.month')
          .data(monthRange)
          .enter().append('text')
          .attr('class', 'month-name')
          .text(function (d) {
            return locale.months[d.getMonth()];
          })
          .attr('x', function (d, i) {
            var matchIndex = 0;
            dateRange.find(function (element, index) {
              matchIndex = index;
              return moment(d).isSame(element, 'month') && moment(d).isSame(element, 'year');
            });

            return Math.floor(matchIndex) * (SQUARE_WIDTH + SQUARE_PADDING);
          })
          .attr('y', 0);  // fix these to the top
    }

    function pluralizedTooltipUnit (count) {
      if ('string' === typeof tooltipUnit) {
        return (tooltipUnit + (count === 1 ? '' : 's'));
      }
      for (var i in tooltipUnit) {
        var _rule = tooltipUnit[i];
        var _min = _rule.min;
        var _max = _rule.max || _rule.min;
        _max = _max === 'Infinity' ? Infinity : _max;
        if (count >= _min && count <= _max) {
          return _rule.unit;
        }
      }
    }

    function tooltipHTMLForDate(d) {
      var dateStr = moment(d).format('ddd, MMM Do YYYY');
      var count = countForDate(d);
      return '<span><strong>' + (count != 0 ? count : locale.No) + ' ' + pluralizedTooltipUnit(count) + '</strong> ' + locale.on + ' ' + dateStr + '</span>';
    }

    function countForDate(d) {
        var key= moment(d).format( 'YYYY-MM-DD' );
        return counterMap[key] || 0;
    }

    function medGap(d) {
      var key= moment(d).format( 'YYYY-MM-DD' );
      return gapMap[key]
    }

    var daysOfChart = chart.data().map(function (day) {
      return day.date.toDateString();
    });

  }

  return chart;
}


// polyfill for Array.find() method
/* jshint ignore:start */
if (!Array.prototype.find) {
  Array.prototype.find = function (predicate) {
    if (this === null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}
/* jshint ignore:end */
