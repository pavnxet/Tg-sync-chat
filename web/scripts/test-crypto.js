const CryptoJS = require('crypto-js');

const passphrase = 'my-secret-key';
const originalText = 'Hello World';

console.log('Original:', originalText);

const encrypted = CryptoJS.AES.encrypt(originalText, passphrase).toString();
console.log('Encrypted:', encrypted);

const bytes = CryptoJS.AES.decrypt(encrypted, passphrase);
const decrypted = bytes.toString(CryptoJS.enc.Utf8);
console.log('Decrypted:', decrypted);

if (originalText === decrypted) {
  console.log('SUCCESS: Encryption/Decryption works.');
} else {
  console.error('FAILURE: Decrypted text does not match.');
  process.exit(1);
}
