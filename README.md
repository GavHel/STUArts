This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Commission request storage

Commission requests are submitted to a server-side Route Handler and stored in
Supabase. The service-role credential is only read by the server and must never
be prefixed with `NEXT_PUBLIC_` or used in browser code.

1. Create a Supabase project.
2. Run `supabase/migrations/20261021000000_create_commission_requests.sql` in
   the Supabase SQL Editor.
3. Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY` from the Supabase project settings. The project
   URL may use the public prefix; the service-role key must not.
4. Restart `npm run dev` and submit the commission form at
   [http://localhost:3000/commission](http://localhost:3000/commission).

The endpoint recalculates estimates on the server and exposes insert access
only through the server-side credential. Row-level security is enabled and
public/authenticated table access is revoked. The current prototype saves
requests but does not yet notify the artist or provide an admin interface;
add abuse controls such as rate limiting before opening the endpoint to a
public launch.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
