var Monitoring = Monitoring || (function() {

  var stats = new MemoryStats();
  stats.domElement.style.position = 'fixed';
  stats.domElement.style.right        = '0px';
  stats.domElement.style.bottom       = '0px';
  document.body.appendChild( stats.domElement );
  requestAnimationFrame(function rAFloop(){
      stats.update();
      requestAnimationFrame(rAFloop);
  });

  var RenderRate = function () {
    var container = document.createElement( 'div' );
    container.id  = 'stats';
    container.style.cssText = 'width:150px;opacity:0.9;cursor:pointer;position:fixed;right:80px;bottom:0px;';

    var msDiv = document.createElement( 'div' );
    msDiv.id  = 'ms';
    msDiv.style.cssText = 'padding:0 0 3px 3px;text-align:left;background-color:#020;';
    container.appendChild( msDiv );

    var msText  = document.createElement( 'div' );
    msText.id = 'msText';
    msText.style.cssText = 'color:#0f0;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px';
    msText.innerHTML= 'Repaint rate: 0/sec';
    msDiv.appendChild( msText );

    var bucketSize = 20;
    var bucket = [];
    var lastTime  = Date.now();
    return {
      domElement: container,
      ping: function () {
        var start = lastTime;
        var stop = Date.now();
        var rate = 1000 / (stop - start);
        bucket.push(rate);
        if (bucket.length > bucketSize) {
          bucket.shift();
        }
        var sum = 0;
        for (var i = 0; i < bucket.length; i++) {
          sum = sum + bucket[i];
        }
        msText.textContent = "Repaint rate: " + (sum / bucket.length).toFixed(2) + "/sec";
        lastTime = stop;
      }
    }
  };

  var renderRate = new RenderRate();
  document.body.appendChild( renderRate.domElement );

  return {
    memoryStats: stats,
    renderRate: renderRate
  };
  
})();
