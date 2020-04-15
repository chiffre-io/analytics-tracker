import { encryptString, parsePublicKey } from '@chiffre/crypto-box'
import {
  Event,
  setupSessionListeners,
  setupPageVisitListeners,
  createGenericEvent,
  createBrowserEvent
} from '@chiffre/analytics-core'
import { Config } from './types'
import { version } from './version'

export function readConfig(): Config | null {
  try {
    const config = JSON.parse(
      document.getElementById('chiffre:analytics-config')?.innerText || '{}'
    )
    if (!config.pushURL) {
      throw new Error('Missing pushURL')
    }
    return {
      publicKey: parsePublicKey(config.publicKey),
      pushURL: config.pushURL
    }
  } catch (error) {
    console.error(
      '[Chiffre] Failed to load Chiffre analytics configuration:',
      error
    )
    return null
  }
}

function makeUrl(config: Config, perf: number, xhr: string) {
  const query = [`v=${version}`, `perf=${perf.toFixed()}`, `xhr=${xhr}`].join(
    '&'
  )
  return `${config.pushURL}?${query}`
}

export function sendEvent(event: Event<any, any>, config: Config) {
  const tick = performance.now()
  const json = JSON.stringify(event)
  const payload = encryptString(json, config.publicKey)
  const tock = performance.now()
  const perf = Math.round(tock - tick)
  if (window.localStorage.getItem('chiffre:debug') === 'true') {
    console.dir({
      event,
      payload,
      perf,
      version
    })
  }
  if (window.localStorage.getItem('chiffre:no-send') === 'true') {
    console.info('[Chiffre] Skip sending message (chiffre:no-send is set)', {
      payload,
      perf
    })
    return false
  }

  if ('fetch' in window) {
    const url = makeUrl(config, perf, 'fetch')
    fetch(url, {
      method: 'POST',
      body: payload,
      credentials: 'omit',
      cache: 'no-store',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain'
      }
    })
    return true
  }

  const beaconUrl = makeUrl(config, perf, 'beacon')
  if (
    typeof navigator.sendBeacon === 'function' &&
    navigator.sendBeacon(beaconUrl, payload)
  ) {
    return true
  }

  // Fallback to img GET
  const imgUrl = makeUrl(config, perf, 'img')
  const img = new Image()
  img.src = `${imgUrl}&payload=${payload}`
  return true
}

export function setup() {
  window.chiffre = {
    sendNumber: () => {},
    sendNumbers: () => {},
    sendString: () => {},
    sendStrings: () => {}
  }
  const config = readConfig()
  if (!config) {
    return
  }
  if (navigator.doNotTrack === '1') {
    // With DoNotTrack, we send a single event for page views, without
    // any session tracking or other visitor information.
    sendEvent(createBrowserEvent('session:dnt', null), config)
  } else {
    setupSessionListeners(event => sendEvent(event, config))
    setupPageVisitListeners(event => sendEvent(event, config))
  }
  window.chiffre.sendNumber = data => {
    const event = createGenericEvent('generic:number', data)
    sendEvent(event, config)
  }
  window.chiffre.sendNumbers = data => {
    const event = createGenericEvent('generic:numbers', data)
    sendEvent(event, config)
  }
  window.chiffre.sendString = data => {
    const event = createGenericEvent('generic:string', data)
    sendEvent(event, config)
  }
  window.chiffre.sendStrings = data => {
    const event = createGenericEvent('generic:strings', data)
    sendEvent(event, config)
  }
}
