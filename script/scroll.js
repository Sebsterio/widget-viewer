(function() {
	// ------------------- transitionend ---------------------

	// let iframe GET its content
	function loadFrame(pages, z) {
		const page = getPage(pages, z);
		const frame = page.querySelector("iframe");
		if (frame.src != frame.dataset.src) {
			frame.src = frame.dataset.src;
		}
	}

	// increment zIndex of all pages and loop at both ends of stack
	function shiftPages(pages, increment) {
		pages.forEach(page => {
			let index = Number(page.style.zIndex);
			index = index + (increment ? 1 : -1);
			if (index > pages.length) index = 1;
			if (index <= 0) index = pages.length;
			page.style.zIndex = index;
		});
	}

	function handlePageTransitionEnd(e, pages, increment) {
		if (
			e.propertyName === "opacity" &&
			e.target.classList.contains("closing")
		) {
			// reset recently closed page
			e.target.classList.add("disabled");
			e.target.classList.remove("closing");
			const panel = e.target.querySelector(".panel");
			panel.classList.remove("on-top");
			panel.classList.remove("visible");
			panel.classList.remove("hover");
			panel.classList.remove("expanded");

			shiftPages(pages, increment);

			// load iframe content in upcoming page
			if (increment) loadFrame(pages, pages.length - 1);
			else loadFrame(pages, 1);

			scrollPage.ready = true;
		}
	}

	// --------------------- scroll page ----------------------

	// retrieve page with a given zIndex
	function getPage(pages, zIndex) {
		return pages.filter(page => {
			return Number(page.style.zIndex) === zIndex;
		})[0];
	}

	function scrollPage(pages, increment) {
		// communicate with handlePageTransitionEnd()
		scrollPage.ready = false;
		scrollPage.increment = increment;

		// enable next/prev page
		const nextPageZIndex = increment ? pages.length - 1 : 1;
		const nextPage = getPage(pages, nextPageZIndex);
		nextPage.classList.remove("disabled");
		// close current page
		const currentPage = getPage(pages, pages.length);
		currentPage.classList.add("closing");
		// -> continued in handlePageTransitionEnd()
	}

	// debounce scroll
	scrollPage.ready = true;

	// -------------------- scroll nav ---------------------

	function scrollNav() {
		console.log("scroll nav");
	}

	// -------------------- set up scroll ---------------------

	const SWIPE_SENSITIVITY = 15;
	const SCROLL_SENSITIVITY = 80;

	let touchstartY = 0;

	// Note where where swipe gesture began
	function handleTouchStart(e) {
		touchstartY = e.touches[0].pageY;
	}

	function handleTouchEnd(e, pages, container, layoutSelect) {
		const touchEndElement = document.elementFromPoint(
			e.changedTouches[0].clientX,
			e.changedTouches[0].clientY
		);
		const startedOnContainer = !!e.target.closest("#" + container.id);
		const endedOnContainer = !!touchEndElement.closest("#" + container.id);

		// Swiped from header down
		if (!startedOnContainer && endedOnContainer) {
			togglePanel(layoutSelect, true);
		}
		// Swiped from container to header
		else if (startedOnContainer && !endedOnContainer) {
			togglePanel(layoutSelect, false);
		}
		// Swiped within container
		else {
			const touchendY = e.changedTouches[0].pageY;
			const deltaY = touchendY - touchstartY;
			if (deltaY < -SWIPE_SENSITIVITY) scrollPage(pages, 1);
			else if (deltaY > SWIPE_SENSITIVITY) scrollPage(pages, 0);
		}
	}

	function handleWheel(e, pages, container) {
		// check if mouse is over container
		if (!!e.target.closest("#" + container.id)) {
			// avoid trackpad scroll inertia
			if (e.deltaY > SCROLL_SENSITIVITY) scrollPage(pages, 1);
			else if (e.deltaY < -SCROLL_SENSITIVITY) scrollPage(pages, 0);
		}
	}

	// Handle message from iframe
	function handleeMessage(e, pages) {
		if (e.data === "down") scrollPage(pages, 1);
		else if (e.data === "up") scrollPage(pages, 0);
	}

	window.setUpScroll = function(pages, container, layoutSelect) {
		// load content in top page and adjacent ones
		loadFrame(pages, pages.length);
		loadFrame(pages, pages.length - 1);
		loadFrame(pages, 1);

		// Add doc & window listeners only on first load
		if (setUpScroll.isDone) return;
		setUpScroll.isDone = true;

		document.addEventListener("touchstart", handleTouchStart);
		document.addEventListener("touchend", e =>
			handleTouchEnd(e, pages, container, layoutSelect)
		);
		document.addEventListener("wheel", e => handleWheel(e, pages, container));
		window.addEventListener("message", e =>
			handleeMessage(e, pages, container)
		);
		document.addEventListener("transitionend", e =>
			handlePageTransitionEnd(e, pages, scrollPage.increment)
		);
	};
})();
