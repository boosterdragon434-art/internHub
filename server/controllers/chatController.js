const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const socketService = require('../services/socketService');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');

/**
 * Check if the user is authorized to participate in a conversation.
 */
const checkChatAccess = async (conversation, req) => {
  const { id: userId, role } = req.user;

  if (role === 'admin') return true;

  // Verify that current user is a participant of the conversation thread
  return conversation.participants.some((pId) => pId.toString() === userId);
};

/**
 * @desc    Get or create a direct chat conversation between current user and recipient
 * @route   POST /api/chat/conversations
 * @access  Private
 */
const getOrCreateConversation = async (req, res, next) => {
  try {
    const { recipientId } = req.body;
    const { id: currentUserId, role } = req.user;

    if (!recipientId) {
      return next(ApiError.badRequest('recipientId is required.'));
    }

    if (recipientId === currentUserId) {
      return next(ApiError.badRequest('You cannot start a conversation with yourself.'));
    }

    // Role-based boundary enforcement checks
    if (role === 'student') {
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return next(ApiError.notFound('Recipient user not found.'));
      }

      // Students can only chat with admins, or their assigned guide
      const isRecipientAdmin = recipient.role === 'admin';
      const student = await User.findById(currentUserId).select('assignedGuide');
      const isRecipientAssignedGuide = student.assignedGuide && student.assignedGuide.toString() === recipientId;

      if (!isRecipientAdmin && !isRecipientAssignedGuide) {
        return next(
          ApiError.forbidden('Students are only authorized to chat with admins or their assigned guide.')
        );
      }
    } else if (role === 'guide') {
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return next(ApiError.notFound('Recipient user not found.'));
      }

      // Guides can only chat with admins, or their assigned cohort students
      const isRecipientAdmin = recipient.role === 'admin';
      const guide = await User.findById(currentUserId).select('assignedStudents');
      const assignedStudentIds = (guide.assignedStudents || []).map((id) => id.toString());
      const isRecipientCohortStudent = assignedStudentIds.includes(recipientId);

      if (!isRecipientAdmin && !isRecipientCohortStudent) {
        return next(
          ApiError.forbidden(
            'Guides are only authorized to chat with admins or their assigned student cohort.'
          )
        );
      }
    }

    // Check if direct conversation already exists
    let conversation = await Conversation.findOne({
      type: 'direct',
      participants: { $all: [currentUserId, recipientId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, recipientId],
        type: 'direct',
      });
      logger.info(`Conversation started: participants [${currentUserId}, ${recipientId}]`);
    }

    const populated = await Conversation.findById(conversation._id).populate(
      'participants',
      'name email avatar role fontColor'
    );

    ApiResponse.success(res, 200, 'Conversation retrieved.', populated);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all conversation threads for the logged-in user
 * @route   GET /api/chat/conversations
 * @access  Private
 */
const getConversations = async (req, res, next) => {
  try {
    const { id: currentUserId } = req.user;

    const conversations = await Conversation.find({
      participants: currentUserId,
    })
      .populate('participants', 'name email avatar role')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name email role' },
      })
      .sort('-updatedAt')
      .lean();

    // Enrich conversations with dynamic recipient headers (filtering out current user)
    const enriched = conversations.map((convo) => {
      const recipient = convo.participants.find(
        (part) => part._id.toString() !== currentUserId
      );
      return {
        ...convo,
        recipient: recipient || null,
      };
    });

    ApiResponse.success(res, 200, 'Conversations fetched successfully.', enriched);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get paginated messages inside a conversation thread
 * @route   GET /api/chat/conversations/:id/messages
 * @access  Private
 */
const getMessages = async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return next(ApiError.notFound('Conversation thread not found.'));
    }

    const hasAccess = await checkChatAccess(conversation, req);
    if (!hasAccess) {
      return next(ApiError.forbidden('You are not authorized to view messages in this thread.'));
    }

    const { id: currentUserId } = req.user;

    // Mark unread messages sent by other participants as read by the current user
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: currentUserId },
        'readBy.user': { $ne: currentUserId }
      },
      {
        $push: { readBy: { user: currentUserId, readAt: new Date() } }
      }
    );

    const { page = 1, limit = 40 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(parseInt(limit, 10), 100);

    const total = await Message.countDocuments({ conversation: conversationId });
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name email avatar role')
      .sort('createdAt')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    ApiResponse.success(
      res,
      200,
      'Messages fetched successfully.',
      messages,
      ApiResponse.paginate(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send a message in a conversation thread (updates lastMessage & dispatches socket)
 * @route   POST /api/chat/messages
 * @access  Private
 */
const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, content, attachments } = req.body;
    const { id: currentUserId } = req.user;

    if (!conversationId || !content) {
      return next(ApiError.badRequest('conversationId and message content are required.'));
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return next(ApiError.notFound('Conversation thread not found.'));
    }

    const hasAccess = await checkChatAccess(conversation, req);
    if (!hasAccess) {
      return next(ApiError.forbidden('You are not authorized to send messages in this thread.'));
    }

    // Write message with sender as readBy entry by default
    const message = await Message.create({
      conversation: conversationId,
      sender: currentUserId,
      content,
      attachments: attachments || [],
      readBy: [{ user: currentUserId, readAt: new Date() }]
    });

    // Update conversation lastMessage reference
    conversation.lastMessage = message._id;
    await conversation.save();

    const populated = await Message.findById(message._id).populate(
      'sender',
      'name email avatar role'
    );

    // Broadcast instant Socket.IO message event
    socketService.sendRealTimeMessage(conversationId, populated);

    ApiResponse.success(res, 201, 'Message sent successfully.', populated);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all authorized chat recipients for the logged-in user
 * @route   GET /api/chat/recipients
 * @access  Private
 */
const getAvailableRecipients = async (req, res, next) => {
  try {
    const { id: currentUserId, role } = req.user;
    let recipients = [];

    if (role === 'student') {
      const student = await User.findById(currentUserId).select('assignedGuide');
      const query = { role: 'admin' };
      if (student && student.assignedGuide) {
        query.$or = [{ role: 'admin' }, { _id: student.assignedGuide }];
      }
      recipients = await User.find(query).select('name email role avatar').lean();
    } else if (role === 'guide') {
      const guide = await User.findById(currentUserId).select('assignedStudents');
      const studentIds = guide?.assignedStudents || [];
      recipients = await User.find({
        $or: [
          { role: 'admin' },
          { _id: { $in: studentIds } }
        ]
      }).select('name email role avatar').lean();
    } else if (role === 'admin') {
      recipients = await User.find({ _id: { $ne: currentUserId } })
        .select('name email role avatar')
        .lean();
    }

    ApiResponse.success(res, 200, 'Available recipients fetched successfully.', recipients);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  getAvailableRecipients,
};
