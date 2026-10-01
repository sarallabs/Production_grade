import React from 'react';
import { renderToString } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

function Test() {
  const content = "Prove that $\\sqrt{7}$ is irrational";
  return React.createElement(ReactMarkdown, {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex]
  }, content);
}

console.log(renderToString(React.createElement(Test)));
