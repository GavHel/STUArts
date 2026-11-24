# STUArts

STUArts is a Next.js app for discovering student artists, previewing artwork,
and submitting commission requests. The admin workspace is available at
`/admin`.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`: the Supabase project URL.
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the project's publishable key.
     The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` is also accepted.
   - `SUPABASE_SERVICE_ROLE_KEY`: the server-only service role key. Never add a
     `NEXT_PUBLIC_` prefix to this value or commit it.
   - `ADMIN_EMAILS`: comma-separated email addresses allowed into `/admin`.
3. In the Supabase SQL Editor, run the migrations in
   `supabase/migrations/` in filename order.
4. Create an administrator account in Supabase Authentication and use the same
   email in `ADMIN_EMAILS`. Enable email/password sign-ups if customers should
   be able to create optional tracking accounts.
5. Start the app with `npm run dev`, then visit `http://localhost:3000`.

## Accounts and workspaces

Customers can optionally sign up and sign in at `/account/sign-up` and
`/account/sign-in`. A commission request is linked to their account only when
they submit it while signed in; guests can still submit requests.

Artists also create an account, then an admin links it to their profile by
selecting the account email in the artist editor. Artists sign in through the
same account page and open `/artist` to edit their profile and artwork, review
assigned commission requests, and send a response. New artist artwork is saved
as a draft; admins control publication.

Sign in at `/admin/sign-in` for the admin workspace. Admins can view all
commission requests, update statuses and private notes, and manage artist
profiles and artwork. The regular sign-in page also links to admin sign-in,
and signed-in admins can open the workspace from My Account. Admin access is
restricted by `ADMIN_EMAILS`. Public
read access is limited to published records; privileged database access stays
server-side. Published artists and artwork appear on `/discover`, with an
artist directory at `/` and an individual profile at `/artists/<slug>`.
To start a commission, choose an artist and use the request link on their
profile. The request is assigned to that artist.

Commission requests are stored in Supabase and appear in the admin inbox.
Artist responses appear in the customer's account. Email notifications are
not configured. Artists and admins can upload JPEG, PNG, or WebP artwork images
up to 5 MiB, or continue to use an HTTP/HTTPS image URL. Run the artwork upload
migration to create its private Supabase Storage bucket. An uploaded image is
publicly accessible only while both its artwork and artist are published;
otherwise only the owning artist and admins can access it. Replaced uploads
and uploads whose database save fails may remain in the private storage bucket.

## Checks

```bash
npm run lint
npm run build
npm audit --omit=dev
node --experimental-strip-types --test tests/artwork-image-validation.test.mjs tests/artwork-upload-routes.test.mjs tests/wall-artwork-model.test.mjs tests/discover-gallery.test.mjs
```

The studio includes the original sample room preview and an experimental
camera-based wall preview for published artwork. A phone prepares its 3D model
locally; it is not saved or uploaded. The selected width is approximate, not
the artwork's actual size. Image URLs must allow cross-origin access for model
generation. iPhone uses Safari and AR Quick Look, which can also offer floor
placement; supported Android devices use WebXR and ARCore. Android Scene Viewer
is not used because it cannot access browser-generated model URLs. Device and
browser support varies, and real-device placement still needs verification.

To test on a phone on the same local network, start Next.js using the
computer's local network IP address (replace the example address):

```powershell
npm run dev -- --experimental-https --hostname 192.168.1.10
```

Next.js may download mkcert and request administrator permission to install a
local certificate authority. Install only its **public** `rootCA.pem` on the
phone and enable trust in iOS Settings > General > About > Certificate Trust
Settings. Never share the CA private key. Then open
`https://192.168.1.10:3000/studio` on the phone. The computer and phone must be
on the same network, and local firewall settings may need to allow the dev
server. This exposes the development server to that network; do not use an
untrusted network. See the [Next.js local HTTPS guide](https://vercel.com/kb/guide/access-nextjs-localhost-https-certificate-self-signed)
for details.
