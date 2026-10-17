import type { NextApiRequest, NextApiResponse } from 'next'
import { createRouter } from 'next-connect'
import Boom from '@hapi/boom'
import { handler as errHandler, sendUpstreamError } from '../../lib/apiHandler'
import { getAddressStatus, setAddressStatus } from '../../lib/ddgEmailApi'

const router = createRouter<NextApiRequest, NextApiResponse>()

/** Private address local part, e.g. `amaze-gem-spider` (no `@duck.com`). */
const ADDRESS_RE = /^[a-z0-9][a-z0-9-]*$/i

function bearer(req: NextApiRequest) {
  const { authorization } = req.headers
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw Boom.unauthorized()
  }
  return authorization.slice('Bearer '.length)
}

function addressParam(value: unknown) {
  const address = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!ADDRESS_RE.test(address)) throw Boom.badRequest('Invalid address')
  return address
}

async function relay(result: Response, res: NextApiResponse) {
  if (!result.ok) return sendUpstreamError(result, res)
  const body = (await result.json()) as { active?: boolean }
  res.status(200).json({ active: body.active === true })
}

async function getStatus(req: NextApiRequest, res: NextApiResponse) {
  const token = bearer(req)
  const address = addressParam(req.query.address)
  return relay(await getAddressStatus(token, address), res)
}

async function putStatus(req: NextApiRequest, res: NextApiResponse) {
  const token = bearer(req)
  const address = addressParam(req.body?.address)
  if (typeof req.body?.active !== 'boolean') throw Boom.badRequest('Invalid active flag')
  return relay(await setAddressStatus(token, address, req.body.active), res)
}

export default router.get(getStatus).put(putStatus).handler(errHandler)
