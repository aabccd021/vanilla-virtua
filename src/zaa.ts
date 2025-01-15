export function sessionLog(key: string, value: string): void {
  const count = Number(sessionStorage.getItem("counter") ?? "0");
  sessionStorage.setItem("counter", String(count + 1));
  sessionStorage.setItem(`${count}-${key}`, value);
  console.log(`${count}-${key}`, value);
}

function onClick(): void {
  console.log("hello");
}

const app = document.querySelector("#app");
if (app === null) {
  throw new Error("no app");
}
app.addEventListener("click", onClick);

window.addEventListener("pagehide", () => {
  sessionLog("pagehide", "true");
});

window.addEventListener("pageshow", () => {
  sessionLog("pageshow", "true");
});

window.addEventListener("beforeunload", () => {
  sessionLog("beforeunload", "true");
});
