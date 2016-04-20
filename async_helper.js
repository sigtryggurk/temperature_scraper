var async = require('async');
var http = require('http'); 

var test = false;

function execute_async(funcArray, numFuncsNeeded, last_callback)
{
  var results = [];
  var count = 0;
  var isDone = false;
  var asyncTasks = [];
   
  var callbackHelper = function(err, result)
  {
    if(isDone)
    {
      last_callback(null,null);
    }
    if(err) 
    {
      isDone = true;
      last_callback(err, null);
    }  
    else if (result) 
    {
      count++;
      results.push(result);
    
      if (count == numFuncsNeeded) 
      {
        isDone = true;
        last_callback(null, results);
      }
    } 
  };
  
  funcArray.forEach(function(func){
    asyncTasks.push(function(ignore){
      func(callbackHelper);
    });
  });

  async.parallel(asyncTasks);
}
exports.execute_async = execute_async;

/* TEST case */
if (test) 
{
  var arr = [
    function(callback){
        setTimeout(function(){
            callback(null, 'one');
        }, 200);
    },
    function(callback){
        setTimeout(function(){
            callback(null, 'two');
        }, 100);
    }
  ];

  var printResults = function(err, results) {
    if(err) 
    {
      console.log('Error: ' + err);
    } 
    else 
    {
      results.forEach(function(result){
        console.log(result);
      });
    }
  }

  execute_async(arr, 1, printResults);
}

