import { clerkMiddleware } from "@clerk/nextjs/server";

// Do not enforce per-route protection in middleware so that the app and APIs
// can be used without requiring Clerk authentication. Individual routes may
// still call `auth()` if they need stronger guarantees.
export default clerkMiddleware(async (_auth, _req) => {
  // noop — don't call _auth.protect()
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};