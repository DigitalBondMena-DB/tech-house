// import {
//   AngularNodeAppEngine,
//   createNodeRequestHandler,
//   isMainModule,
//   writeResponseToNodeResponse,
// } from '@angular/ssr/node';
// import express from 'express';
// import { join } from 'node:path';
// import compression from 'compression';
// const browserDistFolder = join(import.meta.dirname, '../browser');

// const app = express();

// app.use(compression({
//   level: 6,
//   threshold: 1024,
//   filter: (req, res) => {
//     if (req.headers['x-no-compression']) {
//       return false;
//     }
//     return compression.filter(req, res);
//   }
// }));

// const angularApp = new AngularNodeAppEngine();

// app.use(
//   express.static(browserDistFolder, {
//     maxAge: '1y',
//     index: false,
//     redirect: false,
//     immutable: true,
//     fallthrough: true,
//   }),
// );

// /**
//  * Handle all other requests by rendering the Angular application.
//  */
// app.use((req, res, next) => {
//   res.setHeader('X-Content-Type-Options', 'nosniff');
//   angularApp
//     .handle(req)
//     .then((response) =>
//       response ? writeResponseToNodeResponse(response, res) : next(),
//     )
//     .catch(next);
// });

// /**
//  * Start the server if this module is the main entry point, or it is ran via PM2.
//  * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
//  */
// export const reqHandler = createNodeRequestHandler(app);
// if (isMainModule(import.meta.url) || process.env['pm_id']) {
//   const port = process.env['PORT'] || 5000;

//   const server = app.listen(port, () => {
//     console.log(`Node Express server listening on http://localhost:${port}`);
//   });

//   server.keepAliveTimeout = 65000;
//   server.headersTimeout = 66000;
// }

















/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
// export const reqHandler = createNodeRequestHandler(app);
import { AngularAppEngine, createRequestHandler } from '@angular/ssr'
import { getContext } from '@netlify/angular-runtime/context.mjs'

const angularAppEngine = new AngularAppEngine()

export async function netlifyAppEngineHandler(request: Request): Promise<Response> {
  const context = getContext()
  // Example API endpoints can be defined here.
  // Uncomment and define endpoints as necessary.
  // const pathname = new URL(request.url).pathname;
  // if (pathname === '/api/hello') {
  //   return Response.json({ message: 'Hello from the API' });
  // }

  const result = await angularAppEngine.handle(request, context)
  return result || new Response('Not found', { status: 404 })
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createRequestHandler(netlifyAppEngineHandler)
