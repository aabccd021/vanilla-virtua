console.log("hello");

function renderPage() {}

const anchors = document.body.querySelectorAll("a");

for (const anchor of anchors) {
  anchor.addEventListener("click", (event) => {
    event.preventDefault();
    const path = new URL(anchor.href).pathname;
    if (path === "/foo") {
      document.body.innerHTML = "<div>foo</div><a href='/bar'>bar</a>";
      document.title = "foo";
    } else if (path === "/bar") {
      document.body.innerHTML = "<div>bar</div><a href='/foo'>foo</a>";
      document.title = "bar";
    }
    history.pushState({}, "", anchor.href);
  });
}

window.addEventListener("popstate", (event) => {
  console.log("popstate", location.pathname, event);
});
