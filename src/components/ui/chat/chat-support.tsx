/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  ChatBubble,
  ChatBubbleAction,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";
import { ChatInput } from "@/components/ui/chat/chat-input";
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from "@/components/ui/chat/expandable-chat";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { Button } from "@/components/ui/button";
import { Copy, Send } from "lucide-react";
import { useChat } from "ai/react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeDisplayBlock from "@/components/ui/chat/code-display-block";

export default function ChatSupport() {
  const [isGenerating, setIsGenerating] = useState(false);
  const {
    messages,
    setMessages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useChat({
    onResponse(response) {
      if (response) {
        setIsGenerating(false);
      }
    },
    onError(error) {
      if (error) {
        setIsGenerating(false);
      }
    },
  });

  const messagesRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGenerating(true);
    handleSubmit(e);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isGenerating || isLoading || !input) return;
      setIsGenerating(true);
      onSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const actionIcons = [
    { icon: Copy, type: 'Copy' },
    // { icon: RefreshCcw, type: 'Regenerate' },
  ];

  return (
    <ExpandableChat size="md" position="bottom-right">
      <ExpandableChatHeader className="bg-muted/60 flex-col text-center justify-center">
        <h1 className="text-xl font-semibold">Chat with AI Emergency Vet ✨</h1>
        <p>Ask any question for our expert AI to answer</p>
        <div className="flex gap-2 items-center pt-2">
          <Button variant="secondary" onClick={() => setMessages([])}>
            New Chat
          </Button>
          <Button variant="secondary">See FAQ</Button>
        </div>
      </ExpandableChatHeader>
      <ExpandableChatBody>
        <ChatMessageList className="bg-muted/25" ref={messagesRef}>
          {/* Initial message */}
          <ChatBubble variant="received">
            <ChatBubbleAvatar src="" fallback="👨🏽‍⚕️" />
            <ChatBubbleMessage>
              Hello! I&apos;m an AI emergency vet. Could you please share with me the name, age, breed and symptoms of your pet?
            </ChatBubbleMessage>
          </ChatBubble>

          {/* Messages */}
          {messages &&
            messages.map((message, index) => (
              <ChatBubble
                key={index}
                variant={message.role == "user" ? "sent" : "received"}
              >
                <ChatBubbleAvatar
                  src=""
                  fallback={message.role == "user" ? "🐶" : "👨🏽‍⚕️"}
                />
                <ChatBubbleMessage
                  variant={message.role == "user" ? "sent" : "received"}
                >
                  {message.content
                    .split("```")
                    .map((part: string, index: number) => {
                      if (index % 2 === 0) {
                        return (
                          <Markdown key={index} remarkPlugins={[remarkGfm as any]}>
                            {part}
                          </Markdown>
                        );
                      } else {
                        return (
                          <pre className=" pt-2" key={index}>
                            <CodeDisplayBlock code={part} lang="" />
                          </pre>
                        );
                      }
                    })}
                    {message.role == "assistant" && actionIcons.map(({ icon: Icon, type }) => (
                      <ChatBubbleAction
                        className="size-6"
                        key={type}
                        icon={<Icon className="size-3" />}
                        onClick={(e) => {
                          navigator.clipboard.writeText(message.content);
                          const svgElement = e.currentTarget.querySelector('svg');
                          if (svgElement) {
                            svgElement.outerHTML = '<svg class="size-3"><path d="M10 15l-5-5 1.41-1.41L10 12.17l7.59-7.59L19 6l-9 9z"/></svg>';
                          }
                        }}
                      />
                    ))}
                </ChatBubbleMessage>
              </ChatBubble>
            ))}

          {/* Loading */}
          {isGenerating && (
            <ChatBubble variant="received">
              <ChatBubbleAvatar src="" fallback="🤖" />
              <ChatBubbleMessage isLoading />
            </ChatBubble>
          )}
        </ChatMessageList>
      </ExpandableChatBody>
      <ExpandableChatFooter className="bg-muted/25">
        <form ref={formRef} className="flex relative gap-2" onSubmit={onSubmit}>
          <ChatInput
            value={input}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            className="min-h-12 bg-background shadow-none "
          />
          <Button
            className="absolute top-1/2 right-2 transform  -translate-y-1/2"
            type="submit"
            size="icon"
            disabled={isLoading || isGenerating || !input}
          >
            <Send className="size-4" />
          </Button>
        </form>
      </ExpandableChatFooter>
    </ExpandableChat>
  );
}