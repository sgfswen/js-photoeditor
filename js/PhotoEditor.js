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
	this.defaultCtx 	= {};
	this.editCtxIdx 	= 0;
	this.editCtxLog 	= [];

	this.canvas 	= PhotoEditor.utils.makeCanvas(width, height);
	this.canvasCtx 	= this.canvas.getContext('2d');
	this.buffer 	= null;
	this.bufferCtx 	= null;
	this.img 		= null;

	this.minX 		= 0;
	this.minY 		= 0;
	this.maxX 		= 0;
	this.maxY 		= 0;

	this.log 		= false;

	this.debug 		= false;

	this.isReady 	= false;
	this.updated 	= false;

	if (typeof src !== 'undefined') {
		this.load(src);
	}

}


PhotoEditor.MIN_SCALE = 1.0;
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
		self.init();
		if ((typeof onload).toLowerCase() === 'function') {
			onload();
		}
	};
	self.img.src = src;
}


/**
 *
 */
PhotoEditor.prototype.init = function() {

	this.editCtxIdx = 0;
	this.editCtxLog = [];

	var rect = this.editRect();
	this.updateEditCtxPos(rect.x, rect.y, rect.w, rect.h);

	this.defaultCtx = PhotoEditor.utils.copy(this.editCtx);

	var s 			= Math.max(this.calcScale(true), this.calcScale(false));
	var w 			= Math.max(this.img.width, this.img.height);
	this.buffer 	= PhotoEditor.utils.makeCanvas(w*s, w*s);
	this.bufferCtx 	= this.buffer.getContext('2d');

	this.isReady = true;

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
	this.updateMoveRange();
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
	this.updated = true;
}

/**
 * 移動範囲の座標幅を更新
 *
 */
PhotoEditor.prototype.updateMoveRange = function() {

	var scale = this.calcScale(this.isReversed());

	if (this.isReversed()) {
		this.minX = (this.img.width  - this.img.height * scale)/2;
		this.maxX =  this.img.height < this.img.width
				  ? (this.img.width  - this.img.height * scale)/2 + this.defaultCtx.height - this.editCtx.height
				  : (this.img.height * scale - this.img.width )/2 + this.defaultCtx.width  - this.editCtx.width;
		this.minY = (this.img.height - this.img.width  * scale)/2;
		this.maxY =  this.img.height > this.img.width 
				  ? (this.img.height - this.img.width  * scale)/2 + this.defaultCtx.width  - this.editCtx.width
				  : (this.img.width  * scale - this.img.height)/2 + this.defaultCtx.height - this.editCtx.height;
	}
	else {
		this.minX = 0;
		this.minY = 0;
		this.maxX = (this.img.width  * scale - this.editCtx.width);
		this.maxY = (this.img.height * scale - this.editCtx.height);
	}

}


/**
 *
 */
PhotoEditor.prototype.render = function() {

	if (!this.isReady || !this.updated) {
		return;
	}

	this.prerender();

	var x 	= this.editCtx.x;
	var y 	= this.editCtx.y;
	var w 	= this.editCtx.width;
	var h 	= this.editCtx.height;

	var width 	= this.buffer.width-this.img.width;
	var height 	= this.buffer.height-this.img.height;

	this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	this.canvasCtx.drawImage(this.buffer,width/2+x,height/2+y,w,h,0,0,this.canvas.width,this.canvas.height);

	this.updated = false;
}

/**
 *
 */
PhotoEditor.prototype.prerender = function() {

	var scale = this.calcScale(this.isReversed());

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
 * 縦横と回転状況によって拡縮率を計算
 * @return int 
 */
PhotoEditor.prototype.calcScale = function(isReversed) {
	var scale = 1;
	if (isReversed) {
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
	return scale;
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
	var x = this.editCtx.x+(this.editCtx.width-w)/2;
	var y = this.editCtx.y+(this.editCtx.height-h)/2;
	this.updateEditCtxPos(x, y, w, h);
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
	this.updateMoveRange();
	this.updateEditCtxLog();
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

	moveX = Math.min(Math.max(moveX, this.minX), this.maxX);
	moveY = Math.min(Math.max(moveY, this.minY), this.maxY);

	this.editCtx.x = moveX;
	this.editCtx.y = moveY;

	this.updateEditCtxLog();

}


/**
 * 編集内容を初期状態に戻す
 *
 */
PhotoEditor.prototype.clear = function() {
	this.editCtx = $.extend({},this.defaultCtx);
	this.updateEditCtxLog();
}


/**
 *
 */
PhotoEditor.prototype.undo = function() {
	if (this.editCtxIdx > 0) {
		this.editCtxIdx--;
		this.editCtx = PhotoEditor.utils.copy(this.editCtxLog[this.editCtxIdx]);
		this.updated = true;
	}
}

/**
 *
 */
PhotoEditor.prototype.isReversed = function() {
	return Math.abs(this.editCtx.rotate) % 360 == 90 || Math.abs(this.editCtx.rotate) % 360 == 270;
}


/**
 *
 */
PhotoEditor.prototype.redo = function() {
	if (this.editCtxIdx+1 < this.editCtxLog.length) {
		this.editCtxIdx++;
		this.editCtx = PhotoEditor.utils.copy(this.editCtxLog[this.editCtxIdx]);
		this.updated = true;
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



