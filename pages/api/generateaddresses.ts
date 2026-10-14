import type { NextApiRequest, NextApiResponse } from 'next'
import { createRouter } from 'next-connect'
import Boom from '@hapi/boom'
import { handler as errHandler, sendUpstreamError } from '../../lib/apiHandler'
import { generateAddresses } from '../../lib/ddgEmailApi'

const router = createRouter<NextApiRequest, NextApiResponse>()

async function generate(req: NextApiRequest, res: NextApiResponse) {
  const { authorization } = req.headers
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw Boom.unauthorized()
  }
  const token = authorization.slice('Bearer '.length)

  const result = await generateAddresses(token)
  if (!result.ok) return sendUpstreamError(result, res)
  res.status(200).json((await result.json()) as { address: string })
}

export default router.post(generate).handler(errHandler)
