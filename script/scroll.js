(function() {
	// ------------------- transitionend ---------------------

	// Let iframe GET its content
	function loadFrame(pages, z) {
		const page = getPage(pages, z);
		const frame = page.querySelector("iframe");
		if (frame.src != frame.dataset.src) {
			frame.src = frame.dataset.src;
		}
	}

	// Increment zIndex of all pages and loop at both ends of stack
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
			// Reset recently closed page
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

	// --------------------- Scroll page ----------------------

	// Retrieve page with a given zIndex
	function getPage(pages, zIndex) {
		return pages.filter(page => {
			return Number(page.style.zIndex) === zIndex;
		})[0];
	}

	function scrollPage(pages, dom, increment) {
		if (pages.length === 1) return;

		// Communicate with handlePageTransitionEnd()
		scrollPage.ready = false;
		scrollPage.increment = increment;

		// Enable next/prev page
		const nextPageZIndex = increment ? pages.length - 1 : 1;
		const nextPage = getPage(pages, nextPageZIndex);
		nextPage.classList.remove("disabled");

		updateHeadline("project", nextPage, dom.header);

		// Close current page
		const currentPage = getPage(pages, pages.length);
		currentPage.classList.add("closing");
		// -> continued in handlePageTransitionEnd()
	}

	// Debounce scroll
	scrollPage.ready = true;

	// -------------------- set up scroll ---------------------

	const SWIPE_SENSITIVITY = 15;
	const SCROLL_SENSITIVITY = 80;

	let touchstartY = 0;

	// Note where where swipe gesture began
	function handleTouchStart(e) {
		touchstartY = e.touches[0].pageY;
	}

	function handleTouchEnd(e, pages, dom) {
		const touchEndElement = document.elementFromPoint(
			e.changedTouches[0].clientX,
			e.changedTouches[0].clientY
		);
		const startedOnContainer = !!e.target.closest("#" + dom.container.id);
		const endedOnContainer = !!touchEndElement.closest("#" + dom.container.id);

		// Swiped from header down
		if (!startedOnContainer && endedOnContainer) {
			togglePanel(dom.layoutSelect, true);
		}
		// Swiped from container to header
		else if (startedOnContainer && !endedOnContainer) {
			togglePanel(dom.layoutSelect, false);
		}
		// Swiped within container
		else if (startedOnContainer && endedOnContainer) {
			const touchendY = e.changedTouches[0].pageY;
			const deltaY = touchendY - touchstartY;
			if (deltaY < -SWIPE_SENSITIVITY) scrollPage(pages, dom, 1);
			else if (deltaY > SWIPE_SENSITIVITY) scrollPage(pages, dom, 0);
		}
	}

	function handleWheel(e, pages, dom) {
		// Check if mouse is over container
		if (!!e.target.closest("#" + dom.container.id)) {
			// Avoid trackpad scroll inertia
			if (e.deltaY > SCROLL_SENSITIVITY) scrollPage(pages, dom, 1);
			else if (e.deltaY < -SCROLL_SENSITIVITY) scrollPage(pages, dom, 0);
		}
	}

	// Handle message from iframe
	function handleeMessage(e, pages, dom) {
		if (e.data === "down") scrollPage(pages, dom, 1);
		else if (e.data === "up") scrollPage(pages, dom, 0);
	}

	// load content in top page and adjacent ones
	window.loadFirstFrames = function(pages) {
		loadFrame(pages, pages.length);
		if (pages.length === 1) return;
		loadFrame(pages, pages.length - 1);
		loadFrame(pages, 1);
	};

	// Add scroll-related event listeners
	window.setUpScroll = function(pages, dom) {
		document.addEventListener("touchstart", handleTouchStart);
		document.addEventListener("touchend", e => handleTouchEnd(e, pages, dom));
		document.addEventListener("wheel", e => handleWheel(e, pages, dom));
		window.addEventListener("message", e => handleeMessage(e, pages, dom));
		document.addEventListener("transitionend", e =>
			handlePageTransitionEnd(e, pages, scrollPage.increment)
		);
	};
})();
