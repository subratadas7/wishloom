const SDK = 'https://www.gstatic.com/firebasejs/13.2.0/';
let setup;

async function firebase() {
  if (!setup) setup = (async () => {
    const response = await fetch('/api/auth/config', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || !result.configured) throw new Error('Firebase is not configured yet. Add the Firebase web settings in Vercel, then redeploy.');
    const [{ initializeApp, getApps }, authSdk] = await Promise.all([
      import(`${SDK}firebase-app.js`), import(`${SDK}firebase-auth.js`)
    ]);
    const app = getApps().length ? getApps()[0] : initializeApp(result.config);
    const auth = authSdk.getAuth(app);
    return { auth, ...authSdk };
  })();
  return setup;
}

async function notify(message) {
  const { auth } = await firebase();
  const user = auth.currentUser;
  if (!user) return;
  const idToken = await user.getIdToken(true);
  const response = await fetch('/api/auth/session', {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, name: user.displayName || '', picture: user.photoURL || '' })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || message || 'Could not start your Wishvilo session.');
  return result;
}

function actionUrl() { return `${location.origin}/?authAction=complete`; }

export async function signInGoogle() {
  const { auth, GoogleAuthProvider, signInWithPopup, signInWithRedirect } = await firebase();
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (error) {
    if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(error.code)) {
      await signInWithRedirect(auth, new GoogleAuthProvider());
      return;
    }
    throw error;
  }
  await notify();
  location.href = '/?account=1';
}

export async function finishRedirect() {
  const { auth, getRedirectResult } = await firebase();
  const result = await getRedirectResult(auth);
  if (result?.user) {
    await notify();
    location.href = '/?account=1';
  }
}

export async function register({ name, email, password }) {
  const { auth, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signOut } = await firebase();
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  try {
    await updateProfile(credential.user, { displayName: name.trim() });
    await sendEmailVerification(credential.user, { url: actionUrl(), handleCodeInApp: false });
  } catch (error) {
    // The account may already have been created even when mail delivery fails.
    // Sign out so the user can return to login and request a fresh link.
    await signOut(auth).catch(() => {});
    throw error;
  }
  return credential.user.email;
}

export async function resendVerification() {
  const { auth, sendEmailVerification } = await firebase();
  if (!auth.currentUser || auth.currentUser.emailVerified) throw new Error('Create an account first, or sign in after verifying your email.');
  await sendEmailVerification(auth.currentUser, { url: actionUrl(), handleCodeInApp: false });
}

export async function completeVerification() {
  const { auth, reload } = await firebase();
  if (!auth.currentUser) throw new Error('After verifying, sign in with your email and password to continue.');
  await reload(auth.currentUser);
  if (!auth.currentUser.emailVerified) throw new Error('Open the verification link in your email first, then try again.');
  await notify();
  location.href = '/?account=1';
}

export async function login({ email, password }) {
  const { auth, signInWithEmailAndPassword, sendEmailVerification, signOut } = await firebase();
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  if (!credential.user.emailVerified) {
    let resendError;
    try {
      await sendEmailVerification(credential.user, { url: actionUrl(), handleCodeInApp: false });
    } catch (error) {
      resendError = error;
    }
    await signOut(auth);
    if (resendError) throw resendError;
    throw new Error('This email is registered but not verified yet. A fresh verification link was sent. Check your inbox and spam folder, open it, then log in again.');
  }
  await notify();
  location.href = '/?account=1';
}

export async function sendPasswordReset(email) {
  const { auth, sendPasswordResetEmail } = await firebase();
  try {
    await sendPasswordResetEmail(auth, email.trim(), { url: actionUrl(), handleCodeInApp: false });
  } catch (error) {
    // Keep the same confirmation for existing and unknown addresses.
    if (!['auth/user-not-found', 'auth/invalid-email'].includes(error.code)) throw error;
  }
}

export async function signOutFirebase() {
  const { auth, signOut } = await firebase();
  await signOut(auth);
}

export async function setOrChangePassword({ currentPassword, newPassword, confirmPassword }) {
  if (!newPassword || newPassword.length < 8) throw new Error('Choose a password with at least 8 characters.');
  if (newPassword !== confirmPassword) throw new Error('The new passwords do not match.');
  const { auth, EmailAuthProvider, reauthenticateWithCredential, updatePassword, linkWithCredential } = await firebase();
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('Sign in again to manage your password.');
  const hasPassword = user.providerData.some(provider => provider.providerId === 'password');
  if (hasPassword) {
    if (!currentPassword) throw new Error('Enter your current password.');
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
    await updatePassword(user, newPassword);
  } else {
    await linkWithCredential(user, EmailAuthProvider.credential(user.email, newPassword));
  }
  await notify();
}

export async function handleAuthAction() {
  const action = new URLSearchParams(location.search).get('authAction');
  if (!action) return;
  if (action === 'complete') {
    const { auth, reload } = await firebase();
    if (auth.currentUser) await reload(auth.currentUser);
    history.replaceState({}, '', location.pathname + location.hash);
    if (auth.currentUser?.emailVerified) {
      await notify();
      location.href = '/?account=1';
      return;
    }
    window.dispatchEvent(new CustomEvent('wishvilo:auth-notice', { detail: { message: 'If you completed an email verification or password reset, you can now sign in with your updated account details.' } }));
  }
}

window.wishviloFirebaseAuth = { signOutFirebase };
