let list = document.getElementById('course-priority-list');
let draggingEl;
let pressedEl = null; // To track the element on mousedown

// Add mousedown listener to the list to capture initial press on li elements
list.addEventListener('mousedown', (e) => {
	if (e.target.tagName === 'LI' && e.button === 0) {
		// Only for left clicks on LI
		pressedEl = e.target;
		// Don't toggle class here yet, wait for mouseup to confirm it's not a drag
	}
});

// Add mouseup listener to the document to correctly capture the end of a click
document.addEventListener('mouseup', (e) => {
	if (e.button === 0 && pressedEl && !draggingEl) {
		// If an element was pressed (left-click) and no drag is active
		// Check if the mouseup target is the same as pressedEl or a child of it
		// This ensures it's a click on the intended item
		if (pressedEl === e.target || pressedEl.contains(e.target)) {
			pressedEl.classList.toggle('disabled');
		}
	}
	// Reset pressedEl after mouseup, regardless of whether a class was toggled
	// This handles cases where mousedown was on an LI but mouseup was elsewhere without dragging
	if (e.button === 0) {
		pressedEl = null;
	}
});

list.addEventListener('dragstart', (e) => {
	draggingEl = e.target;
	e.target.classList.add('dragging');
	// If the item was marked as disabled, un-disable it when dragging starts
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
