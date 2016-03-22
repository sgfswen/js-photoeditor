$(function(){

	var editor = new PhotoEditor(400,300);
	editor.load('data/image3.png', 
		function(){
			console.log('complete');
		}, 
		function(){
			console.log('error!');
		}
	);








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
	$('body').append($(editor.buffer));

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
			prevX = event.changedTouches[0].pageX;
			prevY = event.changedTouches[0].pageY;
		}
		function onTouchMove ( event ) {
			if ( isTouching && !isGesturing) {
				var x = prevX - event.changedTouches[0].pageX;
				var y = event.changedTouches[0].pageY - prevY;
				prevX = event.changedTouches[0].pageX;
				prevY = event.changedTouches[0].pageY;
				editor.move(x,- y);
			}
		}
		function onTouchEnd ( event ) {
			isTouching = false;
		}

		// gesture event handlers
		function onGestureStart( event ) {
			event.preventDefault();
			isGesturing = true;
			prevScale = event.scale;
		}
		function onGestureChage( event ) {
			if (isGesturing) {
				scale += (event.scale - prevScale)*10;
				prevScale = event.scale;
				scale = Math.min(Math.max(scale, 100), 150);
				editor.scale(scale/100);
			}
		}
		function onGestureEnd( event ) {
			isGesturing = false;
		}

		editor.canvas.addEventListener( 'touchstart', onTouchStart, false );
		editor.canvas.addEventListener( 'touchmove', onTouchMove, false );
		editor.canvas.addEventListener( 'touchend', onTouchEnd, false );
		editor.canvas.addEventListener( 'gesturestart', onGestureStart, false );
		editor.canvas.addEventListener( 'gesturechange', onGestureChage, false );
		editor.canvas.addEventListener( 'gestureend', onGestureEnd, false );

	})();


});

