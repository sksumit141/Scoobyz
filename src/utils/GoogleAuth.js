export const configureGoogleAuth = () => {
  console.log('Google Auth configured (Web fallback)');
};

export const signInWithGoogle = async () => {
  console.log('Native Google Sign-In is not supported on Web. Please test on mobile.');
  throw new Error('Native Google Sign-In is not supported on Web. Please test on a real device or emulator.');
};
