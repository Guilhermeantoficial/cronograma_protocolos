import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function RichTextEditor({ value, onChange, disabled }: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const isInternalChange = useRef(false);
  const clearBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '<div class="quill-editor-mount"></div>';
    const editorElem = containerRef.current.querySelector('.quill-editor-mount') as HTMLElement;

    const quill = new Quill(editorElem, {
      theme: 'snow',
      placeholder: 'Insira o texto de discussão e tratativas...',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'bullet' }, { list: 'ordered' }],
          ['clean']
        ]
      }
    });

    quillRef.current = quill;

    // Append Limpar button to right side of Quill toolbar
    const toolbarElem = containerRef.current.querySelector('.ql-toolbar');
    if (toolbarElem) {
      let clearContainer = toolbarElem.querySelector('.ql-custom-clear-container') as HTMLElement;
      if (!clearContainer) {
        clearContainer = document.createElement('div');
        clearContainer.className = 'ql-custom-clear-container';

        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'ql-clear-btn';
        clearBtn.title = 'Apagar todo o texto das anotações';
        clearBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eraser"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
          <span>LIMPAR</span>
        `;
        clearBtn.onclick = (e) => {
          e.preventDefault();
          if (quillRef.current) {
            quillRef.current.setText('');
          }
          onChange('');
        };
        clearContainer.appendChild(clearBtn);
        toolbarElem.appendChild(clearContainer);
        clearBtnRef.current = clearBtn;
      }
    }

    if (value) {
      if (/<[a-z][\s\S]*>/i.test(value)) {
        quill.clipboard.dangerouslyPasteHTML(value);
      } else {
        quill.setText(value);
      }
    }

    quill.on('text-change', () => {
      isInternalChange.current = true;
      const html = quill.root.innerHTML === '<p><br></p>' ? '' : quill.root.innerHTML;
      onChange(html);
      setTimeout(() => {
        isInternalChange.current = false;
      }, 0);
    });

    return () => {
      quillRef.current = null;
      clearBtnRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  // Synchronize value from props if updated externally
  useEffect(() => {
    if (quillRef.current && !isInternalChange.current) {
      const currentHtml = quillRef.current.root.innerHTML === '<p><br></p>' ? '' : quillRef.current.root.innerHTML;
      if (value !== currentHtml) {
        if (!value) {
          quillRef.current.setText('');
        } else if (/<[a-z][\s\S]*>/i.test(value)) {
          quillRef.current.clipboard.dangerouslyPasteHTML(value);
        } else {
          quillRef.current.setText(value);
        }
      }
    }
  }, [value]);

  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!disabled);
    }
  }, [disabled]);

  const isEmpty = !value || value === '<p><br></p>';

  useEffect(() => {
    if (clearBtnRef.current) {
      clearBtnRef.current.disabled = !!(disabled || isEmpty);
    }
  }, [disabled, isEmpty]);

  return (
    <div
      className={`border border-[#C9CACC] rounded-xl bg-white overflow-hidden shadow-xs transition ${
        disabled ? 'opacity-40 pointer-events-none' : 'focus-within:border-[#3F48CC] focus-within:ring-1 focus-within:ring-[#3F48CC]'
      }`}
    >
      <div ref={containerRef} className="quill-container" />
    </div>
  );
}




