import React from 'react';

interface MarkdownRendererProps {
  content?: string;
  className?: string;
  inlineOnly?: boolean;
}

/**
 * Safely parse inline markdown formatting (bold, italic, inline code)
 */
function renderInline(text: string): React.ReactNode[] {
  if (!text) return [];
  // Tokenize by bold (**...**), italic (*...*), and inline code (`...`)
  const regex = /(\*\*[^*]+\*\*|(?<!\*)\*[^*]+\*(?!\*)|`[^`]+`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-neutral-900 dark:text-neutral-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={index} className="italic text-neutral-800 dark:text-neutral-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px] text-rose-600 dark:text-rose-400"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

/**
 * Split a markdown table row into cells
 */
function splitTableRow(rowStr: string): string[] {
  return rowStr
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

/**
 * Clean, lightweight, zero-dependency Markdown renderer for technical specifications
 * Supports: #, ##, ###, #### headings, **bold**, *italic*, bullet/number lists, and markdown tables
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content = '',
  className = '',
  inlineOnly = false,
}) => {
  if (!content) return null;

  if (inlineOnly) {
    return <span className={className}>{renderInline(content)}</span>;
  }

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    // 1. Markdown Table detection
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headers = splitTableRow(tableLines[0]);
        const isSeparator = /^\|?\s*[-:]+[-| :]*\|\s*$/.test(tableLines[1]);
        const rowLines = isSeparator ? tableLines.slice(2) : tableLines.slice(1);

        elements.push(
          <div
            key={`table-${elements.length}`}
            className="my-3 overflow-x-auto rounded-lg border border-[#E0DBD2] dark:border-[#261619] bg-[#FFFEFA] dark:bg-[#0E0A0B] shadow-xs"
          >
            <table className="w-full text-left text-xs border-collapse">
              {headers.length > 0 && (
                <thead>
                  <tr className="border-b border-[#E0DBD2] dark:border-[#261619] bg-[#F5F3EE] dark:bg-[#181114]">
                    {headers.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        className="px-3.5 py-2.5 font-bold tracking-tight text-[#140E10] dark:text-[#F1EEEE]"
                      >
                        {renderInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-[#E0DBD2] dark:divide-[#261619]">
                {rowLines.map((r, rIdx) => {
                  const cells = splitTableRow(r);
                  return (
                    <tr
                      key={rIdx}
                      className={rIdx % 2 === 0 ? 'bg-[#FFFEFA] dark:bg-[#0E0A0B]' : 'bg-[#F9F7F2] dark:bg-[#140E10]'}
                    >
                      {cells.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="px-3.5 py-2 text-[#140E10] dark:text-[#F1EEEE] font-normal leading-relaxed"
                        >
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 2. Headings
    if (line.startsWith('#### ')) {
      elements.push(
        <h4
          key={`h4-${elements.length}`}
          className="text-xs sm:text-sm font-bold tracking-tight uppercase text-neutral-800 dark:text-neutral-200 mt-3 mb-1"
        >
          {renderInline(line.slice(5))}
        </h4>
      );
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h3
          key={`h3-${elements.length}`}
          className="text-sm sm:text-base font-bold tracking-tight text-[#FF000E] dark:text-[#FF2E3A] mt-3.5 mb-1.5"
        >
          {renderInline(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      elements.push(
        <h2
          key={`h2-${elements.length}`}
          className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-4 mb-2"
        >
          {renderInline(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith('# ')) {
      elements.push(
        <h1
          key={`h1-${elements.length}`}
          className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-4 mb-2"
        >
          {renderInline(line.slice(2))}
        </h1>
      );
      i++;
      continue;
    }

    // 3. Unordered list
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const listItems: string[] = [];
      while (
        i < lines.length &&
        (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))
      ) {
        listItems.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul
          key={`ul-${elements.length}`}
          className="list-disc list-inside space-y-1 my-2 pl-1 text-neutral-700 dark:text-neutral-300"
        >
          {listItems.map((item, lIdx) => (
            <li key={lIdx} className="leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 4. Ordered list
    if (/^\d+\.\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol
          key={`ol-${elements.length}`}
          className="list-decimal list-inside space-y-1 my-2 pl-1 text-neutral-700 dark:text-neutral-300"
        >
          {listItems.map((item, lIdx) => (
            <li key={lIdx} className="leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 5. Horizontal rule
    if (/^[-*_]{3,}$/.test(line)) {
      elements.push(
        <hr
          key={`hr-${elements.length}`}
          className="my-3 border-[#261619] dark:border-[#261619]"
        />
      );
      i++;
      continue;
    }

    // 6. Paragraph
    elements.push(
      <p
        key={`p-${elements.length}`}
        className="leading-relaxed my-1.5 text-neutral-700 dark:text-neutral-300"
      >
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
};

export default MarkdownRenderer;
