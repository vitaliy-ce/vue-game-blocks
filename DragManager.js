var DragManager = new function() {

	/**
	 * составной объект для хранения информации о переносе:
	 * {
	 *   elem - элемент, на котором была зажата мышь
	 *   avatar - аватар
	 *   downX/downY - координаты, на которых был mousedown
	 *   shiftX/shiftY - относительный сдвиг курсора от угла элемента
	 * }
	 */
	var dragObject = {};

	var self = this;

	function onMouseDown(e) {
		e.preventDefault(); 
		var elem = e.target.closest('.draggable');
		if (!elem) return;

		dragObject.elem = elem;

		// запомним, что элемент нажат на текущих координатах pageX/pageY
		if (e.type == 'touchstart') {
			dragObject.downX = e.changedTouches[0].pageX;
			dragObject.downY = e.changedTouches[0].pageY;
		} else {
			dragObject.downX = e.pageX;
			dragObject.downY = e.pageY;			
		}

		return false;
	}

	function onMouseMove(e) {
		e.preventDefault();
		if (!dragObject.elem) return; // элемент не зажат

		if (!dragObject.avatar) { // если перенос не начат...
			if (e.type == 'touchmove') {
				var moveX = e.changedTouches[0].pageX - dragObject.downX;
				var moveY = e.changedTouches[0].pageY - dragObject.downY;
			} else {
				var moveX = e.pageX - dragObject.downX;
				var moveY = e.pageY - dragObject.downY;
			}

			// если мышь передвинулась в нажатом состоянии недостаточно далеко
			if (Math.abs(moveX) < 3 && Math.abs(moveY) < 3) {
				return;
			}

			// начинаем перенос
			dragObject.avatar = createAvatar(e); // создать аватар
			if (!dragObject.avatar) { // отмена переноса, нельзя "захватить" за эту часть элемента
				dragObject = {};
				return;
			}

			// аватар создан успешно
			// создать вспомогательные свойства shiftX/shiftY
			// var coords = getCoords(dragObject.avatar);
			// dragObject.shiftX = dragObject.downX - coords.left;
			// dragObject.shiftY = dragObject.downY - coords.top;
			dragObject.shiftX = -1;
			dragObject.shiftY = -1;

			startDrag(e); // отобразить начало переноса
		}

		// отобразить перенос объекта при каждом движении мыши
		if (e.type == 'touchmove') {
			dragObject.avatar.style.left = Math.round(e.changedTouches[0].pageX - dragObject.shiftX) + 'px';
			dragObject.avatar.style.top = Math.round(e.changedTouches[0].pageY - dragObject.shiftY) + 'px';
		} else {
			dragObject.avatar.style.left = Math.round(e.pageX - dragObject.shiftX) + 'px';
			dragObject.avatar.style.top = Math.round(e.pageY - dragObject.shiftY) + 'px';
		}
		return false;
	}

	function onMouseUp(e) {
		e.preventDefault();
		if (dragObject.avatar) { // если перенос идет
			finishDrag(e);
		}

		// перенос либо не начинался, либо завершился
		// в любом случае очистим "состояние переноса" dragObject
		dragObject = {};
		return false;
	}

	function finishDrag(e) {
		var dropElem = findDroppable(e);

		if (!dropElem) {
			self.onDragCancel(dragObject);
		} else {
			self.onDragEnd(dragObject, dropElem);
		}
	}

	function createAvatar(e) {

		// запомнить старые свойства, чтобы вернуться к ним при отмене переноса
		var avatar = dragObject.elem;
		var old = {
			parent: avatar.parentNode,
			nextSibling: avatar.nextSibling,
			position: avatar.position || '',
			left: avatar.left || '',
			top: avatar.top || '',
			zIndex: avatar.zIndex || ''
		};

		// функция для отмены переноса
		avatar.rollback = function() {
			old.parent.insertBefore(avatar, old.nextSibling);
			avatar.style.position = old.position;
			avatar.style.left = old.left;
			avatar.style.top = old.top;
			avatar.style.zIndex = old.zIndex
			avatar.classList.remove('avatar');
		};

		return avatar;
	}

	function startDrag(e) {
		var avatar = dragObject.avatar;

		// инициировать начало переноса
		document.body.appendChild(avatar);
		avatar.style.zIndex = 9999;
		avatar.style.position = 'absolute';
		avatar.classList.add('avatar');
	}

	function findDroppable(event) {
		// спрячем переносимый элемент
		dragObject.avatar.hidden = true;

		// получить самый вложенный элемент под курсором мыши
		if (event.type == 'touchend') {
			var elem = document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);			
		} else {
			var elem = document.elementFromPoint(event.clientX, event.clientY);			
		}

		// показать переносимый элемент обратно
		dragObject.avatar.hidden = false;

		if (elem == null) {
			// такое возможно, если курсор мыши "вылетел" за границу окна
			return null;
		}
		dragObject.target_elem = elem;

		return elem.closest('.droppable');
	}

	document.onmousemove = onMouseMove;
	document.onmouseup = onMouseUp;
	document.onmousedown = onMouseDown;

	document.ontouchmove = onMouseMove;
	document.ontouchstart = onMouseDown;
	document.ontouchend = onMouseUp;
	document.ontouchcancel = onMouseUp;

	this.onDragEnd = function(dragObject, dropElem) {};
	this.onDragCancel = function(dragObject) {};

};


function getCoords(elem) { // кроме IE8-
	var box = elem.getBoundingClientRect();

	return {
		top: box.top + pageYOffset,
		left: box.left + pageXOffset
	};

}