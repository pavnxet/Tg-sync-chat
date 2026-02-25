import dbConnect from '../../lib/db';
import Message from '../../models/Message';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const update = req.body;
      console.log('Received Telegram update:', JSON.stringify(update, null, 2));

      // Handle message updates
      if (update.message && update.message.text) {
        // Basic config check
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI is not defined');
            // Don't leak internals to Telegram, just log it.
            return res.status(500).end();
        }

        // Validate Chat ID
        const allowedChatId = process.env.TELEGRAM_CHAT_ID;
        const senderChatId = update.message.chat && update.message.chat.id;

        if (!allowedChatId) {
            console.warn('TELEGRAM_CHAT_ID not configured, accepting all messages');
        } else if (String(senderChatId) !== String(allowedChatId)) {
            console.warn(`Unauthorized message attempt from Chat ID: ${senderChatId} (Expected: ${allowedChatId})`);
            return res.status(200).json({ ok: true, ignored: true });
        }

        await dbConnect();

        // Safely parse timestamp
        let messageDate;
        if (update.message.date) {
            // Check if valid number
            const dateNum = Number(update.message.date);
            if (!isNaN(dateNum)) {
                messageDate = new Date(dateNum * 1000);
            } else {
                messageDate = new Date();
            }
        } else {
            messageDate = new Date();
        }

        // Ensure Date object is valid
        if (isNaN(messageDate.getTime())) {
             messageDate = new Date();
        }

        const msg = await Message.create({
          content: update.message.text,
          direction: 'inbound',
          isEncrypted: false,
          timestamp: messageDate,
        });

        console.log('Saved inbound message:', msg._id);
      } else {
        console.log('Update ignored (no text message or not a message update):', update);
      }

      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Webhook error:', error);
      // Still return 200 to prevent Telegram from retrying indefinitely on bad payloads
      // Telegram retries on non-200, so we return 200 unless it's a transient server error we want retry for.
      // Usually better to log and return 200 to avoid queue buildup.
      res.status(200).json({ ok: true });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
