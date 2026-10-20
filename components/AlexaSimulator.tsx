'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, Bot, User, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { Task } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
    );
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
      const context = ambiguousCandidates?.length
        ? { lastAmbiguousCandidates: ambiguousCandidates }
        : undefined;

      await onSendMessage(textToSend.trim(), context);
    } catch (err) {
      console.error(err);
    }
  };

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

  (AlexaSimulator as any).addAssistantMessage = addAssistantMessage;

  return (
    <Card className="flex flex-col h-[740px] border-border bg-card/80 shadow-2xl overflow-hidden p-0 gap-0">
      {/* Header Bar */}
      <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Avatar className="w-8 h-8 border border-cyan-500/40 bg-cyan-500/20 text-cyan-400">
            <AvatarFallback className="bg-transparent text-cyan-400">
              <Bot className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              Alexa+ Voice Simulator
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            </h2>
            <span className="text-[11px] text-muted-foreground">Natural voice & text assistant</span>
          </div>
        </div>

        {/* Audio Output Toggle */}
        <Button
          variant={speechSynthesisEnabled ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => setSpeechSynthesisEnabled(!speechSynthesisEnabled)}
          title={speechSynthesisEnabled ? 'Mute spoken audio' : 'Enable spoken audio'}
          aria-label={speechSynthesisEnabled ? 'Mute spoken audio' : 'Enable spoken audio'}
          className={speechSynthesisEnabled ? 'text-cyan-400 border border-cyan-500/30' : 'text-muted-foreground'}
        >
          {speechSynthesisEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </Button>
      </div>

      {/* Suggested Prompts Pills */}
      <div className="px-3 py-2 bg-muted/30 border-b border-border overflow-x-auto flex gap-1.5">
        {SAMPLE_PROMPTS.map((prompt) => (
          <Badge
            key={prompt}
            variant="outline"
            onClick={() => handleSend(prompt)}
            className="cursor-pointer hover:bg-cyan-950/60 hover:text-cyan-300 hover:border-cyan-700/60 transition-all font-normal whitespace-nowrap text-xs py-1 px-2.5"
          >
            {prompt}
          </Badge>
        ))}
      </div>

      {/* Chat Messages Transcript */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5" role="log" aria-live="polite">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center space-x-1.5 mb-1 px-1">
              {msg.sender === 'user' ? (
                <>
                  <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                  <span className="text-[11px] font-medium text-foreground">You</span>
                  <User className="w-3 h-3 text-muted-foreground" />
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3 text-cyan-400" />
                  <span className="text-[11px] font-medium text-cyan-300">Alexa+</span>
                  <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                </>
              )}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-muted/80 text-foreground border border-border rounded-bl-none ring-1 ring-cyan-500/10'
              }`}
            >
              <p>{msg.text}</p>
            </div>
          </div>
        ))}

        {/* Ambiguity Quick Selection */}
        {ambiguousCandidates && ambiguousCandidates.length > 0 && (
          <div className="p-3 my-2 rounded-xl bg-amber-950/40 border border-amber-600/40 space-y-2">
            <p className="text-xs font-semibold text-amber-300">
              Multiple matching tasks found. Select which one to complete:
            </p>
            <div className="flex flex-col gap-1.5">
              {ambiguousCandidates.map((c) => (
                <Button
                  key={c.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSend(`Complete #${c.id}`)}
                  className="w-full justify-between text-xs bg-amber-900/30 hover:bg-amber-900/60 text-amber-200 border-amber-700/50"
                >
                  <span>
                    #{c.id}: <strong>{c.title}</strong>
                  </span>
                  <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                    {c.priority}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start space-x-2">
            <Avatar className="w-6 h-6 border border-cyan-500/40 bg-cyan-500/20 text-cyan-400">
              <AvatarFallback className="bg-transparent text-cyan-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </AvatarFallback>
            </Avatar>
            <div className="px-3.5 py-2 rounded-2xl bg-muted/80 border border-border rounded-bl-none flex items-center space-x-2">
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
        <div className="px-4 py-2 bg-cyan-950/80 border-t border-cyan-700/50 flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-xs font-semibold text-cyan-300">Listening to voice input... speak now</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleToggleMic} className="text-xs h-7 px-2 text-cyan-200">
            Cancel
          </Button>
        </div>
      )}

      {/* Input Field and Controls */}
      <div className="p-3 border-t border-border bg-card">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          {/* Mic Button */}
          <Button
            type="button"
            variant={isListening ? 'destructive' : 'secondary'}
            size="icon"
            onClick={handleToggleMic}
            title={isListening ? 'Stop listening' : 'Start voice input (Web Speech API)'}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            className={isListening ? 'animate-pulse shadow-lg shadow-rose-600/30' : 'text-cyan-400'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          {/* Text Input */}
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Say or type a command... (e.g. 'Plan my day')"
            className="flex-1 bg-background"
            disabled={isLoading}
          />

          {/* Send Button */}
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Send utterance"
            size="icon"
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
};
