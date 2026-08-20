import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, ArrowLeft, Loader2, Wifi, WifiOff } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Avatar from '../../components/marketplace/Avatar';
import { messageService } from '../../services/messageService';
import { getErrorMessage } from '../../utils/errors';
import { formatDate } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeMessages } from '../../hooks/useRealtimeMessages';

export default function FreelancerMessagesPage() {
  usePageTitle('Messages');

  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Real-time messaging via WebSocket
  const { connected, onMessageSent, onMessageRead } = useRealtimeMessages(user?.id);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await messageService.getConversations();
      const data = response.data ?? [];
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load conversations.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Subscribe to real-time incoming messages
  useEffect(() => {
    const unsubscribe = onMessageSent((message) => {
      // If the message belongs to the active conversation, add it to the chat
      if (
        activeConversation &&
        (message.sender_id === activeConversation.id || message.receiver_id === activeConversation.id)
      ) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }

      // Refresh conversation list to update last message and unread count
      loadConversations();
    });

    return unsubscribe;
  }, [onMessageSent, activeConversation, loadConversations]);

  // Subscribe to real-time read receipts
  useEffect(() => {
    const unsubscribe = onMessageRead((data) => {
      // Update read status of messages in the current conversation
      setMessages((prev) =>
        prev.map((msg) =>
          msg.sender_id === user?.id && msg.receiver_id === data.receiver_id
            ? { ...msg, read_at: data.read_at }
            : msg,
        ),
      );
    });

    return unsubscribe;
  }, [onMessageRead, user?.id]);

  const openConversation = useCallback(async (partner) => {
    setActiveConversation(partner);
    setLoadingMessages(true);
    try {
      const response = await messageService.getMessages(partner.id);
      const data = response.data ?? [];
      setMessages(Array.isArray(data) ? data : []);
      // Mark as read
      await messageService.markAllAsRead(partner.id);
    } catch {
      // non-critical
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || !activeConversation || sending) return;

    setSending(true);
    try {
      const response = await messageService.sendMessage({
        receiver_id: activeConversation.id,
        content: newMessage.trim(),
      });
      // The message will also arrive via WebSocket, but add it immediately for instant feedback
      if (response.data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === response.data.id)) return prev;
          return [...prev, response.data];
        });
      }
      setNewMessage('');
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      // Refresh conversations to update last message
      loadConversations();
    } catch {
      // non-critical
    } finally {
      setSending(false);
    }
  }, [newMessage, activeConversation, sending, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-card border border-gray-200 bg-white" />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Unable to load messages" description={error} onRetry={loadConversations} />;
  }

  // Conversation view
  if (activeConversation) {
    return (
      <div className="flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
          <Button variant="ghost" size="xs" onClick={() => { setActiveConversation(null); setMessages([]); }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar name={activeConversation.name} src={activeConversation.avatar} size="sm" />
          <h2 className="text-sm font-bold text-ink-900">{activeConversation.name}</h2>
          <div className="ml-auto flex items-center gap-1.5">
            {connected ? (
              <Wifi className="h-3.5 w-3.5 text-success-500" title="Real-time connected" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-gray-400" title="Connecting..." />
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loadingMessages ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === activeConversation.id ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    msg.sender_id === activeConversation.id
                      ? 'bg-gray-100 text-ink-900'
                      : 'bg-brand-500 text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <p className={`text-[10px] ${msg.sender_id === activeConversation.id ? 'text-gray-400' : 'text-white/60'}`}>
                      {formatDate(msg.created_at)}
                    </p>
                    {msg.sender_id === user?.id && msg.read_at && (
                      <span className="text-[10px] text-white/80">✓✓</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 px-4 py-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type a message..."
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-ink-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              disabled={sending}
            />
            <Button size="sm" onClick={handleSend} loading={sending} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Conversations list view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Messages</h1>
          <p className="text-sm text-gray-500">Conversations with employers and clients.</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          {connected ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-success-500" />
              <span>Live</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5" />
              <span>Offline</span>
            </>
          )}
        </div>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversations yet"
          description="When you start working with employers, your conversations will appear here."
        />
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Card key={conv.partner.id} interactive onClick={() => openConversation(conv.partner)} className="cursor-pointer">
              <CardBody className="flex items-center gap-3">
                <Avatar name={conv.partner.name} src={conv.partner.avatar} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-ink-900">{conv.partner.name}</p>
                    <span className="text-xs text-gray-400">{formatDate(conv.last_message.created_at)}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-gray-500">{conv.last_message.content}</p>
                </div>
                {conv.unread_count > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                    {conv.unread_count}
                  </span>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
