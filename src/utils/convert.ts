/**
 * Take an Integer and compress it to a string, of "strlen" bytes long.
 */
export function intToStr(num: number, len = 4) {
  const byteArray = []

  for (let index = 0; index < len; index++) {
    const byte = num & 0xFF
    byteArray[index] = byte
    num = (num - byte) / 256
  }

  return byteArray.map(byte => String.fromCharCode(byte)).join('')
}

/**
 * Converts compresed string back to an Integer
 */
export function strToInt(str: string, len = 4) {
  let number = 0

  for (let index = 0; index < len; index++) {
    number += str.charCodeAt(index) * 256 ** index
  }

  return number
}

/**
 * Convert an IP from x.x.x.x to integer format.
 */
export function convertIp(ip: string) {
  return ip
    .split('.')
    .reduce((int, value) => int * 256 + +value, 0)
}
