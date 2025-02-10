import { Tool, ToolParams } from 'ai';
import { z } from 'zod';

const humanReviewSchema = z.object({
  content: z.string().describe('The AI-generated content to be reviewed.'),
});

export type HumanReviewToolInput = z.infer<typeof humanReviewSchema>;

export const humanReviewTool: Tool = {
  name: 'requestHumanReview',
  description:
    'Requests a human review of the generated content before displaying it to the user.',
  schema: humanReviewSchema,
  handler: async ({ content }: ToolParams<typeof humanReviewSchema>) => {
    // This handler function is intentionally left almost empty.
    // The actual "work" happens in the UI, where the human interacts.
    // We just return the content.  The UI will update the `data` prop
    // of `useChat` to reflect the human's edits and approval/rejection.
    return content;
  },
}; 