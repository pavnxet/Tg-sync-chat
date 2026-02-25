import dbConnect from '../../lib/db';
import Message from '../../models/Message';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const update = req.body;

      if (update.message && update.message.text) {
        await dbConnect();

        await Message.create({
          content: update.message.text,
          direction: 'inbound',
          timestamp: new Date(update.message.date * 1000), // Telegram timestamp is unix seconds
        });

        console.log('Received message from Telegram:', update.message.text);
      }

      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
