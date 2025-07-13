import { Workbox } from 'workbox-window'

let wb
let registration

/**
 * Register the service worker
 */
export function registerServiceWorker() {
  // Only register service worker in production
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    wb = new Workbox('/sw.js')
    
    // Add event listeners
    wb.addEventListener('installed', (event) => {
      if (!event.isUpdate) {
        console.log('Service Worker installed for the first time!')
      } else {
        console.log('Service Worker updated!')
      }
    })
    
    wb.addEventListener('waiting', (event) => {
      console.log('A new service worker is waiting to be activated.')
      // You can show a notification to the user here
    })
    
    wb.addEventListener('controlling', () => {
      console.log('Service Worker is now controlling the page')
      window.location.reload()
    })
    
    wb.addEventListener('activated', (event) => {
      if (!event.isUpdate) {
        console.log('Service Worker activated for the first time!')
      } else {
        console.log('Service Worker activated after update!')
      }
    })
    
    wb.addEventListener('message', (event) => {
      console.log('Message from Service Worker:', event.data)
    })
    
    // Register the service worker
    wb.register()
      .then((r) => {
        registration = r
        console.log('Service Worker registered successfully')
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error)
      })
  }
}

/**
 * Update the service worker
 */
export function updateServiceWorker() {
  if (wb) {
    wb.messageSkipWaiting()
  }
}

/**
 * Send a message to the service worker
 * @param {Object} message - The message to send
 */
export function sendMessageToSW(message) {
  if (registration && registration.active) {
    registration.active.postMessage(message)
  }
}

export default {
  registerServiceWorker,
  updateServiceWorker,
  sendMessageToSW
}