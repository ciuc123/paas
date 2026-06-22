import { ProjectLoader } from "@/components/project-loader";
import { getCurrentAccess } from "@/lib/access";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProjectPage({ params }: Props) {
  // Auth optional: don't redirect unauthenticated users.
  const access = await getCurrentAccess();

  const { id } = await params;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(217,108,63,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(36,92,79,0.18),_transparent_30%),linear-gradient(180deg,#fcf7ef_0%,#f4efe7_58%,#efe7db_100%)]">
      <div className="space-y-6 p-6">
        <ProjectLoader projectId={id} />
      </div>
    </main>
  );
}
