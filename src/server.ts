let counter = 0;

function button(trigger: boolean): string {
  const height = Math.floor(Math.random() * 100) + 100;

  const html = `
  <li>
    <button 
      data-click-hello
      style="border: 1px solid #ccc; height: ${height}px; width: ${height}px"
      ${trigger ? 'data-infinite-trigger="mylist"' : ""}
    >
      ID: ${counter}
    </button>
  </li>`;
  counter++;
  return html;
}

Bun.serve({
  fetch: (req): Response => {
    const path = new URL(req.url).pathname;
    if (path === "/infinite.js") {
      return new Response(Bun.file("infinite.js"));
    }
    if (path === "/fe.js") {
      return new Response(Bun.file("fe.js"));
    }

    if (path !== "/") {
      return new Response(undefined, { status: 200 });
    }

    const buttons = Array.from({ length: 30 }, (_, i) => button(i === 29));

    return new Response(
      `<head>
        <style> :root { color-scheme: dark; } </style>
        <script src="/infinite.js" type="module"></script>
        <script src="/fe.js" type="module"></script>
      </head>
      <body>
        <div data-infinite-root="mylist">
          <div>
          ${buttons.join("\n")}
          </div>
        </div>
        <a 
          data-infinite-next="mylist" 
          style="visibility: hidden; position: fixed;"
          href="/">
          Next
        </a>
      </body>
      `,
      {
        headers: { "content-type": "text/html" },
      },
    );
  },
});
