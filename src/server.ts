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
    if (path === "/fe2.js") {
      return new Response(Bun.file("fe2.js"));
    }

    if (path === "/foo") {
      return new Response(
        `<head>
            <style> 
              :root { 
                color-scheme: dark; 
              } 
              ul {
                list-style: none;
                padding: 0;
                margin: 0;
              }
            </style>
            <script src="/infinite.js" type="module"></script>
            <title>Foo</title>
          </head>
          <body>
            <script src="/fe2.js" defer></script>
            <div>foo</div>
            <a 
              data-infinite-link="mylist"
              href='/'
            >
              Home
            </a>
          </body>
        `,
        {
          headers: { "content-type": "text/html" },
        },
      );
    }

    if (path === "/favicon.ico") {
      return new Response(undefined, { status: 200 });
    }

    if (path !== "/") {
      return new Response("Not found", { status: 404 });
    }

    const buttons = Array.from({ length: 30 }, (_, i) => button(i === 29)).join(
      "\n",
    );

    return new Response(
      `<head>
        <style> 
          :root { 
            color-scheme: dark; 
          } 
          ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }
        </style>
        <script src="/infinite.js" type="module"></script>
        <title>Root</title>
      </head>
      <body style="margin: 0; padding: 0; display: flex;">
        <script src="/fe.js" defer></script>
        <a 
          href="/foo"
          style="padding: 30px;"
        >Foo</a>
        <ul data-infinite-root="mylist">
          ${buttons}
        </ul>
        <a 
          data-infinite-next="mylist" 
          style="visibility: hidden; position: fixed;"
          href="/"
        >
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
