/**
 *
 *
 */


var PhotoEditor = function(width, height, src){

	this.editCtx = {
		x 		: 0,
		y 		: 0,
		width  	: 0,
		height 	: 0,
		rotate 	: 0
	}
	this.defaultCtx = {};
	this.moveBaseCtx = {};
	this.editCtxIdx = 0;
	this.editCtxLog = [];

	this.canvas 	= PhotoEditor.utils.makeCanvas(width, height);
	this.canvasCtx 	= this.canvas.getContext('2d');
	this.buffer 	= PhotoEditor.utils.makeCanvas(width*4, height*4);
	this.bufferCtx 	= this.buffer.getContext('2d');
	this.img 		= null;

	this.rangeX 	= 0;
	this.rangeY 	= 0;

	this.log 		= false;

	this.debug 		= false;

	if (typeof src !== 'undefined') {
		this.load(src);
	}

}


PhotoEditor.MIN_SCALE = 1;
PhotoEditor.MAX_SCALE = 1.5;


/**
 *
 * @param string src 
 * @param function onload
 * @param function onerror
 */
PhotoEditor.prototype.load = function(src, onload, onerror) {
	var self = this;
	self.img = new Image();
	self.img.onerror = function() {
		if ((typeof onerror).toLowerCase() === 'function') {
			onerror();
		}
	}
	self.img.onload = function(){
		self.initEditCtx();
		self.draw();
		if ((typeof onload).toLowerCase() === 'function') {
			onload();
		}
	};
	self.img.src = src;
}


/**
 *
 */
PhotoEditor.prototype.initEditCtx = function() {
	this.editCtxIdx = 0;
	this.editCtxLog = [];
	var rect = this.editRect();
	this.updateEditCtxPos(rect.x, rect.y, rect.w, rect.h);
	this.defaultCtx = PhotoEditor.utils.copy(this.editCtx);
	this.moveBaseCtx = PhotoEditor.utils.copy(this.editCtx);
}


/**
 * 編集矩形を作成する
 *
 */
PhotoEditor.prototype.editRect = function() {

	function make(priority) {
		var sx, sy, sw, sh,
			pos = {x:this.img.width/2,y:this.img.height/2};
	
		if (priority) {
			sw = this.canvas.width * this.img.height / this.canvas.height;
			sh = this.img.height;
		}
		else {
			sw = this.img.width;
			sh = this.canvas.height * this.img.width / this.canvas.width;
		}

		sx = pos.x - sw / 2;
		sy = pos.y - sh / 2;
	
		return {x:sx, y:sy, w:sw, h:sh};
	}

	var priorityToHeight = this.canvas.height >= this.canvas.width;
	var rect = make.call(this, priorityToHeight);

	if (!priorityToHeight && rect.y < 0
	 || priorityToHeight && rect.x < 0) {
		rect = make.call(this, !priorityToHeight);
	}

	return rect;

}


/**
 * 座標と最大XY値を更新する
 *
 */
PhotoEditor.prototype.updateEditCtxPos = function(x,y,width,height) {
	this.editCtx.x 		= x;
	this.editCtx.y 		= y;
	this.editCtx.width 	= width;
	this.editCtx.height = height;
	this.updateEditCtxLog();
}

/**
 * 編集ログを更新する
 *
 */
PhotoEditor.prototype.updateEditCtxLog = function(x,y,w,h) {
	if (this.log) {
		this.editCtxLog.splice(this.editCtxIdx+1, this.editCtxLog.length-1);
		this.editCtxLog.push(PhotoEditor.utils.copy(this.editCtx));
		this.editCtxIdx = this.editCtxLog.length-1;
	}
}




/**
 *
 */
PhotoEditor.prototype.draw = function() {

	this.drawBuffer();

	var x 	= this.editCtx.x;
	var y 	= this.editCtx.y;
	var w 	= this.editCtx.width;
	var h 	= this.editCtx.height;

	var width 	= this.buffer.width-this.img.width;
	var height 	= this.buffer.height-this.img.height;

	this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	this.canvasCtx.drawImage(this.buffer,width/2+x,height/2+y,w,h,0,0,this.canvas.width,this.canvas.height);

}

/**
 *
 */
