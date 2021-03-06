function pdcGauge() {
  // defaults
  var w = 450, h = 450;
  var outerRadius = (w / 2) - 10;
  var innerRadius = (w / 2) - 45;
  var optimalPDC = 0.80

  var color = ['#cc0000', '#37baab'];
  var selector = 'body';
  var amount = 265;
  var total = 365;
  var pdc = (amount / total) * 100;

  // getters and setters
  gauge.selector = function(value) {
    if (!arguments.length) { return selector; }
    selector = value;
    return gauge;
  }

  gauge.pdc = function(value) {
    if (!arguments.length) { return pdc; }
    pdc = value;
    return gauge;
  }


  // Set up gauge
  function gauge() {

    // Remove guage if it already exists
    d3.select(gauge.selector()).selectAll('svg.gauge').remove();

    var ratio = pdc;
    var piPercent = Math.PI * ratio;
    var optimalPiPercent = Math.PI * optimalPDC;

    // Draw Gauge
    drawGauge();

    // Draw gauge variables
    function drawGauge() {

      var arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle(0)
        .endAngle(Math.PI);

      var arcLine = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle(0)
        .endAngle(piPercent);

      var optimalLine = d3.arc()
        .innerRadius(innerRadius-10)
        .outerRadius(outerRadius+15)
        .startAngle(optimalPiPercent+.02)
        .endAngle(optimalPiPercent);

      var svg = d3.select(gauge.selector())
        .append('svg')
        .attr('width', w)
        .attr('height', h)
        .append('g')
        .attr('class', 'pdc-gauge')
        .attr('transform', 'translate(' + w / 2 + ',' + h / 2  + ')');
        ;

      var path = svg.append('path')
        .attr("d", arc)
        .attr("transform", 'rotate(-90)')
        .attr("fill", color[0]);

      var path2 = svg.append('path')
        .attr("d", arcLine)
        .attr("transform", 'rotate(-90)')
        .attr("fill", color[1]);

      var path3 = svg.append('path')
        .attr("d", optimalLine)
        .attr("transform", 'rotate(-90)')
        .attr("fill", 'black');

      var middleCount = svg.append('text')
        .text(Math.round(pdc*100) + "%")
        .attr('class', 'display-1')
        .attr('text-anchor', 'middle');

      // var optimalText = svg.append('text')
      //   .text("Optimal is >80%")
      //   .attr('transform', 'translate(' + 140 + ',' + -180 + ')');
    }
  };

  return gauge;
}
;