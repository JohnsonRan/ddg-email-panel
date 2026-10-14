import type { NextApiRequest, NextApiResponse } from 'next'
import { createRouter } from 'next-connect'
import Boom from '@hapi/boom'
import { handler as errHandler, sendUpstreamError } from '../../lib/apiHandler'
import { getDashboard } from '../../lib/ddgEmailApi'

const router = createRouter<NextApiRequest, NextApiResponse>()

async function dashboard(req: NextApiRequest, res: NextApiResponse) {
  const { authorization } = req.headers
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw Boom.unauthorized()
  }
  const token = authorization.slice('Bearer '.length)

  const result = await getDashboard(token)
  if (!result.ok) return sendUpstreamError(result, res)
  res.status(200).json(await result.json())
}

export default router.get(dashboard).handler(errHandler)
