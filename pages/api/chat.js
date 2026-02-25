import dbConnect from '../../lib/db';
import Message from '../../models/Message';
import axios from 'axios';

export default async function handler(req, res) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const messages = await Message.find({}).sort({ timestamp: 1 }); /* Sort by timestamp ascending */
        res.status(200).json({ success: true, data: messages });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'POST':
      try {
        /* Encrypted content is expected in req.body.content */
        /* Plain content is optional for decrypted Telegram notification */
        const { plainContent, ...messageData } = req.body;

        const message = await Message.create(messageData);

        /* Send to Telegram if direction is outbound (from extension/web app) */
        if (message.direction === 'outbound') {
          const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
          const chatId = process.env.TELEGRAM_CHAT_ID;

          if (telegramToken && chatId) {
            try {
              await axios.post(
                `https://api.telegram.org/bot${telegramToken}/sendMessage`,
                {
                  chat_id: chatId,
                  text: plainContent || message.content, // Send plain content if available, otherwise encrypted
                }
              );
            } catch (tgError) {
              console.error('Telegram API Error:', tgError.response?.data || tgError.message);
              // We don't fail the request if Telegram fails, but we log it.
              // Or maybe we should return a warning?
            }
          } else {
             console.warn('Telegram credentials not set');
          }
        }

        res.status(201).json({ success: true, data: message });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    default:
      res.status(400).json({ success: false });
      break;
  }
}
