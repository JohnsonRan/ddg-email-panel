import type { NextApiRequest, NextApiResponse } from 'next'
import { createRouter } from 'next-connect'
import Boom from '@hapi/boom'
import { handler as errHandler, sendUpstreamError } from '../../../lib/apiHandler'
import { login as ddgLogin, getAccessToken } from '../../../lib/ddgEmailApi'

const router = createRouter<NextApiRequest, NextApiResponse>()

async function login(req: NextApiRequest, res: NextApiResponse) {
  const { username, otp } = req.body
  if (!username || !otp) {
    throw Boom.badRequest()
  }

  const loginResult = await ddgLogin(username, otp)
  if (!loginResult.ok) return sendUpstreamError(loginResult, res)
  const loginData = (await loginResult.json()) as { status: string; token: string; user: string }

  const dashboard = await getAccessToken(loginData.token)
  if (!dashboard.ok) return sendUpstreamError(dashboard, res)
  // `token` is the session token; only it (not access_token) is accepted by /email/dashboard.
  res.status(200).json({ ...(await dashboard.json()), token: loginData.token })
}

export default router.post(login).handler(errHandler)
