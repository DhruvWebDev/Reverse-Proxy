import { error } from "console";
import { date, z } from "zod";

export const workerMessageSchema  = z.object({
    requestType: z.enum(["HTTP"]),
    header: z.any(),
    body: z.any(),
    url: z.string(),
})

export const replyMessageSchema  = z.object({
    data: z.any(),
    error  : z.string().optional(),
    errorCode: z.enum(['500', '404']).optional(),
})


export type WorkerMessageType = z.infer<typeof workerMessageSchema>;
export type ReplyMessageType = z.infer<typeof replyMessageSchema>;
// The line defines a TypeScript type WorkerMessage that is automatically derived from a Zod schema named workerMessage. This allows for strong type-checking and validation of messages exchanged between processes (e.g., between the primary process and worker processes in the server setup). By using z.infer, it ensures that the WorkerMessage type will always be in sync with the schema defined by workerMessage, providing both type safety and validation capabilities.