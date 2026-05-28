const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * Validation schemas for Chat/Real-time system endpoints.
 */
const chatValidator = {
  getOrCreateConversation: Joi.object({
    recipientId: Joi.string().regex(objectIdPattern).message('Invalid Recipient ID format').required().messages({
      'any.required': 'recipientId is required',
    }),
  }),

  sendMessage: Joi.object({
    conversationId: Joi.string().regex(objectIdPattern).message('Invalid Conversation ID format').required().messages({
      'any.required': 'conversationId is required',
    }),
    content: Joi.string().trim().required().messages({
      'any.required': 'Message content cannot be empty',
    }),
    attachments: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          url: Joi.string().uri().required(),
        })
      )
      .optional(),
  }),
};

module.exports = chatValidator;
