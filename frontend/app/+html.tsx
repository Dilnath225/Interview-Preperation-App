import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

const responsiveGlobalStyles = `
  html, body {
    height: 100%;
    background-color: #070C12;
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  #root {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    background-color: #070C12;
  }
  /* Custom modern dark scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #0A0E14;
  }
  ::-webkit-scrollbar-thumb {
    background: #1E2A3A;
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #00F5D4;
  }
  /* Interactive pointers for buttons and links */
  [role="button"], button, a, [data-focusable="true"] {
    cursor: pointer !important;
  }
  /* Text selection highlight */
  ::selection {
    background: rgba(0, 245, 212, 0.3);
    color: #FFFFFF;
  }
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>AI Mentor | Enterprise Technical & Leadership Career Accelerator</title>
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveGlobalStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
