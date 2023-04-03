import { Box, Button, Flex, FormControl, Textarea } from '@chakra-ui/react';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import rehypeRaw from 'rehype-raw';

import { API_KEY, HOST } from '../../config';
import { useChatContext } from '../../contexts/ChatContext';

export default function DocChat() {
  const chatContainerRef: React.RefObject<HTMLDivElement> = useRef(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const {
    temperature,
    systemMessage,
    params,
    setParams,
    header,
    loadMessages,
    messages,
    connected,
    setConnected,
    wsUrl,
    setWsUrl,
    websckt,
    setWebsckt,
    disconnect,
    chatModel,
  } = useChatContext();
  const [question, setQuestion] = useState('');
  const [shouldScroll, setShouldScroll] = useState(true);

  const handleScroll = () => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      const isScrolledToBottom =
        chatContainer.scrollHeight - chatContainer.clientHeight <=
        chatContainer.scrollTop + 1;
      if (isScrolledToBottom) {
        setShouldScroll(true);
      } else {
        setShouldScroll(false);
      }
    }
  };

  function sendMessage(event: any) {
    event.preventDefault();
    if (question === '') {
      return;
    }
    websckt.send(
      JSON.stringify({
        question,
        system: systemMessage,
        temperature: temperature / 100,
        model: chatModel,
      })
    );
    setQuestion('');
    inputRef.current?.focus();
  }

  useEffect(() => {
    setConnected(false);
    const ws = new WebSocket(wsUrl);
    setWebsckt(ws);
    ws.onopen = (event) => {
      console.log('Connected!');
      setConnected(true);
    };
    ws.onmessage = function (event) {
      loadMessages(event);
    };

    return () => {
      ws.close();
    };
  }, [wsUrl]);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (shouldScroll && chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages, shouldScroll]);

  return (
    <Box m={1} height="100%">
      <Box mb={1}>
        {messages ? (
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            style={{ height: '70vh', overflowY: 'scroll', maxWidth: '100vw' }}
          >
            <div
              style={{
                background: '#171923',
                padding: '10px',
                whiteSpace: 'pre-line',
              }}
            >
              <ReactMarkdown
                rehypePlugins={[rehypeRaw]}
                components={{
                  table: ({ node, ...props }) => (
                    <table className="table-with-white-border" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="margin-left-right" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="margin-left-right" {...props} />
                  ),
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        children={String(children).replace(/\n$/, '')}
                        language={match[1]}
                        PreTag="section"
                        {...props}
                        style={okaidia}
                      />
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {messages}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <div
            ref={chatContainerRef}
            style={{
              height: '70vh',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <h3
              style={{
                position: 'absolute',
                bottom: 3,
                left: 0,
                right: 0,
              }}
            >
              {connected ? 'What can I help you accomplish?' : '📡 Loading...'}
            </h3>
          </div>
        )}
      </Box>
      <Box mb={1}>
        <Box textAlign="center">{header}</Box>
        <FormControl isRequired>
          <Textarea
            placeholder="Ask a question..."
            ref={inputRef}
            onChange={(e: any) => setQuestion(e.target.value)}
            value={question || ''}
          />
        </FormControl>
      </Box>
      <Box>
        <Flex alignItems="center">
          <Button
            isLoading={!connected}
            isDisabled={!connected}
            colorScheme="blue"
            variant="solid"
            onClick={(e) => sendMessage(e)}
            float="right"
          >
            Ask
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}