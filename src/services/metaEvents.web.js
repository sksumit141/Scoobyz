// Meta App Events and Apple's tracking-transparency prompt are native-only.
// Keeping a web-specific module prevents Metro from loading either native
// dependency when the Expo app runs in a browser.

export async function initializeMetaSdk() {
  return false;
}

export async function logCompletedRegistration() {}

export async function logContact() {}

export function logViewContent() {}

export function logBookingStarted() {}

export async function logSchedule() {}

export async function logBookingCompleted() {}

export async function logPurchase() {}
