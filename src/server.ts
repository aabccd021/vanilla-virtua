let counter = 0;

function button(trigger?: true): string {
  const height = Math.floor(Math.random() * 100) + 100;
  return `<button 
  style="border: 1px solid #ccc; height: ${height}px; width: ${height}px"
  ${trigger ? 'data-infinite-trigger="mylist"' : ''}
  onClick="console.warn('clicked')"
  >
  ID: ${counter++}
  </button>`;
}

Bun.serve({
  fetch: (req): Response => {
    const path = new URL(req.url).pathname;
    if (path === '/infinite.js') {
      return new Response(Bun.file('infinite.js'));
    }

    const buttons = Array.from({ length: 30 }, (_) => button());
    buttons.push(button(true));

    return new Response(
      `<head>
        <style> :root { color-scheme: dark; } </style>
        <script src="/infinite.js" type="module"></script>
      </head>
      <body>
        <div 
          style="overflow-anchor: none; flex: 0 0 auto; position: relative; width: 100%;"
          data-infinite-root="mylist"
        >
          ${buttons.join('\n')}
        </div>
        <a 
          data-infinite-next="mylist" 
          style="visibility: hidden; position: fixed;"
          href="/">
          Next
        </a>
      </body>
      `, {
      headers: { 'content-type': 'text/html' }
    })
  }
})
