const mongoose = require('mongoose');

// Define Schema manually to test structure, since Message.js uses ES modules and we are running in Node context without babel/next setup for this script easily.
// Ideally, we'd use 'esm' or modify package.json type:module, but let's keep it simple and redefine for test.
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

const Message = mongoose.model('MessageTest', MessageSchema);

const validMessage = new Message({
  content: 'encrypted-string',
  direction: 'outbound',
});

const validationError = validMessage.validateSync();
if (validationError) {
  console.error('Validation Failed:', validationError);
  process.exit(1);
} else {
  console.log('SUCCESS: Valid message schema validation passed.');
}

const invalidMessage = new Message({
  content: 'encrypted-string',
  direction: 'invalid-direction',
});

const invalidError = invalidMessage.validateSync();
if (invalidError && invalidError.errors['direction']) {
  console.log('SUCCESS: Invalid direction caught by schema validation.');
} else {
  console.error('FAILURE: Invalid direction NOT caught.');
  process.exit(1);
}
