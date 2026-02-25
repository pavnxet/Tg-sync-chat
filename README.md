# Secure Telegram Bridge

A Next.js application that provides a secure, end-to-end encrypted chat interface linked to a Telegram bot.

## Setup

1.  **Clone the repository.**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment Variables:**
    Create a `.env.local` file in the root directory with the following variables:
    ```
    MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
    TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
    TELEGRAM_CHAT_ID=YOUR_TELEGRAM_CHAT_ID
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser.

## Chrome Extension Setup

1.  Open Chrome and navigate to `chrome://extensions/`.
2.  Enable "Developer mode" in the top right.
3.  Click "Load unpacked".
4.  Select the `extension` folder in this repository.
5.  Click the extension icon to launch the secure chat with context from the active tab.

## Security Note

-   **Outbound Messages (Web -> Telegram):** Encrypted client-side using AES-256 (via `crypto-js`). The database stores only the ciphertext, but a decrypted version is sent to the Telegram bot for notification purposes.
-   **Inbound Messages (Telegram -> Web):** Stored in plaintext since the server does not have access to your client-side passphrase to encrypt them. These are displayed directly in the web interface.
-   The passphrase is never sent to the server.
-   **Important:** If you lose your passphrase, you cannot decrypt your outbound message history.
