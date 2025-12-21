"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { messageService } from '../../../services/messageService';
import { Card } from '../../../components/common/Card';
import { MessageSquare, Send, User, ChevronRight, PlusCircle } from 'lucide-react';

export default function MessagesPage() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [participants, setParticipants] = useState([]);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        if (activeConversation) {
            loadMessages(activeConversation.id);
            // Poll for new messages every 5 seconds
            const interval = setInterval(() => loadMessages(activeConversation.id), 5000);
            return () => clearInterval(interval);
        }
    }, [activeConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadConversations = async () => {
        try {
            const data = await messageService.getConversations();
            setConversations(data);
        } catch (error) {
            console.error('Failed to load conversations', error);
        }
    };

    const loadMessages = async (conversationId) => {
        try {
            const data = await messageService.getMessages(conversationId);
            setMessages(data);
        } catch (error) {
            console.error('Failed to load messages', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation) return;

        try {
            await messageService.sendMessage(activeConversation.id, newMessage);
            setNewMessage('');
            loadMessages(activeConversation.id);
        } catch (error) {
            console.error('Failed to send message', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const startNewChat = async (participantId) => {
        try {
            const conversation = await messageService.startConversation(participantId);
            setConversations(prev => {
                if (prev.find(c => c.id === conversation.id)) return prev;
                return [conversation, ...prev];
            });
            setActiveConversation(conversation);
            setShowNewChatModal(false);
        } catch (error) {
            console.error('Failed to start conversation', error);
        }
    };

    const openNewChatModal = async () => {
        try {
            const data = await messageService.getParticipants();
            setParticipants(data);
            setShowNewChatModal(true);
        } catch (error) {
            console.error('Failed to load participants', error);
        }
    };

    // Helper to get the other person's name
    const getOtherUserName = (conv) => {
        if (!conv) return '';
        // Check for the user that isn't me
        if (user.id !== conv.gov_user_id && conv.gov_name) return conv.gov_name;
        if (user.id !== conv.site_admin_id && conv.site_admin_name) return conv.site_admin_name;
        if (user.id !== conv.super_admin_id && conv.super_admin_name) return conv.super_admin_name;
        return 'Unknown User';
    };

    const isSuperAdmin = user?.role_name === 'super_admin';
    const bubbleColor = isSuperAdmin ? 'bg-purple-600' : 'bg-blue-600';
    const bubbleText = isSuperAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-100'; // Wait, blue was text-white

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                    <p className="text-gray-500">Secure communication channel</p>
                </div>
                <button
                    onClick={openNewChatModal}
                    className={`flex items-center px-4 py-2 text-white rounded-lg transition ${isSuperAdmin ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    <PlusCircle className="w-5 h-5 mr-2" />
                    New Message
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Inbox List */}
                <Card className="col-span-1 p-0 overflow-hidden flex flex-col h-full">
                    <div className="p-4 border-b border-gray-100 font-bold bg-gray-50">Inbox</div>
                    <div className="overflow-y-auto flex-1">
                        {conversations.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                No conversations yet
                            </div>
                        ) : (
                            conversations.map(conv => (
                                <div
                                    key={conv.id}
                                    onClick={() => setActiveConversation(conv)}
                                    className={`p-4 border-b border-gray-50 cursor-pointer transition-colors ${activeConversation?.id === conv.id
                                        ? (isSuperAdmin ? 'bg-purple-50 border-l-4 border-l-purple-600' : 'bg-blue-50 border-l-4 border-l-blue-600')
                                        : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex justify-between mb-1">
                                        <span className="font-medium text-gray-900">
                                            {getOtherUserName(conv) || 'Unknown User'}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(conv.updated_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 truncate">
                                        Click to view messages...
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Message View */}
                <Card className={`col-span-1 lg:col-span-2 p-0 overflow-hidden flex flex-col h-full ${isSuperAdmin ? 'bg-slate-50' : ''}`}>
                    {activeConversation ? (
                        <>
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <span className="font-bold text-gray-900">
                                    {getOtherUserName(activeConversation)}
                                </span>
                            </div>

                            <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isSuperAdmin ? 'bg-gradient-to-br from-slate-50 to-purple-50' : 'bg-white'}`}>
                                {messages.map((msg) => {
                                    const isMe = msg.sender_id === user.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] rounded-lg p-3 ${isMe
                                                ? (isSuperAdmin ? 'bg-purple-700 text-white rounded-br-none' : 'bg-blue-600 text-white rounded-br-none')
                                                : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                                }`}>
                                                <p className="text-sm">{msg.body}</p>
                                                <span className={`text-[10px] block mt-1 ${isMe ? 'text-white/80' : 'text-gray-400'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-4 border-t border-gray-100 bg-gray-50">
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-12">
                            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg">Select a conversation to start messaging</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* New Chat Modal */}
            {showNewChatModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] flex flex-col">
                        <h2 className="text-xl font-bold mb-4">Start New Conversation</h2>
                        <div className="overflow-y-auto flex-1 space-y-2">
                            {participants.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => startNewChat(p.id)}
                                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg flex items-center border border-gray-100"
                                >
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{p.name}</div>
                                        <div className="text-xs text-gray-500 capitalize">{p.role_name?.replace('_', ' ')}</div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
                                </button>
                            ))}
                            {participants.length === 0 && (
                                <p className="text-center text-gray-500 py-4">No available users to message</p>
                            )}
                        </div>
                        <button
                            onClick={() => setShowNewChatModal(false)}
                            className="mt-4 w-full py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
