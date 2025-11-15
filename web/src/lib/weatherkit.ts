import { importPKCS8, SignJWT } from 'jose'

export async function generateWeatherKitJWT(): Promise<string> {
  const teamId = process.env.APPLE_TEAM_ID
  const keyId = process.env.APPLE_KEY_ID
  const serviceId = process.env.APPLE_SERVICE_ID
  const rawKey = process.env.APPLE_PRIVATE_KEY

  if (!teamId || !keyId || !serviceId) {
    throw new Error(
      `Missing WeatherKit env vars: teamId=${Boolean(teamId)}, keyId=${Boolean(keyId)}, serviceId=${Boolean(
        serviceId
      )}`
    )
  }

  if (!rawKey) {
    throw new Error('APPLE_PRIVATE_KEY environment variable is required')
  }

  const normalizedKey = rawKey.replace(/\\n/g, '\n')

  const privateKey = await importPKCS8(normalizedKey, 'ES256')

  const now = Math.floor(Date.now() / 1000)
  const exp = now + 3600

  const jwt = await new SignJWT({
    iss: teamId,
    sub: serviceId,
    iat: now,
    exp,
  })
    .setProtectedHeader({
      alg: 'ES256',
      kid: keyId,
      id: `${teamId}.${serviceId}`,
    })
    .sign(privateKey)

  return jwt
}

