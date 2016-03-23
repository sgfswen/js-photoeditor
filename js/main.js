$(function(){

	var editor = new PhotoEditor(400,300);
	editor.load('data/image3.png', 
		function(){
			if (editor.debug) {
				$('body').append($(editor.buffer));
			}
			console.log('complete');
		}, 
		function(){
			console.log('error!');
		}
	);

	// 
	var stats;
	if (editor.debug) {
		stats = new Stats();
		stats.domElement.style.position = 'fixed';
		stats.domElement.style.right	= '5px';
		stats.domElement.style.top 		= '5px';
		document.body.appendChild( stats.domElement );
	}

	// 
	var update = function () {

		if (stats){
			stats.update();	
		}

		editor.render();
		requestAnimationFrame( update );
	};
	requestAnimationFrame( update );


	var degree = 0;
	$('#rotate').click(function(){
		degree += 90;
		editor.rotate(degree);
		$('#scale').val(100);
	});

	var scale = 100;
	$('#scale').change(function(){
		var scale = $(this).val();
		editor.scale(scale/100);
	}).val(scale);

	$('body').append($(editor.canvas));

	var value = 10;
	$('#up').click(function(){ editor.move(0,- value);});
	$('#down').click(function(){ editor.move(0,value);});
	$('#left').click(function(){ editor.move(- value,0);});
	$('#right').click(function(){ editor.move(value,0);});

	$('#clear').click(function(){ editor.clear();});
	$('#undo').click(function(){ editor.undo();});
	$('#redo').click(function(){ editor.redo();});


	$('#IMG1').click(function(){ editor.load('data/image1.png'); $('#scale').val(100); });
	$('#IMG2').click(function(){ editor.load('data/image2.png'); $('#scale').val(100); });
	$('#IMG3').click(function(){ editor.load('data/image3.png'); $('#scale').val(100); });






	(function(){
		var isDragging = false, prevX, prevY;
		function onMouseDown( event ) {
			event.preventDefault();
			isDragging = true;
			prevX = event.clientX;
			prevY = event.clientY;
		}
		function onMouseMove( event ) {
			if ( isDragging === true ) {
				var x = prevX - event.clientX;
				var y = event.clientY - prevY;
				prevX = event.clientX;
				prevY = event.clientY;
				editor.move(x,- y);
			}
		}
		function onMouseUp( event ) {
			isDragging = false;
		}
		editor.canvas.addEventListener( 'mousedown', onMouseDown, false );
		editor.canvas.addEventListener( 'mousemove', onMouseMove, false);
		editor.canvas.addEventListener( 'mouseup', onMouseUp, false );
		editor.canvas.addEventListener( 'mouseleave', onMouseUp, false );
	})();


	(function(){
		function onMouseWheel( event ) {
			event.preventDefault();
			var delta = event.wheelDeltaY ?
							event.wheelDeltaY : event.wheelDelta ? 
								event.wheelDelta : event.detail ? 
									event.detail : 0;
			scale += delta > 0 ? 0.5 : -0.5;
			scale = Math.min(Math.max(scale, 100), 150);
			editor.scale(scale/100);
		}
		editor.canvas.addEventListener( 'mousewheel', onMouseWheel, false );
		editor.canvas.addEventListener( 'MozMousePixelScroll', onMouseWheel, false);
	})();


	(function(){

		// 
		var isTouching = false, prevX, prevY;
		var isGesturing = false, prevScale;

		// touch event handlers
		function onTouchStart( event ) {
			event.preventDefault();
			isTouching = true;
			prevX = event.targetTouches[0].pageX;
			prevY = event.targetTouches[0].pageY;
			if (event.targetTouches.length > 1) {
				isGesturing = true;
				prevScale = calcScale(event);
			}
		}
		function onTouchMove ( event ) {
			if ( isTouching && !isGesturing) {
				var x = prevX - event.targetTouches[0].pageX;
				var y = event.targetTouches[0].pageY - prevY;
				prevX = event.targetTouches[0].pageX;
				prevY = event.targetTouches[0].pageY;
				editor.move(x,- y);
			}
			else if (isGesturing) {
				scale += (calcScale(event) - prevScale)*0.1;
				prevScale = calcScale(event);
				scale = Math.min(Math.max(scale, 100), 150);
				editor.scale(scale/100);
			}
		}
		function onTouchEnd ( event ) {
			isGesturing = false;
			isTouching = false;
		}

		function calcScale(event) {
			return Math.sqrt(Math.pow((event.targetTouches[1].pageX - event.targetTouches[0].pageX),2)
				 + Math.pow((event.targetTouches[1].pageY - event.targetTouches[0].pageY),2));
		}

		editor.canvas.addEventListener( 'touchstart', onTouchStart, false );
		editor.canvas.addEventListener( 'touchmove', onTouchMove, false );
		editor.canvas.addEventListener( 'touchend', onTouchEnd, false );

	})();



});

