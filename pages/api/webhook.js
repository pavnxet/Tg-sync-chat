import dbConnect from '../../lib/db';
import Message from '../../models/Message';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const update = req.body;
      console.log('Webhook received:', JSON.stringify(update, null, 2));

      // Ensure db is connected
      try {
        await dbConnect();
      } catch (dbError) {
        console.error('Database connection failed:', dbError);
        // If DB fails, we should technically return 500, but Telegram will retry.
        // If it's a permanent config error, retry is bad. But here it's safer to 500.
        return res.status(500).json({ error: 'Database connection failed' });
      }

      if (update.message && update.message.text) {

        const timestamp = update.message.date
          ? new Date(update.message.date * 1000)
          : new Date();

        try {
          const message = await Message.create({
            content: update.message.text,
            direction: 'inbound',
            timestamp: timestamp,
          });
          console.log('Message saved successfully:', message._id);
        } catch (saveError) {
          console.error('Failed to save message to DB:', saveError);
          // Return 500 so Telegram retries
          return res.status(500).json({ error: 'Failed to save message' });
        }

      } else {
        console.log('Webhook received but no text message found (likely a service message or media).');
      }

      // Always return 200 OK if we processed logic successfully (even if we ignored the message)
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Webhook unexpected error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
