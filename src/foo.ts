console.log("foo");

const newChild = document.createElement("h2");
newChild.textContent = "this is dynamically added";

document.body.appendChild(newChild);
