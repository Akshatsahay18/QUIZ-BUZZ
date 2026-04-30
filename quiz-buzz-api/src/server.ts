import "dotenv/config";

import { createApp, loadResources } from "@classytic/arc/factory";
import { openApiPlugin } from "@classytic/arc/docs";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import mongoose from "mongoose";

type ClerkUser = {
  _id: string;
  id: string;
  userId: string;
  sub: string;
  role?: string;
  claims: JWTPayload;
};

const getRequiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
};

const getBearerToken = (request: FastifyRequest) => {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
};

const createClerkAuth = (jwksUrl: string) => {
  const jwks = createRemoteJWKSet(new URL(jwksUrl));

  const applyToken = async (request: FastifyRequest, token: string) => {
    const { payload } = await jwtVerify(token, jwks);
    if (!payload.sub) {
      throw new Error("Invalid token subject.");
    }

    const roleClaim = payload.role ?? payload.org_role;
    const role = typeof roleClaim === "string" ? roleClaim : undefined;

    (request as FastifyRequest & { user: ClerkUser }).user = {
      _id: payload.sub,
      id: payload.sub,
      userId: payload.sub,
      sub: payload.sub,
      role,
      claims: payload
    };
  };

  const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    const token = getBearerToken(request);
    if (!token) {
      return reply.code(401).send({ error: "Authentication required." });
    }

    try {
      await applyToken(request, token);
    } catch (error) {
      request.log.warn({ error }, "Clerk JWT verification failed");
      return reply.code(401).send({ error: "Invalid or expired token." });
    }
  };

  const optionalAuthenticate = async (
    request: FastifyRequest,
    _reply: FastifyReply
  ) => {
    const token = getBearerToken(request);
    if (!token) {
      return;
    }

    try {
      await applyToken(request, token);
    } catch (error) {
      request.log.warn({ error }, "Optional Clerk JWT verification failed");
    }
  };

  return { authenticate, optionalAuthenticate };
};

const registerSwaggerUiRoute = async (
  fastify: FastifyInstance,
  routePrefix: string,
  specUrl: string
) => {
  fastify.get(routePrefix, async (_request, reply) => {
    return reply.type("text/html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Quiz Buzz API Docs</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "${specUrl}",
        dom_id: "#swagger-ui"
      });
    </script>
  </body>
</html>`);
  });
};

const start = async () => {
  const mongodbUri = getRequiredEnv("MONGODB_URI");
  const clerkJwksUrl = getRequiredEnv("CLERK_JWKS_URL");
  const corsOrigin = getRequiredEnv("CORS_ORIGIN");
  const port = Number.parseInt(process.env.PORT ?? "8040", 10);

  if (Number.isNaN(port)) {
    throw new Error("PORT must be a number.");
  }

  await mongoose.connect(mongodbUri);

  const clerkAuth = createClerkAuth(clerkJwksUrl);

  const app = await createApp({
    preset: process.env.NODE_ENV === "production" ? "production" : "development",
    resourcePrefix: "/api/v1",
    resources: await loadResources(import.meta.url),
    auth: {
      type: "authenticator",
      authenticate: clerkAuth.authenticate,
      optionalAuthenticate: clerkAuth.optionalAuthenticate
    },
    cors: {
      origin: corsOrigin.split(",").map((origin) => origin.trim()),
      credentials: true
    },
    plugins: async (fastify) => {
      await fastify.register(openApiPlugin, {
        title: "Quiz Buzz API",
        version: "0.1.0",
        description: "Backend API for the Quiz Buzz app.",
        prefix: "/api/v1/_docs",
        apiPrefix: "/api/v1"
      });

      await registerSwaggerUiRoute(
        fastify,
        "/api/v1/docs",
        "/api/v1/_docs/openapi.json"
      );
    }
  });

  await app.listen({ port, host: "0.0.0.0" });
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