PhotoEditor.prototype.drawBuffer = function() {

	var scale = 1;
	if (this.isReversed()) {
		if (
			this.defaultCtx.width > this.img.height
		 || this.defaultCtx.height < this.img.width
		) {
			scale = this.defaultCtx.width/this.img.height;
		}
		else if (
			this.defaultCtx.height > this.img.width
		 || this.defaultCtx.width < this.img.height) {
			scale = this.defaultCtx.height/this.img.width;
		}
	}




	if (this.isReversed()) {
		this.rangeX = ( this.img.height * scale - this.editCtx.width  )/2;
		this.rangeY = ( this.img.width  * scale - this.editCtx.height )/2;
	}
	else {
		this.rangeX = ( this.img.width  * scale - this.editCtx.width )/2;
		this.rangeY = ( this.img.height * scale - this.editCtx.height )/2;
	}


	var width 	= this.buffer.width-this.img.width;
	var height 	= this.buffer.height-this.img.height;

	this.bufferCtx.clearRect(0, 0, this.buffer.width, this.buffer.height);
	this.bufferCtx.save();
	this.bufferCtx.translate(this.buffer.width/2, this.buffer.height/2);
	this.bufferCtx.rotate(this.editCtx.rotate * Math.PI / 180);
	this.bufferCtx.scale(scale,scale);
    this.bufferCtx.translate( -1 * this.buffer.width/2, -1 * this.buffer.height/2 );    
	this.bufferCtx.drawImage(this.img, width/2, height/2, this.img.width, this.img.height);
	this.bufferCtx.restore();


	if (this.debug) {
		var x = width/2+this.editCtx.x;
		var y = height/2+this.editCtx.y;
		var w = this.editCtx.width;
		var h = this.editCtx.height;
		this.bufferCtx.fillStyle = 'rgba(192, 80, 77, 0.7)';
		this.bufferCtx.fillRect(x,y,w,h);
	}

}


/**
 * 拡大縮小する
 *
 * 初期状態から指定の比率に変形させる
 * MIN_SCALEからMAX_SCALEの範囲の値を受け付ける
 *
 * @param int scale 
 */
PhotoEditor.prototype.scale = function(scale) {

	if (scale < PhotoEditor.MIN_SCALE || scale > PhotoEditor.MAX_SCALE) {
		return;
	}

	scale = 1-(scale-1);

	var w = this.defaultCtx.width * scale;
	var h = this.defaultCtx.height * scale;
	var x = this.defaultCtx.x+(this.defaultCtx.width-w)/2
	var y = this.defaultCtx.y+(this.defaultCtx.height-h)/2

	this.updateEditCtxPos(x, y, w, h);
	this.moveBaseCtx = PhotoEditor.utils.copy(this.editCtx);

	this.draw();

}


/**
 * 回転させる
 *
 * 初期状態から指定の角度に変形させる
 *
 * @param int degree
 */
PhotoEditor.prototype.rotate = function(degree) {
	this.clear();
	this.editCtx.rotate = degree;
	this.updateEditCtxLog();
	this.draw();
}


/**
 * 移動
 *
 * 引数の値を座標に加算する
 *
 * @param int x 
 * @param int y
 */
PhotoEditor.prototype.move = function(x,y) {

	var moveX = this.editCtx.x + x;
	var moveY = this.editCtx.y + y;

	moveX = Math.min(Math.max(moveX, this.moveBaseCtx.x - this.rangeX), this.moveBaseCtx.x + this.rangeX)
	moveY = Math.min(Math.max(moveY, this.moveBaseCtx.y - this.rangeY), this.moveBaseCtx.y + this.rangeY)

	this.editCtx.x = moveX;
	this.editCtx.y = moveY;

	this.updateEditCtxLog();

	this.draw();

}


/**
 * 編集内容を初期状態に戻す
 *
 */
PhotoEditor.prototype.clear = function() {
	this.editCtx = $.extend({},this.defaultCtx);
	this.moveBaseCtx = PhotoEditor.utils.copy(this.editCtx);
	this.updateEditCtxLog();
	this.draw();
}


/**
 *
 */
PhotoEditor.prototype.undo = function() {
	if (this.editCtxIdx > 0) {
		this.editCtxIdx--;
		this.editCtx = PhotoEditor.utils.copy(this.editCtxLog[this.editCtxIdx]);
		this.draw();
	}
}

/**
 *
 */
PhotoEditor.prototype.isReversed = function() {
	return this.editCtx.rotate % 360 == 90 || this.editCtx.rotate % 360 == 270;
}


/**
 *
 */
PhotoEditor.prototype.redo = function() {
	if (this.editCtxIdx+1 < this.editCtxLog.length) {
		this.editCtxIdx++;
		this.editCtx = PhotoEditor.utils.copy(this.editCtxLog[this.editCtxIdx]);
		this.draw();
	}
}


/**
 *
 *
 */
PhotoEditor.utils = {
	copy : function(obj) {
		return JSON.parse(JSON.stringify(obj));
	}, 
	makeElm : function(name, props) {
		var elm = document.createElement(name);
		for (var name in props) {
			elm[name] = props[name];
		}
		return elm;
	},
	makeCanvas : function(width, height) {
		return PhotoEditor.utils.makeElm('canvas', {
			width 	: width,
			height 	: height
		});
	}
}



