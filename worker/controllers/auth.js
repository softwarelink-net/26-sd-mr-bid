import {
  CORS_HEADERS,
  json,
  error,
  parseBody,
  signJwt,
  requireAuth,
  DEMO_PASSWORDS,
  MOCK_USERS,
  queryFirst,
  writeAudit,
  clientIp,
  userAgent,
} from './_shared.js'

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function onRequestPost(context) {
  const { request, env } = context
  const body = await parseBody(request)
  const username = body?.username
  if (!username || !body?.password) {
    return error('请提供账号与密码')
  }

  let user = await queryFirst(
    env,
    'SELECT id, username, real_name, role, department, badge_no FROM sd_mr_bid_users WHERE username = ? AND is_active = 1',
    [username],
  )

  if (!user) {
    user = MOCK_USERS.find((u) => u.username === username)
  }

  const expected = DEMO_PASSWORDS[username]
  if (!user || expected !== body.password) {
    return error('账号或密码错误', 401)
  }

  const secret = env.JWT_SECRET || 'sd-mr-bid-demo-jwt-secret-2026'
  const token = await signJwt(
    {
      id: user.id,
      username: user.username,
      real_name: user.real_name,
      role: user.role,
      department: user.department,
      badge_no: user.badge_no,
    },
    secret,
  )

  await writeAudit(env, user, 'LOGIN', 'auth', clientIp(request), userAgent(request))

  return json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      real_name: user.real_name,
      role: user.role,
      department: user.department,
      badge_no: user.badge_no,
    },
  })
}

export async function onRequestGet(context) {
  const auth = await requireAuth(context.request, context.env)
  if (auth.error) return auth.error
  return json({ success: true, user: auth.user })
}
