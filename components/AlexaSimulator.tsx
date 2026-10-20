'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, Bot, User, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { Task } from '@/lib/types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isAmbiguousPrompt?: boolean;
}

interface AlexaSimulatorProps {
  onSendMessage: (utterance: string, context?: any) => Promise<void>;
  isLoading: boolean;
  ambiguousCandidates?: Task[];
}

const SAMPLE_PROMPTS = [
  'Plan my day',
  'Remind me to submit Devpost tomorrow high priority',
  'Add task review code low priority',
  "What's on my list?",
  'Done with Devpost',
];

export const AlexaSimulator: React.FC<AlexaSimulatorProps> = ({
  onSendMessage,
  isLoading,
  ambiguousCandidates,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I'm TaskPilot, your Alexa+ style task assistant. You can speak or type tasks, prioritize them, ask what's pending, or say 'Plan my day' for multi-step agentic scheduling.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSynthesisEnabled, setSpeechSynthesisEnabled] = useState(true);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          handleSend(transcript);
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Voice output via speechSynthesis
  const speak = (text: string) => {
    if (!speechSynthesisEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Prefer an English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const handleToggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use text input or Chrome/Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  };

  const handleSend = async (utteranceToSend?: string) => {
    const textToSend = utteranceToSend || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      // Build context for disambiguation if active
      const context = ambiguousCandidates?.length
        ? { lastAmbiguousCandidates: ambiguousCandidates }
        : undefined;

      await onSendMessage(textToSend.trim(), context);
    } catch (err) {
      console.error(err);
    }
  };

  // When parent receives response, this method can append assistant message
  useEffect(() => {
    // Listen for custom event or props update if necessary
  }, []);

  // Expose append assistant message
  const addAssistantMessage = (reply: string, isAmbiguous = false) => {
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      sender: 'assistant',
      text: reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAmbiguousPrompt: isAmbiguous,
    };
    setMessages((prev) => [...prev, assistantMessage]);
    speak(reply);
  };

  // Expose this via custom handler or forwardRef if needed
  (AlexaSimulator as any).addAssistantMessage = addAssistantMessage;

  return (
    <div className="flex flex-col h-[740px] bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Header Bar */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
              Alexa+ Voice Simulator
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            </h2>
            <span className="text-[11px] text-slate-400">Natural voice & text assistant</span>
          </div>
        </div>

        {/* Audio Output Toggle */}
        <button
          onClick={() => setSpeechSynthesisEnabled(!speechSynthesisEnabled)}
          title={speechSynthesisEnabled ? 'Mute spoken audio' : 'Enable spoken audio'}
          aria-label={speechSynthesisEnabled ? 'Mute spoken audio' : 'Enable spoken audio'}
          className={`p-2 rounded-lg text-xs font-medium transition-colors ${
            speechSynthesisEnabled
              ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          {speechSynthesisEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Suggested Prompts Pills */}
      <div className="px-3 py-2 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto flex gap-1.5 scrollbar-thin">
        {SAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSend(prompt)}
            disabled={isLoading}
            className="text-xs whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-700/60 text-slate-300 border border-slate-700/60 transition-all flex items-center gap-1"
          >
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Transcript */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3.5"
        role="log"
        aria-live="polite"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center space-x-1.5 mb-1 px-1">
              {msg.sender === 'user' ? (
                <>
                  <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                  <span className="text-[11px] font-medium text-slate-300">You</span>
                  <User className="w-3 h-3 text-slate-400" />
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3 text-cyan-400" />
                  <span className="text-[11px] font-medium text-cyan-300">Alexa+</span>
                  <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                </>
              )}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-md ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-bl-none ring-1 ring-cyan-500/10'
              }`}
            >
              <p>{msg.text}</p>
            </div>
          </div>
        ))}

        {/* Ambiguity Quick Selection Buttons */}
        {ambiguousCandidates && ambiguousCandidates.length > 0 && (
          <div className="p-3 my-2 rounded-xl bg-amber-950/40 border border-amber-600/40 space-y-2">
            <p className="text-xs font-semibold text-amber-300">
              Multiple matching tasks found. Select which one to complete:
            </p>
            <div className="flex flex-col gap-1.5">
              {ambiguousCandidates.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSend(`Complete #${c.id}`)}
                  className="text-left text-xs px-3 py-1.5 rounded-lg bg-amber-900/30 hover:bg-amber-900/60 text-amber-200 border border-amber-700/50 flex items-center justify-between"
                >
                  <span>
                    #{c.id}: <strong>{c.title}</strong>
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-950">
                    {c.priority}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start space-x-2">
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-slate-800/80 border border-slate-700/50 rounded-bl-none flex items-center space-x-2">
              <span className="text-xs text-cyan-300 font-medium">Running MCP tool calls...</span>
              <span className="flex space-x-1">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></span>
              </span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Listening Waveform Banner */}
      {isListening && (
        <div className="px-4 py-2 bg-cyan-950/60 border-t border-cyan-700/50 flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-xs font-semibold text-cyan-300">Listening to voice input... speak now</span>
          </div>
          <button
            onClick={handleToggleMic}
            className="text-xs px-2 py-0.5 rounded bg-cyan-800/80 text-cyan-200 hover:bg-cyan-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Input Field and Controls */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          {/* Mic Button */}
          <button
            type="button"
            onClick={handleToggleMic}
            title={isListening ? 'Stop listening' : 'Start voice input (Web Speech API)'}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            className={`p-2.5 rounded-xl transition-all ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Say or type a command... (e.g. 'Plan my day')"
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            disabled={isLoading}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Send utterance"
            className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-semibold transition-all shadow-md shadow-cyan-500/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
