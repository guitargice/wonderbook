import { StorybookLayout } from "@/components/storybook/StorybookLayout";
import { StoryReader } from "@/components/storybook/StoryReader";

type StoryPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function StoryPage({ params }: StoryPageProps) {
  const { sessionId } = await params;

  return (
    <StorybookLayout>
      <StoryReader sessionId={sessionId} />
    </StorybookLayout>
  );
}
