console.log("Hello World");

const newChild = window.document.createElement("h2");
newChild.textContent = "this is dynamically added";
newChild.dataset["testid"] = "dyn";
window.document.body.appendChild(newChild);
