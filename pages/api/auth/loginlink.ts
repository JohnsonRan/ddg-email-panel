import type { NextApiRequest, NextApiResponse } from 'next'
import { createRouter } from 'next-connect'
import Boom from '@hapi/boom'
import { handler as errHandler, sendUpstreamError } from '../../../lib/apiHandler'
import { loginRequest } from '../../../lib/ddgEmailApi'

const router = createRouter<NextApiRequest, NextApiResponse>()

async function loginLink(req: NextApiRequest, res: NextApiResponse) {
  const { username } = req.body
  if (!username) throw Boom.badRequest()
  const result = await loginRequest(username)
  if (!result.ok) return sendUpstreamError(result, res)
  res.status(200).json({ message: 'success' })
}

export default router.post(loginLink).handler(errHandler)
