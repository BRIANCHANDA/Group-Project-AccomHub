import { apiReference } from "@scalar/hono-api-reference";
import packageJSON from "./package.json" with { type: "json" };
import type { OpenAPIHono } from "@hono/zod-openapi";

type AppOpenAPI = OpenAPIHono

export default function configureOpenAPI(app: AppOpenAPI) {
  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      version: packageJSON.version,
      title: 'Accommodation Hub',
      description: 'api for the accommodation system for Cbu students',  
    },
  });

  app.get(
    "/reference",
    apiReference({
      theme: "kepler",
      spec: {
        url: "/doc",
      },
    }),
  );
}