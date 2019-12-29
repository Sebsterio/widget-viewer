// Minimum screen width for 2-col layout
const BOOK_LAYOUT_MIN_WIDTH = 800;

// iframe width in "mobile view"
const NARROW_LAYOUT_WIDTH = 400;

function loadCatalog(catalog, container, layoutSelect) {
	container.innerHTML = "";
	const pages = getPages(catalog);
	renderPages(pages, container);
	// setUpOverlays(pages, layout);
	setUpScroll(pages, container, layoutSelect);
}

function loadDoc() {
	// TODO: click -> toggle overlay
	const title = document.getElementById("title");

	const navLinks = document.querySelectorAll(".nav-link");
	const layoutSelect = document.getElementById("layout-select");
	const mainContent = document.getElementById("main-content");

	// Load home section on doc load
	loadCatalog(Library.home, mainContent, layoutSelect);
	updateLayout(mainContent, layoutSelect, null);

	// Change section in nav menu
	navLinks.forEach(link => {
		link.addEventListener("click", () => {
			const catalog = Library[link.dataset.catalog];
			loadCatalog(catalog, mainContent);
			updateLayout(mainContent, layoutSelect, null);
		});
	});

	// Change layout in UI
	layoutSelect.addEventListener("change", e => {
		updateLayout(mainContent, layoutSelect, e);
	});

	// Window resize (includes orientationchange)
	window.addEventListener("resize", () => {
		updateLayout(mainContent, layoutSelect, null);
	});
}

loadDoc();
