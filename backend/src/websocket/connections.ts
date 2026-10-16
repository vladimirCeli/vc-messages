export const connections = new Map<string, any>()

export function addConnection(userId: string, ws: any) {
  connections.set(userId, ws)
}

export function removeConnection(userId: string) {
  connections.delete(userId)
}

export function getConnection(userId: string) {
  return connections.get(userId)
}

export function broadcast(message: any) {
  const payload = JSON.stringify(message)
  connections.forEach(ws => ws.send(payload))
}
