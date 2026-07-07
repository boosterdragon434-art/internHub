import React, { useState, useEffect, useRef } from 'react';
import { FiSend } from 'react-icons/fi';
import { getComments, addComment } from '../../api/taskApi';
import { toast } from 'react-hot-toast';

/**
 * TaskComments — comment thread and composer inside the task detail view.
 */
const TaskComments = ({ taskId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const commentEndRef = useRef(null);

  useEffect(() => {
    let active = true;
    const fetchComments = async () => {
      try {
        const response = await getComments(taskId);
        if (active && response.data && response.data.success) {
          setComments(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      } finally {
        if (active) setFetching(false);
      }
    };
    fetchComments();
    return () => {
      active = false;
    };
  }, [taskId]);

  useEffect(() => {
    commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || loading) return;

    setLoading(true);
    try {
      const response = await addComment(taskId, { content: newComment.trim() });
      if (response.data && response.data.success) {
        setComments((prev) => [...prev, response.data.data]);
        setNewComment('');
      }
    } catch (err) {
      toast.error('Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (fetching) {
    return (
      <div className="flex justify-center py-6">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[500px] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.map((comment) => (
          <div key={comment._id} className="flex gap-3 items-start">
            {/* Avatar */}
            {comment.author?.avatar ? (
              <img
                src={comment.author.avatar}
                alt={comment.author.name}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover mt-0.5 bg-slate-100 dark:bg-slate-800 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-xs font-bold text-white flex items-center justify-center shrink-0 mt-0.5">
                {comment.author?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}

            {/* Comment Bubble */}
            <div className="flex-1 min-w-0 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/60 rounded-xl px-3 py-2.5 shadow-sm">
              <div className="flex justify-between items-baseline gap-2 mb-1">
                <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 truncate">
                  {comment.author?.name}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                  {formatTimestamp(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
                {comment.content}
              </p>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
            No comments yet. Start the discussion!
          </div>
        )}
        <div ref={commentEndRef} />
      </div>

      {/* Editor Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/30 flex gap-2">
        <textarea
          rows="1"
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 min-h-[40px] max-h-[120px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none resize-none transition-all duration-200"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || loading}
          className="px-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg flex items-center justify-center transition-all shrink-0"
          aria-label="Send comment"
        >
          <FiSend className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default TaskComments;
