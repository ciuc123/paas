const PLACEHOLDER_PUBLISHABLE_KEY = 'pk_test_replace_me';
const CLERK_SCRIPT_URL = 'https://unpkg.com/@clerk/clerk-js@latest/dist/clerk.browser.js';

function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function toggleVisibility(element, isVisible) {
  if (element) {
    element.hidden = !isVisible;
  }
}

function clearElement(element) {
  if (element) {
    element.replaceChildren();
  }
}

function renderNotice(host, title, message) {
  if (!host) {
    return;
  }

  clearElement(host);

  const wrapper = document.createElement('div');
  wrapper.className = 'setup-state';

  const heading = document.createElement('strong');
  heading.textContent = title;

  const copy = document.createElement('p');
  copy.textContent = message;

  wrapper.append(heading, copy);
  host.appendChild(wrapper);
}

function getPublishableKey() {
  return (window.CLERK_PUBLISHABLE_KEY || '').trim();
}

function hasConfiguredKey(key) {
  return Boolean(key) && key !== PLACEHOLDER_PUBLISHABLE_KEY;
}

async function ensureClerkLoaded() {
  if (window.Clerk) {
    return window.Clerk;
  }

  const existingScript = document.querySelector('script[data-clerk-sdk="true"]');
  if (existingScript) {
    await new Promise((resolve, reject) => {
      existingScript.addEventListener('load', resolve, { once: true });
      existingScript.addEventListener('error', reject, { once: true });
    });
    if (!window.Clerk) {
      throw new Error('Clerk SDK loaded but window.Clerk is unavailable.');
    }
    return window.Clerk;
  }

  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CLERK_SCRIPT_URL;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.dataset.clerkSdk = 'true';
    script.addEventListener('load', resolve, { once: true });
    script.addEventListener('error', () => reject(new Error('Failed to load the Clerk browser SDK.')), { once: true });
    document.head.appendChild(script);
  });

  if (!window.Clerk) {
    throw new Error('Clerk SDK did not expose window.Clerk.');
  }

  return window.Clerk;
}

export async function initializeClerk(options) {
  const {
    statusId,
    signInHostId,
    userButtonId,
    signedInShellId,
    signedOutShellId,
    afterSignInUrl = '/roadmap/',
    afterSignUpUrl = '/roadmap/',
    afterSignOutUrl = '/',
    onSignedIn,
    onSignedOut
  } = options;

  const statusElement = document.getElementById(statusId);
  const signInHost = document.getElementById(signInHostId);
  const userButtonHost = document.getElementById(userButtonId);
  const signedInShell = document.getElementById(signedInShellId);
  const signedOutShell = document.getElementById(signedOutShellId);
  const publishableKey = getPublishableKey();

  if (!hasConfiguredKey(publishableKey)) {
    toggleVisibility(signedInShell, false);
    toggleVisibility(signedOutShell, true);
    setText(statusElement, 'Clerk key not configured');
    renderNotice(
      signInHost,
      'Clerk needs a publishable key',
      'Update docs/assets/clerk-config.js with your real Clerk publishable key to enable sign-in on the published site.'
    );
    return {
      configured: false,
      signedIn: false,
      clerk: null
    };
  }

  setText(statusElement, 'Loading Clerk authentication...');

  try {
    const clerk = await ensureClerkLoaded();
    await clerk.load({ publishableKey });

    if (clerk.user) {
      toggleVisibility(signedOutShell, false);
      toggleVisibility(signedInShell, true);
      clearElement(userButtonHost);
      clerk.mountUserButton(userButtonHost, {
        afterSignOutUrl
      });

      const identifier = clerk.user.primaryEmailAddress?.emailAddress || clerk.user.username || 'authenticated user';
      setText(statusElement, `Signed in as ${identifier}`);

      if (typeof onSignedIn === 'function') {
        await onSignedIn(clerk);
      }

      return {
        configured: true,
        signedIn: true,
        clerk
      };
    }

    toggleVisibility(signedInShell, false);
    toggleVisibility(signedOutShell, true);
    clearElement(signInHost);
    await clerk.mountSignIn(signInHost, {
      afterSignInUrl,
      afterSignUpUrl
    });
    setText(statusElement, 'Authentication required');

    if (typeof onSignedOut === 'function') {
      await onSignedOut(clerk);
    }

    return {
      configured: true,
      signedIn: false,
      clerk
    };
  } catch (error) {
    toggleVisibility(signedInShell, false);
    toggleVisibility(signedOutShell, true);
    setText(statusElement, 'Authentication unavailable');
    renderNotice(signInHost, 'Clerk failed to load', error.message);
    return {
      configured: true,
      signedIn: false,
      clerk: null,
      error
    };
  }
}

export { PLACEHOLDER_PUBLISHABLE_KEY };