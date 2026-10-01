import React from 'react';
import { renderToString } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const content = "What is the zero-point energy of a quantized EM field mode of angular frequency $\\omega$?";

const html = renderToString(
  React.createElement(ReactMarkdown, {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    children: content
  })
);

console.log(html);
