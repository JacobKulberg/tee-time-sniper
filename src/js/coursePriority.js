let list = document.getElementById('course-priority-list');
let draggingEl;
let pressedEl = null;

list.addEventListener('mousedown', (e) => {
	if (e.target.tagName === 'LI' && e.button === 0) {
		pressedEl = e.target;
	}
});

document.addEventListener('mouseup', (e) => {
	if (e.button === 0 && pressedEl && !draggingEl) {
		if (pressedEl === e.target || pressedEl.contains(e.target)) {
			pressedEl.classList.toggle('disabled');
		}
	}

	if (e.button === 0) {
		pressedEl = null;
	}
});

list.addEventListener('dragstart', (e) => {
	draggingEl = e.target;
	e.target.classList.add('dragging');

	if (e.target.classList.contains('disabled')) {
		e.target.classList.remove('disabled');
	}
	pressedEl = null;
});

list.addEventListener('dragend', (e) => {
	e.target.classList.remove('dragging');
	draggingEl = null;
});

list.addEventListener('dragover', (e) => {
	e.preventDefault();

	let afterEl = getDragAfterElement(list, e.clientY);
	let current = document.querySelector('.dragging');

	if (!afterEl) {
		list.appendChild(current);
	} else {
		list.insertBefore(current, afterEl);
	}
});

function getDragAfterElement(container, y) {
	let draggableEls = [...container.querySelectorAll('li:not(.dragging)')];

	return draggableEls.reduce(
		(closest, child) => {
			let box = child.getBoundingClientRect();
			let offset = y - box.top - box.height / 2;

			if (offset < 0 && offset > closest.offset) {
				return { offset, element: child };
			} else {
				return closest;
			}
		},
		{ offset: Number.NEGATIVE_INFINITY }
	).element;
}
