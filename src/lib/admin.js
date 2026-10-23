// Admin roles, capabilities, passcode hashing, sessions and invite codes.
// No backend: everything here lives in this browser (localStorage).

export const OWNER_EMAIL = 'jennifercharles996@gmail.com'
export const DEFAULT_PASSCODE = 'linksy-admin'
export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000
export const ROLES = ['owner', 'manager', 'editor', 'viewer']
export const ROLE_LABEL = { owner: 'Owner', manager: 'Manager', editor: 'Editor', viewer: 'Viewer' }

const CAPS = {
  owner: [
    'listings.view', 'listings.edit',
    'orders.view', 'orders.edit',
    'reviews.view', 'reviews.edit',
    'users.view', 'users.invite', 'users.manage',
    'settings.view', 'settings.edit',
  ],
  manager: [
    'listings.view', 'listings.edit',
    'orders.view', 'orders.edit',
    'reviews.view', 'reviews.edit',
    'users.view', 'users.invite',
    'settings.view', 'settings.edit',
  ],
  editor: ['listings.view', 'listings.edit'],
  viewer: ['listings.view', 'orders.view', 'reviews.view', 'settings.view'],
}

// Owner can invite manager, editor, viewer. Manager can only invite editor or viewer. Nobody invites a second owner.
const INVITABLE = { owner: ['manager', 'editor', 'viewer'], manager: ['editor', 'viewer'] }

export function can(role, cap) {
  return (CAPS[role] || []).includes(cap)
}

export function invitableRoles(role) {
  return INVITABLE[role] || []
}

export async function hashPasscode(email, passcode) {
  const text = `linksy:${String(email).trim().toLowerCase()}:${passcode}`
  if (globalThis.crypto?.subtle) {
    const buf = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
  }
  return `plain:${text}`
}

// Invite codes carry their own details (email, role, expiry, nonce) so the join link
// works on any device without a server. Base64url of a small JSON payload.
function b64urlEncode(text) {
  return btoa(unescape(encodeURIComponent(text))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(code) {
  let s = code.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  return decodeURIComponent(escape(atob(s)))
}

export function encodeInvite(payload) {
  return b64urlEncode(JSON.stringify(payload))
}

// payload: { n: nonce, e: email, r: role, x: expiresAtMs }
export function decodeInvite(code) {
  try {
    const p = JSON.parse(b64urlDecode(String(code || '')))
    if (!p || !p.n || !p.e || !p.r) return null
    return p
  } catch {
    return null
  }
}

export function inviteLink(code) {
  return `${window.location.origin}/admin/invite?code=${code}`
}

export function inviteMessage(link, role, email) {
  return `Hi, you have been invited to join the Linksy admin team as ${ROLE_LABEL[role]} (${email}).\n\nOpen this link within 7 days, set your name and passcode, and you are in. The link works once.\n\n${link}`
}

// Reads an image file and returns a downscaled dataURL so it fits in localStorage.
export function readImage(file, maxSide = 800, type = 'image/jpeg', quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      reject(new Error('That file is not an image.'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not decode that image.'))
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
        const w = Math.max(1, Math.round(img.naturalWidth * scale))
        const h = Math.max(1, Math.round(img.naturalHeight * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL(type, quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
