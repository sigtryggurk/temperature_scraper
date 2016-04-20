var async_helper = require('./async_helper');
var util = require('util');
var phantom = require('phantom');

function createCrawler(host, path_format, zipcode, loc)
{
  var path = util.format(path_format, zipcode);
  return function (first_callback)
  {
    phantom.create(function (phantom) 
    {
      phantom.createPage(function(page)
      {
        page.set('onError', function(msg, trace) 
        {
          var msgStack = ['ERROR: ' + msg];
          if (trace && trace.length) 
          {
            msgStack.push('TRACE:');
            trace.forEach(function(t) {
              msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
            });
          }
        });
        page.set('onLoadFinished', function() 
        {
          /* timeout needed because onLoadFinished event is unreliable */
          setTimeout(function () 
          {
            page.evaluate(function(loc) {return document.querySelector(loc).innerHTML}, 
                          function(res){
 	 			         if(res==null)
 				         {
					   first_callback("No temperature found on: " + host, null);
					 }
 					 else
					 {
					   first_callback(null, res);
					 }
                                       }, 
                          loc);
            phantom.exit(0);
          }, 3000);
        });
        page.open(host+path);
      });
    });
 };
}

function getAvgTemp(zipcode)
{
  var isError = false
  var last_callback = function(err, results)
  {
    if(err)
    {
      isError = true;
      console.log('Error: ' + err);
    }
    else if(results && !isError)
    {
      sum = 0
      results.forEach(function(result){
        result = result.match(/\d+/)[0];
        sum += parseFloat(result);
      });
      avgTemp = sum/results.length;
      console.log(util.format("Average Temperature is %d Fahrenheit", avgTemp));
    }
  }


  var wundergroundCrawler = createCrawler('http://www.wunderground.com', '/cgi-bin/findweather/hdfForecast?query=%d', zipcode, 'div#curTemp span.wx-data span.wx-value');
  var weathercomCrawler = createCrawler('http://www.weather.com', '/weather/today/l/%d:4:US', zipcode, 'div.temperature span.ng-scope.ng-binding');
  var weathergovCrawler = createCrawler('http://forecast.weather.gov', '/zipcity.php?inputstring=%d', zipcode,'p.myforecast-current-lrg');

  var arr = [wundergroundCrawler, weathercomCrawler, weathergovCrawler];
  async_helper.execute_async(arr, 2, last_callback);

}

getAvgTemp(94040);
