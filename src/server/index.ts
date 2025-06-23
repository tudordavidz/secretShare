import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { secretRouter } from "./routers/secrets";

export const appRouter = router({
  auth: authRouter,
  secret: secretRouter,
});

export type AppRouter = typeof appRouter;
