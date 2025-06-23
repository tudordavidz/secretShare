import { PrismaClient } from '@/generated/prisma';
import { TRPCError, initTRPC } from '@trpc/server';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface Context {
  req?: NextRequest;
  user?: {
    id: string;
    email: string;
  } | null;
}

export const createTRPCContext = async ({ req }: { req?: NextRequest }): Promise<Context> => {
  let user = null;

  if (req) {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || 
                  req.cookies.get('auth-token')?.value;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        user = { id: decoded.userId, email: decoded.email };
      } catch {
        // Token is invalid, user remains null
      }
    }
  }

  return {
    req,
    user,
  };
};

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export { prisma };
