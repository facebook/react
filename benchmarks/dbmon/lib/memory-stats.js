/**
 * @author mrdoob / http://mrdoob.com/
 * @author jetienne / http://jetienne.com/
 * @author paulirish / http://paulirish.com/
 */
var MemoryStats = function (){

	var msMin	= 100;
	var msMax	= 0;

	var container	= document.createElement( 'div' );
	container.id	= 'stats';
	container.style.cssText = 'width:80px;opacity:0.9;cursor:pointer';

	var msDiv	= document.createElement( 'div' );
	msDiv.id	= 'ms';
	msDiv.style.cssText = 'padding:0 0 3px 3px;text-align:left;background-color:#020;';
	container.appendChild( msDiv );

	var msText	= document.createElement( 'div' );
	msText.id	= 'msText';
	msText.style.cssText = 'color:#0f0;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px';
	msText.innerHTML= 'Memory';
	msDiv.appendChild( msText );

	var msGraph	= document.createElement( 'div' );
	msGraph.id	= 'msGraph';
	msGraph.style.cssText = 'position:relative;width:74px;height:30px;background-color:#0f0';
	msDiv.appendChild( msGraph );

	while ( msGraph.children.length < 74 ) {

		var bar = document.createElement( 'span' );
		bar.style.cssText = 'width:1px;height:30px;float:left;background-color:#131';
		msGraph.appendChild( bar );

	}

	var updateGraph = function ( dom, height, color ) {

		var child = dom.appendChild( dom.firstChild );
		child.style.height = height + 'px';
		if( color ) child.style.backgroundColor = color;

	}

	var perf = window.performance || {};
	// polyfill usedJSHeapSize
	if (!perf.memory){
		perf.memory = { usedJSHeapSize : 0 };
	}

	// support of the API?
	if( perf.memory.totalJSHeapSize === 0 ){
		console.warn('totalJSHeapSize === 0... performance.memory is only available in Chrome .')
	}

	// TODO, add a sanity check to see if values are bucketed.
	// If so, remind user to adopt the --enable-precise-memory-info flag.
	// open -a "/Applications/Google Chrome.app" --args --enable-precise-memory-info

	var lastTime	= Date.now();
	var lastUsedHeap= perf.memory.usedJSHeapSize;
	return {
		domElement: container,

		update: function () {

			// refresh only 30time per second
			if( Date.now() - lastTime < 1000/30 )	return;
			lastTime	= Date.now()

			var delta	= perf.memory.usedJSHeapSize - lastUsedHeap;
			lastUsedHeap	= perf.memory.usedJSHeapSize;
			var color	= delta < 0 ? '#830' : '#131';

			var ms	= perf.memory.usedJSHeapSize;
			msMin	= Math.min( msMin, ms );
			msMax	= Math.max( msMax, ms );
			msText.textContent = "Mem: " + bytesToSize(ms, 2);

			var normValue	= ms / (30*1024*1024);
			var height	= Math.min( 30, 30 - normValue * 30 );
			updateGraph( msGraph, height, color);

			function bytesToSize( bytes, nFractDigit ){
				var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
				if (bytes == 0) return 'n/a';
				nFractDigit	= nFractDigit !== undefined ? nFractDigit : 0;
				var precision	= Math.pow(10, nFractDigit);
				var i 		= Math.floor(Math.log(bytes) / Math.log(1024));
				return Math.round(bytes*precision / Math.pow(1024, i))/precision + ' ' + sizes[i];
			};
		}

	}

};
