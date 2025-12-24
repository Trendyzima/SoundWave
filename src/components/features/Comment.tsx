import { Comment as CommentType } from '../../types';
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react';
import { getTimeAgo, formatNumber } from '../../lib/utils';
import { useState } from 'react';

interface CommentProps {
  comment: CommentType;
  depth?: number;
}

export default function Comment({ comment, depth = 0 }: CommentProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  return (
    <div className={`${depth > 0 ? 'ml-12 mt-3' : 'mt-4'}`}>
      <div className="flex gap-3">
        <img
          src={comment.userAvatar}
          alt={comment.username}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
        
        <div className="flex-1 min-w-0">
          <div className="glass-card p-3 rounded-lg">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h4 className="font-semibold text-sm text-foreground">{comment.username}</h4>
                <p className="text-xs text-muted-foreground">{getTimeAgo(comment.timestamp)}</p>
              </div>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>
          </div>
          
          <div className="flex items-center gap-4 mt-2 px-3">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                isLiked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{formatNumber(comment.likes + (isLiked ? 1 : 0))}</span>
            </button>
            
            {comment.replies && comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</span>
              </button>
            )}
            
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Reply
            </button>
          </div>
          
          {showReplies && comment.replies && comment.replies.length > 0 && (
            <div>
              {comment.replies.map((reply) => (
                <Comment key={reply.id} comment={reply} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
