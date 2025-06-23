import { router, publicProcedure, protectedProcedure, prisma } from '../trpc';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { TRPCError } from '@trpc/server';
import { secretCreateRateLimit, secretAccessRateLimit, getClientIdentifier } from '@/lib/rate-limit';

export const secretRouter = router({
  create: publicProcedure
    .input(
      z.object({
        title: z.string().optional(),
        content: z.string().min(1, 'Content is required'),
        password: z.string().optional(),
        expiresAt: z.string().optional().transform((val) => val ? new Date(val) : undefined),
        isOneTimeAccess: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Rate limiting for secret creation
      if (ctx.req) {
        const clientId = getClientIdentifier(ctx.req);
        const rateLimit = secretCreateRateLimit.check(clientId);
        
        if (!rateLimit.allowed) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many secrets created. Please try again later.',
          });
        }
      }

      const { title, content, password, expiresAt, isOneTimeAccess } = input;

      // Generate unique slug
      const slug = nanoid(12);

      // Hash password if provided
      const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

      const secret = await prisma.secret.create({
        data: {
          title,
          content,
          slug,
          password: hashedPassword,
          expiresAt,
          isOneTimeAccess,
          userId: ctx.user?.id,
        },
      });

      return {
        id: secret.id,
        slug: secret.slug,
        title: secret.title,
        expiresAt: secret.expiresAt,
        isOneTimeAccess: secret.isOneTimeAccess,
        createdAt: secret.createdAt,
      };
    }),

  getBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        password: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Rate limiting for secret access
      if (ctx.req) {
        const clientId = getClientIdentifier(ctx.req);
        const rateLimit = secretAccessRateLimit.check(clientId);
        
        if (!rateLimit.allowed) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many secret access attempts. Please try again later.',
          });
        }
      }

      const { slug, password } = input;

      const secret = await prisma.secret.findUnique({
        where: { slug },
      });

      if (!secret) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Secret not found',
        });
      }

      // Check if secret has expired
      if (secret.expiresAt && secret.expiresAt < new Date()) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Secret has expired',
        });
      }

      // Check if secret has been accessed and is one-time only
      if (secret.isOneTimeAccess && secret.hasBeenAccessed) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Secret has already been accessed',
        });
      }

      // Check password if required
      if (secret.password) {
        if (!password) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Password required',
          });
        }

        const isPasswordValid = await bcrypt.compare(password, secret.password);
        if (!isPasswordValid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid password',
          });
        }
      }

      // Log access
      await prisma.accessLog.create({
        data: {
          secretId: secret.id,
          ipAddress: ctx.req?.headers.get('x-forwarded-for') || 
                    ctx.req?.headers.get('x-real-ip') || 
                    'unknown',
          userAgent: ctx.req?.headers.get('user-agent') || 'unknown',
        },
      });

      // Mark as accessed if one-time access
      if (secret.isOneTimeAccess) {
        await prisma.secret.update({
          where: { id: secret.id },
          data: { hasBeenAccessed: true },
        });
      }

      return {
        id: secret.id,
        title: secret.title,
        content: secret.content,
        expiresAt: secret.expiresAt,
        isOneTimeAccess: secret.isOneTimeAccess,
        createdAt: secret.createdAt,
      };
    }),

  checkRequirements: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const { slug } = input;

      const secret = await prisma.secret.findUnique({
        where: { slug },
        select: {
          id: true,
          title: true,
          password: true,
          expiresAt: true,
          isOneTimeAccess: true,
          hasBeenAccessed: true,
          createdAt: true,
        },
      });

      if (!secret) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Secret not found',
        });
      }

      // Check if secret has expired
      if (secret.expiresAt && secret.expiresAt < new Date()) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Secret has expired',
        });
      }

      // Check if secret has been accessed and is one-time only
      if (secret.isOneTimeAccess && secret.hasBeenAccessed) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Secret has already been accessed',
        });
      }

      return {
        id: secret.id,
        title: secret.title,
        requiresPassword: !!secret.password,
        expiresAt: secret.expiresAt,
        isOneTimeAccess: secret.isOneTimeAccess,
        createdAt: secret.createdAt,
      };
    }),

  getUserSecrets: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      const { page, limit } = input;
      const skip = (page - 1) * limit;

      const [secrets, total] = await Promise.all([
        prisma.secret.findMany({
          where: { userId: ctx.user.id },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            _count: {
              select: { accessLogs: true },
            },
          },
        }),
        prisma.secret.count({
          where: { userId: ctx.user.id },
        }),
      ]);

      return {
        secrets: secrets.map((secret) => ({
          id: secret.id,
          title: secret.title,
          slug: secret.slug,
          expiresAt: secret.expiresAt,
          isOneTimeAccess: secret.isOneTimeAccess,
          hasBeenAccessed: secret.hasBeenAccessed,
          createdAt: secret.createdAt,
          accessCount: secret._count.accessLogs,
          hasPassword: !!secret.password,
        })),
        total,
        pages: Math.ceil(total / limit),
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      const secret = await prisma.secret.findUnique({
        where: { id },
      });

      if (!secret) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Secret not found',
        });
      }

      if (secret.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to delete this secret',
        });
      }

      await prisma.secret.delete({
        where: { id },
      });

      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        expiresAt: z.string().optional().transform((val) => val ? new Date(val) : undefined),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, title, expiresAt } = input;

      const secret = await prisma.secret.findUnique({
        where: { id },
      });

      if (!secret) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Secret not found',
        });
      }

      if (secret.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to update this secret',
        });
      }

      const updatedSecret = await prisma.secret.update({
        where: { id },
        data: {
          title,
          expiresAt,
        },
      });

      return {
        id: updatedSecret.id,
        title: updatedSecret.title,
        expiresAt: updatedSecret.expiresAt,
        updatedAt: updatedSecret.updatedAt,
      };
    }),
});
