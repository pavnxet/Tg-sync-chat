# Secure Telegram Bridge

This is a Next.js application that provides a secure, end-to-end encrypted chat interface linked to a Telegram bot.

## Setup

1.  **Clone the repository.**
2.  **Install dependencies:**
    ```bash
    cd web
    npm install
    ```
3.  **Configure Environment Variables:**
    Create a `.env.local` file in the `web` directory with the following variables:
    ```
    MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
    TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
    TELEGRAM_CHAT_ID=YOUR_TELEGRAM_CHAT_ID
    ```
    *   **MONGODB_URI:** Your MongoDB connection string.
    *   **TELEGRAM_BOT_TOKEN:** Obtained from @BotFather on Telegram.
    *   **TELEGRAM_CHAT_ID:** Your personal Chat ID (you can get this by messaging @userinfobot).

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

-   Messages are encrypted client-side using AES-256 (via `crypto-js`).
-   The server and database only store encrypted ciphertext.
-   The passphrase is never sent to the server.
-   **Important:** If you lose your passphrase, you cannot decrypt your message history.
