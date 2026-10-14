import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import * as Boom from "@hapi/boom";

const router = createRouter<NextApiRequest, NextApiResponse>();

const handler = {
  onError: (
    err: unknown,
    req: any,
    res: {
      status: (arg0: number) => void;
      json: (arg0: {
        statusCode?: number;
        error?: string;
        message: string;
      }) => void;
    }
  ) => {
    if (Boom.isBoom(err)) {
      const result = {
        statusCode: err.output.payload.statusCode,
        error: err.output.payload.error,
        message: err.output.payload.message,
        code: -1,
      };
      // add error code
      if (err.data?.code) result.code = err.data?.code;
      res.status(err.output.payload.statusCode);
      res.json(result);
    } else {
      res.status(500);
      res.json({
        message: "Unexpected error",
      });
      console.error(err);
    }
  },
  onNoMatch: (req: any, res: any) => {
    res.status(405).json(Boom.methodNotAllowed().output.payload);
  },
};

/**
 * Relay a failed upstream (DuckDuckGo) response with its real status.
 * DDG error bodies are often empty/plain text, so never assume JSON.
 */
export async function sendUpstreamError(result: Response, res: NextApiResponse) {
  const text = (await result.text().catch(() => "")).trim();
  let message = result.statusText || `HTTP ${result.status}`;
  try {
    const body = JSON.parse(text);
    message = body?.message || body?.error || message;
  } catch {
    if (text) message = text.slice(0, 200);
  }
  res.status(result.status).json({ message });
}

export default router;
export { handler };
