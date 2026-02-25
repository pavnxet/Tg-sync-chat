import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
