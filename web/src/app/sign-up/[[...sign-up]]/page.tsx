import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(217,108,63,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(36,92,79,0.18),_transparent_28%),linear-gradient(180deg,#fcf7ef_0%,#f4efe7_52%,#efe7db_100%)] p-6">
      <SignUp forceRedirectUrl="/roadmap" />
    </main>
  );
}