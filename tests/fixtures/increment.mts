const incrementElt = document.querySelector("[data-testid=increment]");
if (incrementElt === null) {
  throw new Error("Absurd");
}

const count = Number(incrementElt.textContent) + 1;
incrementElt.textContent = String(count);
