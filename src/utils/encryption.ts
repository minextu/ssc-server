import { Buffer } from 'node:buffer'
import { GAME_SECRETS, MASTER_SECRET } from '../constants.js'

/**
 * Decrypts the given string using masterSecret
 */
export function masterDecryptString(encrStr: string) {
  let encryptedStage1 = ''
  for (let i = 0; i < encrStr.length; i += 3) {
    const result1 = String.fromCharCode(Number(encrStr.slice(i, i + 3)) - 0x124)
    encryptedStage1 += result1
  }

  const rnd = encryptedStage1.slice(-1).charCodeAt(0) - 1
  encryptedStage1 = encryptedStage1.slice(0, -1)

  let decryptedString = ''
  let currentRnd = rnd
  for (let i = 0; i < encryptedStage1.length; i++) {
    decryptedString += String.fromCharCode(encryptedStage1[i].charCodeAt(0) ^ MASTER_SECRET[currentRnd].charCodeAt(0))
    currentRnd += 1
    if (currentRnd >= MASTER_SECRET.length) {
      currentRnd = 0
    }
  }

  return decryptedString
}

/**
 * Encrypts the given string using masterSecret
 */
export function masterEncryptString(str: string) {
  const max = MASTER_SECRET.length - 2
  const min = 0
  const rnd = Math.floor(Math.random() * (max - min + 1) + min)

  let encryptedStage1 = ''
  let currentRnd = rnd
  for (let i = 0; i < str.length; i++) {
    encryptedStage1 += String.fromCharCode(str[i].charCodeAt(0) ^ MASTER_SECRET[currentRnd].charCodeAt(0))
    currentRnd += 1
    if (currentRnd >= MASTER_SECRET.length) {
      currentRnd = 0
    }
  }

  // blitz3d starts from 1
  encryptedStage1 += String.fromCharCode(rnd + 1)

  let encryptedStage2 = ''
  for (let i = 0; i < encryptedStage1.length; i++) {
    encryptedStage2 += String(encryptedStage1.slice(i).charCodeAt(0) + 0x124).padStart(3, '0')
  }

  return encryptedStage2
}

/**
 * Encrypts the given string using gameSecrets
 */
export function gameEncryptString(str: string) {
  // blitz3d starts counting arrays from 1
  const rnd = Math.floor(Math.random() * GAME_SECRETS.length) + 1
  const secret = GAME_SECRETS[rnd - 1]

  const encrBytes = []
  for (let i = 0; i < str.length; i++) {
    // replicating flaw with encryption of client here
    // converting into number and thus ignoring all alphabetic characters of the secrets
    encrBytes.push(str.charCodeAt(i) ^ Number(secret[i % secret.length]))
  }

  encrBytes.push(0xFA - (rnd * 0x0B))

  return Buffer.from(encrBytes)
}

/**
 * Decrypts the given string using gameSecrets
 */
export function gameDecryptBuffer(buffer: Buffer) {
  const str = [...buffer]
  const lastInt = str.pop()
  if (!lastInt) {
    console.log('can\'t decrypt an empty string')
    return ''
  }

  const rnd = (0xFA - lastInt) / 0x0B

  // random number generation is flawed on the client
  // sometimes returning 0, which in blitz3d would be invalid and not encrypting anything
  if (rnd === 0) {
    return str.map(char => String.fromCharCode(char)).join('')
  }

  // blitz3d starts array index from 1
  const secret = GAME_SECRETS[rnd - 1]

  let decryptedStr = ''
  for (let i = 0; i < str.length; i++) {
    // this is also flawed,
    // xor only works with numbers, making all the non numeric characters in the secrets useless
    decryptedStr += String.fromCharCode(str[i] ^ Number(secret[i % secret.length]))
  }

  return decryptedStr
}
