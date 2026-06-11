import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';


const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine({ allowedHosts: ['techhouseksa.com'], trustProxyHeaders: true });

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    immutable: true,
  })
);
app.get('/sitemap.xml', async (req, res) => {
  try {
    const response = await fetch(`https://api.techhouseksa.com/sitemap`);
    const data = await response.json();

    if (Array.isArray(data)) {
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      for (const url of data) {
        xml += '  <url>\n';
        for (const property in url) {
          // Ignore 'type' since it's not a valid sitemap property
          if (property === 'type') continue;
          xml += `    <${property}>${url[property]}</${property}>\n`;
        }
        xml += '  </url>\n';
      }

      xml += '</urlset>';

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } else {
      res.status(500).send('Error generating sitemap');
    }
  } catch (error) {
    console.error('Error fetching sitemap data:', error);
    res.status(500).send('Error generating sitemap');
  }
});
/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  angularApp
    .handle(req)
    .then((response) => {
      if (response && response.status === 302) {
        // Intercept 302 redirects and change them to 301 Moved Permanently
        const redirectedResponse = new Response(response.body, {
          status: 301,
          statusText: 'Moved Permanently',
          headers: response.headers,
        });
        return writeResponseToNodeResponse(redirectedResponse, res);
      }
      return response ? writeResponseToNodeResponse(response, res) : next();
    })
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
export const reqHandler = createNodeRequestHandler(app);
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 5000;

  const server = app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });

  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
}

















/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
// export const reqHandler = createNodeRequestHandler(app);
// import { AngularAppEngine, createRequestHandler } from '@angular/ssr'
// import { getContext } from '@netlify/angular-runtime/context.mjs'

// const angularAppEngine = new AngularAppEngine()

// export async function netlifyAppEngineHandler(request: Request): Promise<Response> {
//   const context = getContext()
//   // Example API endpoints can be defined here.
//   // Uncomment and define endpoints as necessary.
//   // const pathname = new URL(request.url).pathname;
//   // if (pathname === '/api/hello') {
//   //   return Response.json({ message: 'Hello from the API' });
//   // }

//   const result = await angularAppEngine.handle(request, context)
//   return result || new Response('Not found', { status: 404 })
// }

// /**
//  * The request handler used by the Angular CLI (dev-server and during build).
//  */
// export const reqHandler = createRequestHandler(netlifyAppEngineHandler)
