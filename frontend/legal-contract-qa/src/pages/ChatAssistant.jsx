import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Bot, User, Loader2, Plus, Trash2, Menu, X, Paperclip, Check, FileText,
} from 'lucide-react';
import { sendMessage } from '../services/chat';
import { fetchDocuments } from '../services/documents';
import {
  getConversations,
  getActiveConversationId,
  createConversation,
  addMessage,
  deleteConversation,
  getConversation,
} from '../services/chatHistory';

export default function ChatAssistant() {
  const [conversations, setConversations] = useState(() => getConversations());
  const [activeId, setActiveId] = useState(() => {
    const id = getActiveConversationId();
    if (id && getConversation(id)) return id;
    const conv = createConversation();
    setConversations([conv]);
    return conv.id;
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const docPickerRef = useRef(null);

  const activeConversation = getConversation(activeId);
  const messages = activeConversation?.messages || [];

  useEffect(() => {
    fetchDocuments().then(setDocuments);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (docPickerRef.current && !docPickerRef.current.contains(e.target)) {
        setShowDocPicker(false);
      }
    }
    if (showDocPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDocPicker]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeId]);

  function refreshConversations() {
    setConversations(getConversations());
  }

  function handleNewChat() {
    const conv = createConversation();
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    setShowHistory(false);
    setInput('');
    setSelectedDoc(null);
  }

  function handleSelectConversation(id) {
    setActiveId(id);
    setShowHistory(false);
    setSelectedDoc(null);
  }

  function handleDelete(e, id) {
    e.stopPropagation();
    const remaining = deleteConversation(id);
    setConversations(remaining);
    if (id === activeId) {
      const nextId = remaining[0]?.id || null;
      if (nextId) {
        setActiveId(nextId);
      } else {
        const conv = createConversation();
        setConversations([conv]);
        setActiveId(conv.id);
      }
    }
  }

  function handleSelectDocument(doc) {
    setSelectedDoc(doc);
    setShowDocPicker(false);
  }

  function handleRemoveDocument() {
    setSelectedDoc(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    const contextQuestion = question;

    const userMsg = { role: 'user', content: question, document: selectedDoc || undefined };
    addMessage(activeId, userMsg);
    refreshConversations();
    setInput('');
    setLoading(true);

    try {
      if (selectedDoc && !selectedDoc.documentId) {
        console.warn('Selected document is missing documentId. Re-upload the document to enable document-scoped retrieval.');
      }
      const data = await sendMessage(contextQuestion, selectedDoc?.documentId);
      const assistantMsg = {
        role: 'assistant',
        content: data.answer ?? data.response ?? 'No response received.',
        sources: data.sources || [],
        model: data.model || '',
      };
      addMessage(activeId, assistantMsg);
      refreshConversations();
    } catch {
      const errorMsg = {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      };
      addMessage(activeId, errorMsg);
      refreshConversations();
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full"
    >
      <div className="mb-6 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-text mb-1">Chat Assistant</h1>
          <p className="text-muted">Ask questions about your legal contracts.</p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="lg:hidden p-2 text-muted hover:text-text rounded-lg hover:bg-card-hover transition-colors"
          aria-label="Toggle history"
        >
          {showHistory ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className="glass rounded-2xl flex-1 flex min-h-0 overflow-hidden relative">
        {showHistory && (
          <div
            className="absolute inset-0 z-10 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={() => setShowHistory(false)}
          />
        )}

        {/* History sidebar */}
        <div
          className={`
            w-64 border-r border-border flex flex-col shrink-0 bg-bg/50
            transition-transform duration-300 ease-in-out
            absolute inset-y-0 left-0 z-20 lg:relative lg:translate-x-0
            ${showHistory ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <div className="p-3 border-b border-border">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 ? (
              <p className="text-xs text-muted text-center pt-4">No conversations yet</p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`
                    w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative
                    ${conv.id === activeId
                      ? 'bg-primary-light text-primary font-medium'
                      : 'text-muted hover:text-text hover:bg-card-hover'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span className="truncate">{conv.title}</span>
                  </div>
                  {conv.id !== activeId && (
                    <button
                      onClick={(e) => handleDelete(e, conv.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-dark opacity-0 group-hover:opacity-100 hover:text-error hover:bg-error/5 transition-all"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-muted" />
              </div>
              <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
              <p className="text-sm text-muted max-w-sm">
                Ask a question about your uploaded contracts and get AI-powered answers.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        msg.role === 'user'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-accent/10 text-accent'
                      }`}
                    >
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div>
                      {msg.document && (
                        <div className={`flex items-center gap-1.5 mb-1 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                          <span className="text-[11px] text-muted bg-card-hover rounded-md px-2 py-0.5 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {msg.document.name}
                          </span>
                        </div>
                      )}
                      <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-primary text-white rounded-tr-md'
                              : 'bg-card border border-border rounded-tl-md text-text'
                          }`}
                        >
                          {msg.content}
                          {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-[11px] font-medium text-muted mb-2">Sources</p>
                              <div className="space-y-1.5">
                                {msg.sources.map((src, si) => (
                                  <div key={si} className="text-[11px] bg-bg rounded-lg p-2 border border-border">
                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                      <span className="font-medium text-text truncate">
                                        {src.metadata?.filename || 'Unknown'}
                                      </span>
                                      {src.metadata?.clause && (
                                        <span className="text-muted-dark shrink-0">{src.metadata.clause}</span>
                                      )}
                                    </div>
                                    <p className="text-muted-dark line-clamp-2">{src.chunk_text}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-tl-md px-5 py-3 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-muted-dark animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-dark animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-dark animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          <div className="border-t border-border p-4">
            {selectedDoc && (
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="text-xs text-muted bg-card-hover rounded-md px-2.5 py-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  {selectedDoc.name}
                  {!selectedDoc.documentId && (
                    <span className="text-[10px] text-warning ml-1">(re-upload to scope queries)</span>
                  )}
                  <button
                    onClick={handleRemoveDocument}
                    className="ml-1 text-muted-dark hover:text-text transition-colors"
                    aria-label="Remove document"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              <div className="relative" ref={docPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowDocPicker(!showDocPicker)}
                  className="w-11 h-11 rounded-xl bg-card border border-border flex items-center justify-center text-muted hover:text-text hover:border-primary/50 transition-all duration-200 flex-shrink-0"
                  aria-label="Attach document"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                {showDocPicker && (
                  <div className="absolute bottom-full left-0 mb-2 w-72 bg-bg border border-border rounded-xl shadow-xl overflow-hidden z-30">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-xs font-medium text-muted">Select a document</p>
                    </div>
                    <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
                      {documents.length === 0 ? (
                        <p className="text-xs text-muted text-center py-4">No documents uploaded yet</p>
                      ) : (
                        documents.map((doc) => {
                          const isProcessing = doc.status === 'processing';
                          const isFailed = doc.status === 'failed';
                          const disabled = isProcessing || isFailed;
                          return (
                            <button
                              key={doc.id}
                              type="button"
                              disabled={disabled}
                              onClick={() => !disabled && handleSelectDocument(doc)}
                              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-2.5 ${
                                selectedDoc?.id === doc.id
                                  ? 'bg-primary-light text-primary'
                                  : disabled
                                  ? 'text-muted-dark cursor-not-allowed opacity-50'
                                  : 'text-text hover:bg-card-hover'
                              }`}
                            >
                              <FileText className="w-4 h-4 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="truncate block">{doc.name}</span>
                                <span className={`text-[11px] ${
                                  doc.status === 'indexed' ? 'text-success' : doc.status === 'processing' ? 'text-warning' : 'text-error'
                                }`}>
                                  {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                </span>
                              </div>
                              {selectedDoc?.id === doc.id && (
                                <Check className="w-4 h-4 shrink-0 text-primary" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={selectedDoc ? `Ask about "${selectedDoc.name}"...` : 'Type your question...'}
                disabled={loading}
                className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-text placeholder:text-muted-dark transition-all duration-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-11 h-11 rounded-xl bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-center transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
